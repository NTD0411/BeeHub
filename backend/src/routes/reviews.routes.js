const express = require('express');
const reviewsController = require('../controllers/reviews.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/orders/:orderId', requireAuth, requireRole('customer'), reviewsController.submitReview);
router.get('/mine', requireAuth, requireRole('provider'), reviewsController.getMyReviews);
router.patch('/:id/respond', requireAuth, requireRole('provider'), reviewsController.respondToReview);

module.exports = router;
