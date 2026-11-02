const crypto = require('crypto');
const fetch = require('node-fetch');
const env = require('../config/env');
const { httpError } = require('./auth.helpers');

const PAYOS_API_URL = env.PAYOS_API_URL;
const PAYOS_CHECKSUM_KEY = env.PAYOS_CHECKSUM_KEY;
const PAYOS_CLIENT_ID = env.PAYOS_CLIENT_ID;
const PAYOS_API_KEY = env.PAYOS_API_KEY;
const APP_URL = env.APP_URL;

function payosHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-client-id': PAYOS_CLIENT_ID,
    'x-api-key': PAYOS_API_KEY,
  };
}

function assertPayOSConfig() {
  if (!PAYOS_CLIENT_ID || !PAYOS_API_KEY || !PAYOS_CHECKSUM_KEY) {
    throw httpError(
      500,
      'PayOS chưa được cấu hình (PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY)',
      'payos_config_error',
    );
  }
}

/**
 * PayOS API v2 signature
 * amount=$amount&cancelUrl=$cancelUrl&description=$description&orderCode=$orderCode&returnUrl=$returnUrl
 */
function generateSignature({ orderCode, amount, description, returnUrl, cancelUrl }) {
  const dataStr = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
  return crypto.createHmac('sha256', PAYOS_CHECKSUM_KEY).update(dataStr).digest('hex');
}

function sortObjByKey(object) {
  return Object.keys(object)
    .sort()
    .reduce((acc, key) => {
      acc[key] = object[key];
      return acc;
    }, {});
}

/** PayOS v2 — ký/verify webhook từ object `data` (không phải raw body) */
function createSignatureFromObj(data) {
  if (!data || !PAYOS_CHECKSUM_KEY) return null;

  const sorted = sortObjByKey(data);
  const queryStr = Object.keys(sorted)
    .filter((key) => sorted[key] !== undefined)
    .map((key) => {
      let value = sorted[key];
      if (value && Array.isArray(value)) {
        value = JSON.stringify(value.map((item) => sortObjByKey(item)));
      }
      if (value === null || value === undefined || value === 'null' || value === 'undefined') {
        value = '';
      }
      return `${key}=${value}`;
    })
    .join('&');

  return crypto.createHmac('sha256', PAYOS_CHECKSUM_KEY).update(queryStr).digest('hex');
}

function verifyWebhookSignature(body) {
  const { data, signature } = body || {};
  if (!data || !signature) {
    return { valid: false, reason: 'missing_signature_or_data' };
  }

  const expected = createSignatureFromObj(data);
  if (!expected) {
    return { valid: false, reason: 'config_error' };
  }

  try {
    const valid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected),
    );
    return { valid, reason: valid ? null : 'invalid_signature' };
  } catch {
    return { valid: false, reason: 'invalid_signature' };
  }
}

/** Map PayOS payment link / webhook data → DB status */
function mapPayOSStatus(payosData, expectedAmount) {
  const status = String(payosData?.status || '').toUpperCase();
  const amountPaid = Number(payosData?.amountPaid ?? payosData?.amount ?? 0);
  const expected = Number(expectedAmount);

  if (status === 'PAID' || (amountPaid > 0 && amountPaid >= expected)) {
    return { dbStatus: 'completed', amountPaid, failureReason: null };
  }
  if (status === 'CANCELLED') {
    return { dbStatus: 'cancelled', amountPaid, failureReason: 'Customer cancelled payment' };
  }
  if (status === 'EXPIRED') {
    return { dbStatus: 'failed', amountPaid, failureReason: 'Payment link expired' };
  }
  return { dbStatus: 'pending', amountPaid, failureReason: null };
}

/** Webhook PayOS v2 — thanh toán thành công khi success=true & code=00 */
function isWebhookPaymentSuccess(body) {
  const topOk = body?.success === true && String(body?.code) === '00';
  const dataOk = String(body?.data?.code) === '00';
  return topOk || dataOk;
}

/**
 * Create a payment link on PayOS v2
 * Returns: { checkoutUrl, qrCode, orderCode, payosOrderId }
 */
