const fs = require('fs');
const path = require('path');
const express = require('express');
const authRoutes = require('./auth.routes');
const customersRoutes = require('./customers.routes');
const ordersRoutes = require('./orders.routes');
const paymentsRoutes = require('./payments.routes');
const webhooksRoutes = require('./webhooks.routes');
const adminRoutes = require('./admin.routes');
const notificationRoutes = require('./notification.routes');
const conversationsRoutes = require('./conversations.routes');
const chatRoutes = require('./chat.routes');
const mapsRoutes = require('./maps.routes');
const reviewsRoutes = require('./reviews.routes');
const devRoutes = require('./dev.routes');
const disputesRoutes = require('./disputes.routes');

const providersRoutes = fs.existsSync(path.join(__dirname, 'providers.routes.js'))
  ? require('./providers.routes')
  : null;
const marketplaceRoutes = fs.existsSync(path.join(__dirname, 'marketplace.routes.js'))
  ? require('./marketplace.routes')
  : null;

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    service: 'UniMove Node.js API',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/customers', customersRoutes);
router.use('/orders', ordersRoutes);
if (providersRoutes) {
  router.use('/providers', providersRoutes);
}
router.use('/payments', paymentsRoutes);
router.use('/webhooks', webhooksRoutes);
router.use('/admin', adminRoutes);
if (marketplaceRoutes) {
  router.use('/marketplace', marketplaceRoutes);
}
router.use('/notifications', notificationRoutes);
router.use('/conversations', conversationsRoutes);
router.use('/chat', chatRoutes);
router.use('/maps', mapsRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/disputes', disputesRoutes);
router.use('/dev', devRoutes);

module.exports = router;
