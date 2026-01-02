const { queryGemini } = require("../../../services/geminiClient");
const extractWorkoutInfoFromMsg = require('../Extraction/extractWorkoutInfoFromMsg');
const explainErrorWithGemini = require("../explainErrorWithGemini");
const calculateStreak = require('../../PTF/calculateStreak'); 
const { sendNotification } = require('../../../services/notificationClient');

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

function isEmptyWorkout(workouts) {
  if (!Array.isArray(workouts) || workouts.length === 0) return true;

  return workouts.every(w => {
    if (!w?.title) return true;

    const hasDuration = Number(w.duration) > 0;
    const hasSetsOrReps =
      Number(w.sets) > 0 || Number(w.reps) > 0;

    // valid workout if it has duration OR sets/reps
    return !(hasDuration || hasSetsOrReps);
  });
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
        The user is trying to log a workout or physical activity.

        Task:
        Politely inform the user that no valid workout or physical activity information could be confidently identified from their message.

        Guidelines:
        - Be friendly, encouraging, and non-judgmental.
        - Explain that a workout can be ANY physical activity, including gym exercises, sports, or cardio (e.g. badminton, running, walking).
        - Ask the user to provide the following to help log the workout accurately (highlight them):
          - Exercise or activity name
          - Duration (e.g. minutes or hours)
          - Sets and reps (for strength exercises, if applicable)

        Additional notes:
        - Calories burned are optional.
        - If the user does not know the calories, inform them that the system can estimate calories if duration is provided.
        - Optionally, they may estimate calories themselves using this link:
          https://www.calculator.net/calories-burned-calculator.html

        Tone:
        - Short, clear, and supportive.
        - Do NOT sound like an error message.
        - Encourage the user to try again.

        Do NOT extract data.
        Only respond with a conversational message to the user.
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
          exercise_name: workout.title,
          sets: workout.sets,
          reps: workout.reps,
          duration: workout.duration,
          calories_burned: workout.calories_burned,
          source: workout.source || "ai assistant",
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
    
    try {
      const newStreak = await calculateStreak(user_id, supabase);
      console.log(`User ${user_id} new workout streak: ${newStreak}`);

      if ([1, 3, 7, 14, 21, 30].includes(newStreak)) {
         await sendNotification(
           user_id,
           'success',
           `On fire! You hit a ${newStreak}-day workout streak 🔥! Keep it up! 💪`,
           '/progress'
         );
      }
    } catch (streakError) {
      console.error("Streak calculation failed:", streakError);
    }

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