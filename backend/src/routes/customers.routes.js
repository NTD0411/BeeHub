/**
 * Customer profile API — /api/customers (BE-008 → BE-010).
 */
const express = require('express');
const customersController = require('../controllers/customers.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { handleAvatarUpload } = require('../middleware/upload.middleware');

const router = express.Router();

router.get('/me', requireAuth, requireRole('customer'), customersController.getMe);
router.get('/me/recent-places', requireAuth, requireRole('customer'), customersController.getRecentPlaces);
router.post('/me/recent-places', requireAuth, requireRole('customer'), customersController.addRecentPlace);
router.get('/me/booking-locations', requireAuth, requireRole('customer'), customersController.getBookingLocations);
router.delete('/me/recent-places', requireAuth, requireRole('customer'), customersController.clearRecentPlaces);
router.patch('/me', requireAuth, requireRole('customer'), customersController.patchMe);
router.post(
  '/me/avatar',
  requireAuth,
  requireRole('customer'),
  handleAvatarUpload,
  customersController.uploadAvatar,
);

module.exports = router;
