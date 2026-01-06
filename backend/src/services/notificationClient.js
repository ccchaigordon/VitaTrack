const supabase = require('./supabaseClient'); 

function now_MY() {
  const d = new Date(Date.now() + 8 * 60 * 60 * 1000);
  return d;
}

async function sendNotification(userId, type, message, link = null, dedupeKey = null) {
try {
  const payload = {
      user_id: userId,
      type,
      message,
      action_link: link,
      dedupe_key: dedupeKey,
      created_at: now_MY(),
    };

  const { error } = dedupeKey
      ? await supabase.from('notifications').upsert(payload, { onConflict: 'dedupe_key', ignoreDuplicates: true })
      : await supabase.from('notifications').insert(payload);

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