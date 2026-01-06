async function calculateStreak(userId, supabase) {

  function toDateOnlyMY(date) {
    return date.toLocaleDateString('en-CA'); 
  }

  const today = new Date();
  today.setHours(today.getHours() + 8);
  const pastDate = new Date(today);
  pastDate.setDate(pastDate.getDate() - 30);

  const today_MY = toDateOnlyMY(today);
  const pastDate_MY = toDateOnlyMY(pastDate);
 
  const { data: workoutData, error } = await supabase
    .from('daily_metrics')
    .select('created_at, workout_completed')
    .eq('user_id', userId)
    .gte('created_at', pastDate_MY)
    .lte('created_at', today_MY);

  if (error) throw error;

  const activeDates = new Set();
  workoutData.forEach(item => {
    if (item.workout_completed > 0 && item.created_at) {
      activeDates.add(item.created_at);
    }
  });

  let streak = 0;
  let checkDate = new Date(); 
  checkDate.setHours(checkDate.getHours() + 8);

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