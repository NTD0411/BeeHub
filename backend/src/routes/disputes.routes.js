const express = require('express');
const multer = require('multer');
const disputesController = require('../controllers/disputes.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

// Multer — tối đa 5 ảnh, mỗi ảnh 5MB, field name: evidence
const evidenceUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      const err = new Error('Chỉ chấp nhận file ảnh.');
      err.status = 400;
      return cb(err);
    }
    cb(null, true);
  },
}).array('evidence', 5);

function handleEvidenceUpload(req, res, next) {
  evidenceUpload(req, res, (err) => {
    if (err) {
      err.status = err.status || 400;
      return next(err);
    }
    next();
  });
}

// POST /api/disputes — tạo khiếu nại (customer hoặc provider)
router.post('/', requireAuth, handleEvidenceUpload, disputesController.createDispute);

// GET /api/disputes/my — danh sách dispute của tôi
router.get('/my', requireAuth, disputesController.getMyDisputes);

// GET /api/disputes/:id — chi tiết
router.get('/:id', requireAuth, disputesController.getDispute);

module.exports = router;
