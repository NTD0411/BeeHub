const express = require('express');
const chatAttachmentsController = require('../controllers/chat-attachments.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { handleChatAttachmentUpload } = require('../middleware/upload.middleware');

const router = express.Router();

router.post(
  '/attachments',
  requireAuth,
  handleChatAttachmentUpload,
  chatAttachmentsController.uploadAttachment,
);

module.exports = router;
