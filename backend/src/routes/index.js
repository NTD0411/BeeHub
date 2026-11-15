const express = require('express');
const authRoutes = require('./auth.routes');
const customersRoutes = require('./customers.routes');
const ordersRoutes = require('./orders.routes');
const providersRoutes = require('./providers.routes');
const paymentsRoutes = require('./payments.routes');
const webhooksRoutes = require('./webhooks.routes');
const adminRoutes = require('./admin.routes');
const marketplaceRoutes = require('./marketplace.routes');
const notificationRoutes = require('./notification.routes');
const conversationsRoutes = require('./conversations.routes');
const chatRoutes = require('./chat.routes');
const mapsRoutes = require('./maps.routes');
const reviewsRoutes = require('./reviews.routes');
const devRoutes = require('./dev.routes');
const disputesRoutes = require('./disputes.routes');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    service: 'BeeHub Node.js API',
    timestamp: new Date().toISOString(),
  });
});

router.get('/settings/public', async (_req, res) => {
  try {
    const { supabaseAdmin } = require('../services/supabase.service');
    const { data } = await supabaseAdmin
      .from('platform_settings')
      .select('key, value')
      .in('key', ['insurance_enabled', 'deposit_rate', 'beehub_support_enabled']);
    const map = {};
    (data || []).forEach((r) => {
      map[r.key] = r.value;
    });
    const rawIns = map.insurance_enabled;
    const insuranceEnabled =
      rawIns === undefined || rawIns === null
        ? true
        : rawIns === true || rawIns === 'true' || rawIns === 1 || rawIns === '1';

    const rawSupport = map.beehub_support_enabled;
    const beehubSupportEnabled =
      rawSupport === undefined || rawSupport === null
        ? true
        : rawSupport === true || rawSupport === 'true' || rawSupport === 1 || rawSupport === '1';

    res.json({
      success: true,
      data: {
        insurance_enabled: insuranceEnabled,
        beehub_support_enabled: beehubSupportEnabled,
        deposit_rate: map.deposit_rate !== undefined ? Number(map.deposit_rate) : 0.3,
      },
    });
  } catch (_err) {
    res.json({
      success: true,
      data: { insurance_enabled: true, beehub_support_enabled: true, deposit_rate: 0.3 },
    });
  }
});

router.use('/auth', authRoutes);
router.use('/customers', customersRoutes);
router.use('/orders', ordersRoutes);
router.use('/providers', providersRoutes);
router.use('/payments', paymentsRoutes);
router.use('/webhooks', webhooksRoutes);
router.use('/admin', adminRoutes);
router.use('/marketplace', marketplaceRoutes);
router.use('/notifications', notificationRoutes);
router.use('/conversations', conversationsRoutes);
router.use('/chat', chatRoutes);
router.use('/maps', mapsRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/disputes', disputesRoutes);
router.use('/dev', devRoutes);

module.exports = router;
