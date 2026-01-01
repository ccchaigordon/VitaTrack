function detectUserGoalsRuleBased(text = "") {
  const t = text.toLowerCase();

  const RULES = [
    // Safety & Warning
    { label: "Warning", regex: /warning|danger|risk|unsafe|injury/ },

    // Mental & Psychology
    { label: "Mental Health", regex: /mental health|mental|stress|anxiety|depression/ },
    { label: "Psychology", regex: /psychology|mindset|behavior/ },
    { label: "Meditation", regex: /meditation|mindfulness|breathing/ },

    // Sleep & Recovery
    { label: "Sleep", regex: /sleep|insomnia|rest/ },
    { label: "Recovery", regex: /recovery|rest day|cool down/ },
    { label: "Rehab", regex: /rehab|rehabilitation|physio/ },
    { label: "Pain Relief", regex: /pain relief|reduce pain|ache|soreness/ },

    // Muscle & Strength
    { label: "Build Muscle", regex: /build muscle|muscle gain|hypertrophy|bulking|bulk|big body|more muscle/ },
    { label: "Strength", regex: /strength|stronger|heavy lift/ },
    { label: "Power", regex: /power|explosive|max output/ },

    // Cardio & Conditioning
    { label: "Cardio", regex: /cardio|endurance|stamina/ },
    { label: "Hiit", regex: /hiit|high intensity/ },

    // Mobility & Posture
    { label: "Mobility", regex: /mobility|range of motion/ },
    { label: "Posture", regex: /posture|alignment/ },
    { label: "Yoga", regex: /yoga/ },

    // Body Focus
    { label: "Legs", regex: /legs|leg day|quads|hamstrings/ },

    // Training Type
    { label: "Home", regex: /home workout|at home/ },
    { label: "Gym", regex: /gym|machines|free weights/ },
    { label: "Calisthenics", regex: /calisthenics|bodyweight/ },
    { label: "Beginner", regex: /beginner|newbie|starter/ },

    // Weight & Health
    { label: "Lose Weight", regex: /lose weight|fat loss|cut|slim/ },
    { label: "Balanced", regex: /balanced/ },
    { label: "Stay Healthy", regex: /stay healthy|healthy lifestyle/ },
    { label: "Health", regex: /health|wellness/ },
    { label: "Fitness", regex: /fitness|fit/ },

    // Nutrition & Diet
    { label: "Diet", regex: /diet|dieting/ },
    { label: "Nutrition", regex: /nutrition|nutrients|macros/ },
    { label: "Food", regex: /food|meals/ },
    { label: "Cooking", regex: /cooking|cook|kitchen/ },
    { label: "Recipes", regex: /recipes|recipe/ },
    { label: "Keto", regex: /keto|ketogenic/ },
    { label: "Supplements", regex: /supplements|protein powder|creatine/ },
    { label: "Water", regex: /water|hydration/ },

    // Learning & Info
    { label: "Education", regex: /education|learn|guide|tutorial/ },
    { label: "Science", regex: /science|research|study/ },
    { label: "Review", regex: /review|comparison|rating/ },
    { label: "Tips", regex: /tips|advice|hacks/ },

    // Lifestyle & Utility
    { label: "Lifestyle", regex: /lifestyle|daily life/ },
    { label: "Habits", regex: /habits|routine/ },
    { label: "Activity", regex: /activity|movement/ },
    { label: "Time", regex: /time|schedule/ },
    { label: "Environment", regex: /environment|surroundings/ },

    // Practical / Utility
    { label: "Utility", regex: /utility|tools/ },
    { label: "Money", regex: /money|budget|cost/ },
    { label: "Shopping", regex: /shopping|buy|purchase/ },
    { label: "Office", regex: /office|work desk/ },

    // Academic / Misc
    { label: "Math", regex: /math|calculation/ },

    // Edge / Unknown
    { label: "Clam", regex: /clam/ }
  ];

  // Collect all matches
  const matches = RULES.filter(rule => rule.regex.test(t)).map(rule => rule.label);

  // Return unique matches or ["Unknown"] if none
  return matches.length ? Array.from(new Set(matches)) : ["Unknown"];
}

module.exports = detectUserGoalsRuleBased;
