const cron = require('node-cron');
const { supabaseAdmin } = require('../services/supabase.service');
const { createNotification } = require('../services/notification.service');

/**
 * Chạy mỗi 2 phút.
 *
 * 1. matched + lock_expires_at quá hạn → reset về pending (unlock provider)
 * 2. pending/matched + order_expires_at quá hạn → cancelled (không ai đặt cọc kịp)
 * 3. scheduled + scheduled_pickup_time đã đến → accepted (bắt đầu thực hiện)
 */
async function runOrderTimeoutJob() {
  const now = new Date().toISOString();

  // ── 1. Unlock provider: matched quá 15 phút chưa đặt cọc ────────────────
  const { data: lockedOrders } = await supabaseAdmin
    .from('orders')
    .select('id, customer_id, provider_id, pickup_address, delivery_address')
    .eq('status', 'matched')
    .lt('lock_expires_at', now)
    .not('lock_expires_at', 'is', null);

  for (const order of lockedOrders || []) {
    await supabaseAdmin
      .from('orders')
      .update({
        status: 'pending',
        provider_id: null,
        lock_expires_at: null,
        updated_at: now,
      })
      .eq('id', order.id)
      .eq('status', 'matched');

    // Thông báo cho customer biết hết giờ
    await createNotification(
      order.customer_id,
      'order_timeout',
      'Hết thời gian đặt cọc',
      'Bạn chưa hoàn tất đặt cọc trong 15 phút. Nhà xe đã được giải phóng — bạn có thể chọn lại.',
      { priority: 'high', actionData: { order_id: order.id } },
    ).catch(() => {});

    // Thông báo cho provider
    if (order.provider_id) {
      await createNotification(
        order.provider_id,
        'order_timeout',
        'Khách không đặt cọc kịp',
        `Đơn ${order.pickup_address || ''} → ${order.delivery_address || ''} đã được mở lại cho nhà xe khác.`,
        { actionData: { order_id: order.id } },
      ).catch(() => {});
    }

    console.log(`[OrderTimeout] Unlocked matched order ${order.id}`);
  }

  // ── 2. Auto-cancel: pending/matched quá order_expires_at ────────────────
  const { data: expiredOrders } = await supabaseAdmin
    .from('orders')
    .select('id, status, customer_id, provider_id, pickup_address, delivery_address')
    .in('status', ['pending', 'matched'])
    .lt('order_expires_at', now)
    .not('order_expires_at', 'is', null);

  for (const order of expiredOrders || []) {
    const isPending = order.status === 'pending';
    const cancellationReason = isPending
      ? 'Tự động hủy — không có nhà xe được chọn trước giờ chuyến'
      : 'Tự động hủy — khách không đặt cọc trước giờ chuyến';
    const notifBody = isPending
      ? 'Đơn chuyển trọ đã bị hủy do chưa chọn nhà xe trước giờ hẹn.'
      : 'Đơn chuyển trọ đã bị hủy do không đặt cọc trước giờ hẹn.';

    await supabaseAdmin
      .from('orders')
      .update({
        status: 'cancelled',
        cancellation_reason: cancellationReason,
        cancelled_at: now,
        updated_at: now,
      })
      .eq('id', order.id)
      .in('status', ['pending', 'matched']);

    await createNotification(
      order.customer_id,
      'order_cancelled',
      'Đơn đã tự động hủy',
      notifBody,
      { priority: 'high', actionData: { order_id: order.id } },
    ).catch(() => {});

    if (order.provider_id) {
      await createNotification(
        order.provider_id,
        'order_cancelled',
        'Đơn đã hủy',
        `Đơn ${order.pickup_address || ''} → ${order.delivery_address || ''} đã bị hủy tự động.`,
        { actionData: { order_id: order.id } },
      ).catch(() => {});
    }

    console.log(`[OrderTimeout] Auto-cancelled expired order ${order.id}`);
  }

  // ── 3. Kích hoạt đơn scheduled: đã đến scheduled_pickup_time ────────────
  const { data: scheduledOrders } = await supabaseAdmin
    .from('orders')
    .select('id, customer_id, provider_id, pickup_address, delivery_address')
    .eq('status', 'scheduled')
    .lt('scheduled_pickup_time', now);

  for (const order of scheduledOrders || []) {
    await supabaseAdmin
      .from('orders')
      .update({
        status: 'accepted',
        updated_at: now,
      })
      .eq('id', order.id)
      .eq('status', 'scheduled');

    await createNotification(
      order.provider_id,
      'order_reminder',
      'Đến giờ thực hiện chuyến',
      `Chuyến ${order.pickup_address || ''} → ${order.delivery_address || ''} bắt đầu hôm nay. Hãy đến lấy hàng!`,
      { priority: 'high', actionData: { order_id: order.id } },
    ).catch(() => {});

    await createNotification(
      order.customer_id,
      'order_reminder',
      'Nhà xe đang trên đường đến',
      'Chuyến của bạn bắt đầu hôm nay. Nhà xe sẽ liên hệ sớm.',
      { priority: 'high', actionData: { order_id: order.id } },
    ).catch(() => {});

    console.log(`[OrderTimeout] Activated scheduled order ${order.id}`);
  }

  // ── 4. Nhắc provider T-30: còn 28–32 phút đến giờ hẹn, chưa bắt đầu ──────
  const window30Start = new Date(Date.now() + 28 * 60 * 1000).toISOString();
  const window30End   = new Date(Date.now() + 32 * 60 * 1000).toISOString();

  const { data: prePickupOrders } = await supabaseAdmin
    .from('orders')
    .select('id, provider_id, customer_id, pickup_address, delivery_address, scheduled_pickup_time')
    .eq('status', 'accepted')
    .gte('scheduled_pickup_time', window30Start)
    .lte('scheduled_pickup_time', window30End);

  for (const order of prePickupOrders || []) {
    // Tránh gửi lại nếu đã nhắc trong lần chạy job trước
    const { data: existing } = await supabaseAdmin
      .from('notifications')
      .select('id')
      .eq('user_id', order.provider_id)
      .eq('type', 'pickup_reminder_30')
      .contains('action_data', { order_id: order.id })
      .maybeSingle();

    if (existing) continue;

    const pickupStr = new Date(order.scheduled_pickup_time)
      .toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });

    await createNotification(
      order.provider_id,
      'pickup_reminder_30',
      '⏰ Còn 30 phút đến giờ chuyến!',
      `Chuyến ${order.pickup_address || ''} → ${order.delivery_address || ''} bắt đầu lúc ${pickupStr}. Hãy lên đường ngay!`,
      { priority: 'high', actionData: { order_id: order.id } },
    ).catch(() => {});

    console.log(`[OrderTimeout] Sent T-30 reminder for order ${order.id}`);
  }
}

function startOrderTimeoutJob() {
  // Chạy mỗi 2 phút (giờ HCM)
  cron.schedule('*/2 * * * *', async () => {
    try {
      await runOrderTimeoutJob();
    } catch (err) {
      console.error('[OrderTimeout] Job error:', err.message);
    }
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  console.log('[OrderTimeout] Job started — runs every 2 minutes');
}

module.exports = { startOrderTimeoutJob, runOrderTimeoutJob };
