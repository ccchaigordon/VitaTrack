function cleanLLMJSON(text) {
  // Ensure text is a string
  if (typeof text !== "string") {
    if (Array.isArray(text)) {
      text = text.join("\n");
    } else {
      text = String(text);
    }
  }

  // Remove markdown ```json blocks
  text = text.replace(/```json/g, "").replace(/```/g, "").trim();

  return text;
}

module.exports = cleanLLMJSON;
