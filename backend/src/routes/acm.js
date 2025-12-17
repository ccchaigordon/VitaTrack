const express = require('express');
const supabaseServer = require('../services/supabaseClient');
const { queryGemini } = require('../services/geminiClient');
const detectIntent = require('../utils/detectIntent');
const extractMealTime = require('../utils/extractMealTime');
const multer = require('multer');
const upload = multer();

const logMealHandler = require('../utils/ACM/handlers/logMealHandler');
const logWorkoutHandler = require('../utils/ACM/handlers/logWorkoutHandler');
const recommendationHandler = require('../utils/ACM/handlers/recommendationHandler');

let conversationState = new Map();

const router = express.Router();

router.post("/chat", upload.any(), async (req, res) => {
  const user_id = 1001; // dummy user ID
  const { message } = req.body;
  const files = req.files;
  if (!message) return res.status(400).json({ error: "Message is required" });

  console.log("Received message:", message);
  console.log("Received files:", files);

  const state = conversationState.get(user_id);

  //const user = req.user;
  const intent = detectIntent(message, state);
  
  // Log meal
  if (intent === "log_meal") {
    const response = await logMealHandler(message, files);
    return res.json(response);
  }

  if (intent === "log_workout") {
    const response = await logWorkoutHandler(message, files);
    return res.json(response);
  }

  if (intent === "recommendation") {
    const response = await recommendationHandler(message, user_id, conversationState);
    return res.json(response);    
  }

  if (intent === "more_recommendation") {
    const state = conversationState.get(user_id);
    const currentIndex = state.selectedMealIndex || 0;
    const nextIndex = currentIndex + 1;

    if (!state || !state.recommendedMeals[nextIndex]) {
      const prompt = `There is no more meal recommendation available. Please inform the user accordingly.`;
      const gResponse = await queryGemini(prompt);
      return res.json({ reply: gResponse });
    }

    state.selectedMealIndex = nextIndex;
    conversationState.set(user_id, state);

    const meal = state.recommendedMeals[nextIndex].meal;

    const prompt = `
      You are a friendly fitness assistant chatbot.

      Context:
      The user is browsing meal recommendations.
      They selected the next recommended meal.

      Meal details:
      - Name: ${meal.title}
      - Calories: ${meal.calories} kcal
      - Protein: ${meal.protein} g
      - Carbs: ${meal.carbs} g
      - Fat: ${meal.fat} g

      Task:
      Write a short, friendly response:
      - Acknowledge the choice
      - Mention calories
      - Ask if the user wants more recommendation or modify the meal
      - Use emojis naturally
      - Keep it under 2 sentences
      `;
    
    const gResponse = await queryGemini(prompt);
    console.log('Gemini response for more recommendation:', gResponse);

    return res.json({
      reply: gResponse,
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