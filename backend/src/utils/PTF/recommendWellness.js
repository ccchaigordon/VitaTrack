const detectUserGoalRuleBased = require('../ACM/Extraction/extractGoalRuleBased');
const extractUserGoal = require('../ACM/Extraction/extractUserGoal');

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

const normalise = (s) => tokenize(s).join("");

async function recommendWellness(user_id, supabase) {
  try {   
      let userGoal = "";
      
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
      }
          
      const recentWorkoutSet = new Set(
          (workoutLogs || []).map(w => normalise(w.exercise_name))
      );


      console.log("Recent workouts in last 48h:", recentWorkoutSet);

      const { data: wellness_resources, error } = await supabase
          .from("wellness_resources")
          .select("*")
          .contains("category_tags", [userGoal]);    

      if (error || !wellness_resources.length) {
          console.error("Error fetching wellness resources:", error);
      }

      const filteredWorkouts = wellness_resources.filter(workout => {
        const titleNorm = normalise(workout.title);

          if (recentWorkoutSet.has(titleNorm)) return false;

          for (const k of recentWorkoutSet) {
            if (titleNorm.includes(k) || k.includes(titleNorm)) 
              return false;
          }
          return true;
      });

      const recommendations = filteredWorkouts;

      console.log("Filtered workout recommendations:", recommendations);

      return { recommendations };

  } catch (error) {
      console.error("Error in recommendWellness:", error);
      throw error;
  }
}

module.exports = recommendWellness;