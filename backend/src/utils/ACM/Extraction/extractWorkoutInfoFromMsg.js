const { queryGemini } = require('../../../services/geminiClient');

async function extractWorkoutInfoFromMsg(message) {
    const prompt = `
        You are a workout information extractor.

        - If multiple workouts are present, extract each workout separately.
        - Use the actual exercise names as "exercise_name".
        - Extract sets, reps, duration, and calories burned for each workout.

        From the following message, extract:
        [
            {
            "exercise_name": "... list of items ...",
            "sets": NUMBER,
            "reps": NUMBER,
            "duration": NUMBER,
            "calories_burned": NUMBER,
            "source": "user_message"
            }
        ]

        If data is missing, return null for it.

        RETURN ONLY valid JSON in the above format. If no workout information is found, return an empty JSON array: []

        Message: "${message}"
        `;

    let gResponse = await queryGemini(prompt);

    let parsed;

    const cleanText = gResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    parsed = JSON.parse(cleanText);

    return parsed;
}

module.exports = extractWorkoutInfoFromMsg;