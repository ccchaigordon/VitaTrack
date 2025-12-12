const { queryGemini } = require('../services/geminiClient');

async function extractMealInfo(message) {
    const prompt = `
        You are a meal information extractor.

        From the following message, extract:
        - meal_name
        - protein (g)
        - carbs (g)
        - fat (g)
        - calories (kcal)

        If data is missing, return null for it.

        RETURN ONLY valid JSON with keys: meal_name, protein, carbs, fat, calories.

        Message: "${message}"
        `;

  return await queryGemini(prompt);
}

module.exports = extractMealInfo;