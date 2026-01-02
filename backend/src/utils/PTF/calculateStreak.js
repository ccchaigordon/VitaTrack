async function calculateStreak(userId, supabase) {
  const today = new Date();
  const pastDate = new Date(today);
  pastDate.setDate(pastDate.getDate() - 30); 

  const { data: workoutData, error } = await supabase
    .from('daily_metrics')
    .select('created_at, workout_completed')
    .eq('user_id', userId)
    .gte('created_at', pastDate.toISOString())
    .lte('created_at', today.toISOString());

  if (error) throw error;

  const activeDates = new Set();
  workoutData.forEach(item => {
    if (item.workout_completed > 0) {
      const d = new Date(item.created_at);
      const key = d.toLocaleDateString('en-CA'); 
      activeDates.add(key);
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
  } else {
     return 0;
  }

  while (true) {
    const key = checkDate.toLocaleDateString('en-CA');
    if (activeDates.has(key)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

module.exports = calculateStreak;