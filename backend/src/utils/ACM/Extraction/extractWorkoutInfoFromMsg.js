const { queryGemini } = require('../../../services/geminiClient');

async function extractWorkoutInfoFromMsg(message) {
   const prompt = `
        You are a workout and physical activity information extractor.

        Definition:
        - A workout can be ANY physical activity, including:
        - Gym exercises (e.g. squats, bench press)
        - Cardio activities (e.g. running, cycling)
        - Sports and games (e.g. badminton, basketball, football)
        - General activities (e.g. walking, hiking)

        Rules:
        - If multiple workouts are mentioned, extract each one separately.
        - Use the actual activity or exercise name as "title".
        - Extract or infer the following:
        - sets (number of sets, if applicable)
        - reps (number of repetitions, if applicable)
        - duration (in minutes)
        - calories_burned (in kcal)
        - If sets, reps, or calories are given as 0 for a workout where they do not logically apply, treat them as invalid.


        Calories estimation rules:
        - If calories are explicitly stated, use that value.
        - If a sport or cardio activity has a valid duration but calories are given as 0, ignore the stated value and estimate calories. Tell the user that you have estimated the calories based on duration.
        - If calories are not stated:
        - Estimate calories ONLY if duration is provided or if sets or reps is provided.
        - Use reasonable average values for a typical adult.
        - Sports and cardio activities MUST have estimated calories only if duration exists. HOWEVER, For calisthenics (e.g. jumping jacks, burpees, mountain climbers, etc.), if reps or sets are provided but duration is missing, estimate calories based on average time per rep or per set.
        - Calories_burned must NEVER be null if duration is available.
        - Do NOT guess or invent duration. If duration is missing, set "duration": null and "calories_burned": 0. (except for calisthenics as mentioned above).

        Other rules:
        - For sports or cardio activities, sets and reps are usually null.
        - Convert hours to minutes if duration is provided in hours.
        - If a value cannot be determined at all (except calories when duration exists), return null.

        Return the result as a JSON array in the following format:

        [
        {
            "title": "string",
            "sets": number | null,
            "reps": number | null,
            "duration": number | null,
            "calories_burned": number,
            "source": "user_message"
        }
        ]

        IMPORTANT:
        - Return ONLY valid JSON.
        - If no workout or physical activity is found, return an empty array: [].

        Message: "${message}"
    `;



    let gResponse = await queryGemini(prompt);

    let parsed;

    const cleanText = gResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    parsed = JSON.parse(cleanText);

    return parsed;
}

module.exports = extractWorkoutInfoFromMsg;