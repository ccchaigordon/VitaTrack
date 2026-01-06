const cron = require('node-cron');
const supabase = require('../services/supabaseClient');
const { sendNotification } = require('../services/notificationClient');

const TZ = 'Asia/Kuala_Lumpur';

if (process.env.ENABLE_CRON !== 'true') {
  console.log('[WorkoutReminder] CRON disabled (ENABLE_CRON!=true). pid=', process.pid);
  return;
}

if (global.__workout_reminder_cron_started) {
  console.log('[WorkoutReminder] Cron already started, skipping. pid=', process.pid);
  return;
}
global.__workout_reminder_cron_started = true;

function mytDateKey(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now); 
}

function mytToUtcIso(dateKey, hour, min = 0, sec = 0, ms = 0) {
  const [yy, mm, dd] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(yy, mm - 1, dd, hour - 8, min, sec, ms)).toISOString();
}

function addDaysDateKey(dateKey, days) {
  const [yy, mm, dd] = dateKey.split('-').map(Number);
  const d = new Date(Date.UTC(yy, mm - 1, dd));
  d.setUTCDate(d.getUTCDate() + days);
  return mytDateKey(new Date(d.getTime() + 8 * 60 * 60 * 1000));
}

function buildMytDayWindowIso() {
  const dateKey = mytDateKey();
  const nextDateKey = addDaysDateKey(dateKey, 1);

  return {
    dateKey,
    startIso: mytToUtcIso(dateKey, 0, 0, 0, 0),
    endIso: mytToUtcIso(nextDateKey, 0, 0, 0, 0),
  };
}

async function runWorkoutReminder() {
  const now = new Date();
  console.log(`[WorkoutReminder] pid=${process.pid} now=${now.toString()} iso=${now.toISOString()}`);

  const { dateKey, startIso, endIso } = buildMytDayWindowIso();

  const { data: users, error } = await supabase.from('users').select('user_id');
  if (error || !users) {
    console.error('[WorkoutReminder] Error fetching users:', error);
    return;
  }

  for (const u of users) {
    const startIso_MY = new Date(new Date(startIso).getTime() + 8 * 60 * 60 * 1000).toISOString();
    const endIso_MY = new Date(new Date(endIso).getTime() + 8 * 60 * 60 * 1000).toISOString();

    const { data: rows, error: mErr } = await supabase
      .from('daily_metrics')
      .select('workout_completed')
      .eq('user_id', u.user_id)
      .gte('created_at', startIso_MY)
      .lt('created_at', endIso_MY);

      console.log('[WorkoutReminder] daily_metrics query result:', { user: u.user_id, rows, mErr, startIso_MY, endIso_MY });

    if (mErr) {
      console.error('[WorkoutReminder] daily_metrics query error:', { user: u.user_id, mErr, startIso, endIso });
      continue;
    }

    const totalWorkouts = (rows || []).reduce((sum, r) => sum + (r.workout_completed || 0), 0);

    if (totalWorkouts <= 0) {
      const dedupeKey = `workout:reminder:${dateKey}:${u.user_id}`;

      await sendNotification(
        u.user_id,
        'reminder',
        "You haven't logged a workout yet today. Keep your streak alive! 💪",
        '/chatbot',
        dedupeKey
      );

      console.log(`[WorkoutReminder] Sent reminder to ${u.user_id} dedupeKey=${dedupeKey}`);
    }
  }
}

// Run daily at 20:00 (8pm)
cron.schedule('0 20 * * *', runWorkoutReminder, { timezone: TZ });

console.log('[WorkoutReminder] Cron registered (daily 8pm MYT). pid=', process.pid);
