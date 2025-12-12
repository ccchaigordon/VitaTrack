function detectIntent(text) {
  const t = (text || '').toLowerCase();

  if (/\b(i ate|i had|ate|had|i drank|log meal|)\b/.test(t)) return 'log_meal';
  if (/\b(i did|completed|ran|jogged|workout|lifted|training)\b/.test(t)) return 'log_workout';
  if (/\b(give me|recommend|suggest|what can i have|ideas|recommendation)\b/.test(t)) return 'recommendation';

  return 'chat';
}

module.exports = detectIntent;