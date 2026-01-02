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

        // Fetch user profile goal first
        const { data: userProfile } = await supabase
            .from("user_profiles")
            .select("goals")
            .eq("user_id", user_id)
            .single();
        
        let goal = userProfile?.goals || "";

        // Try rule-based detection from message
        userGoal = detectUserGoalRuleBased(goal);
        console.log("Rule-based detected goal:", userGoal);

        // --- Normalize function ---
        const normalizeGoal = (g) => {
            if (!g) return null;

            // If it's a stringified array, parse it
            if (typeof g === "string") {
                try {
                    const parsed = JSON.parse(g);
                    if (Array.isArray(parsed)) return parsed;
                } catch {
                    // Not JSON, keep as string
                }
            }
            return g;
        };

        // LAST RESORT: Gemini
        if (!userGoal || (Array.isArray(userGoal) && userGoal.includes("Unknown"))) {
            userGoal = await extractUserGoal(goal);
            userGoal = normalizeGoal(userGoal);
            console.log("Gemini-extracted goal:", userGoal);
        }

        // Fallback safety
        if (
            !userGoal ||
            (Array.isArray(userGoal) && userGoal.some(g => g.trim() === "Unknown")) ||
            (typeof userGoal === "string" && userGoal.trim() === "Unknown")
        ) {
            userGoal = "Stay Healthy";
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

        let userGoals = Array.isArray(userGoal) ? userGoal : [userGoal];

        // Check if it's a JSON string inside an array
        if (userGoals.length === 1 && typeof userGoals[0] === "string" && userGoals[0].startsWith("[")) {
            try {
                userGoals = JSON.parse(userGoals[0]);
            } catch (e) {
                console.error("Failed to parse userGoals JSON", e);
            }
        }

        const { data: wellness_resources, error } = await supabase
            .from("wellness_resources")
            .select("*")
            .overlaps("category_tags", userGoals);    

        if (error || !wellness_resources.length) {
            conversationState.set(user_id, {
                state: "WAITING_WORKOUT_GOAL",
                type: "WORKOUT",
            }); 

            const prompt = 
                `You are a friendly fitness assistant chatbot.

                Context:
                The user requested a workout/exercise recommendation.

                Workout/exercise goal: ${goal || "any"}
                
                Inform the user that you know their goal but there are no suitable workout/exercise in the library.
                Suggest the user to change their goal or log more workouts/exercises to get better recommendations.
                Suggest some workouts/exercises categories they can try with examples/explanations.

                Important: 
                - If you suggest some workout/exercise, return ONLY valid JSON in the following format:
                    workouts: [
                        {
                            "title": "... exercise name ...",
                            "sets": NUMBER,
                            "reps": NUMBER,
                            "duration": NUMBER,
                            "calories_burned": NUMBER
                            "source": "ai assistant"
                        }
                    ]

                Keep it friendly.
                
                Return in JSON format including the response and any suggestions. For example:
                {
                    "reply": "Your friendly response here. Some explanations/full guide about the workouts/exercises you suggested.",
                    "workout": [ ... ]
                }`;               

            gResponse = await queryGemini(prompt);

            let parsed;

            try {
                const cleanText = gResponse.replace(/```json/g, "").replace(/```/g, "").trim();
                parsed = JSON.parse(cleanText);
            } catch (err) {
                console.error("Failed to parse Gemini output:", err);
                gResponse = `I'm sorry, I encountered an error while processing your request. Could you please try again later?`;
                res.json({ chat_id: finalChatId, reply: gResponse, choices: choices }) 
            };

            const workout = Array.isArray(parsed.workout) ? parsed.workout : [];
            const firstWorkout = workout.length > 0 ? [workout[0]] : [];

            conversationState.set(user_id, {
                state: "SHOWING_RESULTS",
                type: "WORKOUT",
                recommended: workout,
                multimodalContext: {
                    meals: [],
                    workouts: firstWorkout
                },
                selectedIndex: 0
            });

            return { reply: parsed.reply, choices: ["Log meal", "View meals log", "Log workout", "View workouts log", "Meal recommendation"]};
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

        const top = recommendations[0];
        console.log("Top workout recommendation:", top);

        const workout = top;

        const prompt = `
            You are a friendly fitness assistant chatbot.

            User goal:
            ${goal}

            Context:
            The user is browsing workout/exercise recommendations.

            Recommended workout details:
            - Title: ${workout.title}
            - Description: ${workout.description}
            - Source: ${workout.source_url}
            - Category: ${workout.category_tags}

            Task:
            Write a short, friendly response:
            - Tell the user that you know their goals.
            - Suggest the recommended workout details based on their goals ${goal}.
            - Mention the workout description, source url and category
            - Can add any extra explanation if needed
            - Ask if the user wants more recommendation
            - Use emojis naturally
            `;
        
        gResponse = await queryGemini(prompt);

        conversationState.set(user_id, {
            state: "SHOWING_RESULTS",
            type: "WORKOUT",
            recommended: workout,
            multimodalContext: {
                meals: [],
                workouts: workout ? [workout] : []
            },
            selectedIndex: 0
        });

        return { reply: gResponse, choices: ["Select recommendation", "More recommendation", "Log meal", "Log this workout?", "View meals log", "Log workout", "View workouts log", "Meal recommendation"] };

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