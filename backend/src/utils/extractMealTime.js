const MEAL_TIME_KEYWORDS = {
  breakfast: ["breakfast", "morning", "brunch"],
  lunch: ["lunch", "noon", "afternoon"],
  snacks: ["snack", "snacks", "tea", "refreshment"],
  dinner: ["dinner", "supper", "night", "evening"]
};

function inferMealTimeByClock() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 11) return "breakfast";
  if (hour >= 11 && hour < 17) return "lunch";
  if (hour >= 17 && hour < 22) return "dinner";

  return null;
}

function extract(text) {
  const t = text.toLowerCase();

  for (const [mealTime, keywords] of Object.entries(MEAL_TIME_KEYWORDS)) {
    if (keywords.some(k => t.includes(k))) {
      return mealTime;
    }
  }
  return null; // not specified
}

function extractMealTime(text) {
    let mealTime = extract(text);

    if (!mealTime) {
      mealTime = inferMealTimeByClock();
    }

    return mealTime;
}

module.exports = extractMealTime;