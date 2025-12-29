function detectUserGoalRuleBased(text = "") {
  const t = text.toLowerCase();

  if (/bulk|bulking|muscle|hypertrophy|gain muscle/.test(t)) {
    return "Muscle Gain";
  }

  if (/lose weight|fat loss|burn fat|slim|cut/.test(t)) {
    return "Weight Loss";
  }

  if (/endurance|stamina|cardio|long run/.test(t)) {
    return "Endurance";
  }

  if (/strength|power|lift heavier|max/.test(t)) {
    return "Strength";
  }

  if (/flexibility|stretch|mobility|yoga/.test(t)) {
    return "Flexibility";
  }

  if (/maintain|stay healthy|general fitness/.test(t)) {
    return "Maintenance";
  }

  return "Unknown";
}

module.exports = detectUserGoalRuleBased;