async function createPaymentLink(paymentData) {
  try {
    assertPayOSConfig();

    const {
      paymentCode,
      amount,
      orderCode,
      description,
      returnUrl,
      cancelUrl,
      customerEmail,
      customerName,
    } = paymentData;

    if (!amount || !orderCode) {
      throw httpError(400, 'Thiếu amount hoặc orderCode', 'validation_error');
    }

    const numericAmount = parseInt(amount, 10);
    const numericOrderCode = parseInt(orderCode, 10);
    const paymentDescription = description || 'Thanh toan UniMove';
    const successUrl = returnUrl || `${APP_URL}/payment-success`;
    const failUrl = cancelUrl || `${APP_URL}/payment-cancel`;

    const signature = generateSignature({
      orderCode: numericOrderCode,
      amount: numericAmount,
      description: paymentDescription,
      returnUrl: successUrl,
      cancelUrl: failUrl,
    });

    const requestBody = {
      orderCode: numericOrderCode,
      amount: numericAmount,
      description: paymentDescription,
      buyerName: customerName || 'Customer',
      buyerEmail: customerEmail || 'noreply@unimove.com',
      returnUrl: successUrl,
      cancelUrl: failUrl,
      signature,
    };

    console.log('[PayOS] Creating payment link:', {
      orderCode: numericOrderCode,
      amount: numericAmount,
      paymentCode,
      apiUrl: PAYOS_API_URL,
    });

    const response = await fetch(`${PAYOS_API_URL}/payment-requests`, {
      method: 'POST',
      headers: payosHeaders(),
      body: JSON.stringify(requestBody),
    });

    const payosResponse = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('[PayOS] API Error:', payosResponse);
      throw httpError(
        response.status,
        `PayOS error: ${payosResponse.desc || payosResponse.message || 'Unknown error'}`,
        'payos_api_error',
      );
    }

    if (payosResponse.code !== '00') {
      console.error('[PayOS] Response code not 00:', payosResponse);
      throw httpError(
        400,
        `PayOS returned error: ${payosResponse.desc}`,
        'payos_error',
      );
    }

    const { data } = payosResponse;

    console.log('[PayOS] Payment link created successfully:', {
      orderCode: data.orderCode,
      paymentLinkId: data.paymentLinkId,
      checkoutUrl: data.checkoutUrl,
    });

    return {
      success: true,
      paymentCode,
      orderCode: data.orderCode,
      payosOrderId: data.paymentLinkId,
      checkoutUrl: data.checkoutUrl,
      qrCode: data.qrCode,
      accountNumber: data.accountNumber,
      accountName: data.accountName,
      expiresAt: new Date(Date.now() + 3600000),
    };
  } catch (error) {
    console.error('[PayOS Service Error]:', error.message);
    if (error.status) throw error;
    if (error.code === 'ENOTFOUND') {
      throw httpError(
        502,
        `Không kết nối được PayOS API (${PAYOS_API_URL}). Kiểm tra PAYOS_API_URL trong .env`,
        'payos_network_error',
      );
    }
    throw httpError(500, 'Lỗi tạo link thanh toán', 'payos_service_error');
  }
}

/** PayOS orderCode: unique integer (giây + random 4 chữ số) */
function generateOrderCode() {
  const seconds = Math.floor(Date.now() / 1000);
  const random = Math.floor(Math.random() * 10000);
  return String(seconds * 10000 + random);
}

/** Format: PAY-YYYYMMDD-XXXX */
function generatePaymentCode() {
  const now = new Date();
  const date = now.toISOString().split('T')[0].replace(/-/g, '');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `PAY-${date}-${random}`;
}

async function getPaymentStatus(paymentLinkId) {
  try {
    assertPayOSConfig();

    const response = await fetch(`${PAYOS_API_URL}/payment-requests/${paymentLinkId}`, {
      method: 'GET',
      headers: payosHeaders(),
    });

    const payosResponse = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw httpError(response.status, 'Không thể lấy trạng thái thanh toán', 'payos_get_status_error');
    }

    if (payosResponse.code !== '00') {
      throw httpError(400, `PayOS error: ${payosResponse.desc}`, 'payos_error');
    }

    return payosResponse.data;
  } catch (error) {
    if (error.status) throw error;
    throw httpError(500, 'Lỗi khi kiểm tra trạng thái thanh toán', 'payos_status_error');
  }
}

async function cancelPaymentRequest(paymentLinkId) {
  try {
    assertPayOSConfig();

    const response = await fetch(`${PAYOS_API_URL}/payment-requests/${paymentLinkId}/cancel`, {
      method: 'POST',
      headers: payosHeaders(),
      body: JSON.stringify({ cancellationReason: 'Cancelled by merchant' }),
    });

    const payosResponse = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw httpError(response.status, 'Không thể hủy thanh toán', 'payos_cancel_error');
    }

    if (payosResponse.code !== '00') {
      throw httpError(400, `PayOS error: ${payosResponse.desc}`, 'payos_error');
    }

    return payosResponse.data;
  } catch (error) {
    if (error.status) throw error;
    throw httpError(500, 'Lỗi khi hủy thanh toán', 'payos_cancel_error');
  }
}

module.exports = {
  createPaymentLink,
  generateOrderCode,
  generatePaymentCode,
  getPaymentStatus,
  cancelPaymentRequest,
  generateSignature,
  createSignatureFromObj,
  verifyWebhookSignature,
  mapPayOSStatus,
  isWebhookPaymentSuccess,
};
