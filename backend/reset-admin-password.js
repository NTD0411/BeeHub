/**
 * Reset password cho admin@unimove.com
 * Dùng Supabase Admin REST API trực tiếp (không cần SDK / WebSocket)
 * Chạy: node reset-admin-password.js
 */

const SUPABASE_URL        = 'https://byqwsmdgyojzgyhbladx.supabase.co';
const SERVICE_ROLE_KEY    = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5cXdzbWRneW9qemd5aGJsYWR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTg0NDg3MiwiZXhwIjoyMDk1NDIwODcyfQ.4W-gQgmpYFDTpu9yrZC_yQ4IQq4SZJS8lIm7QQuNhjs';
const ADMIN_EMAIL         = 'admin@unimove.com';
const NEW_PASSWORD        = 'Admin123!@#';

async function resetAdminPassword() {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'apikey': SERVICE_ROLE_KEY,
  };

  // 1. Tìm UID của admin theo email
  console.log('🔍 Tìm user', ADMIN_EMAIL, '...');
  const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(ADMIN_EMAIL)}`, { headers });
  const listJson = await listRes.json();

  let userId = null;

  // Response có thể là { users: [...] } hoặc mảng trực tiếp
  const users = listJson.users ?? (Array.isArray(listJson) ? listJson : []);
  const found = users.find(u => u.email === ADMIN_EMAIL);

  if (found) {
    userId = found.id;
  } else {
    // Fallback: dùng UID từ screenshot nếu API list không trả về
    userId = '2690c66f-d1b5-4820-a7fb-b4bf94b96277';
    console.log('⚠️  Dùng UID từ Supabase Dashboard:', userId);
  }

  console.log('✅ UID:', userId);

  // 2. Update password
  console.log('🔑 Đang reset password...');
  const updateRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ password: NEW_PASSWORD, email_confirm: true }),
  });

  const updateJson = await updateRes.json();

  if (!updateRes.ok) {
    throw new Error(updateJson.message ?? JSON.stringify(updateJson));
  }

  console.log('\n🎉 Reset thành công!');
  console.log('📧 Email   :', ADMIN_EMAIL);
  console.log('🔑 Password:', NEW_PASSWORD);
  console.log('\n👉 Đăng nhập tại: http://localhost:3000/login');
}

resetAdminPassword()
  .then(() => process.exit(0))
  .catch(e => { console.error('\n❌ Lỗi:', e.message); process.exit(1); });
