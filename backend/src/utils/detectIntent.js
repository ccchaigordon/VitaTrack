function detectIntent(text, state) {
  const t = (text || '').toLowerCase();

  if (state?.state === "SHOWING_RESULTS") {
    if (/\b(first|second|third|1|2|3)\b/.test(t)) {
      return "select_recommendation";
    }
    if (/\b(add|change|replace|swap)\b/.test(t)) {
      return "modify_recommendation";
    }
    if (/\b(confirm|log|save|yes)\b/.test(t)) {
      return "confirm_recommendation";
    }
    if (/\b(cancel|no|exit|quit|done)\b/.test(t)) {
      return "cancel_recommendation";
    }
    if (/\b(more|another|next|other)\b/.test(t)) {
      return "more_recommendation";
    }    
  }

  // state: "IDLE" | "SHOWING_RESULTS" | "LOGGING_MEAL" | "RECOMMENDING",


  if (/\b(i ate|i had|ate|had|i drank|log meal)\b/.test(t)) return 'log_meal';
  if (/\b(i did|completed|ran|jogged|workout|lifted|training|log workout)\b/.test(t)) return 'log_workout';
  if (/\b(give me|recommend|suggest|what can i have|ideas|recommendation)\b/.test(t)) return 'recommendation';

  return 'chat';
}

module.exports = detectIntent;