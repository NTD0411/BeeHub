const { supabaseAdmin } = require('../services/supabase.service');
const { createOrderTrackingService } = require('../services/order-tracking.service');
const events = require('../services/tracking-events.service');
const service = createOrderTrackingService(supabaseAdmin);
const handle = method => async (req, res, next) => {
  try {
    res.set('Cache-Control', 'private, no-store');
    const data = await service[method](req.params.id, req.user, req.body);
    if (method !== 'read') events.changed(req.params.id);
    res.json({ success: true, data });
  } catch (error) { next(error); }
};
async function stream(req, res, next) {
  try {
    await service.read(req.params.id, req.user);
    if (res.destroyed) return;
    res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'private, no-store',
      'X-Accel-Buffering': 'no', 'Connection': 'keep-alive' });
    res.flushHeaders();
    const signal = () => { if (!res.destroyed) res.write('data: changed\n\n'); };
    const unsubscribe = events.subscribe(req.params.id, signal);
    const heartbeat = setInterval(() => { if (!res.destroyed) res.write(': keepalive\n\n'); }, 15000);
    // Reconnect through authentication regularly; never retain an indefinite grant.
    const expiry = setTimeout(() => res.end(), 55000);
    res.on('close', () => { unsubscribe(); clearInterval(heartbeat); clearTimeout(expiry); });
    signal();
  } catch (error) { next(error); }
}
module.exports = { stream, read: handle('read'), publish: handle('publish'), stop: handle('stop') };
