const express = require('express');
const supabaseServer = require('../services/supabaseClient');
const { queryGemini } = require('../services/geminiClient');
const recommendWellness = require('../utils/PTF/recommendWellness');
const recommendRecipes = require('../utils/PTF/recommendRecipes');
const calculateStreak = require('../utils/PTF/calculateStreak'); 

function getRlsClient(req) {
  console.log('Creating RLS client with access token:', req.user.accessToken);
  return supabaseServer.createUserSupabaseClient(req.user.accessToken);
}

const router = express.Router();

async function fetchMetricsData(userId, startDate, endDate, supabase) {
  const { data, error } = await supabase
    .from('daily_metrics')
    .select('created_at, calories_in, calories_burned, protein, carbs, fat, workout_completed')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (error) throw error;
  return data;
}

async function extractUserGoal(userId, supabase) {
  try {
    const { data: userProfile, error } = await supabase
      .from("user_profiles")
      .select("goals")
      .eq("user_id", userId)
      .single();
  
    if (error || !userProfile || !userProfile.goals) {
      console.log("Error fetching user profile for goal extraction:", error);
      return null;
    } 

    const goalText = userProfile.goals;

    const prompt = `
      Analyze this user's fitness goal text: "${goalText}".
      Determine if the user explicitly specified a numeric goal for "calories to be burned" or "active calories" (e.g., "burn 500 kcal daily", "burn 300 calories").
      
      Rules:
      1. Ignore "calorie intake" or "eat". Focus only on BURNING/OUTPUT.
      2. Normalize the value to a WEEKLY goal (integer).
         - If user says "burn 500 daily", return 3500 (500 * 7).
         - If user says "burn 2000 per week", return 2000.
         - If no time range specified, assume weekly.
      3. Return ONLY a JSON object.
      4. Format: { "burn_goal": <number> } if found, or { "burn_goal": null } if not mentioned.
    `;

    const gResponse = await queryGemini(prompt);

    function extractJson(text) {
      const match = String(text).match(/\{[\s\S]*\}/);
      return match ? match[0] : null;
    }

    const match = extractJson(gResponse);
    if (match) {
      const json = JSON.parse(match);
      return typeof json.burn_goal === 'number' ? json.burn_goal : null;
    }
    return null;

  } catch (err) {
    console.error("Error in extractUserGoal:", err);
    return null;
  }
}

