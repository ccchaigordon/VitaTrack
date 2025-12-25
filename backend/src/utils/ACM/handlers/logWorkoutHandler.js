const { queryGemini } = require("../../../services/geminiClient");
const cleanLLMJSON  = require("../cleanLLMJSON");
const extractWorkoutInfoFromFiles = require('../Extraction/extractWorkoutInfoFromFiles');
const extractWorkoutInfoFromMsg = require('../Extraction/extractWorkoutInfoFromMsg');
const processFiles = require("../FileProcessor/fileProcessor");
const recommendationHandler = require("./recommendationHandlerForWorkout");

async function logWorkoutHandler(message, files, conversationState, user_id, supabase) {
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
    
    console.log("Extraction result:", extraction);

    let workoutData;

    try {
      workoutData = cleanLLMJSON(extraction);      
      console.log("Cleaned workout data:", workoutData);
    } catch (err) {
      console.error("JSON parse error:", err);
      return { reply: "I couldn't understand the workout details." };
    }

    let workoutDataParsed;

    try {
      workoutDataParsed = typeof workoutData === "string" ? JSON.parse(workoutData) : workoutData;
    } catch (err) {
      console.error("Failed to parse workoutData:", err);
      return { reply: "Invalid workout data format." };
    }

    if (!Array.isArray(workoutDataParsed) || workoutDataParsed.length === 0) {
      return { reply: "No workout data found to log." };
    }

    for(const workout of workoutDataParsed) {
      const workoutSource = workout.source || "unknown";

      // Check for missing nutrition info
      const requiredFields = ["exercise_name", "sets", "reps", "duration", "calories_burned"];
      const missingFields = requiredFields.filter(field => workout[field] === null);

      if (missingFields.length > 0) {
        if (missingFields.includes("calories_burned")) {
          return { 
          reply: `Please provide the following missing information: ${missingFields.join(", ")}. To calculate calories burned, please use this link: https://www.calculator.net/calories-burned-calculator.html`
        };
        } else {
          return { reply: `Please provide the following missing information: ${missingFields.join(", ")}.` };
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
        return { reply: "Failed to log workout." };
      }

      const messageForRec = `I have just logged a workout: ${workout.exercise_name} with ${workout.calories_burned} kcal burned. Can you recommend a suitable workout for my next workout?`;

      const recResponse = await recommendationHandler(messageForRec, user_id, conversationState, supabase);

      const prompt = `
        You are a friendly fitness assistant chatbot.

        Context:
        The user is logging workout.

        Workout details:
        - Name: ${workout.exercise_name}
        - Sets: ${workout.sets}
        - Reps: ${workout.reps}
        - Duration: ${workout.duration} minutes
        - Calories Burned: ${workout.calories_burned} kcal

        Task:
        Write a short, friendly response. Can use emojis naturally.
        - Acknowledge the logged workout
        - Mention calories burned`
      
      const gResponse = await queryGemini(prompt);

      messageToReturn = `${gResponse} \n\n${recResponse.reply}`;

      conversationState.set(user_id, { state: "IDLE" });
    }

    return { reply: messageToReturn };
}

module.exports = logWorkoutHandler;