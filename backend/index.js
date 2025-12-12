const express = require('express');
const cors = require('cors');
const supabaseAuth = require('./src/routes/auth');
const detectIntent = require('./src/utils/detectIntent');
const extractMealInfo = require('./src/utils/extractMealInfo');
const cleanLLMJSON = require('./src/utils/cleanLLMJSON');
const { queryGemini } = require('./src/services/geminiClient');
const { GoogleGenAI } = require("@google/genai");
const supabaseServer = require('./src/services/supabaseClient');
const udmRoutes = require('./src/routes/udm');

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
  })
);
app.use(express.json());

const multer = require('multer');
const upload = multer();

const ai = new GoogleGenAI({});

app.post("/chat", async (req, res) => { // later put upload.any()
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  //const user = req.user;
  const intent = detectIntent(message);
  
  if (intent === "log_meal") {
    const mealText = message;
    const extraction = await extractMealInfo(mealText);

    let mealData;

    try {
      mealData = cleanLLMJSON(extraction);      
    } catch (err) {
      console.error("JSON parse error:", err);
      return res.json({ reply: "I couldn't understand the meal details." });
    }

    // Check for missing nutrition info
    const requiredFields = ["protein", "carbs", "fat", "calories"];
    const missingFields = requiredFields.filter(field => mealData[field] === null);

    if (missingFields.length > 0) {
      return res.json({
        reply: `I need more information to log this meal. Missing: ${missingFields.join(", ")}. Could you tell me the portions or more details about your meal?`
      });
    }

    const { data, error } = await supabaseServer
      .from("meal_logs")
      .insert({
        meal_name: mealData.meal_name,
        protein: mealData.protein,
        carbs: mealData.carbs,
        fat: mealData.fat,
        calories: mealData.calories,
        user_id: 1001, // Placeholder user ID
        created_at: new Date()
      });

    if (error) {
      console.error("Meal log error:", error);
      return res.status(500).json({ reply: "Failed to log meal." });
    }

    return res.json({
      reply: `🍽️ Meal logged (placeholder). `
    });
  }

  if (intent === "log_workout") {
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

// User & Data Management APIs (auth-required)
app.use('/api', supabaseAuth, udmRoutes);


const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Vitatrack API running at http://localhost:${PORT}`);
});
