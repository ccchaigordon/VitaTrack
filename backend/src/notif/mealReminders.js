const cron = require('node-cron');
const supabase = require('../services/supabaseClient'); 
const { sendNotification } = require('../services/notificationClient');

const MEAL_SCHEDULES = [
  { 
    name: 'Breakfast', 
    windowStart: 7,  // 7:00 AM
    windowEnd: 11,   // 11:00 AM
    triggerHour: 8  // 8:00 AM
  },
  { 
    name: 'Lunch', 
    windowStart: 11, // 11:00 AM
    windowEnd: 16,   // 4:00 PM
    triggerHour: 12  // 12:00 PM
  },
  { 
    name: 'Dinner', 
    windowStart: 17, // 5:00 PM
    windowEnd: 22,   // 10:00 PM
    triggerHour: 18  // 6:00 PM
  }
];

cron.schedule('0 0 * * * *', async () => {
  const now = new Date();
  const currentHour = now.getHours(); // 0-23
  
  console.log(`[MealReminder] Checking time: ${currentHour}:00`);

  const schedule = MEAL_SCHEDULES.find(s => s.triggerHour === currentHour);
  
  if (!schedule) {
    return;
  }

  try {
    const { data: users, error } = await supabase.from('users').select('user_id');
    
    if (error || !users) {
      console.error("Error fetching users for reminder:", error);
      return;
    }

    const todayStart = new Date();
    todayStart.setHours(schedule.windowStart, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(schedule.windowEnd, 0, 0, 0);

    for (const user of users) {
      const { count } = await supabase
        .from('meal_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.user_id)
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString());

      if (count === 0) {
        await sendNotification(
          user.user_id,
          'reminder',
          `Don't forget to log your ${schedule.name}!`,
          '/chatbot'
        );
        console.log(`Sent ${schedule.name} reminder to ${user.user_id}`);
      }
    }
  } catch (err) {
    console.error("Unexpected error in meal reminder job:", err);
  }
});