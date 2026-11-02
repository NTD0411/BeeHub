const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const notifCtrl = require('../controllers/notification.controller');

const router = express.Router();

router.get('/',              requireAuth, notifCtrl.listNotifications);  // danh sách
router.get('/unread-count',  requireAuth, notifCtrl.unreadCount);        // badge
router.patch('/read-all',    requireAuth, notifCtrl.markAllRead);        // đọc hết
router.patch('/:id/read',    requireAuth, notifCtrl.markRead);           // đọc 1 cái

module.exports = router;
