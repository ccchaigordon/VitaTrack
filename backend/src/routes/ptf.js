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
    .select('created_at, calories_in, calories_burned, protein, carbs, fat')
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

router.get('/ptf/insights', async (req, res) => {
  const supabase = getRlsClient(req);
  const user_id = req.user?.id || req.user?.user_id || 1;

  const today = new Date();

  // 1. Find Monday of *this* week
  const currentDay = today.getDay();   // 0=Sun, 1=Mon, ..., 6=Sat
  const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;

  const currentMonday = new Date(today);
  currentMonday.setDate(today.getDate() - diffToMonday);
  currentMonday.setHours(0, 0, 0, 0);

  // weekday index 1..7 (Mon..Sun) for "this week"
  const weekdayIndex = currentDay === 0 ? 7 : currentDay; 

  // 2. Date range for THIS week: Mon ~ today
  const thisWeekStart = new Date(currentMonday);
  const thisWeekEnd = new Date(today);
  thisWeekEnd.setHours(23, 59, 59, 999);
  console.log("This Week Start:", thisWeekStart);
  console.log("This Week End:", thisWeekEnd);

  // 3. Date range for LAST week: previous Mon ~ previous Sun
  const lastWeekStart = new Date(currentMonday);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  lastWeekStart.setHours(0, 0, 0, 0);

  const lastWeekEnd = new Date(currentMonday);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 1); // Sunday before currentMonday
  lastWeekEnd.setHours(23, 59, 59, 999);

  const sum = (arr, field) =>
    arr.reduce((acc, entry) => acc + (entry[field] || 0), 0);

  try {
    const thisWeekData = await fetchMetricsData(user_id, thisWeekStart, thisWeekEnd, supabase);
    const lastWeekData = await fetchMetricsData(user_id, lastWeekStart, lastWeekEnd, supabase);

    console.log("This Week Data:", thisWeekData);
    console.log("Last Week Data:", lastWeekData);

    // TOTALS
    const totalBurnedThisWeek = sum(thisWeekData, 'calories_burned');
    const totalBurnedLastWeek = sum(lastWeekData, 'calories_burned');

    // AVERAGES
    const daysThisWeekSoFar = weekdayIndex;  // Mon–today
    const avgBurnedThisWeek =
      daysThisWeekSoFar > 0 ? totalBurnedThisWeek / daysThisWeekSoFar : 0;

    const avgBurnedLastWeek = totalBurnedLastWeek / 7;

    const deltaPercent = (avgBurnedLastWeek, avgBurnedThisWeek) => {
      if (!avgBurnedLastWeek || avgBurnedLastWeek === 0) return 0;
      return ((avgBurnedThisWeek - avgBurnedLastWeek) / avgBurnedLastWeek * 100).toFixed(2);
    }

    console.log("Avg Burned This Week:", avgBurnedThisWeek);
    console.log("Avg Burned Last Week:", avgBurnedLastWeek);
    console.log("Delta Percent:", deltaPercent(avgBurnedLastWeek, avgBurnedThisWeek));

    const prompt = 
    `Provide a concise weekly summary based on the following data:
    - Average Daily Calories Burned This Week: ${avgBurnedThisWeek.toFixed(0)}
    - Average Daily Calories Burned Last Week: ${avgBurnedLastWeek.toFixed(0)}
    - Percentage Change in Average Daily Calories Burned: ${deltaPercent(avgBurnedLastWeek, avgBurnedThisWeek)}%

    Generate 1 bullet point summarizing the user's performance this week compared to last week. If there is insufficient data, indicate that no insights are available.`;

    // to save our gemini token :D
    // const gResponse = await queryGemini(prompt);

    // dummy response
    const gResponse = deltaPercent(avgBurnedLastWeek, avgBurnedThisWeek) > 0 ?
      `Great job! Your average daily calories burned increased by ${deltaPercent(avgBurnedLastWeek, avgBurnedThisWeek)}% compared to last week.` : `This week, your average daily calories burned decreased by ${Math.abs(deltaPercent(avgBurnedLastWeek, avgBurnedThisWeek))}% compared to last week. Let's aim to be more active next week!`;
    
    const insight = {
      summary: [gResponse],
      nextFocus: 'Try to maintain this momentum over the next week.',
      isFallback: false,
    };

    res.json(insight);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});


module.exports = router;