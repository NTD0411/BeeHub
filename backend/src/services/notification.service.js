const { supabaseAdmin } = require('./supabase.service');

/**
 * Tạo 1 thông báo in-app cho user.
 * @param {string} userId
 * @param {string} type  - notification_type enum value
 * @param {string} title
 * @param {string} body
 * @param {object} opts  - { priority, listingId, actionData, actionUrl, icon }
 */
async function createNotification(userId, type, title, body, opts = {}) {
  const { error } = await supabaseAdmin.from('notifications').insert({
    user_id: userId,
    notification_type: type,
    title,
    body,
    priority: opts.priority || 'normal',
    listing_id: opts.listingId || null,
    action_data: opts.actionData || null,
    action_url: opts.actionUrl || null,
    icon: opts.icon || null,
    is_read: false,
    is_sent: true,
    sent_at: new Date().toISOString(),
  });
  if (error) {
    console.error('[notification] insert error:', error.message);
    return { error };
  }
  return { error: null };
}

/** Gửi thông báo cho tất cả admin đang active */
async function notifyAdmins(type, title, body, opts = {}) {
  const { data: admins, error } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .eq('status', 'active');

  if (error) {
    console.error('[notification] fetch admins error:', error.message);
    return;
  }

  await Promise.all(
    (admins || []).map((admin) => createNotification(admin.id, type, title, body, opts)),
  );
}

module.exports = { createNotification, notifyAdmins };
