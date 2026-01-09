const express = require('express');
const supabaseServer = require('../services/supabaseClient');
const { queryGemini } = require('../services/geminiClient');
const detectGoal = require('../utils/ACM/detectGoal');
const multer = require('multer');
const upload = multer();

const logMealHandler = require('../utils/ACM/handlers/logMealHandler');
const logWorkoutHandler = require('../utils/ACM/handlers/logWorkoutHandler');
const recommendationHandlerForMeal = require('../utils/ACM/handlers/recommendationHandlerForMeal');
const recommendationHandlerForWorkout = require('../utils/ACM/handlers/recommendationHandlerForWorkout');

const processUploadedFilesHandler = require('../utils/ACM/handlers/processUploadedFilesHandler');
const { mul } = require('@tensorflow/tfjs');

let conversationState = new Map();
let multimodalContext = null;

function hasRecommendations(state) {
  return (
    state instanceof Map &&
    Array.isArray(state.get("recommended")) &&
    state.get("recommended").length > 0
  );
}

function getRlsClient(req) {
  console.log('Creating RLS client with access token:', req.user.accessToken);
  return supabaseServer.createUserSupabaseClient(req.user.accessToken);
}

const router = express.Router();

router.post("/chat", upload.any(), async (req, res) => {
  const supabase = getRlsClient(req);

  // Access the user ID
  const user = req.user; // from auth middleware

  const { message, chat_id, choice } = req.body;

  console.log("Active chat id received:", chat_id);

  let finalChatId = chat_id;
  let finalMsgId = " ";  

  console.log("final chat id at start:", finalChatId);

  const date = new Date();
  date.setHours(date.getHours() + 8);

  // Create chat if new
  if (!finalChatId) {
    const { data: chat, error } = await supabase
      .from("chats")
      .insert({
        user_id: user.id,
        title: message.slice(0, 30) || "New chat",
        created_at: date,
        updated_at: date
      })
      .select()
      .single();

    if (error) throw error;
    finalChatId = chat.chat_id;
  }

  console.log("Final chat id after check:", finalChatId);

  const { data: chatData, error: chatError } = await supabase
    .from("chats")
    .select("*")
    .eq("chat_id", finalChatId)
    .single();
  
  console.log("Chat data fetched:", chatData);
  console.log("Chat title:", chatData ? chatData.title : "No chat data");

  if (chatError) return res.status(500).json({ error: chatError });

  // If title is still "New chat", update it to the first message
  if (chatData.title === "New chat") {
    const { error: updateError } = await supabase
      .from("chats")
      .update({ title: message, updated_at: date })
      .eq("chat_id", finalChatId)
      .select()
      .single();

    if (updateError) {
      console.log("Failed to update chat title:", updateError);
    
      return res.status(500).json({ error: updateError });
    }
  }

  const { data: chat, error } = await supabase
    .from("chat_history")
    .insert({
      chat_id: finalChatId,
      role: "user",
      message,
      created_at: date
    })
    .select()
    .single();

  if (error) throw error;
  finalMsgId = chat.msg_id;

  console.log("Final msg id:", finalMsgId);

  const files = req.files
    ? req.files
    : req.file
      ? [req.file]
      : [];
  if (!message) return res.status(400).json({ error: "Message is required" });

  console.log("Received message:", message);
  console.log("Received files:", files);

 if (files.length > 0) {
    for (const file of files) {
      const path = `${user.id}/${finalChatId}/${Date.now()}-${file.originalname}`;

      const { data: uploadData, error: uploadError } =
        await supabase.storage
          .from("chat-files")
          .upload(path, file.buffer, {
            contentType: file.mimetype
          });

      console.log("UPLOAD RESULT:", uploadData);
      console.log("UPLOAD ERROR:", uploadError);

      if (uploadError) {
        throw uploadError;
      }

      const { data: signedUrlData, error: signedUrlError } =
        await supabase.storage
          .from("chat-files")
          .createSignedUrl(path, 60 * 60);

      console.log("SIGNED FILE URL:", signedUrlData?.signedUrl);

      if (signedUrlError) throw signedUrlError;

      const date = new Date();
      date.setHours(date.getHours() + 8);

      const { error: insertError } =
        await supabase.from("chat_files").insert({
          msg_id: finalMsgId,
          file_url: path,
          file_name: file.originalname,
          file_type: file.mimetype,
          uploaded_at: date
        });

      if (insertError) {
        console.error("Error inserting chat file record:", insertError);
        throw insertError;
      }
    }
  }

   const { data: savedContext } = await supabase
    .from("chat_context")
    .select("*")
    .eq("user_id", user.id)
    .eq("chat_id", finalChatId)
    .single();

  if (savedContext) { 
    multimodalContext = savedContext.multimodal_context;
  }

  if (savedContext?.conversation_state) {
    let stateObj = savedContext?.conversation_state;

    if (typeof stateObj === "string") {
      stateObj = JSON.parse(stateObj);
    }

    conversationState.set(
      user.id,
      new Map(Object.entries(stateObj || {}))
    );
  }

  // Load conversation history for context (last 20 messages, excluding current message)
  const { data: chatHistory } = await supabase
    .from("chat_history")
    .select("role, message, created_at, msg_id")
    .eq("chat_id", finalChatId)
    .neq("msg_id", finalMsgId) // Exclude the current message we just inserted
    .order("created_at", { ascending: true })
    .limit(20);

  // Formatting - only include messages with text content
  const conversationContext = (chatHistory || [])
    .filter(msg => msg.message && msg.message.trim()) // Only include messages with text
    .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.message}`)
    .join('\n');

  let state = conversationState.get(user.id);
  console.log("State at Log this meal?:", state);


  if(files && files.length > 0) {
    multimodalContext = await processUploadedFilesHandler( message, files );
    conversationState.set(user.id, { ...state, multimodalContext } );
  }

  console.log("Multimodal context extracted:", multimodalContext);

  const goal = await detectGoal(message);
  console.log("Goal:", goal);

  // If goal is not equal to empty string, replace the existing goal in user profile
  if (goal) {
    const { data: userProfile, error: profileError } = await supabase
      .from("user_profiles")
      .update({ goals: goal })
      .eq("user_id", user.id)
      .select()
      .single();
    if (profileError) {
      console.error("Error updating user goal in profile:", profileError);
    } else {
      console.log("Updated user goal in profile to:", goal);
    }
  }

  const { data: p } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
    
  userProfile = p;

  switch (choice) {
    case 'Log meal':
      intent = 'log_meal';
      break;
    case 'View meals log':
      intent = 'view_meals_log';
      break;
    case 'Log workout':
      intent = 'log_workout';
      break;
    case 'View workouts log':
      intent = 'view_workouts_log';
      break;
    case 'Meal recommendation':
      intent = 'recommendation_meal';
      break;
    case 'Workout recommendation':
      intent = 'recommendation_workout';
      break;
    case 'More recommendation':
      intent = 'more_recommendation';
      break;
    case 'Previous recommendation':
      intent = 'previous_recommendation';
      break;
    case 'Select recommendation':
      intent = 'select_recommendation';
      break;    
    case 'Log this workout?':
      if (state.get('multimodalContext')?.workouts?.length > 0) {
        multimodalContext = state.get('multimodalContext');
        console.log("Multimodal context in state for logging workout:", multimodalContext);
        intent = 'log_workout';
      } else {
        console.log("No workout available to log.");
      }
      break;
    case 'Log this meal?':
      if (state.get('multimodalContext')?.meals?.length > 0) {  
        multimodalContext = state.get('multimodalContext');
        intent = 'log_meal';
      } else {
        console.log("No meal available to log.");
      }
      break;
    default:
      intent = 'chat';
  }

  console.log("Final intent after choice handling:", intent);

  if (intent === "log_meal") {
    const response = await logMealHandler(message, multimodalContext?.meals, conversationState, user.id, supabase);

    const responseMessage = typeof response === 'string' ? response : response.reply || JSON.stringify(response);

    const date = new Date();
    date.setHours(date.getHours() + 8);

    await supabase.from("chat_history").insert({
      chat_id: finalChatId,
      role: "ai",
      message: responseMessage,
      created_at: date,  
    });

    let stateObj = {};
    let state = conversationState.get(user.id);

    if (state instanceof Map) {
      stateObj = Object.fromEntries(state);
    } else if (state && typeof state === "object") {
      stateObj = state;
    }

    console.log("State object to save:", stateObj);

    const { data, error, count } = await supabase
      .from("chat_context")
      .update({
        multimodal_context: null,
        conversation_state: stateObj,
        updated_at: date
      })
      .eq("user_id", user.id)
      .eq("chat_id", finalChatId)
      .select();
    
    if (!data || data.length === 0) {
      await supabase.from("chat_context").insert({
        user_id: user.id,
        chat_id: finalChatId,
        multimodal_context: null,
        conversation_state: stateObj
      });
    }

    const choices = ["Log meal", "View meals log", "Log workout", "View workouts log", "Meal recommendation", "Workout recommendation"];

    // append response with chat id
    const responseWithChatId = { ...response, chat_id: finalChatId, choices: choices };

    return res.json(responseWithChatId);
  }

  if (intent === "view_meals_log") {
    const supabase = getRlsClient(req);
    const user = req.user;

    const { data: userMealData, error: userMealDataError } = await supabase
      .from("meal_logs")
      .select("created_at, meal_name, protein, carbs, fat, calories, source, meal_time")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (userMealDataError) {
      return res.status(500).json({ error: userMealDataError });
    }

    console.log("userMealData:", userMealData);

    const response = "This is you recent meal logs. You can download it as a CSV file for your records.";

    const responseMessage = typeof response === 'string' ? response : response.reply || JSON.stringify(response);

    const date = new Date();
    date.setHours(date.getHours() + 8);

    await supabase.from("chat_history").insert({
      chat_id: finalChatId,
      role: "ai",
      message: responseMessage,
      log_data: userMealData,
      created_at: date,  
    });

    let stateObj = {};
    let state = conversationState.get(user.id);

    if (state instanceof Map) {
      stateObj = Object.fromEntries(state);
    } else if (state && typeof state === "object") {
      stateObj = state;
    }

    console.log("State object to save:", stateObj);

    const { data, error, count } = await supabase
      .from("chat_context")
      .update({
        multimodal_context: null,
        conversation_state: stateObj,
        updated_at: date
      })
      .eq("user_id", user.id)
      .eq("chat_id", finalChatId)
      .select();
    
    if (!data || data.length === 0) {
      await supabase.from("chat_context").insert({
        user_id: user.id,
        chat_id: finalChatId,
        multimodal_context: null,
        conversation_state: stateObj
      });
    }

    const choices = ["Log meal", "View meals log", "Log workout", "View workouts log", "Meal recommendation", "Workout recommendation"];

    return res.json({reply: response, chat_id: finalChatId, data: userMealData, choices: choices});
  }

  if (intent === "log_workout") {
    const response = await logWorkoutHandler(message, multimodalContext?.workouts, conversationState, user.id, supabase);

    const responseMessage = typeof response === 'string' ? response : response.reply || JSON.stringify(response);

    const date = new Date();
    date.setHours(date.getHours() + 8);

    await supabase.from("chat_history").insert({
      chat_id: finalChatId,
      role: "ai",
      message: responseMessage,
      created_at: date,  
    });

    let stateObj = {};
    let state = conversationState.get(user.id);

    if (state instanceof Map) {
      stateObj = Object.fromEntries(state);
    } else if (state && typeof state === "object") {
      stateObj = state;
    }

    console.log("State object to save:", stateObj);

    const { data, error, count } = await supabase
      .from("chat_context")
      .update({
        multimodal_context: null,
        conversation_state: stateObj,
        updated_at: date
      })
      .eq("user_id", user.id)
      .eq("chat_id", finalChatId)
      .select();
    
    if (!data || data.length === 0) {
      await supabase.from("chat_context").insert({
        user_id: user.id,
        chat_id: finalChatId,
        multimodal_context: null,
        conversation_state: stateObj
      });
    }

    const choices = ["Log meal", "View meals log", "Log workout", "View workouts log", "Meal recommendation", "Workout recommendation"];

    // append response with chat id
    const responseWithChatId = { ...response, chat_id: finalChatId, choices: choices };

    return res.json(responseWithChatId);
  }

  if (intent === "view_workouts_log") {
    const supabase = getRlsClient(req);
    const user = req.user;

    const { data: userWorkoutData, error: userWorkoutDataError } = await supabase
      .from("workout_logs")
      .select("created_at, exercise_name, sets, reps, duration, calories_burned, source")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    if (userWorkoutDataError) {
      return res.status(500).json({ error: userWorkoutDataError });
    }

    const response = "This is you recent workout logs. You can download it as a CSV file for your records.";

    const responseMessage = typeof response === 'string' ? response : response.reply || JSON.stringify(response);

    const date = new Date();
    date.setHours(date.getHours() + 8);

    await supabase.from("chat_history").insert({
      chat_id: finalChatId,
      role: "ai",
      message: responseMessage,
      log_data: userWorkoutData,
      created_at: date,  
    });

    let stateObj = {};
    let state = conversationState.get(user.id);

    if (state instanceof Map) {
      stateObj = Object.fromEntries(state);
    } else if (state && typeof state === "object") {
      stateObj = state;
    }

    console.log("State object to save:", stateObj);

    const { data, error, count } = await supabase
      .from("chat_context")
      .update({
        multimodal_context: null,
        conversation_state: stateObj,
        updated_at: date
      })
      .eq("user_id", user.id)
      .eq("chat_id", finalChatId)
      .select();
    
    if (!data || data.length === 0) {
      await supabase.from("chat_context").insert({
        user_id: user.id,
        chat_id: finalChatId,
        multimodal_context: null,
        conversation_state: stateObj
      });
    }

    const choices = ["Log meal", "View meals log", "Log workout", "View workouts log", "Meal recommendation", "Workout recommendation"];

    return res.json({reply: response, chat_id: finalChatId, data: userWorkoutData, choices: choices});
  }

  if (intent === "recommendation_meal") {
    let { reply, choices } = await recommendationHandlerForMeal(message, user.id, conversationState, supabase);

    const responseMessage = typeof reply === 'string' ? reply : reply.reply || JSON.stringify(reply);

    const date = new Date();
    date.setHours(date.getHours() + 8);

    await supabase.from("chat_history").insert({
      chat_id: finalChatId,
      role: "ai",
      message: responseMessage,
      created_at: date,  
    });

    let stateObj = {};
    let state = conversationState.get(user.id);

    if (state instanceof Map) {
      stateObj = Object.fromEntries(state);
    } else if (state && typeof state === "object") {
      stateObj = state;
    }

    console.log("State object to save:", stateObj);

    const { data, error, count } = await supabase
      .from("chat_context")
      .update({
        multimodal_context: multimodalContext,
        conversation_state: stateObj,
        updated_at: date
      })
      .eq("user_id", user.id)
      .eq("chat_id", finalChatId)
      .select();
    
    if (!data || data.length === 0) {
      await supabase.from("chat_context").insert({
        user_id: user.id,
        chat_id: finalChatId,
        multimodal_context: multimodalContext,
        conversation_state: stateObj
      });
    }

    // append response with chat id
    let rep = { reply: reply, chat_id: finalChatId, choices: choices };

    return res.json(rep);    
  }

  if (intent === "recommendation_workout") {
    const { reply, choices } = await recommendationHandlerForWorkout(message, user.id, conversationState, supabase);
    
    const responseMessage = typeof reply === 'string' ? reply : reply.reply || JSON.stringify(reply);

    const date = new Date();
    date.setHours(date.getHours() + 8);

    await supabase.from("chat_history").insert({
      chat_id: finalChatId,
      role: "ai",
      message: responseMessage,
      created_at: date,  
    });

    let stateObj = {};
    let state = conversationState.get(user.id);

    if (state instanceof Map) {
      stateObj = Object.fromEntries(state);
    } else if (state && typeof state === "object") {
      stateObj = state;
    }
    
    if (stateObj?.multimodalContext?.workouts?.length > 0) {
      const hasLoggableWorkout = stateObj.multimodalContext.workouts.some(w => {
        const type = w.type?.trim().toLowerCase();
        return type !== 'article' && type !== 'video';
      });
      console.log("Workout type in multimodalContext:", stateObj.multimodalContext.workouts.map(w => w.type));
      console.log("Has loggable workout:", hasLoggableWorkout);

      if (hasLoggableWorkout) {
        choices.push("Log this workout?");
      }
    }

    console.log("State object to save:", stateObj);

    const { data, error, count } = await supabase
      .from("chat_context")
      .update({
        multimodal_context: multimodalContext,
        conversation_state: stateObj,
        updated_at: date
      })
      .eq("user_id", user.id)
      .eq("chat_id", finalChatId)
      .select();
    
    if (!data || data.length === 0) {
      await supabase.from("chat_context").insert({
        user_id: user.id,
        chat_id: finalChatId,
        multimodal_context: multimodalContext,
        conversation_state: stateObj
      });
    }    

    // append response with chat id
    const responseWithChatId = { reply: reply, chat_id: finalChatId, choices: choices };
    
    return res.json(responseWithChatId);    
  }

  if (intent === "more_recommendation") {
    const state = conversationState.get(user.id);

    if (!hasRecommendations(state)) {
      const choices = ["Log meal", "View meals log", "Log workout", "View workouts log", "Meal recommendation", "Workout recommendation"];
      const responseMessage = "There is no recommendation to show more of. Please ask for a recommendation first.";

      const date = new Date();
      date.setHours(date.getHours() + 8);

      await supabase.from("chat_history").insert({
        chat_id: finalChatId,
        role: "ai",
        message: responseMessage,
        created_at: date,  
      });

      return res.json({ reply: responseMessage, choices: choices });
    }

    const currentIndex = state.get("selectedIndex") ?? 0;
    const nextIndex = currentIndex + 1;

    if (!state || !state.get("recommended")[nextIndex]) {
      const choices = ["Log meal", "View meals log", "Log workout", "View workouts log", "Meal recommendation", "Workout recommendation"];
      const prompt = `There is no more recommendation available. Please inform the user in a friendly manner. Stay under 2 sentences.`;
      const gResponse = await queryGemini(prompt);
      return res.json({ reply: gResponse , choices: choices });
    }

    state.set("selectedIndex", nextIndex);
    conversationState.set(user.id, state);

    const item = state.get("recommended")[nextIndex];
    let prompt = "";
    const choices = ["Select recommendation", "More recommendation", "Previous recommendation", "Log meal", "View meals log", "Log workout", "View workouts log", "Meal recommendation", "Workout recommendation"];

    if (state.get("type") === "MEAL") {
      const meal = item.meal;

      prompt = `
        You are a friendly fitness assistant chatbot.

        Context:
        The user is browsing for more meal recommendations and you have just provided one. Just act to suggest the next one. Don't start with "hey there", "hello" or similar greetings.

        Meal details:
        - Name: ${meal.title}
        - Calories: ${meal.calories} kcal
        - Protein: ${meal.protein} g
        - Carbs: ${meal.carbs} g
        - Fat: ${meal.fat} g
        - Ingredients: ${meal.ingredients}
        - Procedure: ${meal.procedure}
        - Cooking time: ${meal.cooking_time} minutes
      
      Tell the user that, for more information can browse the source link: ${meal.source_url}

        Task:
        Write a short, friendly response:
        - Suggest the recommended meal details
        - Mention calories
        - Ask if the user wants more recommendation
        - Use emojis naturally
        `;

      choices.push("Log this meal?");
    }

    if (state.get("type") === "WORKOUT") {

      prompt = `
        You are a friendly fitness assistant chatbot.

        Context:
        The user is browsing for more workout recommendations and you have just provided one. Just act to suggest the next one. Don't start with "hey there", "hello" or similar greetings.

       Wokrout details:
        - Name: ${item.title}
        - Description: ${item.description}
        - Source: ${item.source_url}
        - Category: ${item.category_tags}

      Tell the user that, for more information can browse the source link: ${item.source_url}

        Task:
        Write a short, friendly response:
        - Suggest the recommended workout details
        - Mention the workout description, source url and category
        - Ask if the user wants more recommendation
        - Use emojis naturally
        `;

      choices.push("Log this workout?");
    }
    
    const gResponse = await queryGemini(prompt);

    const date = new Date();
    date.setHours(date.getHours() + 8);

    await supabase.from("chat_history").insert({
      chat_id: finalChatId,
      role: "ai",
      message: gResponse,
      created_at: date,  
    });

    let stateObj = {};

    if (state instanceof Map) {
      stateObj = Object.fromEntries(state);
    } else if (state && typeof state === "object") {
      stateObj = state;
    }

    console.log("State object to save:", stateObj);

    const { data, error, count } = await supabase
      .from("chat_context")
      .update({
        multimodal_context: multimodalContext,
        conversation_state: stateObj,
        updated_at: date
      })
      .eq("user_id", user.id)
      .eq("chat_id", finalChatId)
      .select();
    
    if (!data || data.length === 0) {
      await supabase.from("chat_context").insert({
        user_id: user.id,
        chat_id: finalChatId,
        multimodal_context: multimodalContext,
        conversation_state: stateObj
      });
    }

    console.log('Gemini response for more recommendation:', gResponse);

    return res.json({
      chat_id: finalChatId,
      reply: gResponse,
      choices: choices
    });
  }

  if (intent === "previous_recommendation") {
    const state = conversationState.get(user.id);

    if (!hasRecommendations(state)) {
      const choices = ["Log meal", "View meals log", "Log workout", "View workouts log", "Meal recommendation", "Workout recommendation"];
      const responseMessage = "There is no recommendation to show previous of. Please ask for a recommendation first.";

      const date = new Date();
      date.setHours(date.getHours() + 8);

      await supabase.from("chat_history").insert({
        chat_id: finalChatId,
        role: "ai",
        message: responseMessage,
        created_at: date,  
      });

      return res.json({ reply: responseMessage, choices: choices });
    }

    const currentIndex = state.get("selectedIndex") ?? 0;
    const recommendedList = state.get("recommended") ?? [];
    const prevIndex = currentIndex - 1;

    if (!state || !state.get("recommended")[prevIndex]) {
      const choices = ["Log meal", "View meals log", "Log workout", "View workouts log", "Meal recommendation", "Workout recommendation"];
      const prompt = `There is no more recommendation available. Please inform the user in a friendly manner. Stay under 2 sentences.`;
      const gResponse = await queryGemini(prompt);
      return res.json({ reply: gResponse, choices: choices });
    }

    state.set("selectedIndex", prevIndex);
    conversationState.set(user.id, state);

    const item = state.get("recommended")[prevIndex];
    let prompt = "";
    let choices = ["Select recommendation", "More recommendation", "Previous recommendation", "Log meal", "View meals log", "Log workout", "View workouts log", "Meal recommendation", "Workout recommendation"];

    if (state.get("type") === "MEAL") {
      const meal = item.meal;

      prompt = `
        You are a friendly fitness assistant chatbot.

        Context:
        The user is browsing meal recommendations.
        They selected the previous recommended meal.

        Meal details:
        - Name: ${meal.title}
        - Calories: ${meal.calories} kcal
        - Protein: ${meal.protein} g
        - Carbs: ${meal.carbs} g
        - Fat: ${meal.fat} g

        Task:
        Write a short, friendly response:
        - Acknowledge the choice
        - Mention calories
        - Ask if the user wants more recommendation
        - Use emojis naturally
        - Keep it under 2 sentences
        `;

      choices.push("Log this meal?");
    }

    if (state.type === "WORKOUT") {

      prompt = `
        You are a friendly fitness assistant chatbot.

        Context:
        The user is browsing workout recommendations.
        They selected the previous recommended exercise.

       Wokrout details:
        - Name: ${item.title}
        - Description: ${item.description}
        - Source: ${item.source_url}
        - Category: ${item.category_tags}

        Task:
        Write a short, friendly response:
        - Acknowledge the choice
        - Ask if the user wants more recommendation
        - Use emojis naturally
        - Keep it under 2 sentences
        `;

      choices.push("Log this workout?");
    }
    
    const gResponse = await queryGemini(prompt);

    const date = new Date();
    date.setHours(date.getHours() + 8);

    await supabase.from("chat_history").insert({
      chat_id: finalChatId,
      role: "ai",
      message: gResponse,
      created_at: date,  
    });

    let stateObj = {};

    if (state instanceof Map) {
      stateObj = Object.fromEntries(state);
    } else if (state && typeof state === "object") {
      stateObj = state;
    }

    console.log("State object to save:", stateObj);

    const { data, error, count } = await supabase
      .from("chat_context")
      .update({
        multimodal_context: multimodalContext,
        conversation_state: stateObj,
        updated_at: date
      })
      .eq("user_id", user.id)
      .eq("chat_id", finalChatId)
      .select();
    
    if (!data || data.length === 0) {
      await supabase.from("chat_context").insert({
        user_id: user.id,
        chat_id: finalChatId,
        multimodal_context: multimodalContext,
        conversation_state: stateObj
      });
    }

    console.log('Gemini response for more recommendation:', gResponse);

    return res.json({
      chat_id: finalChatId,
      reply: gResponse,
      choices: choices
    });
  }

  if (intent === "select_recommendation") {
    const state = conversationState.get(user.id);
    console.log("State at select recommendation:", state);

    if (!hasRecommendations(state)) {
      const choices = ["Log meal", "View meals log", "Log workout", "View workouts log", "Meal recommendation", "Workout recommendation"];
      const responseMessage = "There is no recommendation to select. Please ask for a recommendation first.";

      const date = new Date();
      date.setHours(date.getHours() + 8);

      await supabase.from("chat_history").insert({
        chat_id: finalChatId,
        role: "ai",
        message: responseMessage,
        created_at: date,  
      });

      let stateObj = {};
    let state = conversationState.get(user.id);

    if (state instanceof Map) {
      stateObj = Object.fromEntries(state);
    } else if (state && typeof state === "object") {
      stateObj = state;
    }

    console.log("State object to save:", stateObj);

    const { data, error, count } = await supabase
      .from("chat_context")
      .update({
        multimodal_context: multimodalContext,
        conversation_state: stateObj,
        updated_at: date
      })
      .eq("user_id", user.id)
      .eq("chat_id", finalChatId)
      .select();
    
    if (!data || data.length === 0) {
      await supabase.from("chat_context").insert({
        user_id: user.id,
        chat_id: finalChatId,
        multimodal_context: multimodalContext,
        conversation_state: stateObj
      });
    }
      return res.json({ reply: responseMessage, choices: choices });
    }

    const currentIndex = state.get("selectedIndex") ?? 0;
    const recommendedList = state.get("recommended") ?? [];
    const item = recommendedList[currentIndex];
    let prompt = "";
    let recipe_id = null;
    let resource_id = null;
    let type = state.get("type");
    
    if (type === "MEAL") {
      const meal = item.meal;
      recipe_id = meal.recipe_id;

      prompt = `
        You are a friendly fitness assistant chatbot.
        Context:
        The user selected a meal recommendation.
        Meal details: 
        - Name: ${meal.title}
        - Calories: ${meal.calories} kcal
        - Protein: ${meal.protein} g
        - Carbs: ${meal.carbs} g
        - Fat: ${meal.fat} g
        Task:
        Write a short, friendly response:
        - Acknowledge the selected meal
        - Ask if is there anything else they would like to assist with
        - Tell user that you have saved this meal to their recommendation list. User can view it anytime
        - Use emojis naturally
        `;
    }

    if (state.type === "WORKOUT") {
      resource_id = item.resource_id;

      prompt = `
        You are a friendly fitness assistant chatbot.
        Context:
        The user selected a workout recommendation.
        Workout details:
        - Name: ${item.title} 
        - Description: ${item.description}
        - Source: ${item.source_url}
        - Category: ${item.category_tags}
        Task: 
        Write a short, friendly response:
        - Acknowledge the selected workout
        - Ask if the user wants more recommendation
        - Tell user that you have saved this workout to their recommendation list. User can view it anytime
        - Use emojis naturally
        `;
    }
    const gResponse = await queryGemini(prompt);

    const date = new Date();
    date.setHours(date.getHours() + 8);

    await supabase.from("chat_history").insert({
      chat_id: finalChatId,
      role: "ai",
      message: gResponse,
      created_at: date,  
    });
    console.log('Gemini response for select recommendation:', gResponse);

    // Save recommendation to recommendation_history
    await supabase.from("recommendation_history").insert({
      user_id: user.id,
      recipe_id: recipe_id,
      resource_id: resource_id,
      rec_text: gResponse,
      type: type,
      created_at: date,
    });

    const choices = ["Log meal", "View meals log", "Log workout", "View workouts log", "Meal recommendation", "Workout recommendation"];

    return res.json({
      chat_id: finalChatId,
      reply: gResponse,
      choices: choices
    });
  }

  if (intent === 'chat') {
    console.log('Querying Gemini for message:', message);
    
    const now = new Date();

    const currentTime = `
    Current system time:
    - ISO: ${now.toISOString()}
    - Local: ${now.toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}
    - Timezone: Asia/Kuala_Lumpur (UTC+8)
    `;

    let prompt = `You are a friendly wellness assistant for VitaTrack, a fitness and nutrition tracking app.

    Your role:
    - Help users with fitness, nutrition, and wellness questions
    - Provide helpful, accurate information
    - Use emojis naturally
    - Be conversational and engaging
    - If you don't know something, admit it politely
    - If previous conversation context is available, just continue from there. Not need to do any introductions/greetings.

    ${conversationContext ? `Previous conversation context:\n${conversationContext}\n\n` : ''}Current user message: "${message}"
    ${
      conversationState.get(user.id)?.multimodalContext
        ? `Context extracted from uploaded files (images / documents) or messages:
      ${JSON.stringify(conversationState.get(user.id).multimodalContext, null, 2)}\n\n`
        : ''
    }

    User message:
    "${message}"

    User goal:
    "${goal || 'Not specified'}"

    Current time:
    ${currentTime}

    If contextual data from uploaded files is provided, use it as the primary source of truth for nutrition or workout analysis. Do NOT guess nutrition or workout details beyond the provided context. MENTION based on the uploaded files.

    Important:
    - If user ask for meal or workout recommendations, please tell them to use the dedicated buttons for better experience ("Meal recommendation" or "Workout recommendation").
    - If user ask to log meal or workout, please tell them to use the dedicated buttons for better experience ("Log meal" or "Log workout").
    - If user ask for more recommendations, previous or select recommendation, please use the dedicated buttons for better experience ("More recommendations", "Previous recommendation", "Select recommendation"). However, if previous recommendations are not available, you can tell them to choose "Meal recommendation" or "Workout recommendation" first.
    - Do NOT include instructions about using the 'Previous recommendation' button unless the user explicitly asks to see past recommendations. 
    - Do NOT include instructions about using the 'Select recommendation' button unless the user explicitly asks to select a recommendation.
    - Do NOT include instructions about using the 'More recommendation' button unless the user explicitly asks for more recommendations.
    - If user ask for viewing meal or workout logs, please use the dedicated buttons for better experience ("View meals log" or "View workouts log").
    - Other than above, you can answer normally. 
    - If user ask for goal, analyze their goals based on ${userProfile?.goals || 'not specified'} and provide further insights.
    - If user ask anything about their profile (age, weight, height, etc), use the following details:
      - Age: ${userProfile?.age || 'Not specified'}
      - Weight: ${userProfile?.weight || 'Not specified'}
      - Height: ${userProfile?.height || 'Not specified'}
      - Activity Level: ${userProfile?.activity_level || 'Not specified'}
      - Dietary Preferences: ${userProfile?.dietary_preferences || 'Not specified'}
      - Allergies: ${userProfile?.allergies || 'Not specified'}
      - Medical Conditions: ${userProfile?.medical_conditions || 'Not specified'}
      - Goals: ${userProfile?.goals || 'Not specified'}

    IMPORTANT RULE (MUST FOLLOW):

    - If the user asks to log a meal or workout, you **should still provide nutrition or workout analysis** based on the user message, but **also remind them to use the dedicated buttons** ("Log meal" or "Log workout"). 
    - You are **not logging anything yourself** — just analyzing.

    Before responding, you MUST check whether your final reply (including your own suggestions)
    mentions ANY nutrition details (e.g. meal components, calories, macros, food items).

    - If YES:
    - You MUST include a non-empty "meal_analysis" array.
    - The meal_analysis must reflect ALL nutrition details you mentioned.
    - If exact values are unknown, you MUST still provide reasonable estimates.
      You are explicitly ALLOWED to infer typical values based on common fitness standards.
      This is NOT considered guessing.

    OR ANY workout or exercise details (e.g. exercise names, sets, reps, duration, calories burned).
    - If YES:
    - You MUST include a non-empty "workout_analysis" array.
    - The workout_analysis must reflect ALL exercises you mentioned.
    - If exact values are unknown, you MUST still provide reasonable estimates.
      You are explicitly ALLOWED to infer typical values based on common fitness standards.
      This is NOT considered guessing.
    
    If nutrition details are mentioned in user message, include your analysis of the nutrition details in the meal_analysis array. Include all items, with reasonable estimates if exact values are unknown. If NO meal time is mentioned, infer based on ${currentTime}.
    If workout or exercise details are mentioned in user message, include your analysis of the workout details in the workout_analysis array. Include all exercises, with reasonable estimates if exact values are unknown.

    If NO workout is mentioned at all, return an empty workout_analysis array.
    If NO nutrition details are mentioned at all, return an empty meal_analysis array.

    STRICT ENFORCEMENT RULE:

    If your response mentions any workout or exercise:
    - You MUST populate duration and calories_burned with reasonable estimated values.
    - Zero, null, or missing values are NOT allowed.
    - Estimation is REQUIRED even if the user did not provide details.
    - Use common fitness assumptions (e.g., moderate intensity, 30-45 minutes).

    Format your ANALYSIS strictly in JSON as follows (no extra text outside the JSON):    
     
      Nutritional analysis in this format:
      [
        {
          "title": "... list of items ...",
          "protein": NUMBER,
          "carbs": NUMBER,
          "fat": NUMBER,
          "calories": NUMBER,
          "meal_time": "... inferred meal time ...",
          "source": "source_tag" || "user_message" || "ai assistant"
        }
      ]

      Workout analysis in this format:
      [
        {
          "title": "... exercise name ...",
          "sets": NUMBER,
          "reps": NUMBER,
          "duration": NUMBER,
          "calories_burned": NUMBER,
          "source": "source_tag" || "user_message" || "ai assistant"
        }
      ]

    Respond naturally, considering the conversation context if provided. Keep responses concise but helpful.
    
    MUST return your final response in JSON format including the response and any analyses detected. For example:
    {
      "reply": "Your friendly response here.",
      "meal_analysis": [ ... ],
      "workout_analysis": [ ... ]
    }`;

    let choices = ["Log meal", "View meals log", "Log workout", "View workouts log", "Meal recommendation", "Workout recommendation"];

    const gResponse = await queryGemini(prompt);
    console.log('Gemini response:', gResponse);

    let parsed;

    try {
      const cleanText = gResponse.replace(/```json/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleanText);
    } catch (err) {
      console.error("Failed to parse Gemini output:", err);
      gResponse = `I'm sorry, I encountered an error while processing your request. Could you please try again later?`;
      res.json({ chat_id: finalChatId, reply: gResponse, choices: choices }) 
    }

    const reply = parsed.reply || "";
    const meal_analysis = Array.isArray(parsed.meal_analysis) ? parsed.meal_analysis : [];
    const workout_analysis = Array.isArray(parsed.workout_analysis) ? parsed.workout_analysis : [];

    console.log("Reply:", reply);
    console.log("Meal analysis:", meal_analysis);
    console.log("Workout analysis:", workout_analysis);

    let multimodalContext =
      conversationState.get(user.id)?.multimodalContext || {
        meals: [],
        workouts: []
      };

    const newMeals = Array.isArray(meal_analysis) ? meal_analysis : [];
    const newWorkouts = Array.isArray(workout_analysis) ? workout_analysis : [];

    if (newMeals.length > 0 || newWorkouts.length > 0) {
      multimodalContext = {
        ...multimodalContext,
        meals: newMeals.length > 0 ? newMeals : [],
        workouts: newWorkouts.length > 0 ? newWorkouts : []
      };

      let state = conversationState.get(user.id);
      state = state instanceof Map ? Object.fromEntries(state) : state;

      conversationState.set(user.id, {
        ...state,

        state: "SHOWING_RESULTS",

        type: meal_analysis.length > 0 ? "MEAL" : "WORKOUT",
        
        recommended: meal_analysis.length > 0
          ? meal_analysis
          : workout_analysis,

        multimodalContext: {
          meals: meal_analysis.length > 0 ? [meal_analysis[0]] : [],
          workouts: workout_analysis.length > 0 ? [workout_analysis[0]] : []
        },

        selectedIndex: 0
      });

      

      console.log("Updated multimodalContext:", multimodalContext);
    }

    let updated_state = conversationState.get(user.id);
    let updated_stateObj = updated_state instanceof Map ? Object.fromEntries(updated_state) : updated_state;

    if (updated_stateObj?.multimodalContext?.workouts?.length > 0) {
      const hasLoggableWorkout = updated_stateObj.multimodalContext.workouts.some(w => {
        const type = w.type?.trim().toLowerCase();
        return type !== 'article' && type !== 'video';
      });
      console.log("Workout type in multimodalContext:", updated_stateObj.multimodalContext.workouts.map(w => w.type));
      console.log("Has loggable workout:", hasLoggableWorkout);

      if (hasLoggableWorkout) {
        choices = ["Log meal", "View meals log", "Log workout", "Log this workout?", "View workouts log", "Meal recommendation", "Workout recommendation"];
      }
    }

    if (updated_stateObj?.multimodalContext?.meals?.length > 0) {        
      choices = ["Log meal", "Log this meal?", "View meals log", "Log workout", "View workouts log", "Meal recommendation", "Workout recommendation"];        
    }

    console.log("Recommended in state object:", updated_stateObj?.recommended);

    if (updated_stateObj?.recommended?.length > 1) {
      const isAIOnly = updated_stateObj.recommended.every(
        r => r.source === "ai assistant"
      );

      choices = [
        "Log meal",
        "View meals log",
        "Log workout",
        "View workouts log",
        "Meal recommendation",
        "Workout recommendation",
      ];

      if (!isAIOnly) {
        choices.push(
          "More recommendation",
          "Previous recommendation",
          "Select recommendation"
        );
      }
    }

    const date = new Date();
    date.setHours(date.getHours() + 8);

    await supabase.from("chat_history").insert({
      chat_id: finalChatId,
      role: "ai",
      message: reply,
      created_at: date,  
    });

    let stateObj = {};
    let state = conversationState.get(user.id);

    if (state instanceof Map) {
      stateObj = Object.fromEntries(state);
    } else if (state && typeof state === "object") {
      stateObj = state;
    }

    stateObj.multimodalContext = multimodalContext;

    if (state instanceof Map) {
      state.set("multimodalContext", multimodalContext);
      conversationState.set(user.id, state);
    } else {
      conversationState.set(user.id, stateObj);
    }

    console.log("State object to save:", stateObj);

    const { data, error, count } = await supabase
      .from("chat_context")
      .update({
        multimodal_context: multimodalContext,
        conversation_state: stateObj,
        updated_at: date
      })
      .eq("user_id", user.id)
      .eq("chat_id", finalChatId)
      .select();
    
    if (!data || data.length === 0) {
      await supabase.from("chat_context").insert({
        user_id: user.id,
        chat_id: finalChatId,
        multimodal_context: multimodalContext,
        conversation_state: stateObj
      });
    }

    

    return res.json({ chat_id: finalChatId, reply: reply, choices: choices });
  }

  // Default fallback - if intent doesn't match, treat as general chat
  console.log('Intent did not match any handler, defaulting to chat. Intent was:', intent);
  
  let prompt = `You are a friendly wellness assistant for VitaTrack, a fitness and nutrition tracking app.

    Your role:
    - Help users with fitness, nutrition, and wellness questions
    - Provide helpful, accurate information
    - Use emojis naturally
    - Be conversational and engaging
    - If you don't know something, admit it politely

    ${conversationContext ? `Previous conversation context:\n${conversationContext}\n\n` : ''}Current user message: "${message}"
    ${
      multimodalContext
        ? `Context extracted from uploaded files (images / documents):
      ${JSON.stringify(multimodalContext, null, 2)}\n\n`
        : ''
    }

    User message:
    "${message}"

    If contextual data from uploaded files is provided, use it as the primary source of truth. Do NOT guess nutrition or workout details beyond the provided context.

    Respond naturally, considering the conversation context if provided. Keep responses concise but helpful.`;

  const gResponse = await queryGemini(prompt);
  console.log('Gemini response (fallback):', gResponse);

  await supabase.from("chat_history").insert({
    chat_id: finalChatId,
    role: "ai",
    message: gResponse,
    created_at: date,  
  });

  return res.json({ chat_id: finalChatId, reply: gResponse });
});

