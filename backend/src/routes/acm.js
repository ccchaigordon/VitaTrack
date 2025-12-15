const express = require('express');
const supabaseServer = require('../services/supabaseClient');
const { queryGemini } = require('../services/geminiClient');
const detectIntent = require('../utils/detectIntent');
const cleanLLMJSON = require('../utils/cleanLLMJSON');
const extractMealInfoFromFiles = require('../utils/extractMealInfoFromFiles');
const extractMealInfoFromMsg = require('../utils/extractMealInfoFromMsg');
const extractWorkoutInfoFromFiles = require('../utils/extractWorkoutInfoFromFiles');
const extractWorkoutInfoFromMsg = require('../utils/extractWorkoutInfoFromMsg');
const fetchNutritionFromSpoonacular = require('../services/spoonacularClient');
const multer = require('multer');
const upload = multer();
const { PDFParse } = require('pdf-parse');

const router = express.Router();

router.post("/chat", upload.any(), async (req, res) => { // later put upload.any()
  const { message } = req.body;
  const files = req.files;
  if (!message) return res.status(400).json({ error: "Message is required" });

  console.log("Received message:", message);
  console.log("Received files:", files);

  //const user = req.user;
  const intent = detectIntent(message);
  
  if (intent === "log_meal") {
    let textFiles = [];
    let csvFiles = [];
    let pdfFiles = [];
    let imageFiles = [];
    let combinedText = [];
    let imagesForGemini = [];

    if (files && files.length > 0) {
      for (const file of files) {
        if (file.mimetype === "text/plain") {
          textFiles.push(file);
        } else if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
          csvFiles.push(file);
        } else if (file.mimetype.startsWith("image/")) {
          imageFiles.push(file);
        } else if (file.mimetype === "application/pdf") {
          pdfFiles.push(file);
        }
      }

      const textContentsWithSource = textFiles.map(f => ({
        text: f.buffer.toString("utf-8"),
        source: "text_file"
      }));

      const csvContentsWithSource = csvFiles.map(f => ({
        text: f.buffer.toString("utf-8"),
        source: "csv_file"
      }));

      const pdfContentsWithSource = [];

      for (const pdf of pdfFiles) {
        try {
          const parser = new PDFParse({ data: pdf.buffer });

          const result = await parser.getText();

          if (!result.text || result.text.trim().length === 0) {
            //const result = await parser.getImage();
            //pdfContents.push(result.pages[0].images[0].data);
          } else {
            pdfContentsWithSource.push({ text: result.text, source: "pdf_file" });
          }

          await parser.destroy();
        } catch (err) {
          console.error("PDF parse error:", err);
          pdfContentsWithSource.push({ text: "[Failed to extract text from PDF]", source: "pdf_file" });
        }
      }      

      const labeledTextBlocks = [...textContentsWithSource, ...csvContentsWithSource, ...pdfContentsWithSource]
       .map(item => `[SOURCE=${item.source}]\n${item.text}`);

      combinedText = labeledTextBlocks.join("\n\n");

      imagesForGemini = imageFiles.map(f => ({
        filename: f.originalname,
        mimeType: f.mimetype,
        base64: f.buffer.toString("base64")
      }));
    } 

    console.log("Combined text for Gemini:", combinedText);
    console.log("Images for Gemini:", imagesForGemini.map(img => img.filename));

    let extraction;
    
    if ((textFiles.length + csvFiles.length + imageFiles.length + pdfFiles.length) > 0) {
      extraction = await extractMealInfoFromFiles(message, combinedText, imagesForGemini);
    } else {
      extraction = await extractMealInfoFromMsg(message); // fallback: just the text message
    }
    
    console.log("Extraction result:", extraction);

    let mealData;

    try {
      mealData = cleanLLMJSON(extraction);      
      console.log("Cleaned meal data:", mealData);
    } catch (err) {
      console.error("JSON parse error:", err);
      return res.json({ reply: "I couldn't understand the meal details." });
    }

    // Mock data for testing
    // mealData = [
    //   {
    //     "meal_name": "2 slices whole wheat toast, 1 boiled egg, 1 banana, 1 cup black coffee",
    //     "meal_time": "breakfast",
    //     "protein": null,
    //     "carbs": null,
    //     "fat": null,
    //     "calories": null
    //   },
    //   {
    //     "meal_name": "Chicken rice (150g chicken, 200g rice), 1 small bowl of mixed vegetables, 1 cup milk tea (medium sugar)",
    //     "meal_time": "lunch",
    //     "protein": null,
    //     "carbs": null,
    //     "fat": null,
    //     "calories": null
    //   },
    //   {
    //     "meal_name": "1 apple, 10 almonds",
    //     "meal_time": "snack",
    //     "protein": null,
    //     "carbs": null,
    //     "fat": null,
    //     "calories": null
    //   },
    //   {
    //     "meal_name": "Grilled salmon (200g), Steamed broccoli (100g), 1 small baked potato",
    //     "meal_time": "dinner",
    //     "protein": null,
    //     "carbs": null,
    //     "fat": null,
    //     "calories": null
    //   }
    // ];

    function splitMealItems(mealName) {
      // Split by comma, semicolon, or 'and'
      return mealName
        .split(/\s*(?:,|;|\band\b)\s*/i)
        .map(item => item.trim())
        .filter(Boolean);
    }

    const mealCache = {};

    async function fetchNutritionCached(foodDescription) {
      console.log("Fetching nutrition for:", foodDescription);
      if (mealCache[foodDescription]) return mealCache[foodDescription];

      const nutrition = await fetchNutritionFromSpoonacular(foodDescription) || 
                        { protein: null, carbs: null, fat: null, calories: null, estimated: true, source: "spoonacular" };

      mealCache[foodDescription] = nutrition;
      return nutrition;
    }

    let mealDataParsed;

    try {
      mealDataParsed = typeof mealData === "string" ? JSON.parse(mealData) : mealData;
    } catch (err) {
      console.error("Failed to parse mealData:", err);
      return res.status(500).json({ reply: "Invalid meal data format." });
    }

    for(const meal of mealDataParsed) {
      const mealSource = meal.source || "unknown";

      // Check for missing nutrition info
      const requiredFields = ["protein", "carbs", "fat", "calories"];
      const missingFields = requiredFields.filter(field => meal[field] === null);

      if (missingFields.length > 0) {    
        const ingredients = splitMealItems(meal.meal_name);
        let totalNutrition = { protein: 0, carbs: 0, fat: 0, calories: 0 };
        
        for (const item of ingredients) {
          const nutrition = await fetchNutritionCached(item);
          totalNutrition.protein += nutrition.protein;
          totalNutrition.carbs += nutrition.carbs;
          totalNutrition.fat += nutrition.fat;
          totalNutrition.calories += nutrition.calories;
        }

        meal.protein = totalNutrition.protein;
        meal.carbs = totalNutrition.carbs;
        meal.fat = totalNutrition.fat;
        meal.calories = totalNutrition.calories;
      }

      console.log("Entry for meal log:", meal);

      const { data, error } = await supabaseServer
        .from("meal_logs")
        .insert({
          meal_name: meal.meal_name,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat,
          calories: meal.calories,
          source: mealSource,
          user_id: 1001, // Placeholder user ID
          created_at: new Date()
        });

      if (error) {
        console.error("Meal log error:", error);
        return res.status(500).json({ reply: "Failed to log meal." });
      }
    }    

    return res.json({
      reply: `🍽️ Meal logged (placeholder). `
    });
  }

  if (intent === "log_workout") {
    let textFiles = [];
    let csvFiles = [];
    let pdfFiles = [];
    let imageFiles = [];
    let combinedText = [];
    let imagesForGemini = [];

    if (files && files.length > 0) {
      for (const file of files) {
        if (file.mimetype === "text/plain") {
          textFiles.push(file);
        } else if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
          csvFiles.push(file);
        } else if (file.mimetype.startsWith("image/")) {
          imageFiles.push(file);
        } else if (file.mimetype === "application/pdf") {
          pdfFiles.push(file);
        }
      }

      const textContentsWithSource = textFiles.map(f => ({
        text: f.buffer.toString("utf-8"),
        source: "text_file"
      }));

      const csvContentsWithSource = csvFiles.map(f => ({
        text: f.buffer.toString("utf-8"),
        source: "csv_file"
      }));

      const pdfContentsWithSource = [];

      for (const pdf of pdfFiles) {
        try {
          const parser = new PDFParse({ data: pdf.buffer });

          const result = await parser.getText();

          if (!result.text || result.text.trim().length === 0) {
            //const result = await parser.getImage();
            //pdfContents.push(result.pages[0].images[0].data);
          } else {
            pdfContentsWithSource.push({ text: result.text, source: "pdf_file" });
          }

          await parser.destroy();
        } catch (err) {
          console.error("PDF parse error:", err);
          pdfContentsWithSource.push({ text: "[Failed to extract text from PDF]", source: "pdf_file" });
        }
      }      

      const labeledTextBlocks = [...textContentsWithSource, ...csvContentsWithSource, ...pdfContentsWithSource]
       .map(item => `[SOURCE=${item.source}]\n${item.text}`);

      combinedText = labeledTextBlocks.join("\n\n");

      imagesForGemini = imageFiles.map(f => ({
        filename: f.originalname,
        mimeType: f.mimetype,
        base64: f.buffer.toString("base64")
      }));
    }

    console.log("Combined text for Gemini:", combinedText);
    console.log("Images for Gemini:", imagesForGemini.map(img => img.filename));

    let extraction;
    
    if ((textFiles.length + csvFiles.length + imageFiles.length + pdfFiles.length) > 0) {
      extraction = await extractWorkoutInfoFromFiles(message, combinedText, imagesForGemini);
    } else {
      extraction = await extractWorkoutInfoFromMsg(message); // fallback: just the text message
    }
    
    console.log("Extraction result:", extraction);

    let workoutData;

    try {
      workoutData = cleanLLMJSON(extraction);      
      console.log("Cleaned workout data:", workoutData);
    } catch (err) {
      console.error("JSON parse error:", err);
      return res.json({ reply: "I couldn't understand the workout details." });
    }

    let workoutDataParsed;

    try {
      workoutDataParsed = typeof workoutData === "string" ? JSON.parse(workoutData) : workoutData;
    } catch (err) {
      console.error("Failed to parse workoutData:", err);
      return res.status(500).json({ reply: "Invalid workout data format." });
    }

    for(const workout of workoutDataParsed) {
      const workoutSource = workout.source || "unknown";

      // Check for missing nutrition info
      const requiredFields = ["exercise_name", "sets", "reps", "duration", "calories_burned"];
      const missingFields = requiredFields.filter(field => workout[field] === null);

      if (missingFields.length > 0) {
        if (missingFields.includes("calories_burned")) {
          return res.json({ reply: `Please provide the following missing information: ${missingFields.join(", ")}. To calculate calories burned, please use this link: https://www.calculator.net/calories-burned-calculator.html` })
        } else {
          return res.json({ reply: `Please provide the following missing information: ${missingFields.join(", ")}.` })
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
        return res.status(500).json({ reply: "Failed to log workout." });
      }
    }

    return res.json({
      reply: `🏋️ Workout logged (placeholder). `
    });
  }

  if (intent === "recommendation") {
    return res.json({
      reply: `🔍 Looking for suggestions... (placeholder)`
    });
  }

  if (intent === 'chat') {
    console.log('Querying Gemini for message:', message);
    const prompt = `You are a friendly wellness assistant. Respond to: "${message}"`;
    const gResponse = await queryGemini(prompt);
    console.log('Gemini response:', gResponse);
    return res.json({ reply: gResponse });
  }

  // Default normal chat placeholder
  return res.json({
    reply: `👋 Hello! How can I support your wellness today? (placeholder)`
  });
});

module.exports = router;