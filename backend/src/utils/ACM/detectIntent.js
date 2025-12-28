const { queryGemini } = require("../../services/geminiClient");

function safeParseIntent(response) {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    return JSON.parse(jsonMatch[0]).intent;
  } catch (err) {
    console.error("Failed to parse Gemini intent:", err, response);
    return "chat";
  }
} 

async function detectIntent(text, state, conversationContext = '') {

  const prompt = `
    You are an intent classifier for a fitness and wellness chatbot.
    
    ${conversationContext ? `Previous conversation context:\n${conversationContext}\n\n` : ''}
    Current user message: "${text}"
    Conversation state: ${JSON.stringify(state || {})}
    
    Possible intents:
      - log_workout_goal: User wants to log/set their workout goal
      - log_meal: User wants to log/eat/had a meal (e.g., "I ate...", "I had...", "log my meal")
      - log_workout: User wants to log/completed/did a workout (e.g., "I did...", "I completed...", "log my workout")
      - recommendation_meal: User asks for meal suggestions/recommendations (e.g., "recommend a meal", "what should I eat")
      - recommendation_workout: User asks for workout suggestions/recommendations (e.g., "recommend a workout", "what exercise should I do")
      - more_recommendation: User wants to see next/another recommendation (e.g., "show me another", "next one", "more")
      - previous_recommendation: User wants to see previous/earlier recommendation (e.g., "previous", "go back", "last one")
      - select_recommendation: User accepts, agrees to, or chooses a shown recommendation. (e.g., "I want that", "I'll take this", "yes this one", "looks good")
      - delete_meal_log: User wants to delete a previously logged meal (e.g., "delete my last meal", "remove meal log", "I want to delete a meal I logged")
      - chat: General conversation, questions, advice requests, or unclear intent (e.g., "how can I...", "what is...", "tell me about...")
    
    IMPORTANT: 
    - If the user is asking a question, seeking advice, or having a general conversation, use "chat"
    - Only use log_meal or log_workout if the user explicitly states they want to LOG something they already did
    - Only use recommendation_* if the user explicitly asks for recommendations/suggestions
    - Default to "chat" if unsure
    
    Determine the user's intent based on the message, conversation context, and state.
    Consider the conversation flow - if user just asked for recommendations, "next" likely means more_recommendation.

    Return ONLY valid JSON. Do not include any explanation, markdown, or extra text. 
    Format:
    { "intent": "<intent>" }

    `;

  const response = await queryGemini(prompt);
  const intent = safeParseIntent(response);
  return intent;
}

module.exports = detectIntent;