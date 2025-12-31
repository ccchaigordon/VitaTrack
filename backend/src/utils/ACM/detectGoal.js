const { queryGemini } = require("../../services/geminiClient");

function safeParseIntent(response) {
  try {
    // Match JSON in the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");

    const parsed = JSON.parse(jsonMatch[0]);

    // Ensure both keys exist
    const goal = parsed.goal || "";

    return goal;
  } catch (err) {
    console.error("Failed to parse Gemini intent:", err, response);
    return "";
  }
}

async function detectGoal(text, state, conversationContext = '') {

  let stateObj = {};

  if (state instanceof Map) {
    // Map → Object
    stateObj = Object.fromEntries(state);
  } else if (state && typeof state === "object") {
    // Already an object
    stateObj = state;
  }

  const prompt = `
    You are a goal extractor for a fitness and wellness chatbot.
    
    ${conversationContext ? `Previous conversation context:\n${conversationContext}\n\n` : ''}
    Current user message: "${text}"
    Conversation state: ${JSON.stringify(stateObj || {})}
    
    IMPORTANT: 
    - If the user mentions any fitness, nutrition, or wellness goals (e.g., "I want to bulk up", "I want to lose weight", "I aim to gain muscle"), include it as "goal". If no goal is mentioned, use an empty string "". You can return the goal as a single phrase. (e.g., "I want to lose weight", "Bulking up is my main goal", "My goal is to improve cardio fitness")
    
    Determine the user's and goals based on the message, conversation context, and state.

    Return ONLY valid JSON. Do not include any explanation, markdown, or extra text. 
    Format:
    { "goal": "<goal>" }

    `;

  const response = await queryGemini(prompt);
  const goal = safeParseIntent(response);

  return goal;
}

module.exports = detectGoal;