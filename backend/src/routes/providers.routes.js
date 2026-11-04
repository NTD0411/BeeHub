const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { handleProviderDocumentsUpload } = require('../middleware/provider-documents.middleware');
const providersController = require('../controllers/providers.controller');

const router = express.Router();

router.use(requireAuth, requireRole('provider'));
router.get('/me/documents', providersController.getDocuments);
router.post('/me/documents', handleProviderDocumentsUpload, providersController.uploadDocuments);
router.get('/me/verification', providersController.getVerification);
router.post('/me/request-verification', providersController.requestVerification);
router.get('/me/dashboard', providersController.getDashboard);
router.patch('/me/availability', providersController.setAvailability);

module.exports = router;
