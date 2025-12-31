const extractUserGoal = require('../Extraction/extractUserGoal');
const { queryGemini } = require('../../../services/geminiClient');
const explainErrorWithGemini = require("../explainErrorWithGemini");
const detectUserGoalRuleBased = require('../Extraction/extractGoalRuleBased');

const singularize = (w) => {
  if (w.endsWith("ies") && w.length > 3) return w.slice(0, -3) + "y"; 
  if (w.endsWith("sses")) return w; 
  if (w.endsWith("es") && w.length > 3) return w.slice(0, -2); 
  if (w.endsWith("s") && w.length > 2 && !w.endsWith("ss")) return w.slice(0, -1); 
  return w;
};

const tokenize = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/[^a-z\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(singularize);

const canonical = (s) => tokenize(s).join("");

async function recommendationHandlerForWorkout(message, user_id, conversationState, supabase) {
    try {   
        let userGoal = "";
        let gResponse = "";

        // Try rule-based detection from message
        userGoal = detectUserGoalRuleBased(message);
        
         // If still unknown, try user profile
        if (!userGoal || userGoal === "Unknown") {
            const { data: userProfile } = await supabase
                .from("user_profiles")
                .select("goals")
                .eq("user_id", user_id)
                .single();

            userGoal = detectUserGoalRuleBased(userProfile?.goals);
        }

        // LAST RESORT: Gemini
        if (!userGoal || userGoal === "Unknown") {
            userGoal = await extractUserGoal(message);

            if (userGoal === "Unknown") {
                const { data: userProfile } = await supabase
                .from("user_profiles")
                .select("goals")
                .eq("user_id", user_id)
                .single();

                userGoal = await extractUserGoal(userProfile?.goals);
            }
        }

        // Fallback safety
        if (!userGoal || userGoal === "Unknown") {
            userGoal = "General Health";
        }

        console.log("Inferred workout goal for recommendation:", userGoal);

        const { data: workoutLogs, error: logError } = await supabase
            .from("workout_logs")
            .select("exercise_name")
            .eq("user_id", user_id)
            .gte("created_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()); // last 48h
        
        if (logError) {
            console.error("Error fetching recent workout logs:", logError);
            return {
                reply: await explainErrorWithGemini({
                    errorType: "DATABASE_READ_FAILED",
                    userMessage: message,
                    technicalMessage: logError.message
                })
            };
        }
                        
        const recentWorkoutSet = new Set(
            (workoutLogs || []).map(w => canonical(w.exercise_name))
        );

        console.log("Recent workouts in last 48h:", recentWorkoutSet);

        const { data: wellness_resources, error } = await supabase
            .from("wellness_resources")
            .select("*")
            .contains("category_tags", [userGoal]);    

        if (error || !wellness_resources.length) {
            conversationState.set(user_id, {
                state: "WAITING_WORKOUT_GOAL",
                type: "WORKOUT",
            }); 

            const prompt = 
                `You are a friendly fitness assistant chatbot.

                Context:
                The user requested a workout/exercise recommendation.

                Workout/exercise goal: ${userGoal || "any"}
                
                Inform the user that you know their goal but there are no suitable workout/exercise in the library.
                Suggest the user to change their goal or log more workouts/exercises to get better recommendations.
                Keep it friendly.`;               

            gResponse = await queryGemini(prompt);

            return { reply: gResponse };
        }

        const filteredWorkouts = wellness_resources.filter(workout => {
            const titleNorm = canonical(workout.title);

            if (recentWorkoutSet.has(titleNorm)) return false;

            for (const k of recentWorkoutSet) {
                if (titleNorm.includes(k) || k.includes(titleNorm)) 
                return false;
            }
            return true;
        });

        const recommendations = filteredWorkouts;

        console.log("Filtered workout recommendations:", recommendations);

        // Store conversation state
        conversationState.set(user_id, {
            state: "SHOWING_RESULTS",
            type: "WORKOUT",
            recommended: recommendations,
            selectedIndex: 0
        });  

        const top = recommendations[0];
        console.log("Top workout recommendation:", top);

        const workout = top;

        const prompt = `
            You are a friendly fitness assistant chatbot.

            Context:
            The user is browsing workout/exercise recommendations.

            Recommended workout details:
            - Name: ${workout.title}
            - Description: ${workout.description}
            - Source: ${workout.source_url}
            - Category: ${workout.category_tags}

            Task:
            Write a short, friendly response:
            - Tell the user that you know their goals.
            - Suggest the recommended workout details based on their goals.
            - Mention the workout description, source url and category
            - Can add any extra explanation if needed
            - Ask if the user wants more recommendation
            - Use emojis naturally
            `;
        
        gResponse = await queryGemini(prompt);

        return { reply: gResponse };

    } catch (error) {
        console.error("Unexpected error in recommendationHandlerForWorkout:", error);
        return {
            reply: await explainErrorWithGemini({
                errorType: "UNEXPECTED_ERROR",
                userMessage: message,
                technicalMessage: error.message
            })
        };
    }
}

module.exports = recommendationHandlerForWorkout;