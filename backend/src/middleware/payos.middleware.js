const payosService = require('../services/payos.service');

/**
 * PayOS v2 webhook — chữ ký nằm trong body.signature,
 * được tính từ object `data` (không phải x-payos-signature header).
 */
function verifyPayOSSignature(req, res, next) {
  try {
    const result = payosService.verifyWebhookSignature(req.body);

    if (!result.valid) {
      console.warn('[PayOS] Webhook signature failed:', result.reason);
      return res.status(401).json({
        success: false,
        message: 'Invalid PayOS signature',
        code: result.reason || 'invalid_signature',
      });
    }

    req.payosVerified = true;
    next();
  } catch (error) {
    console.error('PayOS signature verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Signature verification error',
      code: 'verification_error',
    });
  }
}

module.exports = { verifyPayOSSignature };
