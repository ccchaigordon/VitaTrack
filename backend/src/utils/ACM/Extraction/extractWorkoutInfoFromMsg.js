const { queryGemini } = require('../../../services/geminiClient');

async function extractWorkoutInfoFromMsg(message) {
    const prompt = `
        You are a workout information extractor.

        From the following message, extract:
        - exercise_name
        - sets
        - reps
        - duration
        - calories_burned

        If data is missing, return null for it.

        RETURN ONLY valid JSON with keys: exercise_name, sets, reps, duration, calories_burned.

        Message: "${message}"
        `;

  return await queryGemini(prompt);
}

module.exports = extractWorkoutInfoFromMsg;