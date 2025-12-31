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
      
    const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("goals")
        .eq("user_id", user_id)
        .single();

    userGoal = detectUserGoalRuleBased(userProfile?.goals);
    
    // LAST RESORT: Gemini
    if (!userGoal || userGoal === "Unknown") {
        userGoal = await extractUserGoal(userProfile?.goals);

        if (userGoal === "Unknown") {
          const { data: userProfile } = await supabase
          .from("user_profiles")
          .select("goals")
          .eq("user_id", user_id)
          .single();

          userGoal = await extractUserGoal(userProfile?.goals);
        }
    }

    // Fallback safety
    if (!userGoal || userGoal === "Unknown") {
        userGoal = "General Health";
    }

    function inferMealTimeByClock() {
      const hour = new Date().getHours();

      if (hour >= 5 && hour < 11) return "breakfast";
      if (hour >= 11 && hour < 16) return "lunch";
      if (hour >= 16 && hour < 18) return "snacks";
      if (hour >= 18 && hour < 5) return "dinner";

      return null;
    }

    // append inferred goal to preferences
    userPreferences.goal = userGoal;
    console.log("Inferred user goal for recommendation:", userGoal);

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
      if (!dietTypeText) return true;
      if (!dietaryTags) return false;

      // Split user input into individual diet types, trim and normalize
      const userDietTypes = dietTypeText.split(",").map(d => d.trim().toLowerCase());

      // Normalize meal dietary tags
      const mealTags = dietaryTags.map(t => t.trim().toLowerCase());

      // Return true if **all** user diet types are in the meal tags
      return userDietTypes.every(tag => mealTags.includes(tag));
    }

    function matchesGoals(meal, goals = []) {
      if (!goals.length) return true;

      // Simple macro-based rules (adjust later)
      return goals.every(goal => {
        if (goal === "Muscle Gain") {
          return meal.protein >= 25;
        }
        if (goal === "Weight Loss") {
          return meal.calories <= 600 && meal.fat <= 20;
        }
        if (goal === "Strength") {
          return meal.protein >= 20 && meal.carbs >= 30;
        }
        if (goal === "Endurance") {
          return meal.carbs >= 40;
        }
        if (goal === "Flexibility") {
          return meal.fat <= 25;
        }
        if (goal === "General Health") {
          return meal.calories >= 300 && meal.calories <= 700;
        }        
        if (goal === "Maintenance") {
          return meal.calories >= 400 && meal.calories <= 700;
        }
        return true;
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
    //console.log("Normalized Vectors:", normalizedVectors);

    const referenceVector = averageVector(normalizedVectorsForMealLogs);
    //console.log("Reference Vector:", referenceVector);

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