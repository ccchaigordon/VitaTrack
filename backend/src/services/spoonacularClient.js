const axios = require("axios");
const qs = require("qs");

async function fetchNutritionFromSpoonacular(ingredient) {

  try {
    const body = qs.stringify({
      ingredientList: ingredient,
      servings: 1,
      includeNutrition: true,
      language: "en"
    });

    const response = await axios.post(
      "https://api.spoonacular.com/recipes/parseIngredients",
      body,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        params: { apiKey: process.env.SPOONACULAR_API_KEY }
      }
    );

    const data = response.data?.[0];
    if (!data || !data.nutrition?.nutrients) throw new Error("No nutrition data");

    // Extract main macros
    const nutrients = data.nutrition.nutrients.reduce((acc, n) => {
      const name = n.name.toLowerCase();
      if (name === "protein") acc.protein = n.amount;
      if (name === "carbohydrates") acc.carbs = n.amount;
      if (name === "fat") acc.fat = n.amount;
      if (name === "calories") acc.calories = n.amount;
      return acc;
    }, { protein: 0, carbs: 0, fat: 0, calories: 0 });

    const result = { ...nutrients, source: "spoonacular", estimated: true };
    return result;

  } catch (err) {
    console.error("Spoonacular error:", err.message, ingredient);
    return { protein: 0, carbs: 0, fat: 0, calories: 0, estimated: true, source: "spoonacular" };
  }
}

module.exports = fetchNutritionFromSpoonacular;