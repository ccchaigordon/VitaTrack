function cleanLLMJSON(response) {
  // Remove markdown code fences
  let cleaned = response.replace(/```json/g, '').replace(/```/g, '').trim();
  // Take only the first JSON object
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON found in LLM response");
  return JSON.parse(match[0]);
}

module.exports = cleanLLMJSON;