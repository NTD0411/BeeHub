const { supabaseAdmin } = require('./supabase.service');

function isImageMime(mimetype) {
  return typeof mimetype === 'string' && mimetype.toLowerCase().startsWith('image/');
}

function getImageExtFromMime(mimetype) {
  if (!isImageMime(mimetype)) return null;
  const subtype = mimetype.split('/')[1] || '';
  const clean = subtype.toLowerCase().replace(/[^a-z0-9.+-]/g, '');
  if (!clean) return null;
  if (clean === 'jpeg') return 'jpg';
  if (clean === 'svg+xml') return 'svg';
  return clean;
}

const COMMON_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/bmp',
  'image/tiff',
  'image/svg+xml',
  // HEIC/HEIF are common on iOS; browser support varies but accept if provided.
  'image/heic',
  'image/heif',
];

/**
 * Đảm bảo bucket public tồn tại trước khi upload (thay thế chạy migration thủ công).
 */
async function ensurePublicImageBucket(
  bucketId,
  { fileSizeLimit = 5 * 1024 * 1024, allowedMimeTypes } = {},
) {
  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
  if (listError) {
    throw listError;
  }

  const exists = (buckets ?? []).some((b) => b.id === bucketId || b.name === bucketId);
  if (exists) {
    // Try to expand mime types if the bucket already exists with stricter rules.
    if (Array.isArray(allowedMimeTypes) && allowedMimeTypes.length > 0) {
      try {
        await supabaseAdmin.storage.updateBucket(bucketId, {
          public: true,
          fileSizeLimit,
          allowedMimeTypes,
        });
      } catch {
        // Some Supabase setups may not allow updating bucket config; ignore.
      }
    }
    return;
  }

  const createConfig = { public: true, fileSizeLimit };
  if (Array.isArray(allowedMimeTypes) && allowedMimeTypes.length > 0) {
    createConfig.allowedMimeTypes = allowedMimeTypes;
  }

  const { error } = await supabaseAdmin.storage.createBucket(bucketId, createConfig);

  if (error && !/already exists/i.test(error.message)) {
    throw error;
  }
}

module.exports = {
  ensurePublicImageBucket,
  isImageMime,
  getImageExtFromMime,
  COMMON_IMAGE_MIME_TYPES,
};
