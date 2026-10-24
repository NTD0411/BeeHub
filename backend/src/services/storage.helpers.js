/**
 * storage.helpers.js — Tiện ích upload ảnh lên Supabase Storage.
 * Được dùng bởi customers.service.js (avatar) và providers.service.js (documents).
 */
const { supabaseAdmin } = require('./supabase.service');

/** Map MIME → đuôi file */
const MIME_TO_EXT = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

const COMMON_IMAGE_MIME_TYPES = Object.keys(MIME_TO_EXT);

/**
 * Trả về đuôi file từ MIME type, hoặc null nếu không hợp lệ.
 * @param {string} mime
 * @returns {string|null}
 */
function getImageExtFromMime(mime) {
  return MIME_TO_EXT[String(mime || '').toLowerCase()] ?? null;
}

/**
 * Đảm bảo bucket public tồn tại. Nếu chưa có sẽ tạo.
 * Bỏ qua lỗi nếu bucket đã tồn tại.
 * @param {string} bucketName
 * @param {{ fileSizeLimit?: number, allowedMimeTypes?: string[] }} [options]
 */
async function ensurePublicImageBucket(bucketName, options = {}) {
  const { fileSizeLimit = 5 * 1024 * 1024, allowedMimeTypes = COMMON_IMAGE_MIME_TYPES } = options;

  const { error } = await supabaseAdmin.storage.createBucket(bucketName, {
    public: true,
    fileSizeLimit,
    allowedMimeTypes,
  });

  // Bỏ qua lỗi "already exists"
  if (error && !error.message?.toLowerCase().includes('already exists')) {
    throw error;
  }
}

module.exports = {
  getImageExtFromMime,
  ensurePublicImageBucket,
  COMMON_IMAGE_MIME_TYPES,
};
