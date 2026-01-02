const cron = require('node-cron');
const supabase = require('../services/supabaseClient'); 
const { sendNotification } = require('../services/notificationClient');

// Run every day at 8:00 PM
cron.schedule('0 20 * * *', async () => {
  console.log(`[WorkoutReminder] Checking for missed workouts...`);

  try {
    const { data: users, error } = await supabase.from('users').select('user_id');
    
    if (error || !users) {
      console.error("Error fetching users for workout reminder:", error);
      return;
    }

    const todayStart = new Date(); // Start of day - End of day
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    for (const user of users) {
      const { data: metrics } = await supabase
        .from('daily_metrics')
        .select('workout_completed')
        .eq('user_id', user.user_id)
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString())
        .maybeSingle(); // Returns null if no row exists

      const hasWorkedOut = metrics && metrics.workout_completed > 0;

      if (!hasWorkedOut) {
        await sendNotification(
          user.user_id,
          'reminder', 
          "💪 You haven't logged a workout yet today. Keep your streak alive!", 
          '/chatbot' 
        );
        console.log(`Sent workout reminder to ${user.user_id}`);
      }
    }
  } catch (err) {
    console.error("Unexpected error in workout reminder job:", err);
  }
});