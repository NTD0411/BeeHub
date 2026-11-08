const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { handleAvatarUpload } = require('../middleware/upload.middleware');
const adminController = require('../controllers/admin.controller');
const databaseBrowserController = require('../controllers/database-browser.controller');

const router = express.Router();

// Auth routes (không cần middleware)
router.post('/auth/login', adminController.login);

// Protected admin routes (Node JWT + admin role)
router.use(requireAuth);
router.use(requireRole('admin'));

// Read-only database browser
router.get('/data/tables', databaseBrowserController.getTables);
router.get('/data/tables/:table/schema', databaseBrowserController.getTableSchema);
router.get('/data/tables/:table/rows', databaseBrowserController.getTableRows);

// Dashboard
router.get('/auth/profile', adminController.getProfile);
router.patch('/auth/profile', adminController.updateProfile);
router.post('/auth/avatar', handleAvatarUpload, adminController.uploadAvatar);
router.get('/dashboard', adminController.getDashboard);
router.get('/dashboard/stats', adminController.getDashboardStats);

// Dashboard extras
router.get('/dashboard/latest-orders', adminController.getLatestOrders);
router.get('/dashboard/order-status-distribution', adminController.getOrderStatusDistribution);

// Provider Management
router.get('/providers/pending', adminController.getPendingProviders);
router.get('/providers/:id/documents', adminController.getProviderDocuments);
router.put('/providers/:id/verify', adminController.verifyProvider);

// Provider Earnings & Withdrawals
router.get('/provider-earnings', adminController.getProviderEarnings);
router.get('/withdrawals', adminController.getWithdrawals);
router.put('/withdrawals/:id/approve', adminController.approveWithdrawal);
router.put('/withdrawals/:id/reject', adminController.rejectWithdrawal);

// Disputes Management
router.get('/disputes', adminController.getDisputes);
router.get('/disputes/:id', adminController.getDisputeDetails);
router.put('/disputes/:id/resolve', adminController.resolveDispute);

// Users Management
router.get('/users', adminController.getUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);

// Orders Management
router.get('/orders', adminController.getOrders);
router.get('/orders/:id', adminController.getOrderById);
router.put('/orders/:id/cancel', adminController.forceCancelOrder);

// Reviews Management
router.get('/reviews', adminController.getReviews);
router.put('/reviews/:id/hide', adminController.hideReview);
router.put('/reviews/:id/unhide', adminController.unhideReview);
router.put('/reviews/:id/flag', adminController.flagReview);

// Marketplace — Pass đồ
router.get('/marketplace/listings', adminController.getMarketplaceListings);
router.put('/marketplace/listings/:id/status', adminController.updateMarketplaceListingStatus);
router.post('/marketplace/listings/:id/approve-fee', adminController.approveMarketplaceListingFee);
router.delete('/marketplace/listings/:id', adminController.deleteMarketplaceListing);

// Refunds Management
router.get('/refunds', adminController.getRefunds);
router.put('/refunds/:id/approve', adminController.approveRefund);

// Analytics APIs
router.get('/analytics/gmv', adminController.getGMVStats);
router.get('/analytics/orders', adminController.getOrderStatistics);
router.get('/analytics/providers', adminController.getTopProviders);
router.get('/analytics/commission', adminController.getPlatformCommissionByMonth);
router.get('/analytics/revenue', adminController.getRevenueByMonth);
router.get('/analytics/ga4', adminController.getGA4Analytics);

// Announcements/Notifications
router.get('/announcements', adminController.getAnnouncements);
router.post('/announcements', adminController.createAnnouncement);
router.put('/announcements/:id/publish', adminController.publishAnnouncement);

// Activity Logs
router.get('/activity/orders', adminController.getOrderStatusHistory);
router.get('/activity/verifications', adminController.getVerificationHistory);
router.get('/activity/refunds', adminController.getRefundHistory);

// Platform Settings
router.get('/settings', adminController.getPlatformSettings);
router.put('/settings', adminController.updatePlatformSettings);

module.exports = router;
