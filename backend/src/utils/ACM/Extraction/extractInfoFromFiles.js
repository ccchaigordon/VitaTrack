const { queryGemini, queryGeminiWithImages } = require('../../../services/geminiClient');

async function extractInfoFromFiles(message, combinedText, images) {

  let responseForCombinedText = "";
  let responseForImages = "";

  if (combinedText) {
    const promptForCombinedText = `
      You are an information extraction model.

      Current local time: ${new Date().toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" })}

      User message:
      "${message}"

      File content:
      """${combinedText || "NO_FILE"}"""

      Instructions:
        Definition:
          - A workout or exercise can be ANY physical activity, including:
          - Gym exercises (e.g. push-ups, bench press, deadlifts)
          - Cardio activities (e.g. running, cycling)
          - Sports and games (e.g. badminton, basketball, football)
          - General physical activities (e.g. walking, hiking)

        Determine the file content first. If it contains meal information, extract the following:

            - If multiple meals are present (breakfast, lunch, snack, dinner), extract each meal separately.
            - Use the actual food items as "meal_name", not "Breakfast", "Lunch", etc.
            - Extract protein, carbs, fat, calories and meal time (breakfast, lunch, snack, dinner) for each meal.
            - If meal time is missing, it must be inferred STRICTLY based on the current local time using the following rules:
              - 05:00-10:59 → Breakfast
              - 11:00-14:59 → Lunch
              - 15:00-17:59 → Snack
              - 18:00-22:59 → Dinner
              - Otherwise → Snack
            - Include the original SOURCE tag (e.g., text_file, csv_file, pdf_file) for each meal.
            - If any field is missing, set it to null.
            - Return ONLY valid JSON in the following format:

            meals: [
                {
                "title": "... list of items ...",
                "protein": NUMBER,
                "carbs": NUMBER,
                "fat": NUMBER,
                "calories": NUMBER
                "meal_time": "... inferred meal time ...",
                "source": "source_tag"
                }
            ]
        
        If the file content contains workout/exercise/sports information instead, extract the following:

            Extraction rules:
            - If multiple workouts or exercises are present, extract EACH one separately.
            - Use the actual activity or exercise name as "title".
            - Extract the following fields for each exercise:
              - sets
              - reps
              - duration (in minutes)
              - calories_burned (in kcal)
            - Include the provided SOURCE tag (e.g. text_file, csv_file, pdf_file) as "source".

            Field handling rules:
            - If sets or reps are not applicable (e.g. sports, cardio), set them to null.
            - Convert hours to minutes if duration is provided in hours.
            - If duration is missing:
              - Set "duration" to null
              - Set "calories_burned" to 0
            - If duration is present but calories are missing:
              - Estimate calories based on activity type and duration using reasonable averages.
            - Do NOT guess duration.

            Output format:
            Return ONLY valid JSON in the following format:

            
              workouts: [
                {
                  "title": "string",
                  "sets": number | null,
                  "reps": number | null,
                  "duration": number | null,
                  "calories_burned": number,
                  "source": "source_tag"
                }
              ]
            

          IMPORTANT:
          - If the file content contains NO workout or physical activity information, return:
            workouts: []

          - If the file content contains NO meal information, return:
            meals: []

    `;

    responseForCombinedText = await queryGemini(promptForCombinedText);
  }

  if (images && images.length > 0) {
    const promptForImages = `
      You are an information extraction model.

      Current local time: ${new Date().toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" })}

      User message:
      "${message}"

      Instructions:
      Determine the image content first. If it contains meal information, extract the following:
      - If multiple images are present analyze each image separately.
      - Extract protein, carbs, fat, calories and meal time (Breakfast, Lunch, Snack, Dinner) for each meal.
      - Meal time must be inferred STRICTLY based on the current local time using the following rules:
        - 05:00-10:59 → Breakfast
        - 11:00-14:59 → Lunch
        - 15:00-17:59 → Snack
        - 18:00-22:59 → Dinner
        - Otherwise → Snack
      - Include the original SOURCE tag (e.g., image_file).
      - Return ONLY valid JSON in the following format:

      meals: [
        {
          "title": "... list of items ...",
          "protein": NUMBER,
          "carbs": NUMBER,
          "fat": NUMBER,
          "calories": NUMBER
          "meal_time": "... inferred meal time ...",
          "source": "source_tag"
        }
      ]

      If the image content does not contains meal information, respond with any answer according to your knowledge. Return in valid JSON format as below: 
      {
        "reply": ".... your response ...."
      }
    `;

    responseForImages = await queryGeminiWithImages(promptForImages, images);
  }

  return { responseForCombinedText, responseForImages };
}

module.exports = extractInfoFromFiles;