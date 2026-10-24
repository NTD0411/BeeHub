/**
 * chat-attachments.service.js — Stub cho tính năng chat file attachment.
 * Được import bởi upload.middleware.js để cấu hình multer cho chat files.
 */

/** Danh sách MIME types được phép upload trong chat */
const CHAT_FILE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed',
];

/** Giới hạn kích thước file chat: 10MB */
const MAX_BYTES = 10 * 1024 * 1024;

module.exports = {
  CHAT_FILE_MIME_TYPES,
  MAX_BYTES,
};
