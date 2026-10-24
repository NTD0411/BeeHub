const { supabaseAdmin } = require('../services/supabase.service');

/** GET /api/notifications — danh sách thông báo của user */
async function listNotifications(req, res) {
  const userId = req.user.id;
  const limit = Math.min(parseInt(req.query.limit) || 30, 100);
  const page  = Math.max(parseInt(req.query.page) || 1, 1);
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabaseAdmin
    .from('notifications')
    .select('id, notification_type, title, body, is_read, created_at, listing_id, action_data, action_url, icon, priority', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return res.status(500).json({ error: error.message });

  return res.json({
    notifications: data || [],
    pagination: { total: count || 0, page, limit },
    unread_count: (data || []).filter(n => !n.is_read).length,
  });
}

/** GET /api/notifications/unread-count — số badge */
async function unreadCount(req, res) {
  const userId = req.user.id;
  const { count, error } = await supabaseAdmin
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ unread_count: count || 0 });
}

/** PATCH /api/notifications/:id/read — đánh dấu đã đọc */
async function markRead(req, res) {
  const userId = req.user.id;
  const { id } = req.params;

  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
}

/** PATCH /api/notifications/read-all — đánh dấu tất cả đã đọc */
async function markAllRead(req, res) {
  const userId = req.user.id;
  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
}

module.exports = { listNotifications, unreadCount, markRead, markAllRead };
