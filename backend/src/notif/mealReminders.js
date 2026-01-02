const cron = require('node-cron');
const supabase = require('../services/supabaseClient'); 
const { sendNotification } = require('../services/notificationClient');

const TZ = 'Asia/Kuala_Lumpur';

const MEAL_SCHEDULES = [
  { 
    name: 'Breakfast', 
    windowStart: 7,  // 7:00 AM
    windowEnd: 11,   // 11:00 AM
  },
  { 
    name: 'Lunch', 
    windowStart: 11, // 11:00 AM
    windowEnd: 16,   // 4:00 PM
  },
  { 
    name: 'Dinner', 
    windowStart: 17, // 5:00 PM
    windowEnd: 22,   // 10:00 PM
  }
];

function buildWindow(schedule) {
  const start = new Date();
  start.setHours(schedule.windowStart, 0, 0, 0);
  const end = new Date();
  end.setHours(schedule.windowEnd, 0, 0, 0);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

async function runMeal(schedule) {
  console.log(`[MealReminder] ${schedule.name} pid=${process.pid} now=${new Date().toString()}`);

  const { startIso, endIso } = buildWindow(schedule);

  const { data: users, error } = await supabase
  .from('users').
  select('user_id');
  if (error || !users) {
    console.error("Error fetching users for reminder:", error);
    return;
  }

  for (const u of users) {
    const { count, error: cErr } = await supabase
      .from('meal_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', u.user_id)
      .gte('created_at', startIso)
      .lt('created_at', endIso);
      
    console.log(`User ${u.user_id} has ${count} meal logs for ${schedule.name} window.`);

    if (cErr) {
      console.log("Error fetching meal logs for user:", u.user_id, cErr);
      continue;
    }

    if ((count ?? 0) === 0) {
      await sendNotification(
        u.user_id,
        'reminder',
        `Don't forget to log your ${schedule.name}!`,
        '/chatbot'
      );
      console.log(`Sent ${schedule.name} reminder to ${u.user_id}`);
    }
  }
}

cron.schedule('0 10 * * *', () => runMeal(MEAL_SCHEDULES[0]), { timezone: TZ }); // Breakfast
cron.schedule('0 15 * * *', () => runMeal(MEAL_SCHEDULES[1]), { timezone: TZ }); // Lunch
cron.schedule('0 21 * * *', () => runMeal(MEAL_SCHEDULES[2]), { timezone: TZ }); // Dinner