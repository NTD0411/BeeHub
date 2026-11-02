const chatAttachmentsService = require('../services/chat-attachments.service');

async function uploadAttachment(req, res, next) {
  try {
    if (!req.file) {
      return next(Object.assign(new Error('Không có file được upload (field: file)'), {
        status: 400,
        code: 'missing_file',
      }));
    }
    const data = await chatAttachmentsService.uploadChatAttachment(req.user.id, req.file);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = { uploadAttachment };
