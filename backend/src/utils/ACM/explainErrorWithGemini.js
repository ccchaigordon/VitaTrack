const { queryGemini } = require("../../services/geminiClient");

async function explainErrorWithGemini ({
  errorType,
  userMessage,
  technicalMessage
}) {
  const prompt = `
    You are a friendly fitness assistant chatbot.

    A problem occurred while helping the user log a meal.

    Error type:
    - ${errorType}

    What the user tried to do:
    - ${userMessage}

    Internal issue (do NOT mention technical details):
    - ${technicalMessage}

    Task:
    Write a short, friendly, reassuring response.
    - Do NOT mention errors, JSON, APIs, or databases
    - Explain what went wrong in simple terms
    - Suggest what the user can do next
    - Use emojis naturally
    `;

  return await queryGemini(prompt);
}

module.exports = explainErrorWithGemini;
