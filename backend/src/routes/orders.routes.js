const express = require('express');
const ordersController = require('../controllers/orders.controller');
const orderQuotesController = require('../controllers/order_quotes.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { handleDeliveryPhotoUpload } = require('../middleware/upload.middleware');

const router = express.Router();

router.get('/', requireAuth, ordersController.listOrders);
router.get('/my-schedule', requireAuth, requireRole('provider'), ordersController.getProviderSchedule);
router.post('/', requireAuth, requireRole('customer'), ordersController.createOrder);
router.post('/:id/cancel-timeout', requireAuth, requireRole('customer'), ordersController.cancelByCustomerTimeout);
router.get('/:id/cancel-estimate', requireAuth, requireRole('customer'), ordersController.cancelEstimate);
router.get('/:id', requireAuth, ordersController.getOrder);
router.get('/:id/quotes', requireAuth, orderQuotesController.listQuotes);
router.post(
  '/:id/quotes',
  requireAuth,
  requireRole('provider'),
  orderQuotesController.submitQuote,
);
router.post(
  '/:id/quotes/:quoteId/select',
  requireAuth,
  requireRole('customer'),
  orderQuotesController.selectQuote,
);
router.post(
  '/:id/respond',
  requireAuth,
  requireRole('provider'),
  ordersController.respondToOrder,
);

router.patch('/:id/accept', requireAuth, requireRole('provider'), ordersController.acceptOrder);
router.patch('/:id/start', requireAuth, requireRole('provider'), ordersController.startOrder);
router.patch('/:id/skip', requireAuth, requireRole('provider'), ordersController.skipOrder);
router.patch('/:id/decline', requireAuth, requireRole('provider'), ordersController.declineOrder);
router.patch('/:id/complete', requireAuth, requireRole('provider'), ordersController.completeOrder);
router.patch('/:id/cancel', requireAuth, ordersController.cancelOrder);
router.post('/:id/delivery-photo', requireAuth, requireRole('provider'), handleDeliveryPhotoUpload, ordersController.uploadDeliveryPhoto);

module.exports = router;
