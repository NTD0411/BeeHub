const express = require('express');
const chatController = require('../controllers/chat.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', requireAuth, chatController.listConversations);
router.get('/:orderId/messages', requireAuth, chatController.getMessages);
router.post('/:orderId/messages', requireAuth, chatController.sendMessage);

module.exports = router;
