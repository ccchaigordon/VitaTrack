const express = require('express');
const supabaseServer = require('../services/supabaseClient'); 
const router = express.Router();

function getRlsClient(req) {
  return supabaseServer.createUserSupabaseClient(req.user.accessToken);
}

// Fetch notifications
router.get('/notifications', async (req, res) => {
  const supabase = getRlsClient(req);
  const { limit } = req.query;

  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data, error } = await query;
    if (error) throw error;
    
    const { count, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false); 
      
    if (countError) throw countError;

    return res.json({ notifications: data, unreadCount: count });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Mark single notification as read
router.patch('/notifications/:id/read', async (req, res) => {
  const supabase = getRlsClient(req);
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) throw error;
    const { count, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    if (countError) throw countError;

    return res.json({ success: true, unreadCount: count ?? 0 });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Mark all notifications as read
router.patch('/notifications/readAll', async (req, res) => {
  const supabase = getRlsClient(req);

  try {
    const userId = req.user?.id || req.user?.user_id;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return res.json({ success: true, unreadCount: 0 });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;