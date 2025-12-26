const tf = require('@tensorflow/tfjs');
const extractMealTime = require('../Extraction/extractMealTime');
const { queryGemini } = require('../../../services/geminiClient');

async function recommendationHandlerForMeal(message, user_id, conversationState, supabase) {
    let mealTime = "";

    mealTime = extractMealTime(message);
    console.log("Inferred meal time for recommendation:", mealTime);

    console.log("User id: ", user_id);

    const { data: meals, error } = await supabase
      .from("meal_logs")
      .select("*")
      .eq("user_id", user_id);

    //console.log("Fetched Meals:", meals);

    if (error || !meals.length) {

      conversationState.set(user_id, {
          state: "IDLE",
          type: "MEAL",
      });

      const prompt = `You are a friendly fitness assistant chatbot.
            Context:
            The user asked for a meal recommendation, but there is not enough past meal data.

            Task:
            Politely explain that you need more logged meals to give accurate recommendations.
            Encourage the user to log a meal first.
            Keep it friendly and under 2 sentences.`;

      const gResponse = await queryGemini(prompt);
      return { reply: gResponse };
    }

    // Filter by rules based on meal time
    function filterMealsByTime(meals, mealTime) {
      if (mealTime === "breakfast") {
        return meals.filter(m => m.calories >= 300 && m.calories <= 550);
      }
      if (mealTime === "lunch") {
        return meals.filter(m => m.calories >= 500 && m.calories <= 750);
      }
      if (mealTime === "dinner") {
        return meals.filter(m => m.calories >= 500 && m.calories <= 800);
      }
      return meals;
    }

    function filterMealsByTime_Calories(meals, mealTime) {
      if (!mealTime) return meals;

      let min = 0;
      let max = Infinity;

      if (mealTime === "breakfast") {
        min = 300;
        max = 550;
      } else if (mealTime === "lunch") {
        min = 500;
        max = 750;
      } else if (mealTime === "dinner") {
        min = 500;
        max = 800;
      }

      return meals.filter(m =>
        m.meal_time === mealTime &&
        m.calories >= min &&
        m.calories <= max
      );
    }

    const filteredMealsFromMealLogs = filterMealsByTime_Calories(meals, mealTime);

    if (!filteredMealsFromMealLogs.length) {

      conversationState.set(user_id, {
          state: "IDLE",
          type: "MEAL",
      });

      const prompt = `You are a friendly fitness assistant chatbot.
            Context:
            The user asked for a meal recommendation, but there is not enough past meal data.

            Task:
            Politely explain that you need more logged meals to give accurate recommendations.
            Encourage the user to log a meal first.
            Keep it friendly and under 2 sentences.`;

      const gResponse = await queryGemini(prompt);
      return { reply: gResponse };
    }

    //console.log("Filtered Meals:", filteredMealsFromMealLogs);

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
            Context:
            The user asked for a meal recommendation, but there is not enough library meal data.

            Task:
            Politely explain that you do not have enough library meal data to give accurate recommendations.
            Keep it friendly and under 2 sentences.`;

      const gResponse = await queryGemini(prompt);
      return { reply: gResponse };
    }

    console.log("Fetched Meal Library:", mealLibrary);

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
        procedure: meal.procedure,
        cooking_time: meal.cooking_time,
        ...nutrition
      };
    });

    console.log("Parsed Meals from Library:", parsedMeals);

    filteredMealsFromMealLibrary = filterMealsByTime(parsedMeals, mealTime);

    if (!filteredMealsFromMealLibrary.length) {

      conversationState.set(user_id, {
          state: "IDLE",
          type: "MEAL",
      });

      const prompt = `You are a friendly fitness assistant chatbot.
        Context:
        The user requested a meal recommendation, but no suitable meals match the criteria.

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

    console.log(vectorsFromMealLibrary);

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
      .squeeze();

    const similarityTensor = similarity;

    const K = Math.min(3, similarityTensor.shape[0]);

    const { values, indices } = tf.topk(similarityTensor, K);

    const topIndices = indices.arraySync();
    const topScores = values.arraySync();

    const recommendations = topIndices.map((idx, i) => ({
      meal: filteredMealsFromMealLibrary[idx],       // original meal object from DB
      similarity: topScores[i]
    }));

    console.log("Recommendations:", recommendations);

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

      Task:
      Write a short, friendly response:
      - Acknowledge the choice
      - Mention calories
      - Ask if the user wants more recommendation or modify the meal
      - Use emojis naturally
      - Keep it under 2 sentences
      `;
    
    const gResponse = await queryGemini(prompt);

    return { reply: gResponse };
}

module.exports = recommendationHandlerForMeal;