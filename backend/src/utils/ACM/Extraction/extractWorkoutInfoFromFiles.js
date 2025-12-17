const { queryGemini } = require('../../../services/geminiClient');

async function extractWorkoutInfoFromFiles(message, combinedText, images) {
  const prompt = `
    You are a workout information extraction model.

    User message:
    "${message}"

    File content (nutrition info):
    """${combinedText || "NO_FILE"}"""

    Attached images (food photos):
    ${images.length > 0 ? images.map(img => `[Image: ${img.filename}]`).join("\n") : "NONE"}

    Instructions:
    - If multiple exercise are present (e.g. push up, pull up, barbell bench press, deadlifts, etc.), extract exercise separately.
    - Use the actual exercise items as "exercise_name.
    - Extract sets, reps, duration, calories_burned for each exercise.
    - Include the original SOURCE tag (e.g., text_file, csv_file, pdf_file) for each exercise.
    - If any field is missing, set it to null.
    - Return ONLY valid JSON in the following format:

    [
      {
        "exercise_name": "... exercise name ...",
        "sets": NUMBER,
        "reps": NUMBER,
        "duration": NUMBER,
        "calories_burned": NUMBER
        "source": "source_tag"
      }
    ]
  `;

  return await queryGemini(prompt);  
}

module.exports = extractWorkoutInfoFromFiles;