// ENDPOINT 1: MACROS
router.get('/ptf/macros', async (req, res) => {
  const supabase = getRlsClient(req);
  const user_id = req.user?.id || req.user?.user_id;
  const days = req.query.days || 7;

  // const { user_id, days = 7 } = req.query;
  const range = Number(days);
  const today = new Date();
  
  const pastDate = new Date(today);
  pastDate.setDate(pastDate.getDate() - (range - 1));
  
  const prevPastDate = new Date(pastDate);
  prevPastDate.setDate(prevPastDate.getDate() - range);

  try {
    const rawData = await fetchMetricsData(user_id, prevPastDate, today, supabase);

    const currentPeriod = rawData.filter(d => new Date(d.created_at) >= pastDate);
    const prevPeriod = rawData.filter(d => new Date(d.created_at) < pastDate);

    const sum = (arr, field) => arr.reduce((acc, curr) => acc + (curr[field] || 0), 0);
    const calcTotals = arr => ({
      calories: sum(arr, 'calories_in'),
      carbs: sum(arr, 'carbs'),
      protein: sum(arr, 'protein'),
      fat: sum(arr, 'fat'),
    });

    const currentStats = calcTotals(currentPeriod);
    const prevStats = calcTotals(prevPeriod);

    const calcDeltaPct = (curr, prev) => {
      if (!prev || prev === 0) return 0;
      return ((curr - prev) / prev * 100).toFixed(2);
    };

    const response = {
      current: {
        totalCalories: currentStats.calories,
        carbs: currentStats.carbs,
        protein: currentStats.protein,
        fat: currentStats.fat,
      },
      deltaPercent: {
        calories: calcDeltaPct(currentStats.calories, prevStats.calories),
        carbs: calcDeltaPct(currentStats.carbs, prevStats.carbs),
        protein: calcDeltaPct(currentStats.protein, prevStats.protein),
        fat: calcDeltaPct(currentStats.fat, prevStats.fat),
      }
    };

    return res.json(response);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ENDPOINT 2: CALORIES
router.get('/ptf/calories', async (req, res) => {
  const supabase = getRlsClient(req);
  const user_id = req.user?.id || req.user?.user_id;
  const days = req.query.days || 7;
  console.log("user_id:", user_id, typeof user_id);
  console.log("days:", days, typeof days);

  // 1. CONVERT INPUT TO WEEK OFFSET
  const weekOffset = (Number(days) / 7) - 1;
  const today = new Date();

  // 2. FIND MONDAY OF CURRENT WEEK
  const currentDay = today.getDay();

  const diffToMonday = currentDay === 0 ? 6 : currentDay - 1; 

  const currentMonday = new Date(today);
  currentMonday.setDate(today.getDate() - diffToMonday);
  currentMonday.setHours(0, 0, 0, 0); 

  // 3. CALCULATE TARGET WINDOW (Start Mon - End Sun)
  const startMonday = new Date(currentMonday);
  startMonday.setDate(currentMonday.getDate() - (weekOffset * 7));

  const endSunday = new Date(startMonday);
  endSunday.setDate(startMonday.getDate() + 6);
  endSunday.setHours(23, 59, 59, 999); 

  try {
    const [currentPeriod, burnGoal] = await Promise.all([
      fetchMetricsData(user_id, startMonday, endSunday, supabase),
      extractUserGoal(user_id, supabase)
    ]);
    console.log("Extracted Burn Goal:", burnGoal);
    console.log("Current Period Data:", currentPeriod);
    const weekOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const dayMap = currentPeriod.reduce((acc, entry) => {
      const d = new Date(entry.created_at);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      if (!acc[dayName]) {
        acc[dayName] = { date: d.toISOString().slice(0, 10), caloriesConsumed: 0, caloriesBurned: 0 };
      }
      acc[dayName].caloriesConsumed += (entry.calories_in || 0);
      acc[dayName].caloriesBurned += (entry.calories_burned || 0);
      return acc;
    }, {});

    const caloriesActivity = weekOrder.map(day => ({
      dayName: day,
      date: dayMap[day]?.date || null,
      caloriesConsumed: dayMap[day]?.caloriesConsumed || 0,
      caloriesBurned: dayMap[day]?.caloriesBurned || 0,
    }));

    return res.json(
      { history: caloriesActivity, goal: burnGoal } );
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ENDPOINT 3: WORKOUT
router.get('/ptf/workout', async (req, res) => {
  const supabase = getRlsClient(req);
  const user_id = req.user?.id || req.user?.user_id;
  const days = 14;
  const today = new Date();
  const pastDate = new Date(today);
  pastDate.setDate(pastDate.getDate() - (days - 1));

  try {
    const workoutData = await fetchMetricsData(user_id, pastDate, today, supabase);

    const dataMap = {};
      workoutData.forEach(item => {
        const dateKey = new Date(item.created_at).toISOString().slice(0, 10);
        dataMap[dateKey] = item.workout_completed ?? 0;
      });

    // Build the 14-Day Series
    const history = [];
    
    for (let i = 0; i < days; i++) {
      const d = new Date(pastDate);
      d.setDate(d.getDate() + i);
      
      const dateKey = d.toISOString().slice(0, 10);
      
      const label = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

      history.push({
        date: dateKey,       
        label: label,        
        count: dataMap[dateKey] || 0 
      });
    }

  return res.json(history);
  } catch (err) {
    return res.status(500).json({ error: err.message });
}});

  // ENDPOINT 4: STREAK DAYS
router.get('/ptf/streak', async (req, res) => {
  const supabase = getRlsClient(req);
  const user_id = req.user?.id || req.user?.user_id;

  try {
    const streak = await calculateStreak(user_id, supabase);
    return res.json({ streakDays: streak });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
  });

// ENDPOINT 5: WEEKLY INSIGHTS
router.get('/ptf/insights', async (req, res) => {
  const supabase = getRlsClient(req);
  const user_id = req.user?.id || req.user?.user_id;

  const today = new Date();
  const currentDay = today.getDay();   // 0=Sun, 1=Mon, ..., 6=Sat
  const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;

  const currentMonday = new Date(today);
  currentMonday.setDate(today.getDate() - diffToMonday);
  currentMonday.setHours(0, 0, 0, 0);

  // Date range for THIS week: Mon ~ today
  const thisWeekStart = new Date(currentMonday);
  const thisWeekEnd = new Date(today);
  thisWeekEnd.setHours(23, 59, 59, 999);

  // Date range for LAST week: previous Mon ~ previous Sun
  const lastWeekStart = new Date(currentMonday);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  lastWeekStart.setHours(0, 0, 0, 0);

  const lastWeekEnd = new Date(currentMonday);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 1); // Sunday before currentMonday
  lastWeekEnd.setHours(23, 59, 59, 999);

  try {
    const [thisWeekData, lastWeekData, streak] = await Promise.all([
      fetchMetricsData(user_id, thisWeekStart, thisWeekEnd, supabase),
      fetchMetricsData(user_id, lastWeekStart, lastWeekEnd, supabase),
      calculateStreak(user_id, supabase)
    ]);

    // CALC TOTAL HELPER
    const sum = (arr, field) => arr.reduce((acc, curr) => acc + (curr[field] || 0), 0);
    const calcTotals = arr => ({
      calories_burned: sum(arr, 'calories_burned'),
      carbs: sum(arr, 'carbs'),
      protein: sum(arr, 'protein'),
      fat: sum(arr, 'fat'),
    });
    
    // CALC DELTA HELPER
    const calcDeltaPct = (currTotal, prevTotal) => {
      if (!prevTotal || prevTotal === 0) return 0;
      return (((currTotal - prevTotal) / prevTotal) * 100).toFixed(2);
    };

    // TOTALS
    const thisWeekTotals = calcTotals(thisWeekData);
    const lastWeekTotals = calcTotals(lastWeekData);

    const totalBurnedThisWeek = thisWeekTotals.calories_burned;
    const totalBurnedLastWeek = lastWeekTotals.calories_burned;
    const deltaBurned = calcDeltaPct(totalBurnedThisWeek, totalBurnedLastWeek);

    const macroDeltas = [
      {
        name: 'Protein',
        totalThisWeek: thisWeekTotals.protein,
        totalLastWeek: lastWeekTotals.protein,
        delta: calcDeltaPct(thisWeekTotals.protein, lastWeekTotals.protein),
      },
      {
        name: 'Carbs',
        totalThisWeek: thisWeekTotals.carbs,
        totalLastWeek: lastWeekTotals.carbs,
        delta: calcDeltaPct(thisWeekTotals.carbs, lastWeekTotals.carbs),
      },
      {
        name: 'Fat',
        totalThisWeek: thisWeekTotals.fat,
        totalLastWeek: lastWeekTotals.fat,
        delta: calcDeltaPct(thisWeekTotals.fat, lastWeekTotals.fat),
      },
    ];

    let selectedMacro = macroDeltas.find(m => m.delta < -10) || 
                        macroDeltas.reduce((max, m) => Math.abs(m.delta) > Math.abs(max.delta) ? m : max);

    const prompt = 
    `You are a Fitness Trainer. Analyze this user's fitness data for the current week vs last week and generate a summary.
    Data profile:
    - Total Calories Burned: ${totalBurnedThisWeek.toFixed(0)} (Change: ${deltaBurned}%)
    - Key Macronutrient Change: ${selectedMacro.name} (${selectedMacro.delta}% change)
    - Current Workout Streak: ${streak} days
    - Workout: ${thisWeekData.filter(d => d.workout_completed > 0).length} sessions
    Tasks:
    Generate exactly 4 short, punchy bullet points. Each item must be plain text + emojis if necessary (no *, quotes, markdown) Return ONLY a raw JSON object with 2 keys: 
    1. "summary": Exactly 4 short bullet points (Activity, Nutrition, Streak, Tip).
    2. "nextFocus": ONE single, motivating sentence telling the user exactly what to focus.
    
    JSON FORMAT:
    { 
      "summary": ["Point 1", "Point 2", "Point 3", "Point 4"],
      "nextFocus": "Sentence here."
    }

    Guidelines:
    1. Calorie Trend: Comment on the burn rate change.
    2. Nutrition Highlight: Comment on the macro change (e.g., "Protein intake dropped...").
    3. Consistency/Streak: Celebration of streak OR encouragement if 0.
    4. Actionable Tip: A specific behavioral tip based on the data (e.g., "Try to hit 20g protein post-workout").`;

    let gResponse;

    // to save our gemini token :D
    gResponse = await queryGemini(prompt);
    console.log("Gemini Raw Response:", gResponse);
    gResponse = typeof gResponse === 'object' ? JSON.stringify(gResponse) : gResponse;

    // dummy data for testing :P
    // gResponse = JSON.stringify({
    //    summary: [
    //      `Calories burned ${deltaBurned >= 0 ? 'up' : 'down'} by ${Math.abs(deltaBurned)}% this week! 🔥`,
    //      `${selectedMacro.name} intake shifted by ${selectedMacro.delta}%.`,
    //      `Current streak is ${streak} days. Keep it rolling! 🚀`,
    //      "Tip: Try adding 10 mins of cardio after lifting."
    //    ],
    //    nextFocus: "Focus on maintaining your protein intake consistency next week."
    // });

    function parseGeminiResponse(text) {
      if (typeof text !== 'string') {
        text = JSON.stringify(text);
      }

      const cleanText = text.replace(/```json\s*|\s*```/g, '');
      const match = cleanText.match(/\{[\s\S]*\}/);
      if (!match) 
        throw new Error("No JSON structure found in response");
      
      return JSON.parse(match[0]);
    }

    let result = {};
    let isFallback = false;

    // Parse Gemini Response
    try {
      const obj = parseGeminiResponse(gResponse);
      
      // Validate structure
      const summary = Array.isArray(obj.summary) ? obj.summary : [];
      // Padding if < 4 points returned
      while (summary.length < 4) summary.push("Keep moving to see more insights!");
      
      const nextFocus = obj.nextFocus || "Maintain your momentum!";
      
      result = { 
        summary: summary.slice(0, 4),
        nextFocus 
      };
      
    } catch (err) { 
      // Fallback
      isFallback = true;
      const fallbackSummary = [];

      if (deltaBurned > 0) {
        fallbackSummary.push(`Calories burned is up by ${deltaBurned}% this week! 🔥`);
      } else {
        fallbackSummary.push(`Calories burned is down by ${Math.abs(deltaBurned)}%. Let's move more!`);
      }
      if (selectedMacro.delta < 0) {
        fallbackSummary.push(`Your ${selectedMacro.name} intake dropped by ${Math.abs(selectedMacro.delta)}%.`);
      } else {
        fallbackSummary.push(`Your ${selectedMacro.name} intake increased by ${selectedMacro.delta}%.`);
      }
      if (streak > 2) {
        fallbackSummary.push(`You're on a ${streak}-day workout streak! Keep it up! 🏆`);
      } else {
        fallbackSummary.push(`Try to log a workout today to build your streak.`);
      }
      fallbackSummary.push("Remember to stay hydrated!");

      result = {
        summary: fallbackSummary,
        nextFocus: "Maintain your momentum!",
      };
    }

    // Final response
    const insight = {
      summary: result.summary,
      nextFocus: result.nextFocus,
      isFallback: isFallback,
    };

    res.json(insight);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ENDPOINT 6: RECOMMEND RECIPES
router.get('/ptf/recommendationRecipes', async (req, res) => {
  const supabase = getRlsClient(req);
  const user_id = req.user?.id || req.user?.user_id;

  try {
    const result = await recommendRecipes(user_id, supabase);
    const formattedRecipes = result.recommendations.map(item => {
      const r = item.meal;
      return{
        id: r.recipe_id || r.id,
        title: r.title,
        summary: r.summary || (r.procedure ? r.procedure.substring(0, 100) + "..." : "Delicious recipe"),
        badge: "Recipe",
        link: r.source_url,
        calories: r.calories,
        protein: r.protein,
        carbs: r.carbs,
        fat: r.fat,
        category: r.dietary_tags ? r.dietary_tags.join(", ") : "Recipe",
        content: r.procedure,
        cooking_time: r.cooking_time,
        ingredients: r.ingredients,
        isRecipe: true,
        image_url: r.image_url,
        dietary_tags: r.dietary_tags || []
      };
    });

    return res.json({ recommendations: formattedRecipes });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ENDPOINT 7: RECOMMEND WELLNESS RESOURCES
router.get('/ptf/recommendationWellness', async (req, res) => {
  const supabase = getRlsClient(req);
  const user_id = req.user?.id || req.user?.user_id;

  try {
    const result = await recommendWellness(user_id, supabase);
    const formattedWellness = result.recommendations.map(w => ({
      id: w.resource_id,
      title: w.title,
      summary: w.description || "Great wellness resource for you.",
      badge: "Wellness", 
      link: w.source_url,
      isRecipe: false,
      category: "Wellness"
    }));

    return res.json({ recommendations: formattedWellness });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// VIEW WORKOUT LOG
router.get('/ptf/workoutLog', async (req, res) => {
const supabase = getRlsClient(req);
    const user = req.user;

    try {
    const { data: userWorkoutData, error } = await supabase
      .from("workout_logs")
      .select("created_at, exercise_name, sets, reps, duration, calories_burned")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching workout logs", error);
      return res.status(500).json({ error: error.message });
    }

    return res.json(userWorkoutData || []);
  } catch (err) {
    console.error("Error in workoutLog", err);
    return res.status(500).json({ error: err.message });
  }
});

// VIEW MEAL LOG
router.get('/ptf/mealLog', async (req, res) => {
const supabase = getRlsClient(req);
    const user = req.user;

    try {
    const { data: userMealData, error } = await supabase
      .from("meal_logs")
      .select("created_at, meal_name, calories, protein, carbs, fat, meal_time")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching meal logs", error);
      return res.status(500).json({ error: error.message });
    }

    return res.json(userMealData || []);
  } catch (err) {
    console.error("Error in mealLog", err);
    return res.status(500).json({ error: err.message });
  }
});

// VIEW SAVED RECOMMENDATIONS
router.get('/ptf/savedRecommendations', async (req, res) => {
  const supabase = getRlsClient(req);
  const user = req.user;

  try {
    const { data, error } = await supabase
      .from("recommendation_history")
      .select(`
        rec_id,
        type,
        created_at,
        recipe_id,
        resource_id,
        recipes (
          title
        ),
        wellness_resources (
          title,
          source_url
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching saved recommendations", error);
      return res.status(500).json({ error: error.message });
    }

    return res.json(data || []);
  } catch (err) {
    console.error("Error in savedRecommendations", err);
    return res.status(500).json({ error: err.message });
  }
});

// TODAY AT A GLANCE (HOME PAGE)
router.get('/ptf/today', async (req, res) => {
  const supabase = getRlsClient(req);
  const user_id = req.user?.id || req.user?.user_id;

  try {
    const today = new Date();
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    const todayData = await fetchMetricsData(user_id, startOfToday, endOfToday, supabase);

    const sum = (arr, field) => arr.reduce((acc, curr) => acc + (curr[field] || 0), 0);
    
    const calories = sum(todayData, 'calories_in');
    const protein = sum(todayData, 'protein');
    const carbs = sum(todayData, 'carbs');
    const fat = sum(todayData, 'fat');
    const caloriesBurned = sum(todayData, 'calories_burned');
    const workoutCount = sum(todayData, 'workout_completed') || 0;
    const burnGoal = await extractUserGoal(user_id, supabase);

    return res.json({
      calories,
      protein,
      carbs,
      fat,
      caloriesBurned,
      workoutCount,
      burnGoal
    });
  } catch (err) {
    console.error('Error fetching today metrics:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;