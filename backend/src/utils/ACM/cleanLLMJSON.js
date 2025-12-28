function cleanLLMJSON(text) {
  // Remove ```json or ``` and extra whitespace
  let cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return cleaned;
}

module.exports = cleanLLMJSON;
