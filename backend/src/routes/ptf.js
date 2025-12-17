const express = require('express');
const supabaseServer = require('../services/supabaseClient');

const router = express.Router();

async function fetchMetricsData(userId, startDate, endDate) {
  const { data, error } = await supabaseServer
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
  const { user_id, days = 7 } = req.query;
  const range = Number(days);
  const today = new Date();
  
  const pastDate = new Date(today);
  pastDate.setDate(pastDate.getDate() - (range - 1));
  
  const prevPastDate = new Date(pastDate);
  prevPastDate.setDate(prevPastDate.getDate() - range);

  try {
    const rawData = await fetchMetricsData(user_id, prevPastDate, today);

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
  const { user_id, days = 7 } = req.query;

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
    const currentPeriod = await fetchMetricsData(user_id, startMonday, endSunday);
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

module.exports = router;