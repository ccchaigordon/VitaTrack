const axios = require("axios");

async function fetchFromOpenFoodFacts(foodName) {
  try {
    const response = await axios.get(
      `https://world.openfoodfacts.org/cgi/search.pl`,
      {
        params: {
          search_terms: foodName,
          search_simple: 1,
          action: "process",
          json: 1,
          page_size: 1
        }
      }
    );

    const product = response.data.products?.[0];
    if (!product || !product.nutriments) return null;

    return {
      calories: product.nutriments["energy-kcal_100g"] ?? null,
      protein: product.nutriments["proteins_100g"] ?? null,
      fat: product.nutriments["fat_100g"] ?? null,
      carbs: product.nutriments["carbohydrates_100g"] ?? null,
      source: "openfoodfacts",
      estimated: true
    };

  } catch (error) {
    console.error("OpenFoodFacts error:", error.message);
    return null;
  }
}

module.exports = fetchFromOpenFoodFacts;
