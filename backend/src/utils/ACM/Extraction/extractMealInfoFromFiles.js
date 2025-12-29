const { queryGemini, queryGeminiWithImages } = require('../../../services/geminiClient');

async function extractMealInfoFromFiles(message, combinedText, images) {

  let responseForCombinedText = "";
  let responseForImages = "";

  if (combinedText) {
    const promptForCombinedText = `
      You are a nutrition information extraction model.

      User message:
      "${message}"

      File content (nutrition info):
      """${combinedText || "NO_FILE"}"""

      Instructions:
      - If multiple meals are present (breakfast, lunch, snack, dinner), extract each meal separately.
      - Use the actual food items as "meal_name", not "Breakfast", "Lunch", etc.
      - Extract protein, carbs, fat, calories and meal time (breakfast, lunch, snack, dinner) for each meal.
      - Include the original SOURCE tag (e.g., text_file, csv_file, pdf_file) for each meal.
      - If any field is missing, set it to null.
      - Return ONLY valid JSON in the following format:

      [
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

    responseForCombinedText = await queryGemini(promptForCombinedText);
  }

  if (images && images.length > 0) {
    const promptForImages = `
      You are a nutrition information extraction model.

      User message:
      "${message}"

      Instructions:
      - If multiple images are present analyze each image separately.
      - Extract protein, carbs, fat, calories and meal time (breakfast, lunch, snack, dinner) for each meal.
      - Include the original SOURCE tag (e.g., image_file).
      - If user didn't provide any meal time on the image, infer it based on current time. (e.g., if current time is 8am, infer breakfast) Follow Malaysia time.
      - If any field is missing, set it to null.
      - Return ONLY valid JSON in the following format:

      [
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

module.exports = extractMealInfoFromFiles;