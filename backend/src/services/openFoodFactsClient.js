const axios = require("axios");

/**
 * Fetch nutrition data from OpenFoodFacts API
 * @param {string} barcode - Product barcode
 * @returns {object} Nutrition data including calories, protein, carbs, fat
 */
async function fetchNutritionFromOpenFoodFacts(barcode) {
  try {
    const response = await axios.get(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    );

    const product = response.data.product;
    if (!product) {
      throw new Error("Product not found");
    }

    const nutrients = product.nutriments || {};
    const servingSize = product.serving_quantity || 100;

    return {
      product_name: product.product_name,
      brand: product.brands,
      barcode: barcode,
      calories: Math.round(nutrients["energy-kcal"] || 0),
      protein: Math.round((nutrients["proteins"] || 0) * 100) / 100,
      carbs: Math.round((nutrients["carbohydrates"] || 0) * 100) / 100,
      fat: Math.round((nutrients["fat"] || 0) * 100) / 100,
      serving_size: servingSize,
      serving_unit: product.serving_size,
      source: "openfoodfacts",
      estimated: false
    };
  } catch (err) {
    console.error("OpenFoodFacts error:", err.message, barcode);
    return null;
  }
}

/**
 * Search products by name in OpenFoodFacts
 * @param {string} query - Product name/query
 * @returns {array} Array of matching products
 */
async function searchOpenFoodFacts(query) {
  try {
    const response = await axios.get("https://world.openfoodfacts.org/cgi/search.pl", {
      params: {
        search_terms: query,
        search_simple: 1,
        action: "process",
        json: 1,
        page_size: 10
      }
    });

    return response.data.products || [];
  } catch (err) {
    console.error("OpenFoodFacts search error:", err.message);
    return [];
  }
}

module.exports = {
  fetchNutritionFromOpenFoodFacts,
  searchOpenFoodFacts
};
