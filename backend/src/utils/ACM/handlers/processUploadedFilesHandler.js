const extractInfoFromFiles = require('../Extraction/extractInfoFromFiles');
const processFiles = require('../FileProcessor/fileProcessor');
const cleanLLMJSON  = require("../cleanLLMJSON");
const fetchNutritionFromSpoonacular = require("../../../services/spoonacularClient");
const explainErrorWithGemini = require("../explainErrorWithGemini");

function isGeminiFallback(text) {
  return (
    typeof text === "string" &&
    (
      text.startsWith("Oops") ||
      text.includes("trouble thinking") ||
      text.length < 30
    )
  );
}

async function processUploadedFilesHandler(message, files) {
    let combinedText = "";
    let imagesForGemini = [];
    
    const result = await processFiles(files);
    combinedText = result.combinedText;
    imagesForGemini = result.imagesForGemini;    

    console.log("Combined text for Gemini:", combinedText);
    console.log("Images for Gemini:", imagesForGemini.map(img => img.filename));
    
    const extraction = await extractInfoFromFiles(message, combinedText, imagesForGemini);

    if (isGeminiFallback(extraction)) {
      return {           
        reply: extraction
      };
    }

    console.log("Extraction result:", extraction);

    let dataParsed = {
      meals: [],
      workouts: []
    };

    try {
      const parsedText = JSON.parse(cleanLLMJSON(extraction.responseForCombinedText) || "{}");
      const parsedImages = JSON.parse(cleanLLMJSON(extraction.responseForImages) || "{}");

      // Merge meals
      if (Array.isArray(parsedText.meals)) dataParsed.meals.push(...parsedText.meals);
      if (Array.isArray(parsedImages.meals)) dataParsed.meals.push(...parsedImages.meals);

      // Merge workouts
      if (Array.isArray(parsedText.workouts)) dataParsed.workouts.push(...parsedText.workouts);
      if (Array.isArray(parsedImages.workouts)) dataParsed.workouts.push(...parsedImages.workouts);

      console.log("Combined parsed data:", dataParsed);

    } catch (err) {
      console.error("JSON parse error:", err);
      return {
        reply: await explainErrorWithGemini({
          errorType: "EXTRACTION_FAILED",
          userMessage: message,
          technicalMessage: err.message
        })
      };
    }

    function splitMealItems(mealName) {
      // Handle if mealName is already an array
      if (Array.isArray(mealName)) {
        return mealName.map(item => String(item).trim()).filter(Boolean);
      }
      // If it's a string, split by comma, semicolon, or 'and'
      if (typeof mealName === 'string') {
        return mealName
          .split(/\s*(?:,|;|\band\b)\s*/i)
          .map(item => item.trim())
          .filter(Boolean);
      }
      // Convert to string and split
      return String(mealName)
        .split(/\s*(?:,|;|\band\b)\s*/i)
        .map(item => item.trim())
        .filter(Boolean);
    }
    
    function normalizeMealName(mealName) {
      // Convert array to string if needed, or return string as-is
      if (Array.isArray(mealName)) {
        return mealName.join(', ');
      }
      return String(mealName);
    }

    const mealCache = {};

    async function fetchNutritionCached(foodDescription) {
      try {
        console.log("Fetching nutrition for:", foodDescription);
        if (mealCache[foodDescription]) return mealCache[foodDescription];

        const nutrition = await fetchNutritionFromSpoonacular(foodDescription) || 
                          { protein: null, carbs: null, fat: null, calories: null, estimated: true, source: "spoonacular" };

        if (!nutrition) throw new Error("No nutrition data returned");

        mealCache[foodDescription] = nutrition;
        return nutrition;

      } catch (err) {
        throw new Error(`Nutrition lookup failed for ${foodDescription}`);
      }
        
    }

    // If data extracted is meal info, enrich missing nutrition info
    if (Array.isArray(dataParsed) && dataParsed.some(m => m.meal_name)) {

      for(const meal of dataParsed) {
        const mealSource = meal.source || "unknown";

        // Check for missing nutrition info
        const requiredFields = ["protein", "carbs", "fat", "calories"];
        const missingFields = requiredFields.filter(field => meal[field] === null);

        if (missingFields.length > 0) {    
          const ingredients = splitMealItems(meal.meal_name);
          let totalNutrition = { protein: 0, carbs: 0, fat: 0, calories: 0 };
          
          for (const item of ingredients) {
            try {
              const nutrition = await fetchNutritionCached(item);
              totalNutrition.protein += nutrition.protein ?? 0;
              totalNutrition.carbs += nutrition.carbs ?? 0;
              totalNutrition.fat += nutrition.fat ?? 0;
              totalNutrition.calories += nutrition.calories ?? 0;
            } catch (err) {
              return {
                reply: await explainErrorWithGemini({
                  errorType: "NUTRITION_LOOKUP_FAILED",
                  userMessage: message,
                  technicalMessage: err.message
                })
              };
            }
          }

          meal.protein = totalNutrition.protein;
          meal.carbs = totalNutrition.carbs;
          meal.fat = totalNutrition.fat;
          meal.calories = totalNutrition.calories;
        }

        // Normalize meal_name to string (handle both array and string formats)
        const normalizedMealName = normalizeMealName(meal.meal_name);

        meal.meal_name = normalizedMealName;
      }
    }

    return dataParsed;
}

module.exports = processUploadedFilesHandler;