const express = require('express');
const supabaseServer = require('../services/supabaseClient');
const { queryGemini } = require('../services/geminiClient');
const detectIntent = require('../utils/ACM/detectIntent');
const multer = require('multer');
const upload = multer();

const logMealHandler = require('../utils/ACM/handlers/logMealHandler');
const logWorkoutHandler = require('../utils/ACM/handlers/logWorkoutHandler');
const recommendationHandlerForMeal = require('../utils/ACM/handlers/recommendationHandlerForMeal');
const recommendationHandlerForWorkout = require('../utils/ACM/handlers/recommendationHandlerForWorkout');

let conversationState = new Map();

function getRlsClient(req) {
  console.log('Creating RLS client with access token:', req.user.accessToken);
  return supabaseServer.createUserSupabaseClient(req.user.accessToken);
}

const router = express.Router();

router.post("/chat", upload.any(), async (req, res) => {
  const supabase = getRlsClient(req);

  // Access the user ID
  const user = req.user; // from auth middleware

  const { message, chat_id } = req.body;

  console.log("Active chat id received:", chat_id);

  let finalChatId = chat_id;
  let finalMsgId = " ";

  console.log("final chat id at start:", finalChatId);

  // Create chat if new
  if (!finalChatId) {
    const { data: chat, error } = await supabase
      .from("chats")
      .insert({
        user_id: user.id,
        title: message.slice(0, 30) || "New chat",
        created_at: new Date(),
        updated_at: new Date()
      })
      .select()
      .single();

    if (error) throw error;
    finalChatId = chat.chat_id;
  }

  console.log("Final chat id after check:", finalChatId);

  // Update chat title
  // Get the chat
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
      .update({ title: message, updated_at: new Date() })
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
      message
    })
    .select()
    .single();

  if (error) throw error;
  finalMsgId = chat.msg_id;

  console.log("Final msg id:", finalMsgId);

  const files = req.files;
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

      const { error: insertError } =
        await supabase.from("chat_files").insert({
          msg_id: finalMsgId,
          file_url: path,
          file_name: file.originalname,
          file_type: file.mimetype,
          uploaded_at: new Date()
        });

      if (insertError) {
        console.error("Error inserting chat file record:", insertError);
        throw insertError;
      }
    }
  }

  // Load conversation history for context (last 20 messages)
  const { data: chatHistory } = await supabase
    .from("chat_history")
    .select("role, message, created_at")
    .eq("chat_id", finalChatId)
    .order("created_at", { ascending: true })
    .limit(20);

  // Formatting
  const conversationContext = (chatHistory || [])
    .filter(msg => msg.message) // Only include messages with text
    .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.message}`)
    .join('\n');

  const state = conversationState.get(user.id);

  // Pass conversation context to intent detection for better accuracy
  const intent = await detectIntent(message, state, conversationContext);
  console.log("Intent:", intent);
  
  if (intent === "log_meal") {
    const response = await logMealHandler(message, files, conversationState, user.id, supabase);

    const responseMessage = typeof response === 'string' ? response : response.reply || JSON.stringify(response);

    await supabase.from("chat_history").insert({
      chat_id: finalChatId,
      role: "ai",
      message: responseMessage,
      created_at: new Date(),  
    });

    // append response with chat id
    const responseWithChatId = { ...response, chat_id: finalChatId };

    return res.json(responseWithChatId);
  }

  if (intent === "log_workout") {
    const response = await logWorkoutHandler(message, files, conversationState, user.id, supabase);

    const responseMessage = typeof response === 'string' ? response : response.reply || JSON.stringify(response);

    await supabase.from("chat_history").insert({
      chat_id: finalChatId,
      role: "ai",
      message: responseMessage,
      created_at: new Date(),  
    });

    // append response with chat id
    const responseWithChatId = { ...response, chat_id: finalChatId };

    return res.json(responseWithChatId);
  }

  if (intent === "recommendation_meal") {
    let response = await recommendationHandlerForMeal(message, user.id, conversationState, supabase);

    const responseMessage = typeof response === 'string' ? response : response.reply || JSON.stringify(response);

    await supabase.from("chat_history").insert({
      chat_id: finalChatId,
      role: "ai",
      message: responseMessage,
      created_at: new Date(),  
    });

    // append response with chat id
    response = { ...response, chat_id: finalChatId };

    return res.json(response);    
  }

  if (intent === "recommendation_workout") {
    const response = await recommendationHandlerForWorkout(message, user.id, conversationState, supabase);
    
    const responseMessage = typeof response === 'string' ? response : response.reply || JSON.stringify(response);

    await supabase.from("chat_history").insert({
      chat_id: finalChatId,
      role: "ai",
      message: responseMessage,
      created_at: new Date(),  
    });

    // append response with chat id
    const responseWithChatId = { ...response, chat_id: finalChatId };
    
    return res.json(responseWithChatId);    
  }

  if (intent === "more_recommendation") {
    const state = conversationState.get(user.id);
    const currentIndex = state.selectedIndex || 0;
    const nextIndex = currentIndex + 1;

    if (!state || !state.recommended[nextIndex]) {
      const prompt = `There is no more recommendation available. Please inform the user in a friendly manner. Stay under 2 sentences.`;
      const gResponse = await queryGemini(prompt);
      return res.json({ reply: gResponse });
    }

    state.selectedIndex = nextIndex;
    conversationState.set(user.id, state);

    const item = state.recommended[nextIndex];
    let prompt = "";

    if (state.type === "MEAL") {
      const meal = item.meal;

      prompt = `
        You are a friendly fitness assistant chatbot.

        Context:
        The user is browsing meal recommendations.
        They selected the next recommended meal.

        Meal details:
        - Name: ${meal.title}
        - Calories: ${meal.calories} kcal
        - Protein: ${meal.protein} g
        - Carbs: ${meal.carbs} g
        - Fat: ${meal.fat} g

        Task:
        Write a short, friendly response:
        - Suggest the recommended meal details
        - Mention calories
        - Ask if the user wants more recommendation or modify the meal
        - Use emojis naturally
        - Keep it under 2 sentences
        `;
    }

    if (state.type === "WORKOUT") {

      prompt = `
        You are a friendly fitness assistant chatbot.

        Context:
        The user is browsing workout recommendations.

       Wokrout details:
        - Name: ${item.title}
        - Description: ${item.description}
        - Source: ${item.source_url}
        - Category: ${item.category_tags}

        Task:
        Write a short, friendly response:
        - Suggest the recommended workout details
        - Mention the workout description, source url and category
        - Ask if the user wants more recommendation
        - Use emojis naturally
        `;
    }
    
    const gResponse = await queryGemini(prompt);

    await supabase.from("chat_history").insert({
      chat_id: finalChatId,
      role: "ai",
      message: gResponse,
      created_at: new Date(),  
    });

    console.log('Gemini response for more recommendation:', gResponse);

    return res.json({
      chat_id: finalChatId,
      reply: gResponse,
    });
  }

  if (intent === "previous_recommendation") {
    const state = conversationState.get(user.id);
    const currentIndex = state.selectedIndex || 0;
    const prevIndex = currentIndex - 1;

    if (!state || !state.recommended[prevIndex]) {
      const prompt = `There is no more recommendation available. Please inform the user in a friendly manner. Stay under 2 sentences.`;
      const gResponse = await queryGemini(prompt);
      return res.json({ reply: gResponse });
    }

    state.selectedIndex = prevIndex;
    conversationState.set(user.id, state);

    const item = state.recommended[prevIndex];
    let prompt = "";

    if (state.type === "MEAL") {
      const meal = item.meal;

      prompt = `
        You are a friendly fitness assistant chatbot.

        Context:
        The user is browsing meal recommendations.
        They selected the next recommended meal.

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
        - Ask if the user wants more recommendation or modify the meal
        - Use emojis naturally
        - Keep it under 2 sentences
        `;
    }

    if (state.type === "WORKOUT") {

      prompt = `
        You are a friendly fitness assistant chatbot.

        Context:
        The user is browsing workout recommendations.

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
    }
    
    const gResponse = await queryGemini(prompt);
    // gResponse = gResponse = `Workout details:
    //  - Name: ${item.title}
    // - Description: ${item.description}
    // - Source: ${item.source_url}
    // - Category: ${item.category_tags.join(', ')}`

    await supabase.from("chat_history").insert({
      chat_id: finalChatId,
      role: "ai",
      message: gResponse,
      created_at: new Date(),  
    });

    console.log('Gemini response for more recommendation:', gResponse);

    return res.json({
      chat_id: finalChatId,
      reply: gResponse,
    });
  }

  if (intent === 'chat') {
    console.log('Querying Gemini for message:', message);
    
    // Build prompt with conversation context
    let prompt = `You are a friendly wellness assistant for VitaTrack, a fitness and nutrition tracking app.

    Your role:
    - Help users with fitness, nutrition, and wellness questions
    - Provide helpful, accurate information
    - Use emojis naturally
    - Be conversational and engaging
    - If you don't know something, admit it politely

    ${conversationContext ? `Previous conversation context:\n${conversationContext}\n\n` : ''}Current user message: "${message}"

    Respond naturally, considering the conversation context if provided. Keep responses concise but helpful.`;

    const gResponse = await queryGemini(prompt);
    console.log('Gemini response:', gResponse);

    await supabase.from("chat_history").insert({
      chat_id: finalChatId,
      role: "ai",
      message: gResponse,
      created_at: new Date(),  
    });

    return res.json({ chat_id: finalChatId, reply: gResponse });
  }

  // Default normal chat placeholder
  return res.json({
    reply: `👋 Hello! How can I support your wellness today? (placeholder)`
  });
});

