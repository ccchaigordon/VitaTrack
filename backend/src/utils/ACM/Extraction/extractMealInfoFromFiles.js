const { queryGemini } = require('../../../services/geminiClient');

async function extractMealInfoFromFiles(message, combinedText, images) {
  const prompt = `
    You are a nutrition information extraction model.

    User message:
    "${message}"

    File content (nutrition info):
    """${combinedText || "NO_FILE"}"""

    Attached images (food photos):
    ${images.length > 0 ? images.map(img => `[Image: ${img.filename}]`).join("\n") : "NONE"}

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

  return await queryGemini(prompt);  
}

module.exports = extractMealInfoFromFiles;