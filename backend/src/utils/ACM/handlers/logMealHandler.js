const { queryGemini } = require("../../../services/geminiClient");
const cleanLLMJSON  = require("../cleanLLMJSON");
const extractMealInfoFromFiles = require('../Extraction/extractMealInfoFromFiles');
const extractMealInfoFromMsg = require("../Extraction/extractMealInfoFromMsg");
const fetchNutritionFromSpoonacular = require("../../../services/spoonacularClient");
const processFiles = require("../FileProcessor/fileProcessor");
const recommendationHandler = require("./recommendationHandlerForMeal");

async function logMealHandler(message, files, conversationState, user_id, supabase) {
    let combinedText = "";
    let imagesForGemini = [];
    let messageToReturn;

    if (files && files.length > 0) {
      const result = await processFiles(files);
      combinedText = result.combinedText;
      imagesForGemini = result.imagesForGemini;
    }

    console.log("Combined text for Gemini:", combinedText);
    console.log("Images for Gemini:", imagesForGemini.map(img => img.filename));

    const hasFiles = files && files.length > 0;

    const extraction = hasFiles
      ? await extractMealInfoFromFiles(message, combinedText, imagesForGemini)
      : await extractMealInfoFromMsg(message);
    
    console.log("Extraction result:", extraction);

    let mealData;

    try {
      mealData = cleanLLMJSON(extraction);      
      console.log("Cleaned meal data:", mealData);
    } catch (err) {
      console.error("JSON parse error:", err);
      return { reply: "I couldn't understand the meal details." };
    }

    // Mock data for testing
    // mealData = [
    //   {
    //     "meal_name": "2 slices whole wheat toast, 1 boiled egg, 1 banana, 1 cup black coffee",
    //     "meal_time": "breakfast",
    //     "protein": null,
    //     "carbs": null,
    //     "fat": null,
    //     "calories": null
    //   },
    //   {
    //     "meal_name": "Chicken rice (150g chicken, 200g rice), 1 small bowl of mixed vegetables, 1 cup milk tea (medium sugar)",
    //     "meal_time": "lunch",
    //     "protein": null,
    //     "carbs": null,
    //     "fat": null,
    //     "calories": null
    //   },
    //   {
    //     "meal_name": "1 apple, 10 almonds",
    //     "meal_time": "snack",
    //     "protein": null,
    //     "carbs": null,
    //     "fat": null,
    //     "calories": null
    //   },
    //   {
    //     "meal_name": "Grilled salmon (200g), Steamed broccoli (100g), 1 small baked potato",
    //     "meal_time": "dinner",
    //     "protein": null,
    //     "carbs": null,
    //     "fat": null,
    //     "calories": null
    //   }
    // ];

    function splitMealItems(mealName) {
      // Split by comma, semicolon, or 'and'
      return mealName
        .split(/\s*(?:,|;|\band\b)\s*/i)
        .map(item => item.trim())
        .filter(Boolean);
    }

    const mealCache = {};

    async function fetchNutritionCached(foodDescription) {
      console.log("Fetching nutrition for:", foodDescription);
      if (mealCache[foodDescription]) return mealCache[foodDescription];

      const nutrition = await fetchNutritionFromSpoonacular(foodDescription) || 
                        { protein: null, carbs: null, fat: null, calories: null, estimated: true, source: "spoonacular" };

      mealCache[foodDescription] = nutrition;
      return nutrition;
    }

    let mealDataParsed;

    try {
      mealDataParsed = typeof mealData === "string" ? JSON.parse(mealData) : mealData;
    } catch (err) {
      console.error("Failed to parse mealData:", err);
      return { reply: "Invalid meal data format." };
    }

    for(const meal of mealDataParsed) {
      const mealSource = meal.source || "unknown";

      // Check for missing nutrition info
      const requiredFields = ["protein", "carbs", "fat", "calories"];
      const missingFields = requiredFields.filter(field => meal[field] === null);

      if (missingFields.length > 0) {    
        const ingredients = splitMealItems(meal.meal_name);
        let totalNutrition = { protein: 0, carbs: 0, fat: 0, calories: 0 };
        
        for (const item of ingredients) {
          const nutrition = await fetchNutritionCached(item);
          totalNutrition.protein += nutrition.protein;
          totalNutrition.carbs += nutrition.carbs;
          totalNutrition.fat += nutrition.fat;
          totalNutrition.calories += nutrition.calories;
        }

        meal.protein = totalNutrition.protein;
        meal.carbs = totalNutrition.carbs;
        meal.fat = totalNutrition.fat;
        meal.calories = totalNutrition.calories;
      }

      console.log("Entry for meal log:", meal);

      const { data, error } = await supabase
        .from("meal_logs")
        .insert({
          meal_name: meal.meal_name,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat,
          calories: meal.calories,
          source: mealSource,
          meal_time: meal.meal_time,
          user_id: user_id,
          created_at: new Date()
        });

      if (error) {
        console.error("Meal log error:", error);
        return { reply: "Failed to log meal." };
      }

      const messageForRec = `I have just logged a meal: ${meal.meal_name} with ${meal.calories} kcal, ${meal.protein}g protein, ${meal.carbs}g carbs, and ${meal.fat}g fat. Can you recommend a suitable meal for my next meal?`;

      const recResponse = await recommendationHandler(messageForRec, user_id, conversationState);

      const prompt = `
        You are a friendly fitness assistant chatbot.

        Context:
        The user is logging meal.

        Meal details:
        - Name: ${meal.title}
        - Calories: ${meal.calories} kcal
        - Protein: ${meal.protein} g
        - Carbs: ${meal.carbs} g
        - Fat: ${meal.fat} g

        Task:
        Write a short, friendly response. Can use emojis naturally.
        - Acknowledge the logged meal
        - Mention calories and macros
        `;
      
      const gResponse = await queryGemini(prompt);

      messageToReturn = `${gResponse} \n\n${recResponse.reply}`;

      conversationState.set(user_id, { state: "IDLE" });
    }    

    return {
      reply: messageToReturn
    };
}

module.exports = logMealHandler;