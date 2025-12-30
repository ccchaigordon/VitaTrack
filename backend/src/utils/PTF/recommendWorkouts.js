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

const canonical = (s) => tokenize(s).join("");

async function recommendWorkouts(user_id, supabase) {
  try {   
      let userGoal = "";
      
      const { data: userProfile } = await supabase
          .from("user_profiles")
          .select("goals")
          .eq("user_id", user_id)
          .single();

      userGoal = detectUserGoalRuleBased(userProfile?.goals);
      
      // LAST RESORT: Gemini
      if (!userGoal || userGoal === "Unknown") {
          userGoal = await extractUserGoal(userProfile?.goals);

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
          console.error("Error fetching wellness resources:", error);
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

      return { recommendations };

  } catch (error) {
      console.error("Error in recommendWorkouts:", error);
      throw error;
  }
}

module.exports = recommendWorkouts;