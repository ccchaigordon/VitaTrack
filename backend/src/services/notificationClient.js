const supabase = require('./supabaseClient'); 

async function sendNotification(userId, type, message, link = null) {
try {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type: type,
    message: message,
    action_link: link
  });

  if (error) {
    console.error("Failed to create notification:", error.message);
  } else {
    console.log(`Notification sent to User ${userId}: ${message}`);
  }
  } catch (err) {
    console.error("Error in sendNotification:", err);
  }
}

module.exports = { sendNotification };