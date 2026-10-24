const { supabaseAdmin } = require('../services/supabase.service');
const chatService = require('../services/chat.service');

async function resolveUserRole(userId, fallbackRole) {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();
  return profile?.role || fallbackRole || 'customer';
}

async function listConversations(req, res, next) {
  try {
    const role = await resolveUserRole(req.user.id, req.user.role);
    const data = await chatService.listConversations(req.user.id, role);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getMessages(req, res, next) {
  try {
    const data = await chatService.getMessages(req.params.orderId, req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function sendMessage(req, res, next) {
  try {
    const data = await chatService.sendMessage(req.params.orderId, req.user.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = { listConversations, getMessages, sendMessage };
