const { queryGemini } = require("../../../services/geminiClient");

async function extractUserGoal(message) {
  const prompt = `
    You are an user goal classification assistant.

    User message:
    "${message}"

    Task:
    Classify the user's goal.

    Respond with possible of following values:
    - Stay Healthy: If the user explicitly mentions maintaining overall health or general fitness.
    - Mental Health: If the user mentions stress relief, anxiety reduction, mindfulness, or similar.
    - Meditation: If the user mentions meditation, mindfulness, or breathing exercises.
    - Lose Weight: If the user mentions weight loss, fat loss, cutting, or slimming.
    - Home: If the user mentions home workouts or exercising at home.
    - Hiit: If the user mentions high-intensity interval training or HIIT.
    - Build Muscle: If the user mentions building muscle, muscle gain, hypertrophy, or bulking.
    - Strength: If the user mentions strength training, getting stronger, or heavy lifting.
    - Gym: If the user mentions going to the gym, using machines, or free weights.
    - Fitness: If the user mentions general fitness or staying fit.
    - Recovery: If the user mentions recovery, rest days, or cool down.
    - Balanced: If the user mentions balanced lifestyle or diet.
    - Lifestyle: If the user mentions lifestyle or daily life.
    - Science: If the user mentions science, research, or study.
    - Mobility: If the user mentions mobility or range of motion.
    - Supplements: If the user mentions supplements, protein powder, or creatine.
    - Review: If the user mentions review, comparison, or rating.
    - Health: If the user mentions health or wellness.
    - Tips: If the user mentions tips, advice, or hacks.
    - Diet: If the user mentions diet or dieting.
    - Education: If the user mentions education, learning, guides, or tutorials.
    - Cooking: If the user mentions cooking, cook, or kitchen.
    - Nutrition: If the user mentions nutrition, nutrients, or macros.
    - Psychology: If the user mentions psychology, mindset, or behavior.
    - Utility: If the user mentions utility, tools, money, shopping, office, food, or math.
    - Money: If the user mentions money, budget, or cost.
    - Shopping: If the user mentions shopping, buy, or purchase.
    - Office: If the user mentions office or work desk.
    - Food: If the user mentions food or meals.
    - Math: If the user mentions math or calculation.
    - Warning: If the user mentions warning, danger, risk, unsafe, or injury.
    - Sleep: If the user mentions sleep, insomnia, or rest.
    - Environment: If the user mentions environment or surroundings.
    - Keto: If the user mentions keto or ketogenic diet.
    - Habits: If the user mentions habits or routines.
    - Water: If the user mentions water or hydration.
    - Activity: If the user mentions activity, exercise, or movement.
    - Time: If the user mentions time.
    - Calisthenics: If the user mentions calisthenics, bodyweight exercises, or similar.
    - Clam: If the user mentions clam exercises.
    - Strength: If the user mentions strength training, getting stronger, or heavy lifting.
    - Recipes: If the user mentions recipes.
    - Power: If the user mentions power.
    - Posture: If the user mentions posture.
    - Cardio: If the user mentions cardio.
    - Legs: If the user mentions legs.
    - Yoga: If the user mentions yoga.
    - Rehab: If the user mentions rehab.
    - Beginner: If the user mentions beginner.
    - Pain Relief: If the user mentions pain relief.
    - Unknown: If the goal is unclear or not listed above.
    
    
    STRICT RULES:
    - Return "Unknown" if the user does NOT clearly mention a specific fitness goal.
    - Generic exercise requests (e.g. "I want to exercise", "suggest workouts", "recommend exercises") MUST be classified as "Unknown".
    - Do NOT infer or guess the goal.
    - Only classify as "General Health" if the user explicitly says they want to maintain overall health or general fitness.
    - If multiple goals are mentioned, choose the most dominant one.
    - No explanations.
    - No emojis.
    - No extra text.

    return in this format: ["<goal_label>", "... additional_goal_labels if any ..."]
    `;

  const response = await queryGemini(prompt);

  return response;
}

module.exports = extractUserGoal;
