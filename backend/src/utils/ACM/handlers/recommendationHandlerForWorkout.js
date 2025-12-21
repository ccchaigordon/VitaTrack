const tf = require('@tensorflow/tfjs');
const extractWorkoutGoal = require('../Extraction/extractWorkoutGoal');
const { queryGemini } = require('../../../services/geminiClient');

async function recommendationHandlerForWorkout(message, user_id, conversationState, supabase) {
    let workoutGoal = "";
    let gResponse = "";

    workoutGoal = extractWorkoutGoal(message);
    console.log("Inferred workout goal for recommendation:", workoutGoal);

    // Fetch workout details from db       
    const { data: wellness_resources, error } = await supabase
        .from("wellness_resources")
        .select("*");
        //.contains("category_tags", [workoutGoal]);    

    console.log(wellness_resources);

    if (error || !wellness_resources.length) {
        conversationState.set(user_id, {
            state: "WAITING_WORKOUT_GOAL",
            type: "WORKOUT",
        }); 

        // const prompt = `You are a friendly fitness assistant chatbot.
        // Context:
        // The user requested a workout/exercise recommendation, but no suitable workout/exercise match the criteria. Ask the user what their workout goal is (e.g. strength, cardio, fat loss).

        // Workout/exercise goal: ${workoutGoal || "any"}`;

        // const gResponse = await queryGemini(prompt);

        gResponse = "I can't find suitable workout";
        return { reply: gResponse };
    }

    const recommendations = wellness_resources;

    // Store conversation state
    conversationState.set(user_id, {
      state: "SHOWING_RESULTS",
      type: "WORKOUT",
      recommended: recommendations,
      selectedIndex: 0
    });  

    console.log("Recommendations:", recommendations);

    const top = recommendations[0];

    const workout = top;

    // const prompt = `
    //   You are a friendly fitness assistant chatbot.

    //   Context:
    //   The user is browsing workout/exercise recommendations.

    //   Workout details:
    //   - Name: ${workout.title}
    //   - Description: ${workout.description}
    //   - Source: ${workout.source_url}
    //   - Category: ${workout.category_tags}

    //   Task:
    //   Write a short, friendly response:
    //   - Acknowledge the choice
    //   - Ask if the user wants more recommendation
    //   - Use emojis naturally
    //   - Keep it under 2 sentences
    //   `;
    
    // const gResponse = await queryGemini(prompt);

    gResponse = `Workout details:
    - Name: ${workout.title}
    - Description: ${workout.description}
    - Source: ${workout.source_url}
    - Category: ${workout.category_tags.join(', ')}`

    return { reply: gResponse };
}

module.exports = recommendationHandlerForWorkout;