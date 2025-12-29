const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({});

async function queryGemini(prompt) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    return response.text;
  } catch (err) {
    console.error("Gemini error:", err);
    return "Oops 😅 I’m having a little trouble thinking right now. Please try again in a moment!";
  }
}

async function queryGeminiWithImages(prompt, images = []) {
  try {
    const parts = [
      { text: prompt },
      ...images.map(img => ({
        inlineData: {
          data: img.base64,
          mimeType: img.mimeType
        }
      }))
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          parts
        }
      ]
    });

    return response.text;
  } catch (err) {
    console.error("Gemini error with images:", err);
    return "Oops 😅 I’m having a little trouble thinking right now. Please try again in a moment!";
  }
}


module.exports = { queryGemini, queryGeminiWithImages };
