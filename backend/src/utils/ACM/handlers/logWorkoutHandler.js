const { queryGemini } = require("../../../services/geminiClient");
const cleanLLMJSON  = require("../cleanLLMJSON");
const extractWorkoutInfoFromFiles = require('../Extraction/extractWorkoutInfoFromFiles');
const extractWorkoutInfoFromMsg = require('../Extraction/extractWorkoutInfoFromMsg');
const processFiles = require("../FileProcessor/fileProcessor");
const recommendationHandlerForWorkout = require("./recommendationHandlerForWorkout");
const explainErrorWithGemini = require("../explainErrorWithGemini");

function isGeminiFallback(text) {
  return (
    typeof text === "string" &&
    (
      text.startsWith("Oops") ||
      text.includes("trouble thinking") ||
      text.length < 30 // optional safety
    )
  );
}

async function logWorkoutHandler(message, files, conversationState, user_id, supabase) {
  try {
    let combinedText = "";
    let imagesForGemini = [];
    let messageToReturn;

    if (files && files.length > 0) {
      const result = await processFiles(files);
      combinedText = result.combinedText;
      imagesForGemini = result.imagesForGemini;
    }

    console.log("Combined text for Gemini:", combinedText);
    console.log("Images for Gemini:", imagesForGemini.map(img => img.filename));

    const hasFiles = files && files.length > 0;

    const extraction = hasFiles
      ? await extractWorkoutInfoFromFiles(message, combinedText, imagesForGemini)
      : await extractWorkoutInfoFromMsg(message);

    if (isGeminiFallback(extraction)) {
      return {           
        reply: extraction
      };
    }
    
    console.log("Extraction result:", extraction);

    let workoutData;

    try {
      workoutData = cleanLLMJSON(extraction);      
      console.log("Cleaned workout data:", workoutData);
    } catch (err) {
      console.error("JSON parse error:", err);
      return {
        reply: await explainErrorWithGemini({
          errorType: "WORKOUT_EXTRACTION_FAILED",
          userMessage: message,
          technicalMessage: err.message
        })
      };
    }

    let workoutDataParsed;

    try {
      workoutDataParsed = typeof workoutData === "string" ? JSON.parse(workoutData) : workoutData;
    } catch (err) {
      console.error("Failed to parse workoutData:", err);
        return { 
          reply: await explainErrorWithGemini({
            errorType: "WORKOUT_DATA_FORMAT_ERROR",
            userMessage: message,
            technicalMessage: err.message
          })
        };
    }

    for(const workout of workoutDataParsed) {
      const workoutSource = workout.source || "unknown";

      // Check for missing workout info
      const requiredFields = ["exercise_name", "sets", "reps", "duration", "calories_burned"];
      const missingFields = requiredFields.filter(field => workout[field] === null);

      if (missingFields.length > 0) {
        if (missingFields.includes("calories_burned")) {
          return { 
            reply: await explainErrorWithGemini({
              errorType: "MISSING_FIELDS_WORKOUT",
              userMessage: message,
              technicalMessage: `Please provide the following missing information: ${missingFields.join(", ")}. To calculate calories burned, please use this link: https://www.calculator.net/calories-burned-calculator.html`
            })
          };

        } else {
          return { 
            reply: await explainErrorWithGemini({
              errorType: "MISSING_FIELDS_WORKOUT",
              userMessage: message,
              technicalMessage: `Please provide the following missing information: ${missingFields.join(", ")}.`
            }) 
          };
        }        
      };

      const { data, error } = await supabase
        .from("workout_logs")
        .insert({
          exercise_name: workout.exercise_name,
          sets: workout.sets,
          reps: workout.reps,
          duration: workout.duration,
          calories_burned: workout.calories_burned,
          source: workoutSource,
          user_id: user_id,
          created_at: new Date()
        });

      if (error) {
        console.error("Workout log error:", error);
        return {
          reply: await explainErrorWithGemini({
            errorType: "DATABASE_WRITE_FAILED",
            userMessage: message,
            technicalMessage: error.message
          })
        };
      } 
    }

    // Fetch user goal from user profile
    const { data: userProfile, error: profileError } = await supabase
      .from("user_profiles")
      .select("goals")
      .eq("user_id", user_id)
      .single();
    
    workoutGoal = userProfile?.goals || null;

    const messageForRec = `Workout goal: ${workoutGoal}`;

    const recResponse = await recommendationHandlerForWorkout(messageForRec, user_id, conversationState, supabase);

    const prompt = `
      You are a friendly fitness assistant chatbot.

      Context:
      The user is logging workout.

      Workout details:
      - ${workoutData}
      
      Task:
      Write a short, friendly response. Can use emojis naturally.
      - Acknowledge the logged workout
      - Mention calories burned`
    
    const gResponse = await queryGemini(prompt);

    if (isGeminiFallback(gResponse)) {
      messageToReturn = gResponse;
    } else {
      messageToReturn = `${gResponse} \n\n${recResponse.reply}`;
    }

    return {
      reply: messageToReturn
    };

  } catch (err) {
    console.error("Unexpected error in logWorkoutHandler:", err);
    return {
      reply: await explainErrorWithGemini({
        errorType: "UNEXPECTED_ERROR",
        userMessage: message,
        technicalMessage: err.message
      })
    };
  }
}

module.exports = logWorkoutHandler;