router.post("/newchat", async (req, res) => {
  const supabase = getRlsClient(req);
  const user = req.user;

  const { data, error } = await supabase
    .from("chats")
    .insert({
      user_id: user.id,
      title: "New chat",
      created_at: new Date(),
      updated_at: new Date()
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

    // 1. Fetch messages for this chat
    const { data: messages } = await supabase
      .from("chat_history")
      .select("msg_id, role, message, created_at")
      .eq("chat_id", chat_id);

    const msgIds = (messages || []).map(m => m.msg_id);

    console.log("Msg IDs to fetch files for:", msgIds);

    const { data: allFiles } = await supabase.from("chat_files").select("*").limit(10);
    console.log("All files in DB:", allFiles);

    // 2. Fetch files for these messages
    const { data: files } = await supabase
      .from("chat_files")
      .select("file_url, file_name, file_type, uploaded_at, msg_id")
      .in("msg_id", msgIds);

    console.log("Fetched files from DB:", files);

    // 3. Generate signed URLs for files
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
          created_at: f.uploaded_at,
          msg_id: f.msg_id
        };
      })
    );

    console.log("Fetched files with URLs:", filesWithUrls);

    // 4. Merge messages and files in timeline
    const timeline = [
      ...messages.map(m => ({
        role: m.role,
        message: m.message,
        created_at: m.created_at,
        msg_id: m.msg_id,
        file_url: null,
        file_name: null
      })),
      ...filesWithUrls
    ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    console.log("Loaded chat timeline:", timeline);

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