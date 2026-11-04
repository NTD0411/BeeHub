const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const ordersController = require('../controllers/orders.controller');

const router = express.Router();

router.use(requireAuth);
router.get('/', ordersController.list);
router.post('/', requireRole('customer'), ordersController.create);
router.post('/:id/respond', requireRole('provider'), ordersController.respond);
router.get('/:id', ordersController.get);

module.exports = router;
