const { randomUUID } = require('crypto');
const { supabaseAdmin } = require('./supabase.service');
const { httpError } = require('./auth.helpers');
const {
  ensurePublicImageBucket,
  getImageExtFromMime,
  isImageMime,
  COMMON_IMAGE_MIME_TYPES,
} = require('./storage.helpers');

const CHAT_ATTACHMENTS_BUCKET = 'chat-attachments';
const MAX_BYTES = 10 * 1024 * 1024;

const CHAT_FILE_MIME_TYPES = [
  ...COMMON_IMAGE_MIME_TYPES,
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed',
];

function extFromFile(file) {
  const imageExt = getImageExtFromMime(file.mimetype);
  if (imageExt) return imageExt;

  const name = file.originalname || '';
  const dot = name.lastIndexOf('.');
  if (dot > 0) {
    const ext = name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (ext) return ext;
  }

  const map = {
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'text/plain': 'txt',
    'application/zip': 'zip',
    'application/x-zip-compressed': 'zip',
  };
  return map[file.mimetype] || 'bin';
}

function isAllowedChatMime(mimetype) {
  return CHAT_FILE_MIME_TYPES.includes(String(mimetype || '').toLowerCase());
}

function previewLabel({ text, mediaUrl, mediaType, mediaName }) {
  const trimmed = text ? String(text).trim() : '';
  if (trimmed) return trimmed.length > 80 ? `${trimmed.slice(0, 80)}…` : trimmed;
  if (!mediaUrl) return '';
  if (isImageMime(mediaType)) return '📷 Ảnh';
  return `📎 ${mediaName || 'Tệp đính kèm'}`;
}

async function uploadChatAttachment(userId, file) {
  if (!file?.buffer?.length) {
    throw httpError(400, 'Thiếu file (field: file)', 'validation_error');
  }
  if (!isAllowedChatMime(file.mimetype)) {
    throw httpError(400, 'Loại file không được hỗ trợ', 'invalid_file_type');
  }
  if (file.size > MAX_BYTES) {
    throw httpError(400, 'File vượt quá 10MB', 'file_too_large');
  }

  const ext = extFromFile(file);
  const objectPath = `${userId}/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;

  try {
    await ensurePublicImageBucket(CHAT_ATTACHMENTS_BUCKET, {
      fileSizeLimit: MAX_BYTES,
      allowedMimeTypes: CHAT_FILE_MIME_TYPES,
    });
  } catch (bucketError) {
    throw httpError(
      500,
      `Không tạo được bucket ${CHAT_ATTACHMENTS_BUCKET}: ${bucketError.message}`,
      'storage_bucket_missing',
    );
  }

  const { error: uploadError } = await supabaseAdmin.storage
    .from(CHAT_ATTACHMENTS_BUCKET)
    .upload(objectPath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
      cacheControl: '3600',
    });

  if (uploadError) throw httpError(500, uploadError.message, 'storage_error');

  const { data: urlData } = supabaseAdmin.storage
    .from(CHAT_ATTACHMENTS_BUCKET)
    .getPublicUrl(objectPath);
  const url = urlData?.publicUrl;
  if (!url) throw httpError(500, 'Không tạo được URL file', 'storage_error');

  return {
    url,
    media_type: file.mimetype,
    media_size: file.size,
    media_name: file.originalname || `file.${ext}`,
    is_image: isImageMime(file.mimetype),
  };
}

module.exports = {
  uploadChatAttachment,
  previewLabel,
  isImageMime,
  CHAT_FILE_MIME_TYPES,
  MAX_BYTES,
};