router.post("/newchat", async (req, res) => {
  const supabase = getRlsClient(req);
  const user = req.user;

  const date = new Date();
  date.setHours(date.getHours() + 8);

  const { data, error } = await supabase
    .from("chats")
    .insert({
      user_id: user.id,
      title: "New chat",
      created_at: date,
      updated_at: date
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error });

  res.json({ chat_id: data.chat_id });
});


router.get("/fetchChatList", async (req, res) =>{
  const supabase = getRlsClient(req);

  try {
    const user = req.user; // from auth middleware
    console.log("Fetching chat list for user:", user.id);

    // Fetch messages
    const { data: chatList } = await supabase
      .from("chats")
      .select("chat_id, title, updated_at")
      .eq("user_id", user.id);
    
    console.log("Fetched chat list:", chatList);

    // Reorder by most recent updated_at
    chatList.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    // Respond
    res.json(chatList || []);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch chat list" });
  }
});

router.get("/loadchat", async (req, res) => {
  try {
    const supabase = getRlsClient(req);
    const user = req.user; // from auth middleware
    let { chat_id } = req.query;

    console.log("Loading chat for user:", user.id);
    console.log("Requested chat_id:", chat_id);

    // Fetch messages for this chat
    const { data: messages } = await supabase
      .from("chat_history")
      .select("msg_id, role, message, log_data, created_at")
      .eq("chat_id", chat_id);

    const msgIds = (messages || []).map(m => m.msg_id);

    console.log("Msg IDs to fetch files for:", msgIds);

    const { data: allFiles } = await supabase.from("chat_files").select("*").limit(10);
    console.log("All files in DB:", allFiles);

    // Fetch files for these messages
    const { data: files } = await supabase
      .from("chat_files")
      .select("file_url, file_name, file_type, uploaded_at, msg_id")
      .in("msg_id", msgIds);

    console.log("Fetched files from DB:", files);

    // Generate signed URLs for files
    const filesWithUrls = await Promise.all(
      (files || []).map(async (f) => {
        const { data } = await supabase.storage
          .from("chat-files")
          .createSignedUrl(f.file_url, 60 * 60 * 24 * 30); // 30 days

        return {
          role: "user",
          message: null,
          file_name: f.file_name,
          file_url: data?.signedUrl,
          file_type: f.file_type,
          created_at: f.uploaded_at,
          msg_id: f.msg_id
        };
      })
    );

    console.log("Fetched files with URLs:", filesWithUrls);

    // Merge messages and files in timeline
    const timeline = [
      ...messages.map(m => ({
        role: m.role,
        message: m.message,
        created_at: m.created_at,
        msg_id: m.msg_id,
        log_data: m.log_data ?? null,
        file_url: null,
        file_name: null
      })),
      ...filesWithUrls
    ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    console.log("Loaded chat timeline:", timeline);
    console.log("messages msg_ids:", messages.map(m => m.msg_id));
    console.log("filesWithUrls msg_ids:", filesWithUrls.map(f => f.msg_id));

    res.json({ chat_id, messages: timeline });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load chat" });
  }
});

router.delete("/deletechat", async (req, res) => {
  try {
    const supabase = getRlsClient(req);
    const user = req.user; // from auth middleware
    let { chat_id } = req.query;

    console.log("Deleting chat for user:", user.id);
    console.log("Chat ID to delete:", chat_id);

    // Delete chat history
    const { error: deleteHistoryError } = await supabase
      .from("chat_history")
      .delete()
      .eq("chat_id", chat_id);
    
    if (deleteHistoryError) {
      console.error("Error deleting chat history:", deleteHistoryError);
      return res.status(500).json({ error: "Failed to delete chat history" });
    }

    // Delete chat context
    const { error: deleteContextError } = await supabase
      .from("chat_context")
      .delete()
      .eq("chat_id", chat_id);
    
    if (deleteContextError) {
      console.error("Error deleting chat context:", deleteContextError);
      return res.status(500).json({ error: "Failed to delete chat context" });
    }

    // Delete chat
    const { error: deleteChatError } = await supabase
      .from("chats")
      .delete()
      .eq("chat_id", chat_id)
      .eq("user_id", user.id);

    if (deleteChatError) {
      console.error("Error deleting chat:", deleteChatError);
      return res.status(500).json({ error: "Failed to delete chat" });
    }
    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete chat" });
  }
});

router.delete("/clearAllChats", async (req, res) => {
  try {
    const supabase = getRlsClient(req);
    const user = req.user; // from auth middleware

    console.log("Clearing all chats for user:", user.id);

    // Delete chat history
    const { error: deleteChat } = await supabase
      .from("chats")
      .delete()
      .eq("user_id", user.id);

    if (deleteChat) {
      console.error("Error deleting all chats:", deleteChat);
      return res.status(500).json({ error: "Failed to delete all chats" });
    }

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to clear all chats" });
  } 
});

module.exports = router;