const fetchNutritionFromSpoonacular = require("./spoonacularClient");
const { fetchNutritionFromOpenFoodFacts } = require("./openFoodFactsClient");

/**
 * Unified nutrition lookup service
 * Tries OpenFoodFacts first (for accuracy), then falls back to Spoonacular
 */
async function fetchNutritionData(query, options = {}) {
  const { barcode = null, preference = "openfoodfacts" } = options;

  try {
    // If barcode provided, try OpenFoodFacts first
    if (barcode) {
      const offResult = await fetchNutritionFromOpenFoodFacts(barcode);
      if (offResult) {
        return offResult;
      }
    }

    // Fall back to Spoonacular for ingredient parsing
    const spoonResult = await fetchNutritionFromSpoonacular(query);
    return spoonResult;
  } catch (err) {
    console.error("Nutrition fetch error:", err.message);
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      estimated: true,
      source: "error"
    };
  }
}

module.exports = {
  fetchNutritionData
};
