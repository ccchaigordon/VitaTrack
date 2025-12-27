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

async function detectIntent(text, state) {

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
    User message: "${text}"
    Conversation state: ${JSON.stringify(state)}
    Possible intents:
      select_recommendation,
      modify_recommendation,
      confirm_recommendation,
      cancel_recommendation,
      more_recommendation,
      previous_recommendation,
      log_meal,
      edit_log_meal,
      delete_log_meal,
      recommendation_meal,
      log_workout,
      edit_log_workout,
      delete_log_workout,      
      recommendation_workout,
      ask_help,
      ask_summary,
      chat
    
    Determine the user's intent based on the message and conversation state.

    Return ONLY valid JSON. Do not include any explanation, markdown, or extra text. 
    Format:
    { "intent": "<intent>" }

    `;

  const response = await queryGemini(prompt);
  const intent = safeParseIntent(response);
  return intent;
}

module.exports = detectIntent;