const express = require('express');
const supabaseServer = require('../services/supabaseClient');
const { queryGemini } = require('../services/geminiClient');
const detectIntent = require('../utils/detectIntent');
const extractMealTime = require('../utils/extractMealTime');
const multer = require('multer');
const upload = multer();

const logMealHandler = require('../utils/ACM/handlers/logMealHandler');
const logWorkoutHandler = require('../utils/ACM/handlers/logWorkoutHandler');

const tf = require('@tensorflow/tfjs');
console.log('tf.linalg:', tf.linalg);


const router = express.Router();

router.post("/chat", upload.any(), async (req, res) => {
  const { message } = req.body;
  const files = req.files;
  if (!message) return res.status(400).json({ error: "Message is required" });

  console.log("Received message:", message);
  console.log("Received files:", files);

  //const user = req.user;
  const intent = detectIntent(message);
  
  // Log meal
  if (intent === "log_meal") {
    const response = await logMealHandler(message, files);
    return res.json(response);
  }

  if (intent === "log_workout") {
    const response = await logWorkoutHandler(message, files);
    return res.json(response);
  }


  if (intent === "recommendation") {
    let mealTime = "";
    let user_id = 1001; // dummy user ID

    mealTime = extractMealTime(message);
    console.log("Inferred meal time for recommendation:", mealTime);

    const { data: meals, error } = await supabaseServer
      .from("meal_logs")
      .select("*")
      .eq("user_id", user_id);

    if (error || !meals.length) {
      throw new Error("No meal data found");
    }

    console.log("Fetched Meals:", meals);

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

    const filteredMealsFromMealLogs = filterMealsByTime(meals, mealTime);

    console.log("Filtered Meals:", filteredMealsFromMealLogs);

    const vectorsFromMealLogs = filteredMealsFromMealLogs.map(m => [
      m.calories,
      m.protein,
      m.carbs,
      m.fat
    ]);

    meal_library_data = [
      { recipe_id: 1,
        title: "Grilled Chicken Salad",
        nutrition_info: "Calories: 350, Protein: 30g, Carbs: 15g, Fat: 12g",
        ingredients: "Chicken breast, mixed greens, cherry tomatoes, cucumber, olive oil, lemon juice" },
      { recipe_id: 2,
        title: "Quinoa and Black Bean Bowl",
        nutrition_info: "Calories: 400, Protein: 20g, Carbs: 50g, Fat: 10g",
        ingredients: "Quinoa, black beans, corn, avocado, salsa, cilantro" },
      { recipe_id: 3,
        title: "Baked Salmon with Asparagus",
        nutrition_info: "Calories: 450, Protein: 35g, Carbs: 10g, Fat: 20g",
        ingredients: "Salmon fillet, asparagus, garlic, olive oil, lemon wedges" },
      { recipe_id: 4,
        title: "Vegetable Stir-Fry with Tofu",
        nutrition_info: "Calories: 300, Protein: 25g, Carbs: 30g, Fat: 8g",
        ingredients: "Tofu, broccoli, bell peppers, snap peas, soy sauce, ginger, garlic" },
    ]

    function parseNutritionInfo(nutritionInfo) {
      const result = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      };

      const caloriesMatch = nutritionInfo.match(/Calories:\s*(\d+)/i);
      const proteinMatch = nutritionInfo.match(/Protein:\s*(\d+)/i);
      const carbsMatch = nutritionInfo.match(/Carbs:\s*(\d+)/i);
      const fatMatch = nutritionInfo.match(/Fat:\s*(\d+)/i);

      if (caloriesMatch) result.calories = Number(caloriesMatch[1]);
      if (proteinMatch) result.protein = Number(proteinMatch[1]);
      if (carbsMatch) result.carbs = Number(carbsMatch[1]);
      if (fatMatch) result.fat = Number(fatMatch[1]);

      return result;
    }

    const parsedMeals = meal_library_data.map(meal => {
      const nutrition = parseNutritionInfo(meal.nutrition_info);

      return {
        recipe_id: meal.recipe_id,
        title: meal.title,
        ingredients: meal.ingredients,
        ...nutrition
      };
    });

    console.log("Parsed Meals from Library:", parsedMeals);

    filteredMealsFromMealLibrary = filterMealsByTime(parsedMeals, mealTime);
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

    const K = 3;

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







    return res.json({
      reply: `🔍 Looking for suggestions... (placeholder)`
    });
  }

  if (intent === 'chat') {
    console.log('Querying Gemini for message:', message);
    const prompt = `You are a friendly wellness assistant. Respond to: "${message}"`;
    const gResponse = await queryGemini(prompt);
    console.log('Gemini response:', gResponse);
    return res.json({ reply: gResponse });
  }

  // Default normal chat placeholder
  return res.json({
    reply: `👋 Hello! How can I support your wellness today? (placeholder)`
  });
});

module.exports = router;