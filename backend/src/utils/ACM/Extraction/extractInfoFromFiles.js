const { queryGemini, queryGeminiWithImages } = require('../../../services/geminiClient');

async function extractInfoFromFiles(message, combinedText, images) {

  let responseForCombinedText = "";
  let responseForImages = "";

  if (combinedText) {
    const promptForCombinedText = `
      You are an information extraction model.

      User message:
      "${message}"

      File content:
      """${combinedText || "NO_FILE"}"""

      Instructions:
        Determine the file content first. If it contains meal information, extract the following:

            - If multiple meals are present (breakfast, lunch, snack, dinner), extract each meal separately.
            - Use the actual food items as "meal_name", not "Breakfast", "Lunch", etc.
            - Extract protein, carbs, fat, calories and meal time (breakfast, lunch, snack, dinner) for each meal.
            - Include the original SOURCE tag (e.g., text_file, csv_file, pdf_file) for each meal.
            - If any field is missing, set it to null.
            - Return ONLY valid JSON in the following format:

            meals: [
                {
                "meal_name": "... list of items ...",
                "protein": NUMBER,
                "carbs": NUMBER,
                "fat": NUMBER,
                "calories": NUMBER
                "meal_time": "... inferred meal time ...",
                "source": "source_tag"
                }
            ]
        
        If the file content contains workout/exercise information instead, extract the following:

            - If multiple exercise are present (e.g. push up, pull up, barbell bench press, deadlifts, etc.), extract exercise separately.
            - Use the actual exercise items as "exercise_name.
            - Extract sets, reps, duration, calories_burned for each exercise.
            - Include the original SOURCE tag (e.g., text_file, csv_file, pdf_file) for each exercise.
            - If any field is missing, set it to null.
            - Return ONLY valid JSON in the following format:

            workouts: [
                {
                    "exercise_name": "... exercise name ...",
                    "sets": NUMBER,
                    "reps": NUMBER,
                    "duration": NUMBER,
                    "calories_burned": NUMBER
                    "source": "source_tag"
                }
            ]
                  
        If the file content contains neither meal nor workout information, respond with an empty JSON array: []
    `;

    responseForCombinedText = await queryGemini(promptForCombinedText);
  }

  if (images && images.length > 0) {
    const promptForImages = `
      You are an information extraction model.

      User message:
      "${message}"

      Instructions:
      - If multiple images are present analyze each image separately.
      - Extract protein, carbs, fat, calories and meal time (Breakfast, Lunch, Snack, Dinner) for each meal.
      - Include the original SOURCE tag (e.g., image_file).
      - If user didn't provide any meal time on the image, infer it based on current time. (e.g., if current time is 8am, infer breakfast) Follow Malaysia time.
      - If any field is missing, set it to null.
      - Return ONLY valid JSON in the following format:

      meals: [
        {
          "meal_name": "... list of items ...",
          "protein": NUMBER,
          "carbs": NUMBER,
          "fat": NUMBER,
          "calories": NUMBER
          "meal_time": "... inferred meal time ...",
          "source": "source_tag"
        }
      ]
    `;

    responseForImages = await queryGeminiWithImages(promptForImages, images);
  }

  return { responseForCombinedText, responseForImages };
}

module.exports = extractInfoFromFiles;