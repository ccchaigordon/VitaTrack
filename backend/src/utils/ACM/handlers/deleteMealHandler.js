const { queryGemini } = require("../../../services/geminiClient");
const cleanLLMJSON  = require("../cleanLLMJSON");
const extractMealInfoFromFiles = require('../Extraction/extractMealInfoFromFiles');
const extractMealInfoFromMsg = require("../Extraction/extractMealInfoFromMsg");
const fetchNutritionFromSpoonacular = require("../../../services/spoonacularClient");
const processFiles = require("../FileProcessor/fileProcessor");
const recommendationHandlerForMeal = require("./recommendationHandlerForMeal");
const explainErrorWithGemini = require("../explainErrorWithGemini");

function isGeminiFallback(text) {
  return (
    typeof text === "string" &&
    (
      text.startsWith("Oops") ||
      text.includes("trouble thinking") ||
      text.length < 30 // optional safety
    )
  );
}

async function deleteMealHandler(message, files, conversationState, user_id, supabase) {
  try {
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

      if (isGeminiFallback(extraction)) {
        return {           
          reply: extraction
        };
      }
      
      console.log("Extraction result:", extraction);

      let mealData;

      try {
        mealData = cleanLLMJSON(extraction);      
        console.log("Cleaned meal data:", mealData);
      } catch (err) {
        console.error("JSON parse error:", err);
        return {
          reply: await explainErrorWithGemini({
            errorType: "MEAL_EXTRACTION_FAILED",
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
        // Fallback: convert to string and split
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

      let mealDataParsed;

      try {
        mealDataParsed = typeof mealData === "string" ? JSON.parse(mealData) : mealData;
      } catch (err) {
        console.error("Failed to parse mealData:", err);
        return {
          reply: await explainErrorWithGemini({
            errorType: "MEAL_DATA_FORMAT_ERROR",
            userMessage: message,
            technicalMessage: err.message
          })
        };
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
            try {
              const nutrition = await fetchNutritionCached(item);
              totalNutrition.protein += nutrition.protein;
              totalNutrition.carbs += nutrition.carbs;
              totalNutrition.fat += nutrition.fat;
              totalNutrition.calories += nutrition.calories;
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

        console.log("Entry for meal log:", meal);

        const { data, error } = await supabase
          .from("meal_logs")
          .insert({
            meal_name: normalizedMealName,
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
          return {
            reply: await explainErrorWithGemini({
              errorType: "DATABASE_WRITE_FAILED",
              userMessage: message,
              technicalMessage: error.message
            })
          };
        }
      }

      let recResponse = { reply: "" };
      
      const messageForRec = `I have just logged a meal. Can you recommend a suitable meal for my next meal?`;

      try {
        recResponse = await recommendationHandlerForMeal(messageForRec, user_id, conversationState, supabase);
      } catch (err) {
        recResponse.reply = "I’ll suggest a meal next time 😊";
      }

      const prompt = `
        You are a friendly fitness assistant chatbot.

        Context:
        The user is logging meal.

        Meal details:
        - ${mealData}

        Task:
        Write a short, friendly response. Can use emojis naturally.
        - Acknowledge the logged meal
        - Mention calories and macros
        `;
      
      const gResponse = await queryGemini(prompt);

      messageToReturn = `${gResponse} \n\n${recResponse.reply}`;

      conversationState.set(user_id, { state: "IDLE" });

      return {
        reply: messageToReturn
      };

  } catch (err) {
      console.error("Unexpected error in logMealHandler:", err);
      return {
        reply: await explainErrorWithGemini({
          errorType: "UNEXPECTED_ERROR",
          userMessage: message,
          technicalMessage: err.message
        })
      };
  }
}

module.exports = deleteMealHandler;