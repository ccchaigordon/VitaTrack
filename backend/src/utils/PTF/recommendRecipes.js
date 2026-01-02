const tf = require('@tensorflow/tfjs');
const detectUserGoalRuleBased = require('../ACM/Extraction/extractGoalRuleBased');
const extractUserGoal = require('../ACM/Extraction/extractUserGoal');

async function recommendRecipes(user_id, supabase) {
  try {
    let mealTime = "";
    let userGoal = "";
    const allergenAliases = {
      dairy: [
        "milk", "cream", "cheese", "butter", "yogurt",
        "whey", "casein", "lactose", "cream cheese",
        "ice cream", "sour cream"
      ],

      gluten: [
        "wheat", "flour", "bread", "pasta", "noodles",
        "barley", "rye", "malt", "semolina", "couscous"
      ],

      egg: [
        "egg", "eggs", "egg white", "egg yolk", "mayonnaise"
      ],

      peanut: [
        "peanut", "peanuts", "groundnut", "peanut butter"
      ],

      tree_nut: [
        "almond", "cashew", "walnut", "pecan", "hazelnut",
        "pistachio", "macadamia", "brazil nut"
      ],

      soy: [
        "soy", "soya", "soybean", "tofu",
        "soy sauce", "miso", "edamame"
      ],

      shellfish: [
        "shrimp", "prawn", "crab", "lobster", "crawfish"
      ],

      fish: [
        "fish", "salmon", "tuna", "cod", "anchovy"
      ],

      sesame: [
        "sesame", "tahini", "sesame oil", "sesame seed"
      ]
    };

    const { data: p } = await supabase
        .from("user_profiles")
        .select("diet_type, allergies")
        .eq("user_id", user_id)
        .single();
    
    const { diet_type, allergies } = p;

    const userPreferences = {
      diet_type,
      allergies
    };
    
    let goal = p?.goals || "";

    // Try rule-based detection from message
    userGoal = detectUserGoalRuleBased(goal);
    console.log("Rule-based detected goal:", userGoal);

    // Normalize function 
    const normalizeGoal = (g) => {
        if (!g) return null;

        // If it's a stringified array, parse it
        if (typeof g === "string") {
            try {
                const parsed = JSON.parse(g);
                if (Array.isArray(parsed)) return parsed;
            } catch {
                // Not JSON, keep as string
            }
        }
        return g;
    };

    // LAST RESORT: Gemini
    if (!userGoal || (Array.isArray(userGoal) && userGoal.includes("Unknown"))) {
        userGoal = await extractUserGoal(goal);
        userGoal = normalizeGoal(userGoal);
        console.log("Gemini-extracted goal:", userGoal);
    }

    // Fallback safety
    if (
        !userGoal ||
        (Array.isArray(userGoal) && userGoal.some(g => g.trim() === "Unknown")) ||
        (typeof userGoal === "string" && userGoal.trim() === "Unknown")
    ) {
        userGoal = "Stay Healthy";
    }

    console.log("Inferred workout goal for recommendation:", userGoal);

    function inferMealTimeByClock() {
      const hour = new Date().getHours();

      if (hour >= 5 && hour < 11) return "breakfast";
      if (hour >= 11 && hour < 16) return "lunch";
      if (hour >= 16 && hour < 18) return "snacks";
      if (hour >= 18 && hour < 5) return "dinner";

      return null;
    }

    mealTime = inferMealTimeByClock();
    console.log("Inferred meal time for recommendation:", mealTime);

    console.log("User id: ", user_id);

    const { data: meals, error } = await supabase
      .from("meal_logs")
      .select("*")
      .eq("user_id", user_id);

    console.log("User profile preferences:", userPreferences);

    function normalizeAllergies(allergies) {
      if (!allergies) return [];

      // If string input
      if (typeof allergies === "string") {
        const val = allergies.trim().toLowerCase();
        if (val === "none" || val === "-" || val === "n/a") return [];
        return [allergies];
      }

      // If array input
      if (Array.isArray(allergies)) {
        return allergies
          .map(a => String(a).trim())
          .filter(a => {
            const v = a.toLowerCase();
            return v && v !== "none" && v !== "-" && v !== "n/a";
          });
      }

      return [];
    }

    const normalizedAllergies = normalizeAllergies(userPreferences.allergies);

    const goalsArray = Array.isArray(userPreferences.goal)
      ? userPreferences.goal
      : [userPreferences.goal];

    function containsAllergen(ingredients, allergies = []) {
      if (!ingredients || !allergies.length) return false;

      const text = Array.isArray(ingredients)
        ? ingredients.join(" ").toLowerCase()
        : ingredients.toLowerCase();

      return allergies.some(allergy => {
        const key = allergy.toLowerCase().replace(/\s+/g, "_");

        const aliases = allergenAliases[key] || [key];

        return aliases.some(alias => text.includes(alias));
      });
    }

    function matchesDietType(dietaryTags, dietTypeText) {
      // If user did not specify diet preference, allow all
      if (!dietTypeText) return true;

      // If meal has no dietary tags, it cannot match
      if (!Array.isArray(dietaryTags) || dietaryTags.length === 0) return false;

      // Normalize user-selected diet types
      const userDietTypes = dietTypeText
        .split(",")
        .map(d => d.trim().toLowerCase())
        .filter(Boolean);

      // If user only selected "balanced", allow all meals
      if (userDietTypes.length === 1 && userDietTypes[0] === "balanced") {
        return true;
      }

      // Normalize meal dietary tags
      const mealTags = dietaryTags.map(t => t.trim().toLowerCase());

      // UNION logic: match if ANY user diet type exists in meal tags
      return userDietTypes.some(tag => mealTags.includes(tag));
    }

    function matchesGoals(meal, goals = []) {
      if (!goals.length) return true;

      return goals.every(goal => {
        switch (goal) {
          // Muscle & Strength
          case "Build Muscle":
            return meal.protein >= 25; // high protein
          case "Strength":
          case "Power":
            return meal.protein >= 20 && meal.carbs >= 30; // protein + energy
          case "Legs":
            return meal.carbs >= 30; // energy for leg workouts

          // Cardio & Conditioning
          case "Cardio":
          case "Hiit":
          case "Endurance":
            return meal.carbs >= 40; // energy for endurance

          // Weight & Health
          case "Lose Weight":
            return meal.calories <= 600 && meal.fat <= 20;
          case "Balanced":
          case "Stay Healthy":
          case "Health":
          case "Fitness":
            return meal.calories >= 300 && meal.calories <= 700;

          // Nutrition & Diet
          case "Nutrition":
          case "Diet":
          case "Food":
          case "Cooking":
          case "Recipes":
          case "Keto":
            return true; // no strict macro rules, include all relevant meals
          case "Supplements":
            return meal.supplements === true; // flag in meal object
          case "Water":
            return meal.isDrink === true && meal.type === "water";

          // Mental & Recovery
          case "Mental Health":
          case "Psychology":
          case "Meditation":
          case "Sleep":
          case "Recovery":
          case "Rehab":
          case "Pain Relief":
            return true; // mostly informational, include all

          // Mobility & Posture
          case "Mobility":
          case "Posture":
          case "Yoga":
            return meal.calories <= 500; // light meals

          // Training Type
          case "Home":
          case "Gym":
          case "Calisthenics":
          case "Beginner":
            return true; // general support

          // Lifestyle / Utility
          case "Lifestyle":
          case "Habits":
          case "Activity":
          case "Time":
          case "Environment":
          case "Utility":
          case "Money":
          case "Shopping":
          case "Office":
          case "Education":
          case "Science":
          case "Review":
          case "Tips":
          case "Math":
          case "Clam":
            return true; // informational, include all

          default:
            return true; // unknown goals: allow by default
        }
      });
    }

    // Filter by rules 
    function filterMealsByTime(meals, mealTime) {
      if (!mealTime) return meals;

      return meals.filter(m =>
        m.meal_time === mealTime
      );
    }

    const filteredMealsFromMealLogs = filterMealsByTime(meals, mealTime);
    console.log("Filtered Meals from Logs:", filteredMealsFromMealLogs);

    const vectorsFromMealLogs = filteredMealsFromMealLogs.map(m => [
      m.calories,
      m.protein,
      m.carbs,
      m.fat
    ]);

    const { data: mealLibrary } = await supabase
      .from("recipes")
      .select("*");

    function parseNutritionJSON(nutrition) {
      return {
        calories: Number(nutrition.calories) || 0,
        protein: Number(String(nutrition.protein).replace("g", "")) || 0,
        carbs: Number(String(nutrition.carbs).replace("g", "")) || 0,
        fat: Number(String(nutrition.fat).replace("g", "")) || 0
      };
    }

    const parsedMeals = mealLibrary.map(meal => {
      const nutrition = parseNutritionJSON(meal.nutrition_info);

      return {
        recipe_id: meal.recipe_id,
        title: meal.title,
        ingredients: meal.ingredients,
        dietary_tags: meal.dietary_tags || [],
        procedure: meal.procedure,
        cooking_time: meal.cooking_time,
        source_url: meal.source_url,
        image_url: meal.image_url,
        ...nutrition
      };
    });

    let filteredMealsFromMealLibrary = parsedMeals

      // diet type
      .filter(meal => matchesDietType(meal.dietary_tags, userPreferences.diet_type))

      // allergies
      .filter(meal => !containsAllergen(meal.ingredients, normalizedAllergies))

      // goals
      .filter(meal => matchesGoals(meal, goalsArray));

    console.log("Filtered Meals from Library:", filteredMealsFromMealLibrary);

    const vectorsFromMealLibrary = filteredMealsFromMealLibrary.map(m => [    
      m.calories,
      m.protein,
      m.carbs,
      m.fat
    ]);

    function normalizeVector(v) {
      const norm = Math.sqrt(v.reduce((sum, x) => sum + x*x, 0));
      if (norm === 0) return v;
      return v.map(x => x / norm);
    }

    function averageVector(vectors) {
      const n = vectors.length;
      const sum = vectors.reduce((acc, v) => acc.map((x, i) => x + v[i]), new Array(vectors[0].length).fill(0));
      return sum.map(x => x / n);
    }

    const normalizedVectorsForMealLogs = vectorsFromMealLogs.map(normalizeVector);

    const referenceVector = averageVector(normalizedVectorsForMealLogs);

    const normalizedVectorsFromMealLibrary = vectorsFromMealLibrary.map(normalizeVector);

    const mealTensor = tf.tensor2d(normalizedVectorsFromMealLibrary);
    const refTensor = tf.tensor1d(referenceVector); 

    // Cosine similarity = dot product of normalized vectors
    const similarity = tf .matMul(mealTensor, refTensor.expandDims(1)).reshape([-1]); const similarityTensor = similarity; 
    const K = Math.min(36, similarityTensor.shape[0]); 
    const { values, indices } = tf.topk(similarityTensor, K); 
    const topIndices = indices.arraySync(); 
    const topScores = values.arraySync(); 
    const recommendations = topIndices.map((idx, i) => ({ 
      meal: filteredMealsFromMealLibrary[idx], 
      similarity: topScores[i] })); 
    tf.dispose([ mealTensor, refTensor, similarityTensor, values, indices ]);

    return { recommendations };
} catch (error) {
      console.error("Error in recommendRecipes:", error);
      throw error;
  }
}

module.exports = recommendRecipes;