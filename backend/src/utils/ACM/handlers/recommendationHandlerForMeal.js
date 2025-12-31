const tf = require('@tensorflow/tfjs');
const extractMealTime = require('../Extraction/extractMealTime');
const { queryGemini } = require('../../../services/geminiClient');
const detectUserGoalRuleBased = require('../Extraction/extractGoalRuleBased');
const extractUserGoal = require('../Extraction/extractUserGoal');

async function recommendationHandlerForMeal(message, user_id, conversationState, supabase) {
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

    // Try rule-based detection from message
    userGoal = detectUserGoalRuleBased(message);

    // If still unknown, try user profile
    if (!userGoal || userGoal === "Unknown") {
        const { data: userProfile } = await supabase
            .from("user_profiles")
            .select("goals")
            .eq("user_id", user_id)
            .single();
    
        userGoal = detectUserGoalRuleBased(userProfile?.goals);
    }

    // LAST RESORT: Gemini
    if (!userGoal || userGoal === "Unknown") {
        userGoal = await extractUserGoal(message);

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

    // append inferred goal to preferences
    userPreferences.goal = userGoal;
    console.log("Inferred user goal for recommendation:", userGoal);

    mealTime = extractMealTime(message);
    console.log("Inferred meal time for recommendation:", mealTime);

    console.log("User id: ", user_id);

    const { data: meals, error } = await supabase
      .from("meal_logs")
      .select("*")
      .eq("user_id", user_id);

    if (error || !meals.length) {
      conversationState.set(user_id, {
          state: "IDLE",
          type: "MEAL",
      });

      const prompt = `You are a friendly fitness assistant chatbot.
            User preferences:
            ${JSON.stringify(userPreferences)}

            Context:
            The user asked for a meal recommendation, but there is not enough past meal data.

            Task:
            Politely tell the user that you know their preferences and explain that you need more logged meals to give accurate recommendations based on their preferences.
            Encourage the user to log a meal first.
            Keep it friendly.`;

      const gResponse = await queryGemini(prompt);
      return { reply: gResponse };
    }

    console.log("User profile preferences:", userPreferences);

    function normalizeMealTime(value) {
      if (!value) return "";

      return value
        .toLowerCase()
        .trim()
        .replace(/s$/, ""); // remove trailing 's' (snacks → snack)
    }

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
      if (userDietTypes.length === 1 && userDietTypes[0] === "Balanced") {
        return true;
      }

      // Normalize meal dietary tags
      const mealTags = dietaryTags.map(t => t.trim().toLowerCase());

      // UNION logic: match if ANY user diet type exists in meal tags
      return userDietTypes.some(tag => mealTags.includes(tag));
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

      const target = normalizeMealTime(mealTime);

      return meals.filter(m =>
        normalizeMealTime(m.meal_time) === target
      );
    }

    const filteredMealsFromMealLogs = filterMealsByTime(meals, mealTime);

    if (!filteredMealsFromMealLogs.length) {

      conversationState.set(user_id, {
          state: "IDLE",
          type: "MEAL",
      });

      const prompt = `You are a friendly fitness assistant chatbot.
            User preferences:
            ${JSON.stringify(userPreferences)}

            Context:
            The user asked for a meal recommendation, but there is not enough past meal data.

            Task:
            Politely tell the user that you know their preferences and explain that you need more logged meals to give accurate recommendations based on their preferences.
            Encourage the user to log a meal first.
            Keep it friendly.`;

      const gResponse = await queryGemini(prompt);
      return { reply: gResponse };
    }

    const vectorsFromMealLogs = filteredMealsFromMealLogs.map(m => [
      m.calories,
      m.protein,
      m.carbs,
      m.fat
    ]);

    const { data: mealLibrary, error: libError } = await supabase
      .from("recipes")
      .select("*");

    if (libError || !mealLibrary.length) {
      
      conversationState.set(user_id, {
          state: "IDLE",
          type: "MEAL",
      });

      const prompt = `You are a friendly fitness assistant chatbot.
            User preferences:
            ${JSON.stringify(userPreferences)}

            Context:
            The user asked for a meal recommendation, but there is not enough library meal data.

            Task:
            Politely tell the user that you know their preferences and explain that you do not have enough library meal data to give accurate recommendations based on their preferences.
            Keep it friendly.`;

      const gResponse = await queryGemini(prompt);
      return { reply: gResponse };
    }

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

      if (!filteredMealsFromMealLibrary.length) {
        conversationState.set(user_id, {
            state: "IDLE",
            type: "MEAL",
        });

        const prompt = `You are a friendly fitness assistant chatbot.
          User preferences:
          ${JSON.stringify(userPreferences)}

          Context:
          The user requested a meal recommendation, but no suitable meals match the criteria. Acknowledge user preferences.

          Task:
          Politely inform the user that you know their preferences but no meals could be found matching their dietary preferences, allergies, or goals.
          Encourage them to adjust their preferences or log more meals.

          Meal time: ${mealTime || "any"}`;

        const gResponse = await queryGemini(prompt);
        return { reply: gResponse };
      }     

    console.log("Filtered Meals from Library:", filteredMealsFromMealLibrary);

    const vectorsFromMealLibrary = filteredMealsFromMealLibrary.map(m => [    
      m.calories,
      m.protein,
      m.carbs,
      m.fat
    ]);

    //console.log(vectorsFromMealLibrary);

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
    const similarity = tf
      .matMul(mealTensor, refTensor.expandDims(1))
      .reshape([-1]);

    const similarityTensor = similarity;

    const K = Math.min(3, similarityTensor.shape[0]);

    const { values, indices } = tf.topk(similarityTensor, K);

    const topIndices = indices.arraySync();
    const topScores = values.arraySync();

    const recommendations = topIndices.map((idx, i) => ({
      meal: filteredMealsFromMealLibrary[idx],       // original meal object from DB
      similarity: topScores[i]
    }));

    //console.log("Recommendations:", recommendations);

    tf.dispose([
      mealTensor,
      refTensor,
      similarityTensor,
      values,
      indices
    ]);

    // Save to conversation state
    conversationState.set(user_id, {
        state: "SHOWING_RESULTS",
        type: "MEAL",
        recommended: recommendations,
        selectedIndex: 0,
        referenceVector
    });

    const top = recommendations[0];

    if (!top) {
        conversationState.set(user_id, {
            state: "IDLE",
            type: "MEAL",
        });

        return { reply: "Sorry, I couldn't find a suitable meal recommendation." };
    }

    const m = top.meal;

    const prompt = `
      You are a friendly fitness assistant chatbot.

      Context:
      The user is browsing meal recommendations.

      Meal details:
      - Name: ${m.title}
      - Calories: ${m.calories} kcal
      - Protein: ${m.protein} g
      - Carbs: ${m.carbs} g
      - Fat: ${m.fat} g
      - Ingredients: ${m.ingredients}
      - Procedure: ${m.procedure}
      - Cooking time: ${m.cooking_time} minutes
    
      Tell the user that, for more information can browse the source link: ${m.source_url}

      Task:
      Write a short, friendly response:
      - Suggest the recommended meal details
      - Tell the user that you know their preferences
      - Mention calories
      - Ask if the user wants more recommendation
      - Use emojis naturally
      `;
    
    const gResponse = await queryGemini(prompt);

    return { reply: gResponse };
}

module.exports = recommendationHandlerForMeal;