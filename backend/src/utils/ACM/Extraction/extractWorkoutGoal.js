const { queryGemini } = require("../../../services/geminiClient");

async function extractWorkoutGoal(message) {
  const prompt = `
    You are an workout intent classification assistant.

    User message:
    "${message}"

    Task:
    Classify the user's workout goal.

    Respond with ONLY one of the following values:
    - Muscle Gain: User want to bulk up and gain muscle mass.
    - Weight Loss: User want to lose weight and burn fat.
    - Endurance: User want to improve stamina and cardiovascular health.
    - Strength: User want to increase overall strength and power.
    - Flexibility: User want to enhance flexibility and range of motion.
    - General Fitness: User want to maintain overall health and fitness.
    - Unknown: If the goal is unclear or not listed above.

    
    STRICT RULES:
    - Return "Unknown" if the user does NOT clearly mention a specific fitness goal.
    - Generic exercise requests (e.g. "I want to exercise", "suggest workouts", "recommend exercises") MUST be classified as "Unknown".
    - Do NOT infer or guess the goal.
    - Only classify as "General Fitness" if the user explicitly says they want to maintain overall health or general fitness.
    - If multiple goals are mentioned, choose the most dominant one.
    - No explanations.
    - No emojis.
    - No extra text.
    `;

  const response = await queryGemini(prompt);

  return response;
}

module.exports = extractWorkoutGoal;
