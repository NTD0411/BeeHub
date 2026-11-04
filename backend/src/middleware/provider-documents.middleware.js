const multer = require('multer');

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: 8 },
  fileFilter: (_req, file, callback) => {
    if (!String(file.mimetype || '').toLowerCase().startsWith('image/')) {
      const error = new Error('Chỉ chấp nhận file ảnh cho giấy tờ xác minh.');
      error.status = 400;
      error.code = 'invalid_file_type';
      return callback(error);
    }
    callback(null, true);
  },
}).any();

function handleProviderDocumentsUpload(req, res, next) {
  upload(req, res, (error) => {
    if (error) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        error.status = 400;
        error.message = 'Mỗi ảnh giấy tờ tối đa 5MB.';
        error.code = 'file_too_large';
      }
      return next(error);
    }
    next();
  });
}

module.exports = { handleProviderDocumentsUpload };
