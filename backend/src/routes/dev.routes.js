const express = require('express');
const { supabaseAdmin } = require('../services/supabase.service');
const { httpError } = require('../services/auth.helpers');
const { applyOrderAfterDepositPaid } = require('../services/payments.service');
const { runOrderTimeoutJob } = require('../jobs/orderTimeout.job');
const env = require('../config/env');

const router = express.Router();

// Guard: block rõ ràng nếu production
router.use((_req, res, next) => {
  if (env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: 'Forbidden in production' });
  }
  next();
});

/**
 * POST /api/dev/payments/simulate
 * Giả lập thanh toán thành công — chỉ dùng khi test
 * Body: { payment_code } hoặc { order_id }
 */
router.post('/payments/simulate', async (req, res) => {
  try {
    const { payment_code, order_id } = req.body || {};

    if (!payment_code && !order_id) {
      return res.status(400).json({ success: false, message: 'Thiếu payment_code hoặc order_id' });
    }

    // Tìm payment
    let query = supabaseAdmin
      .from('payments')
      .select('id, order_id, customer_id, amount, status, payment_code')
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (payment_code) {
      query = query.eq('payment_code', payment_code);
    } else {
      query = query.eq('order_id', order_id);
    }

    const { data: payment, error: fetchError } = await query.maybeSingle();
    if (fetchError) throw httpError(500, fetchError.message, 'db_error');
    if (!payment) return res.status(404).json({ success: false, message: 'Không tìm thấy payment pending' });

    // Mark payment completed
    const { error: payError } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'completed',
        escrow_status: 'held',
        paid_at: new Date().toISOString(),
      })
      .eq('id', payment.id);

    if (payError) throw httpError(500, payError.message, 'db_error');

    // Dùng applyOrderAfterDepositPaid để xử lý đầy đủ:
    // - deposit_paid = true
    // - status → accepted/scheduled
    // - lock_expires_at = null
    // - slot_locked_until = pickup_time + 30 phút
    // - cancel đơn matched trùng giờ (first deposit wins)
    const result = await applyOrderAfterDepositPaid(payment.id);

    res.json({
      success: true,
      message: 'Giả lập thanh toán thành công',
      data: {
        payment_code: payment.payment_code,
        order_id: payment.order_id,
        applied: result.applied,
        repaired: result.repaired,
      },
    });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/dev/jobs/run-timeout
 * Trigger thủ công background job xử lý timeout/scheduled → accepted
 */
router.post('/jobs/run-timeout', async (req, res) => {
  try {
    await runOrderTimeoutJob();
    res.json({ success: true, message: 'Job chạy xong' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PATCH /api/dev/orders/:id/set-pickup-now
 * Đặt scheduled_pickup_time = now + minutes (mặc định 1 phút) để test background job
 */
router.patch('/orders/:id/set-pickup-now', async (req, res) => {
  try {
    const { id } = req.params;
    const minutes = Number(req.body?.minutes ?? 1);
    const newPickup = new Date(Date.now() + minutes * 60 * 1000).toISOString();

    const { error } = await supabaseAdmin
      .from('orders')
      .update({
        scheduled_pickup_time: newPickup,
        slot_locked_until: new Date(Date.now() + (minutes + 30) * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw httpError(500, error.message, 'db_error');
    res.json({ success: true, message: `Đã set pickup = now + ${minutes} phút`, pickup_time: newPickup });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

module.exports = router;
