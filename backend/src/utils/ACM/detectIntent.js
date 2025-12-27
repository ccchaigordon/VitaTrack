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

  // if (state?.state === "SHOWING_RESULTS") {
  //   if (/\b(first|second|third|1|2|3)\b/.test(t)) {
  //     return "select_recommendation";
  //   }
  //   if (/\b(add|change|replace|swap)\b/.test(t)) {
  //     return "modify_recommendation";
  //   }
  //   if (/\b(confirm|log|save|yes)\b/.test(t)) {
  //     return "confirm_recommendation";
  //   }
  //   if (/\b(cancel|no|exit|quit|done)\b/.test(t)) {
  //     return "cancel_recommendation";
  //   }
  //   if (/\b(more|another|next|other)\b/.test(t)) {
  //     return "more_recommendation";
  //   } 
  //   if (/\b(previous|earlier|before|last one)\b/.test(t)) {
  //     return "previous_recommendation";
  //   }   
  // }

  // if (state?.state === "WAITING_WORKOUT_GOAL") {
  //   return 'recommendation_workout';
  // }

  // // state: "IDLE" | "SHOWING_RESULTS" | "LOGGING_MEAL" | "RECOMMENDING",

  // const mealKeywords = /(meal|food|eat|lunch|dinner|breakfast|diet|calories)/;
  // const workoutKeywords = /(workout|exercise|training|gym|cardio|strength|bulk|cut)/;

  // if (/\b(give me|recommend|suggest|what can i have|ideas|recommendation)\b/.test(t)) {

  //   if (workoutKeywords.test(t)) {
  //     return 'recommendation_workout';
  //   }

  //   if (mealKeywords.test(t)) {
  //     return 'recommendation_meal';
  //   }

  //   return 'recommendation';
  // }

  // if (/\b(i ate|i had|ate|had|i drank|log meal)\b/.test(t)) return 'log_meal';
  // if (/\b(i did|completed|ran|jogged|workout|lifted|training|log workout)\b/.test(t)) return 'log_workout'; 

  // return 'chat';

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