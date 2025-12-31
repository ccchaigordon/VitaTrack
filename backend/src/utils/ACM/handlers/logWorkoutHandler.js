const { queryGemini } = require("../../../services/geminiClient");
const extractWorkoutInfoFromMsg = require('../Extraction/extractWorkoutInfoFromMsg');
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

function isEmptyWorkout(workout) {
  if (!workout || typeof workout !== "object") return true;

  const requiredFields = ["exercise_name", "duration", "sets", "reps","calories_burned"];

  return requiredFields.every(
    key => workout[key] === null || workout[key] === undefined || workout[key] === ""
  );
}

async function logWorkoutHandler(message, multimodalContext, conversationState, user_id, supabase) {
  try {
    let messageToReturn;

    const workoutData = multimodalContext
      ? multimodalContext
      : await extractWorkoutInfoFromMsg(message);

    console.log("Workout extraction result:", workoutData);

    if (isGeminiFallback(workoutData)) {
      return {           
        reply: workoutData
      };
    }

    if (isEmptyWorkout(workoutData)) {
      const prompt = `
        You are a friendly fitness assistant chatbot.
        Context:
        The user is trying to log a workout.
        Task:
        Politely inform the user that no valid workout information was found in their message.
        Ask them to provide details like exercise name, duration, sets, reps, and calories burned.
        If calories burned is not known, they can provide an estimate by using this link: https://www.calculator.net/calories-burned-calculator.html
      `;      
      const gResponse = await queryGemini(prompt);
      return {           
        reply: gResponse
      };
    }

    for(const workout of workoutData) {
      const { data, error } = await supabase
        .from("workout_logs")
        .insert({
          exercise_name: workout.exercise_name,
          sets: workout.sets,
          reps: workout.reps,
          duration: workout.duration,
          calories_burned: workout.calories_burned,
          source: workout.source,
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
    

    const prompt = `
      You are a friendly fitness assistant chatbot.

      Context:
      The user is logging workout.

      Workout details:
      - ${workoutData}
      
      Task:
      Write a short, friendly response. Can use emojis naturally.
      - Acknowledge the logged workout
      - Mention calories burned
      - Ask if they need anything else`
      
    
    const gResponse = await queryGemini(prompt);

    messageToReturn = gResponse;
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