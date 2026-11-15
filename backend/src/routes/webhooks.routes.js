const express = require('express');
const paymentsController = require('../controllers/payments.controller');
const { verifyPayOSSignature } = require('../middleware/payos.middleware');

const router = express.Router();

/**
 * POST /api/webhooks/payos
 * PayOS webhook for payment confirmation
 * Signature verification required (x-payos-signature header)
 */
router.post(
  '/payos',
  verifyPayOSSignature,
  paymentsController.payosWebhook
);

module.exports = router;
