/**
 * routes/index.js — Aggregator cho toàn bộ API routes.
 * Mount tại /api (xem app.js).
 *
 * | Prefix             | Module              |
 * |--------------------|---------------------|
 * | /auth              | auth.routes.js      |
 * | /customers         | customers.routes.js |
 * | /providers         | providers.routes.js |
 * | /admin             | admin.routes.js     |
 */
const express = require('express');

const authRoutes = require('./auth.routes');
const customersRoutes = require('./customers.routes');
const providersRoutes = require('./providers.routes');
const ordersRoutes = require('./orders.routes');
const paymentsRoutes = require('./payments.routes');
const webhooksRoutes = require('./webhooks.routes');
const notificationRoutes = require('./notification.routes');
const adminRoutes = require('./admin.routes');

const router = express.Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
router.use('/auth', authRoutes);
router.use('/customers', customersRoutes);
router.use('/providers', providersRoutes);
router.use('/orders', ordersRoutes);
router.use('/payments', paymentsRoutes);
router.use('/webhooks', webhooksRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
