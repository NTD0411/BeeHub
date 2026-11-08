const express = require('express');
const marketplaceController = require('../controllers/marketplace.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { handleMarketplaceImageUpload } = require('../middleware/upload.middleware');

const router = express.Router();

// ── Batch 1 ──────────────────────────────────────────────────────────────────
// API-059 — Khám phá tin
router.get('/listings', requireAuth, marketplaceController.browseListings);
// API-060 — Tin của tôi
router.get('/my-listings', requireAuth, marketplaceController.getMyListings);
// Danh sách hội thoại chợ của tôi
router.get('/my-conversations', requireAuth, marketplaceController.getMyConversations);
// API-062 — Đăng tin
router.post('/listings', requireAuth, marketplaceController.createListing);
// PASS-03 — Thanh toán phí đăng tin
router.post('/listings/:id/listing-fee/pay', requireAuth, marketplaceController.payListingFee);
// Quota miễn phí & ước tính phí đăng tin
router.get('/listing-fee/quota', requireAuth, marketplaceController.getListingFeeQuota);
// API-073 — Upload ảnh tin (đặt trước /listings/:id)
router.post(
  '/listings/images',
  requireAuth,
  handleMarketplaceImageUpload,
  marketplaceController.uploadListingImage,
);

// ── Batch 2 ──────────────────────────────────────────────────────────────────
// API-061 — Chi tiết tin
router.get('/listings/:id', requireAuth, marketplaceController.getListing);
// API-064 — Đổi trạng thái tin
router.patch('/listings/:id/status', requireAuth, marketplaceController.updateListingStatus);
// API-065 — Quan tâm tin
router.post('/listings/:id/interest', requireAuth, marketplaceController.expressInterest);
// API-065b — Bỏ quan tâm
router.delete('/listings/:id/interest', requireAuth, marketplaceController.removeInterest);

// ── Batch 5 ──────────────────────────────────────────────────────────────────
// Tin tôi đã quan tâm (Yêu thích)
router.get('/my-interests', requireAuth, marketplaceController.getMyInterests);

// ── Batch 3 ──────────────────────────────────────────────────────────────────
// Inbox hội thoại Chợ SV
router.get('/conversations', requireAuth, marketplaceController.listConversations);
// API-066 — DS khách quan tâm
router.get('/listings/:id/interests', requireAuth, marketplaceController.getInterestedBuyers);
// API-067 — Đọc chat
router.get('/listings/:listingId/conversations/:buyerId/messages', requireAuth, marketplaceController.getMessages);
// API-068 — Gửi chat
router.post('/listings/:listingId/conversations/:buyerId/messages', requireAuth, marketplaceController.sendMessage);

// ── Batch 4 ──────────────────────────────────────────────────────────────────
// API-069 — Chốt đơn
router.post('/listings/:listingId/conversations/:buyerId/deal', requireAuth, marketplaceController.confirmDeal);
// API-070 — Huỷ chốt
router.delete('/listings/:listingId/deal', requireAuth, marketplaceController.cancelDeal);
// API-071 — Buyer đã đặt xe
router.post('/listings/:listingId/transport-booked', requireAuth, marketplaceController.markTransportBooked);
// Buyer xác nhận đã nhận đồ
router.post('/listings/:id/confirm-received', requireAuth, marketplaceController.confirmReceived);

// ── UX Improvements ───────────────────────────────────────────────────────────
// Đẩy tin lên đầu (1 lần / 24h)
router.post('/listings/:id/bump', requireAuth, marketplaceController.bumpListing);
// Đánh giá seller sau giao dịch
router.post('/listings/:id/rating', requireAuth, marketplaceController.createRating);
// Thống kê & rating của seller
router.get('/seller/:sellerId/stats', requireAuth, marketplaceController.getSellerStats);

module.exports = router;
