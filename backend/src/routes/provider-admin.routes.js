const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const providersController = require('../controllers/providers.controller');

const router = express.Router();

router.post('/auth/login', providersController.adminLogin);
router.use(requireAuth, requireRole('admin'));
router.get('/providers/pending', providersController.getPendingProviders);
router.get('/providers/:id/documents', providersController.getProviderDocuments);
router.put('/providers/:id/verify', providersController.reviewProvider);
router.patch('/providers/:id/verify', providersController.reviewProvider);

module.exports = router;
