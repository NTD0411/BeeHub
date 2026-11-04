const express = require('express');
const authRoutes = require('./auth.routes');
const customerRoutes = require('./customers.routes');
const providerRoutes = require('./providers.routes');
const providerAdminRoutes = require('./provider-admin.routes');
const orderRoutes = require('./orders.routes');
const sharedMoveRoutes = require('./shared-move.routes');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, service: 'unimove-api' });
});

router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/providers', providerRoutes);
router.use('/admin', providerAdminRoutes);
router.use('/orders', orderRoutes);
router.use('/shared-move', sharedMoveRoutes);

module.exports = router;
