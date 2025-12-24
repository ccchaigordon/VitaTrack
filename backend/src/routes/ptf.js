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

// ENDPOINT 3: WEEKLY INSIGHTS
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

  try {
    const thisWeekData = await fetchMetricsData(user_id, thisWeekStart, thisWeekEnd, supabase);
    const lastWeekData = await fetchMetricsData(user_id, lastWeekStart, lastWeekEnd, supabase);

    console.log("This Week Data:", thisWeekData);
    console.log("Last Week Data:", lastWeekData);

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

    const negativeDeltas = macroDeltas.filter(m => m.delta < 0);

    if (negativeDeltas.length > 0) {
      // Rule 1: If negative deltas exist -> pick the most negative (smallest delta)
      selectedMacro = negativeDeltas.reduce((min, m) =>
        m.delta < min.delta ? m : min
      );
    } else {
      // Rule 2: If no negative delta -> pick the most positive (largest delta)
      selectedMacro = macroDeltas.reduce((max, m) =>
        m.delta > max.delta ? m : max
      );
    }

    const prompt = 
    `Provide a concise weekly summary based on the following data:
    - Average Daily Calories Burned This Week: ${avgBurnedThisWeek.toFixed(0)}
    - Average Daily Calories Burned Last Week: ${avgBurnedLastWeek.toFixed(0)}
    - Percentage Change in Average Daily Calories Burned: ${deltaBurned}%
    - Most decreased/increased Macronutrient This Week: ${selectedMacro.name} (${selectedMacro.delta}% change compared to last week)

    Using the data provided, generate 2 bullet point summarizing the user's performance this week compared to last week. Return EXACTLY this JSON format and nothing else:
    {  "summary": ["...", "..."]  }
    Rules:
    - summary must have exactly 2 items
    - each item must be plain text (no *, quotes, markdown)
    - if insufficient data, return: {"summary":[
        "No sufficient data to generate insights.",
        "No sufficient data to generate insights."]}`;

    function extractJson(text) {
      const match = String(text).match(/\{[\s\S]*\}/);
      return match ? match[0] : null;
    }

    function parseSummaryFromGemini(gResponse) {
      const jsonStr = extractJson(gResponse);
      if (!jsonStr) throw new Error("No JSON found");

      const obj = JSON.parse(jsonStr);
      
      const summary = Array.isArray(obj.summary) ? obj.summary : [];

      const cleaned = summary.map(b => String(b).trim()).filter(Boolean).slice(0, 2);
      while (cleaned.length < 2) cleaned.push("No sufficient data to generate insights.");
      return cleaned;
    }

    // to save our gemini token :D
    // const gResponse = await queryGemini(prompt);

    // let summary;
    // try {
    //   summary = parseSummaryFromGemini(gResponse);
    // } catch {
    //   summary = [
    //     "No sufficient data to generate insights.", 
    //     "No sufficient data to generate insights." ];
    // }

    // dummy response without calling Gemini
    const summary = deltaBurned > 0 ?
      `Great job! Your average daily calories burned increased by ${deltaBurned}% compared to last week.` : `This week, your average daily calories burned decreased by ${Math.abs(deltaBurned)}% compared to last week. Let's aim to be more active next week!
      Additionally, your ${selectedMacro.name} intake changed by ${selectedMacro.delta}% compared to last week. Keep an eye on your nutrition to support your fitness goals.`;

    
    const insight = {
      summary: summary,
      nextFocus: 'Try to maintain this momentum over the next week.',
      isFallback: false,
    };

    res.json(insight);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ENDPOINT 4: WORKOUT
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

  // Calculate streakDays (consecutive days with workout_completed)
  // let streakDays = 0;
  // for (let i = workoutData.length - 1; i >= 0; i--) {
  //   if (workoutData[i].workout_completed) {
  //     streakDays++;
  //   } else {
  //     break;
  //   }
  // }

  // // Create history array (1 for completed, 0 for not)
  // const history = workoutData.map(d => d.workout_completed ? 1 : 0);

  // const workoutSummary = {
  //   totalCount,
  //   streakDays,
  //   history
  // };

  return res.json(history);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }});

module.exports = router;