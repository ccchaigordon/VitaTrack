const supabaseServer = require("../../../services/supabaseClient");
const cleanLLMJSON  = require("../cleanLLMJSON");
const extractWorkoutInfoFromFiles = require('../Extraction/extractWorkoutInfoFromFiles');
const extractWorkoutInfoFromMsg = require('../Extraction/extractWorkoutInfoFromMsg');
const processFiles = require("../FileProcessor/fileProcessor");

async function logWorkoutHandler(message, files) {
    let combinedText = "";
    let imagesForGemini = [];

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

      const { data, error } = await supabaseServer
        .from("workout_logs")
        .insert({
          exercise_name: workout.exercise_name,
          sets: workout.sets,
          reps: workout.reps,
          duration: workout.duration,
          calories_burned: workout.calories_burned,
          source: workoutSource,
          user_id: 1001, // Placeholder user ID
          created_at: new Date()
        });

      if (error) {
        console.error("Workout log error:", error);
        return { reply: "Failed to log workout." };
      }
    }

    return { reply: `🏋️ Workout logged successfully.` };
}

module.exports = logWorkoutHandler;