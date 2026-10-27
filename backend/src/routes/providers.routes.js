/**
 * providers.routes.js — Routes cho Provider API.
 *
 * Mount tại /api/providers (xem routes/index.js).
 */
const express = require('express');
const providersController = require('../controllers/providers.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { handleProviderDocsUpload } = require('../middleware/upload.middleware');

const router = express.Router();

router.get('/browse', providersController.browse);

// /me routes must be before /:id to avoid Express matching "me" as an id
router.get('/me', requireAuth, requireRole('provider'), providersController.getMe);
router.get('/me/documents', requireAuth, requireRole('provider'), providersController.getMyDocuments);
router.post(
  '/me/documents',
  requireAuth,
  requireRole('provider'),
  handleProviderDocsUpload,
  providersController.uploadDocuments,
);

router.post(
  '/me/request-verification',
  requireAuth,
  requireRole('provider'),
  providersController.requestVerification,
);

router.get('/me/dashboard', requireAuth, requireRole('provider'), providersController.getDashboard);
router.get('/me/earnings', requireAuth, requireRole('provider'), providersController.getEarnings);
router.get('/me/schedule', requireAuth, requireRole('provider'), providersController.getSchedule);
router.patch('/me/schedule', requireAuth, requireRole('provider'), providersController.updateSchedule);
router.get('/me/quoted-orders', requireAuth, requireRole('provider'), providersController.getQuotedOrders);

// Public provider profile route must be registered after the /me routes.
router.get('/:id', providersController.getById);

module.exports = router;
