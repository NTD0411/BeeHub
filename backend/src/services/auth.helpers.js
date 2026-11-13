/**
 * Helper dùng chung khi team implement auth.service.js (BE-001 → BE-007).
 * Leader KHÔNG implement business logic — chỉ cung cấp hàm tiện ích.
 */
const { signAccessToken } = require('../utils/jwt');

function httpError(status, message, code) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

/** Chuẩn SĐT VN — khớp `CustomerAuthRepository.normalizePhone` (Flutter). */
function normalizePhone(input) {
  let digits = String(input || '').replace(/\D/g, '');
  if (digits.startsWith('84')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length < 9 || digits.length > 10) {
    throw httpError(400, 'Invalid phone number', 'validation_error');
  }
  return `+84${digits}`;
}

function publicProfile(row, providerProfile) {
  if (!row) return null;
  const base = {
    id: row.id,
    email: row.email,
    phone: row.phone,
    full_name: row.full_name,
    avatar_url: row.avatar_url,
    role: row.role,
    status: row.status,
    student_id: row.student_id,
    university: row.university,
    created_at: row.created_at,
  };
  if (providerProfile) {
    base.business_name = providerProfile.business_name;
    base.is_verified = providerProfile.is_verified;
    base.verification_status = providerProfile.verification_status ?? null;
    base.rating = providerProfile.rating;
    base.total_reviews = providerProfile.total_reviews ?? 0;
    base.total_orders = providerProfile.total_orders ?? 0;
    base.vehicle_type = providerProfile.vehicle_type ?? null;
    base.compliance_score = providerProfile.compliance_score ?? 20;
  }
  if (row.ward) base.ward = row.ward;
  return base;
}

function buildAuthResponse(profile) {
  const user = publicProfile(profile);
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });
  return { user, accessToken };
}

module.exports = {
  httpError,
  normalizeEmail,
  normalizePhone,
  publicProfile,
  buildAuthResponse,
};
