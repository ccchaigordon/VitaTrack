const { queryGemini } = require("../../../services/geminiClient");
const extractMealInfoFromMsg = require("../Extraction/extractMealInfoFromMsg");
const explainErrorWithGemini = require("../explainErrorWithGemini");
const { sendNotification } = require('../../../services/notificationClient');

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

function isEmptyMeal(meals) {
  if (!Array.isArray(meals) || meals.length === 0) return true;

  return meals.every(meal =>
    !meal?.title ||
    Number.isNaN(Number(meal.calories)) ||
    Number(meal.calories) <= 0
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
      
      if (isEmptyMeal(mealData)) {
        const prompt = `
          You are a friendly fitness assistant chatbot.
          Context:
          The user is trying to log a meal.
          Task:
          Politely inform the user that no valid meal information was found in their message.
          Ask them to provide details like meal name and calories.
        `;
        const gResponse = await queryGemini(prompt);       
        
        return {           
          reply: gResponse
        };
      }

      const timeNow = new Date();
      let mealTime = " ";

      if (timeNow.getHours() >= 22 || timeNow.getHours() < 5) {
        mealTime = "Snack";
      } else if (timeNow.getHours() >= 18) {
        mealTime = "Dinner";
      } else if (timeNow.getHours() >= 15) {
        mealTime = "Snack";
      } else if (timeNow.getHours() >= 11) {
        mealTime = "Lunch";
      } else {
        mealTime = "Breakfast";
      }


      for (const mealDataItem of mealData) {
        const { data, error } = await supabase
          .from("meal_logs")
          .insert({
            meal_name: mealDataItem.title,
            protein: mealDataItem.protein,
            carbs: mealDataItem.carbs,
            fat: mealDataItem.fat,
            calories: mealDataItem.calories,
            source: mealDataItem.source || "ai assistant",
            meal_time: mealDataItem.meal_time || mealTime,
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

      try {
        const todayStr = new Date().toISOString().split('T')[0];

        const { data: dailyMetric, error: metricError } = await supabase
          .from('daily_metrics')
          .select('calories_in, protein, carbs, fat')
          .eq('user_id', user_id)
          .eq('created_at', todayStr)
          .single();

          console.log("Fetched daily metrics:", todayStr, {dailyMetric, metricError});

        if (!metricError && dailyMetric && dailyMetric.calories_in > 0) {
           const { calories_in, protein, carbs, fat } = dailyMetric;

           const carbCals = carbs * 4;
           const proteinCals = protein * 4;
           const fatCals = fat * 9;
           const totalCals = calories_in; 

           const carbRatio = carbCals / totalCals;
           const fatRatio = fatCals / totalCals;
           const proteinRatio = proteinCals / totalCals;

           if (carbRatio > 0.70) {
               await sendNotification(
                user_id, 
                'alert',
                "High Carb Alert: Carbs intake is over 70% of today’s calories. Consider adding protein/fats to your next meal.", 
                '/progress');
           } 
           if (fatRatio > 0.40) {
               await sendNotification(
                user_id, 
                'alert',
                "High Fat Alert: Fat intake is over 40% of today's calories. Watch your intake for the rest of the day.", 
                '/progress');
           } 
           if (proteinRatio > 0.35) {
               await sendNotification(
                user_id,
                'alert',
                "High Protein Alert: Protein intake is over 35% of today's calories. Very high protein day!",
                '/progress');
           }
        }
      } catch (notifError) {
        console.error("Failed to process nutrition notifications:", notifError);
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
        - Mention calories and macros. If you do not know, do not mention you do not know. 
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