const { queryGemini } = require("../../../services/geminiClient");
const extractMealInfoFromMsg = require("../Extraction/extractMealInfoFromMsg");
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

async function logMealHandler(message, multimodalContext, conversationState, user_id, supabase) {
  try {
      let messageToReturn;

      const mealData = multimodalContext
        ? multimodalContext
        : await extractMealInfoFromMsg(message);
      
      console.log("Meal extraction result:", mealData);

      if (isGeminiFallback(mealData)) {
        return {           
          reply: mealData
        };
      }      

      for (const mealDataItem of mealData) {
        const { data, error } = await supabase
          .from("meal_logs")
          .insert({
            meal_name: mealDataItem.meal_name,
            protein: mealDataItem.protein,
            carbs: mealDataItem.carbs,
            fat: mealDataItem.fat,
            calories: mealDataItem.calories,
            source: mealDataItem.source,
            meal_time: mealDataItem.meal_time,
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
        - Ask if they need anything else
        `;
      
      const gResponse = await queryGemini(prompt);

      messageToReturn = gResponse;

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

module.exports = logMealHandler;