const express = require('express');
const supabaseServer = require('../services/supabaseClient');
const { queryGemini } = require('../services/geminiClient');
const detectIntent = require('../utils/ACM/detectIntent');
const multer = require('multer');
const upload = multer();

const logMealHandler = require('../utils/ACM/handlers/logMealHandler');
const logWorkoutHandler = require('../utils/ACM/handlers/logWorkoutHandler');
const recommendationHandlerForMeal = require('../utils/ACM/handlers/recommendationHandlerForMeal');
const recommendationHandlerForWorkout = require('../utils/ACM/handlers/recommendationHandlerForWorkout');

let conversationState = new Map();

function getRlsClient(req) {
  console.log('Creating RLS client with access token:', req.user.accessToken);
  return supabaseServer.createUserSupabaseClient(req.user.accessToken);
}

const router = express.Router();

router.post("/chat", upload.any(), async (req, res) => {
  // const user_id = 1001; // dummy user ID
  const supabase = getRlsClient(req);

  // Access the user ID
  const user_id = req.user?.id || req.user?.user_id || 1001; // fallback to dummy
  console.log("user_id:", user_id, typeof user_id);

  const { data } = await supabase
  .rpc('get_current_user'); // optional: you can create a simple function that returns auth.uid()
console.log(data);

  const { message } = req.body;
  const files = req.files;
  if (!message) return res.status(400).json({ error: "Message is required" });

  console.log("Received message:", message);
  console.log("Received files:", files);

  const state = conversationState.get(user_id);

  //const user = req.user;
  const intent = detectIntent(message, state);
  console.log("Intent:", intent);
  
  // Log meal
  if (intent === "log_meal") {
    const response = await logMealHandler(message, files, conversationState, user_id, supabase);
    return res.json(response);
  }

  if (intent === "log_workout") {
    const response = await logWorkoutHandler(message, files, conversationState, user_id, supabase);
    return res.json(response);
  }

  if (intent === "recommendation_meal") {
    const response = await recommendationHandlerForMeal(message, user_id, conversationState, supabase);
    return res.json(response);    
  }

  if (intent === "recommendation_workout") {
    const response = await recommendationHandlerForWorkout(message, user_id, conversationState, supabase);
    return res.json(response);    
  }

  if (intent === "more_recommendation") {
    const state = conversationState.get(user_id);
    const currentIndex = state.selectedIndex || 0;
    const nextIndex = currentIndex + 1;

    if (!state || !state.recommended[nextIndex]) {
      const prompt = `There is no more recommendation available. Please inform the user accordingly.`;
      const gResponse = await queryGemini(prompt);
      return res.json({ reply: gResponse });
    }

    state.selectedIndex = nextIndex;
    conversationState.set(user_id, state);

    const item = state.recommended[nextIndex];
    let prompt = "";

    if (state.type === "MEAL") {
      const meal = item.meal;

      prompt = `
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
    }

    if (state.type === "WORKOUT") {

      prompt = `
        You are a friendly fitness assistant chatbot.

        Context:
        The user is browsing workout recommendations.

       Wokrout details:
        - Name: ${item.title}
        - Description: ${item.description}
        - Source: ${item.source_url}
        - Category: ${item.category_tags}

        Task:
        Write a short, friendly response:
        - Acknowledge the choice
        - Ask if the user wants more recommendation
        - Use emojis naturally
        - Keep it under 2 sentences
        `;
    }
    
    // const gResponse = await queryGemini(prompt);
    gResponse = gResponse = `Workout details:
     - Name: ${item.title}
    - Description: ${item.description}
    - Source: ${item.source_url}
    - Category: ${item.category_tags.join(', ')}`

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