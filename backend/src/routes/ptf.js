const express = require('express');
const supabaseServer = require('../services/supabaseClient');
const { queryGemini } = require('../services/geminiClient');

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

// ENDPOINT 1: MACROS
router.get('/ptf/macros', async (req, res) => {
  const supabase = getRlsClient(req);
  const user_id = req.user?.id || req.user?.user_id || 1;
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
  const user_id = req.user?.id || req.user?.user_id || 1;
  const days = req.query.days || 7;
  console.log("user_id:", user_id, typeof user_id);
  console.log("days:", days, typeof days);
  // const { user_id, days = 7 } = req.query;

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
    const currentPeriod = await fetchMetricsData(user_id, startMonday, endSunday, supabase);
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

    return res.json(caloriesActivity);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ENDPOINT 3: WORKOUT
router.get('/ptf/workout', async (req, res) => {
  const supabase = getRlsClient(req);
  const user_id = req.user?.id || req.user?.user_id || 1;
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
  const user_id = req.user?.id || req.user?.user_id || 1;
  const today = new Date();
  const pastDate = new Date(today);

  // max streak 30 days
  pastDate.setDate(pastDate.getDate() - 30); 

  try {
    const workoutData = await fetchMetricsData(user_id, pastDate, today, supabase);

    // Using Local Time to match user's day boundary
    const activeDates = new Set();
    workoutData.forEach(item => {
      if (item.workout_completed > 0) {
        const d = new Date(item.created_at);
        const key = d.toLocaleDateString('en-CA');
        activeDates.add(key);
      }
    });

    let streak = 0;
    let checkDate = new Date(); // Start checking from today

    const todayKey = checkDate.toLocaleDateString('en-CA');
    const yesterdayDate = new Date(checkDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayKey = yesterdayDate.toLocaleDateString('en-CA');

    // If Today has data, streak includes today.
    // If Today NO data, but Yesterday HAS data, streak count starts from yesterday).
    // If neither, streak is 0.
    if (activeDates.has(todayKey)) {
      // Streak continues from Today
    } else if (activeDates.has(yesterdayKey)) {
      // Streak continues from Yesterday
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // Streak 0
      return res.json({ streakDays: 0 });
    }

    while (true) {
      const key = checkDate.toLocaleDateString('en-CA');
      
      if (activeDates.has(key)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1); // Go to previous day
      } else {
        break;
      }
    }

    return res.json({ streakDays: streak });

    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

// ENDPOINT 5: WEEKLY INSIGHTS
router.get('/ptf/insights', async (req, res) => {
  const supabase = getRlsClient(req);
  const user_id = req.user?.id || req.user?.user_id || 1;

  const today = new Date();
  const currentDay = today.getDay();   // 0=Sun, 1=Mon, ..., 6=Sat
  const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;

  const currentMonday = new Date(today);
  currentMonday.setDate(today.getDate() - diffToMonday);
  currentMonday.setHours(0, 0, 0, 0);

  // weekday index 1..7 (Mon..Sun) for "this week"
  const weekdayIndex = currentDay === 0 ? 7 : currentDay; 

  // Date range for THIS week: Mon ~ today
  const thisWeekStart = new Date(currentMonday);
  const thisWeekEnd = new Date(today);
  thisWeekEnd.setHours(23, 59, 59, 999);
  console.log("This Week Start:", thisWeekStart);
  console.log("This Week End:", thisWeekEnd);

  // Date range for LAST week: previous Mon ~ previous Sun
  const lastWeekStart = new Date(currentMonday);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  lastWeekStart.setHours(0, 0, 0, 0);

  const lastWeekEnd = new Date(currentMonday);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 1); // Sunday before currentMonday
  lastWeekEnd.setHours(23, 59, 59, 999);

  const streakStart = new Date(today);
  streakStart.setDate(streakStart.getDate() - 60);

  try {
    const [thisWeekData, lastWeekData, streakData] = await Promise.all([
      fetchMetricsData(user_id, thisWeekStart, thisWeekEnd, supabase),
      fetchMetricsData(user_id, lastWeekStart, lastWeekEnd, supabase),
      fetchMetricsData(user_id, streakStart, thisWeekEnd, supabase) 
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

    // AVERAGE
    const daysThisWeekSoFar = weekdayIndex;  // Mon–today
    const avgBurnedThisWeek = daysThisWeekSoFar > 0 ? thisWeekTotals.calories_burned / daysThisWeekSoFar : 0;
    const avgBurnedLastWeek = lastWeekTotals.calories_burned / 7;

    // 1) Calories Burned Delta based on AVERAGES
    const deltaBurned = calcDeltaPct(avgBurnedThisWeek, avgBurnedLastWeek);

    // 2) Macro deltas based on TOTALS
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

    // const negativeDeltas = macroDeltas.filter(m => m.delta < 0);

    // if (negativeDeltas.length > 0) {
    //   // Rule 1: If negative deltas exist -> pick the most negative (smallest delta)
    //   selectedMacro = negativeDeltas.reduce((min, m) =>
    //     m.delta < min.delta ? m : min
    //   );
    // } else {
    //   // Rule 2: If no negative delta -> pick the most positive (largest delta)
    //   selectedMacro = macroDeltas.reduce((max, m) =>
    //     m.delta > max.delta ? m : max
    //   );
    // }

    let selectedMacro = macroDeltas.find(m => m.delta < -10) || 
                        macroDeltas.reduce((max, m) => Math.abs(m.delta) > Math.abs(max.delta) ? m : max);

    const activeDates = new Set();
    streakData.forEach(item => {
      if (item.workout_completed > 0) {
        activeDates.add(new Date(item.created_at).toLocaleDateString('en-CA'));
      }
    });

    let streak = 0;
    let checkDate = new Date();
    const todayKey = checkDate.toLocaleDateString('en-CA');
    const yesterdayDate = new Date(checkDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayKey = yesterdayDate.toLocaleDateString('en-CA');

    if (activeDates.has(todayKey)) { 
    } else if (activeDates.has(yesterdayKey)) {
      checkDate.setDate(checkDate.getDate() - 1); 
    } 
    
    if (activeDates.has(checkDate.toLocaleDateString('en-CA'))) {
        while (activeDates.has(checkDate.toLocaleDateString('en-CA'))) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        }
    }

    const prompt = 
    `You are a Fitness Trainer. Analyze this user's fitness data for the current week vs last week and generate a summary.
    Data profile:
    - Average Calories Burned: ${avgBurnedThisWeek.toFixed(0)} (Change: ${deltaBurned}%)
    - Key Macronutrient Change: ${selectedMacro.name} (${selectedMacro.delta}% change)
    - Current Workout Streak: ${streak} days
    - Workout: ${thisWeekData.filter(d => d.workout_completed > 0).length} sessions
    Tasks:
    Generate exactly 4 short, punchy bullet points. Each item must be plain text + emojis if necessary (no *, quotes, markdown) Return ONLY a JSON object with 2 keys: 
    1. "summary": Exactly 4 short bullet points (Activity, Nutrition, Streak, Tip).
    2. "nextFocus": ONE single, motivating sentence telling the user exactly what to focus on next week.
    
    JSON FORMAT:
    { 
      "summary": ["Point 1", "Point 2", "Point 3", "Point 4"],
      "nextFocus": "Your focus sentence here."
    }

    Guidelines:
    1. Calorie Trend: Comment on the burn rate change.
    2. Nutrition Highlight: Comment on the macro change (e.g., "Protein intake dropped...").
    3. Consistency/Streak: Celebration of streak OR encouragement if 0.
    4. Actionable Tip: A specific behavioral tip based on the data (e.g., "Try to hit 20g protein post-workout").`;

    function extractJson(text) {
      const match = String(text).match(/\{[\s\S]*\}/);
      return match ? match[0] : null;
    }

    function parseSummaryFromGemini(gResponse) {
      const jsonStr = extractJson(gResponse);
      if (!jsonStr) throw new Error("No JSON found");

      const obj = JSON.parse(jsonStr);
      
      const summary = Array.isArray(obj.summary) ? obj.summary : [];

      const cleaned = summary.map(b => String(b).trim()).filter(Boolean).slice(0, 4);
      while (cleaned.length < 4) cleaned.push("No sufficient data to generate insights.");
      return cleaned;
    }

    // to save our gemini token :D
    // const gResponse = await queryGemini(prompt);

    // let summary;
    // try {
    //   summary = parseSummaryFromGemini(gResponse);
    // } catch {
    //   summary = [
    //     "Calories activity data is being processed.",
    //     "Nutrition data will appear here soon.",
    //     "Keep logging your workouts to see streaks.",
    //     "Check back tomorrow for more insights." ],
    //     nextFocus = "Keep logging your meals and workouts.";
    // }

    // dummy response without calling Gemini
    const summary = deltaBurned > 0 ?
      `Great job! Your average daily calories burned increased by ${deltaBurned}% compared to last week.` : `This week, your average daily calories burned decreased by ${Math.abs(deltaBurned)}% compared to last week. Let's aim to be more active next week!
      Additionally, your ${selectedMacro.name} intake changed by ${selectedMacro.delta}% compared to last week. Keep an eye on your nutrition to support your fitness goals.`;

    
    const insight = {
      summary: summary,
      nextFocus: next_focus,
      isFallback: false,
    };

    res.json(insight);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;