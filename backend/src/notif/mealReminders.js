const cron = require('node-cron');
const supabase = require('../services/supabaseClient');
const { sendNotification } = require('../services/notificationClient');

const TZ = 'Asia/Kuala_Lumpur';

if (process.env.ENABLE_CRON !== 'true') {
  console.log('[MealReminder] CRON disabled (ENABLE_CRON!=true). pid=', process.pid);
  return;
}

if (global.__meal_reminder_cron_started) {
  console.log('[MealReminder] Cron already started, skipping. pid=', process.pid);
  return;
}
global.__meal_reminder_cron_started = true;

function mytDateKey(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now); 
}

function myt(dateKey, hour, min = 0, sec = 0, ms = 0) {
  const [yy, mm, dd] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(yy, mm - 1, dd, hour, min, sec, ms)).toISOString();
}

const MEAL_SCHEDULES = [
  { name: 'Breakfast', windowStart: 7,  windowEnd: 11, triggerHour: 10 },
  { name: 'Lunch',     windowStart: 11, windowEnd: 16, triggerHour: 15 },
  { name: 'Dinner',    windowStart: 17, windowEnd: 22, triggerHour: 21 },
];

function buildWindowIso(schedule) {
  const dateKey = mytDateKey();
  return {
    dateKey,
    startIso: myt(dateKey, schedule.windowStart, 0, 0, 0),
    endIso: myt(dateKey, schedule.windowEnd, 0, 0, 0),
  };
}

async function runMeal(schedule) {
  const now = new Date();
  console.log(`[MealReminder] ${schedule.name} pid=${process.pid} now=${now.toString()} iso=${now.toISOString()}`);

  const { dateKey, startIso, endIso } = buildWindowIso(schedule);

  const { data: users, error } = await supabase.from('users').select('user_id');
  if (error || !users) {
    console.error('[MealReminder] Error fetching users:', error);
    return;
  }

  const mealKey = schedule.name.toLowerCase();

  for (const u of users) {
    const { count, error: cErr } = await supabase
      .from('meal_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', u.user_id)
      .gte('created_at', startIso)
      .lt('created_at', endIso);

      console.log(`[MealReminder] Checked meal logs for user=${u.user_id} meal=${schedule.name} start=${startIso} end=${endIso} count=${count}`);

    if (cErr) {
      console.error('[MealReminder] Error counting meal logs:', { user: u.user_id, cErr });
      continue;
    }

    if ((count ?? 0) === 0) {
      const dedupeKey = `meal:${mealKey}:${dateKey}:${u.user_id}`;

      await sendNotification(
        u.user_id,
        'reminder',
        `Don't forget to log your ${schedule.name}!`,
        '/chatbot',
        dedupeKey
      );

      console.log(`[MealReminder] Sent ${schedule.name} reminder to ${u.user_id} dedupeKey=${dedupeKey}`);
    }
  }
}

for (const s of MEAL_SCHEDULES) {
  cron.schedule(`0 ${s.triggerHour} * * *`, () => runMeal(s), { timezone: TZ });
}

console.log('[MealReminder] Cron registered (Breakfast/Lunch/Dinner). pid=', process.pid);
