const { queryGemini } = require('../../../services/geminiClient');

async function extractMealInfoFromMsg(message) {
    const prompt = `
        You are a meal information extractor.

        - If multiple meals are present (breakfast, lunch, snack, dinner), extract each meal separately.
        - Use the actual food items as "title", not "Breakfast", "Lunch", etc.
        - Extract protein, carbs, fat, calories and meal time (breakfast, lunch, snack, dinner) for each meal.
        - If protein, carbs, fat, or calories are not mentioned, return the values based on your best estimate/knowledge.

        From the following message, extract:
        [
            {
            "title": "... list of items ...",
            "protein": NUMBER,
            "carbs": NUMBER,
            "fat": NUMBER,
            "calories": NUMBER,
            "meal_time": "... inferred meal time ...",
            "source": "user_message"
            }
        ]

        If data is missing, return null for it.

        RETURN ONLY valid JSON in the above format. If no meal information is found, return an empty JSON array: []

        Message: "${message}"
        `;

    let gResponse = await queryGemini(prompt);

    let parsed;

    const cleanText = gResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    parsed = JSON.parse(cleanText);

    return parsed;
    
}

module.exports = extractMealInfoFromMsg;