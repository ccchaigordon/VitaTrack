async function calculateStreak(userId, supabase) {

  function todayMYDateOnly() {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kuala_Lumpur',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }

  function addDaysMY(dateOnly, deltaDays) {
    const d = new Date(`${dateOnly}T00:00:00+08:00`);
    d.setDate(d.getDate() + deltaDays);
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kuala_Lumpur',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  }

  const today = todayMYDateOnly();
  const pastDate = addDaysMY(today, -30);
  console.log("Date range:", pastDate, "to", today);
 
  const { data: workoutData, error } = await supabase
    .from('daily_metrics')
    .select('created_at, workout_completed')
    .eq('user_id', userId)
    .gte('created_at', pastDate)
    .lte('created_at', today);

  if (error) throw error;

  const activeDates = new Set();
  workoutData.forEach(item => {
    if (item.workout_completed > 0 && item.created_at) {
      activeDates.add(item.created_at);
    }
  });

  let streak = 0;
  let checkDate = today;
  const yesterday = addDaysMY(today, -1);

  if (activeDates.has(checkDate)) {
  } else if (activeDates.has(yesterday)) {
     checkDate = yesterday;
  } else {
     return 0;
  }

  while (true) {
    if (activeDates.has(checkDate)) {
      streak++;
      checkDate = addDaysMY(checkDate, -1);
    } else {
      break;
    }
  }

  return streak;
}

module.exports = calculateStreak;