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
    return "Gemini API Error";
  }
}

module.exports = { queryGemini };
