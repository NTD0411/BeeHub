const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), override: true });
// Project URL
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://byqwsmdgyojzgyhbladx.supabase.co';

// Anon public key
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5cXdzbWRneW9qemd5aGJsYWR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NDQ4NzIsImV4cCI6MjA5NTQyMDg3Mn0.5N_PeOd7TtMDqOQYcTBAFOFha3nE383wp5R27tJ0WPM';

// Service role secret key
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5cXdzbWRneW9qemd5aGJsYWR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTg0NDg3MiwiZXhwIjoyMDk1NDIwODcyfQ.4W-gQgmpYFDTpu9yrZC_yQ4IQq4SZJS8lIm7QQuNhjs';

// Database URL
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:unimove123%40@db.byqwsmdgyojzgyhbladx.supabase.co:5432/postgres';

// Cloudinary (for image uploads)
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dbfgkvdu7';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '635138172262225';
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || 'VbCe8dGdXxulLTNsBHjbddSjI4Q';
const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || 'unimove_preset';

// PayOS — Merchant API v2: https://api-merchant.payos.vn/v2
const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID || '';
const PAYOS_API_KEY = process.env.PAYOS_API_KEY || '';
const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY || '';
const PAYOS_API_URL = process.env.PAYOS_API_URL || 'https://api-merchant.payos.vn/v2';

// Application URLs — APP_URL = frontend web; API_URL = backend (PayOS return callback)
const WEB_DEV_URL = process.env.WEB_DEV_URL || 'http://localhost:3001';
const APP_URL = process.env.APP_URL || WEB_DEV_URL;
const API_URL = process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`;

// Goong Maps (ưu tiên cho địa chỉ VN) — https://docs.goong.io/rest/
const GOONG_API_KEY = process.env.GOONG_API_KEY || '';
const GOONG_API_URL = process.env.GOONG_API_URL || 'https://rsapi.goong.io';

// Google Maps (fallback)
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

// Google Sign-In — OAuth Web client ID dùng làm `audience` khi verify id_token.
// Có thể khai báo nhiều client id (web/android/ios) cách nhau bằng dấu phẩy.
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';

// Node API
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Email configuration (Gmail for password reset OTP)
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_SECURE = process.env.SMTP_SECURE === 'true' || false;
const SMTP_USER = process.env.SMTP_USER || 'ngocquyensn204@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS || 'txovcemzargxcxeh';
const SMTP_FROM = process.env.SMTP_FROM || 'ngocquyensn204@gmail.com';
const PASSWORD_RESET_OTP_EXPIRES_MINUTES = process.env.PASSWORD_RESET_OTP_EXPIRES_MINUTES || 10;

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/** Nested SMTP — dùng bởi mail.service.js */
const smtp = {
  host: SMTP_HOST,
  port: parseInt(String(SMTP_PORT), 10) || 587,
  secure: SMTP_SECURE,
  user: SMTP_USER,
  pass: SMTP_PASS,
  from: SMTP_FROM || SMTP_USER,
  get isConfigured() {
    return Boolean(this.host && this.user && this.pass);
  },
};

module.exports = {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  DATABASE_URL,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_UPLOAD_PRESET,
  PAYOS_CLIENT_ID,
  PAYOS_API_KEY,
  PAYOS_CHECKSUM_KEY,
  PAYOS_API_URL,
  APP_URL,
  API_URL,
  GOONG_API_KEY,
  GOONG_API_URL,
  GOOGLE_MAPS_API_KEY,
  GOOGLE_CLIENT_ID,
  PORT,
  NODE_ENV,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  PASSWORD_RESET_OTP_EXPIRES_MINUTES,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  smtp,
};
