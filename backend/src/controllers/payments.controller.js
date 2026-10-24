const { supabaseAdmin } = require('../services/supabase.service');
const paymentsService = require('../services/payments.service');
const payosService = require('../services/payos.service');
const env = require('../config/env');
const { httpError } = require('../services/auth.helpers');

/** BE-034: GET /api/customers/me/wallet */
async function getWallet(req, res, next) {
  try {
    const data = await paymentsService.getWalletBalance(req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** BE-036: GET /api/customers/me/payment-methods */
async function getPaymentMethods(req, res, next) {
  try {
    const data = await paymentsService.getPaymentMethods(req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** BE-036: POST /api/customers/me/payment-methods */
async function addPaymentMethod(req, res, next) {
  try {
    const data = await paymentsService.addPaymentMethod(req.user.id, req.body || {});
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** BE-036: PATCH /api/customers/me/payment-methods/:id */
async function updatePaymentMethod(req, res, next) {
  try {
    const { id } = req.params;
    if (!id) {
      return next(httpError(400, 'Thiếu payment method ID', 'missing_id'));
    }
    const data = await paymentsService.updatePaymentMethod(req.user.id, id, req.body || {});
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** BE-036: DELETE /api/customers/me/payment-methods/:id */
async function deletePaymentMethod(req, res, next) {
  try {
    const { id } = req.params;
    if (!id) {
      return next(httpError(400, 'Thiếu payment method ID', 'missing_id'));
    }
    await paymentsService.deletePaymentMethod(req.user.id, id);
    res.json({ success: true, message: 'Đã xóa phương thức thanh toán' });
  } catch (error) {
    next(error);
  }
}

/** BE-035 — GET /api/payments — Lịch sử giao dịch */
async function getPayments(req, res, next) {
  try {
    const { items, pagination } = await paymentsService.getPaymentHistory(
      req.user.id,
      req.query,
    );
    res.json({ success: true, data: items, pagination });
  } catch (error) {
    next(error);
  }
}

/** BE-035 — GET /api/payments/:id — Chi tiết giao dịch (auto-sync PayOS qua service) */
async function getPayment(req, res, next) {
  try {
    const { id } = req.params;
    if (!id) {
      return next(httpError(400, 'Thiếu payment ID', 'missing_id'));
    }
    const data = await paymentsService.getPaymentDetail(req.user.id, id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** BE-032: POST /api/customers/me/payments/deposit — Tạo deposit payment với PayOS QR code */
async function createDeposit(req, res, next) {
  try {
    const { order_id, amount, payment_method = 'payos', customer_name, customer_email } = req.body;

    if (!order_id || !amount) {
      return next(httpError(400, 'Thiếu order_id hoặc amount', 'validation_error'));
    }

    if (amount <= 0) {
      return next(httpError(400, 'Số tiền phải lớn hơn 0', 'invalid_amount'));
    }

    if (payment_method !== 'payos') {
      return next(httpError(400, 'Hiện chỉ hỗ trợ thanh toán PayOS', 'unsupported_payment_method'));
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, customer_id, service_type')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return next(httpError(404, 'Không tìm thấy đơn hàng', 'order_not_found'));
    }

    if (order.customer_id !== req.user.id) {
      return next(httpError(403, 'Không có quyền truy cập đơn hàng này', 'access_denied'));
    }

    const paymentCode = payosService.generatePaymentCode();
    const orderCode = payosService.generateOrderCode();

    const { data: paymentRecord, error: insertError } = await supabaseAdmin
      .from('payments')
      .insert({
        payment_code: paymentCode,
        order_id,
        customer_id: req.user.id,
        amount,
        currency: 'VND',
        payment_method,
        status: 'pending',
        escrow_status: 'pending',
        payment_purpose: 'deposit',
        description: `Deposit cho đơn chuyển trọ #${order_id.substring(0, 8)}`,
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('Payment insert error:', insertError);
      return next(httpError(500, 'Lỗi tạo payment record', 'db_error'));
    }

    const payosReturnUrl = `${env.API_URL}/api/payments/payos/return?payment_code=${encodeURIComponent(paymentCode)}`;
    const payosCancelUrl = `${env.API_URL}/api/payments/payos/cancel?payment_code=${encodeURIComponent(paymentCode)}`;

    const payosPayload = {
      paymentCode,
      amount: Math.round(amount),
      orderCode: parseInt(orderCode, 10),
      description: paymentCode,
      returnUrl: payosReturnUrl,
      cancelUrl: payosCancelUrl,
      customerName: customer_name || req.user.name || 'Customer',
      customerEmail: customer_email || req.user.email || 'noreply@unimove.com',
    };

    const payosResponse = await payosService.createPaymentLink(payosPayload);

    const { error: updateError } = await supabaseAdmin
      .from('payments')
      .update({
        payos_order_id: payosResponse.orderCode.toString(),
        payos_transaction_id: payosResponse.payosOrderId || null,
        payos_payment_url: payosResponse.checkoutUrl,
        payos_qr_code: payosResponse.qrCode,
        expires_at: payosResponse.expiresAt.toISOString(),
      })
      .eq('id', paymentRecord.id);

    if (updateError) {
      console.error('Payment update error:', updateError);
      return next(httpError(500, 'Lỗi cập nhật payment details', 'db_error'));
    }

    res.status(201).json({
      success: true,
      data: {
        payment_id: paymentRecord.id,
        payment_code: paymentCode,
        order_id,
        amount,
        currency: 'VND',
        status: 'pending',
        checkout_url: payosResponse.checkoutUrl,
        qr_code: payosResponse.qrCode,
        qr_code_data_url: payosResponse.qrCode,
        bank_account_number: payosResponse.accountNumber,
        bank_account_name: payosResponse.accountName,
        expires_at: payosResponse.expiresAt,
        created_at: new Date().toISOString(),
      },
      message: 'Tạo link thanh toán thành công. Quét mã QR để thanh toán.',
    });
  } catch (error) {
    next(error);
  }
}

/** POST /api/payments/:id/sync — đồng bộ thủ công (dự phòng, thường không cần) */
async function syncPayment(req, res, next) {
  try {
    const data = await paymentsService.syncPaymentStatus(req.user.id, req.params.id);
    res.json({ success: true, message: data.message, data });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/payments/payos/return — PayOS redirect sau thanh toán
 * Tự sync từ PayOS rồi chuyển về màn hình app (local & production)
 */
async function payosReturn(req, res) {
  const paymentCode = req.query.payment_code;

  try {
    const data = await paymentsService.syncPaymentByCode(paymentCode);
    const status = data.payment?.status || 'pending';

    if (req.query.format === 'json') {
      return res.json({ success: true, message: data.message, data });
    }

    const redirectUrl = new URL('/payment-success', env.APP_URL);
    redirectUrl.searchParams.set('payment_code', paymentCode);
    redirectUrl.searchParams.set('status', status);
    if (data.payment?.order_id) {
      redirectUrl.searchParams.set('order_id', data.payment.order_id);
    }
    return res.redirect(302, redirectUrl.toString());
  } catch (error) {
    console.error('[PayOS] Return callback error:', error.message);

    if (req.query.format === 'json') {
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Lỗi xác nhận thanh toán',
      });
    }

    const redirectUrl = new URL('/payment-success', env.APP_URL);
    redirectUrl.searchParams.set('payment_code', paymentCode || '');
    redirectUrl.searchParams.set('status', 'pending');
    return res.redirect(302, redirectUrl.toString());
  }
}

/** GET /api/payments/payos/cancel — PayOS redirect khi khách hủy thanh toán */
async function payosCancel(req, res) {
  const paymentCode = req.query.payment_code || '';

  if (req.query.format === 'json') {
    return res.json({
      success: true,
      message: 'Đã hủy thanh toán',
      data: { payment_code: paymentCode, status: 'cancelled' },
    });
  }

  const redirectUrl = new URL('/payment-cancel', env.APP_URL);
  redirectUrl.searchParams.set('payment_code', paymentCode);
  return res.redirect(302, redirectUrl.toString());
}

/** BE-029: Webhook PayOS v2 — xác nhận thanh toán */
async function payosWebhook(req, res) {
  try {
    const result = await paymentsService.processPayOSWebhook(req.body);

    if (!result.found) {
      console.warn('[PayOS] Webhook: payment not found', {
        orderCode: result.orderCode,
        description: result.paymentCode,
      });
      return res.json({
        success: true,
        message: 'Webhook acknowledged (payment not found)',
      });
    }

    if (result.alreadyProcessed) {
      return res.json({
        success: true,
        message: 'Webhook acknowledged (payment already processed)',
      });
    }

    console.log('[PayOS] Webhook processed:', {
      paymentCode: result.paymentCode,
      status: result.newStatus,
    });

    res.json({
      success: true,
      message: 'Webhook processed successfully',
      data: {
        paymentCode: result.paymentCode,
        newStatus: result.newStatus,
      },
    });
  } catch (error) {
    console.error('PayOS webhook error:', error);
    res.json({
      success: false,
      message: error.message || 'Webhook processing error',
    });
  }
}

/** BE-032 — POST /api/payments/refund */
async function createRefund(req, res, next) {
  try {
    const data = await paymentsService.createRefund(req.user.id, req.body || {});
    res.status(201).json({
      success: true,
      message: data.message || 'Yêu cầu hoàn tiền đã gửi, chờ admin duyệt',
      data,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getWallet,
  getPaymentMethods,
  addPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  getPayments,
  getPayment,
  createDeposit,
  syncPayment,
  payosReturn,
  payosCancel,
  createRefund,
  payosWebhook,
};
