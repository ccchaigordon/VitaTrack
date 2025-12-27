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

module.exports = { queryGemini };
