/**
 * Reset password cho admin@unimove.com
 * Chạy từ thư mục backend: node .\reset-admin-password.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = 'admin@unimove.com';
const NEW_PASSWORD = 'Admin123!@#';

async function resetAdminPassword() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error('Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong backend/.env');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'apikey': SERVICE_ROLE_KEY,
  };

  console.log('🔍 Tìm user', ADMIN_EMAIL, '...');
  const perPage = 1000;
  let adminUser = null;
  for (let page = 1; !adminUser; page++) {
    const listRes = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
      { headers },
    );
    if (!listRes.ok) {
      throw new Error(`Không thể tìm tài khoản admin (HTTP ${listRes.status})`);
    }
    const listJson = await listRes.json();
    const users = listJson.users ?? (Array.isArray(listJson) ? listJson : []);
    adminUser = users.find(user => user.email === ADMIN_EMAIL);
    if (adminUser || users.length < perPage) break;
  }

  if (!adminUser) {
    throw new Error(`Không tìm thấy tài khoản ${ADMIN_EMAIL} trong Supabase project đã cấu hình`);
  }

  console.log('✅ UID:', adminUser.id);
  console.log('🔑 Đang reset password...');
  const updateRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${adminUser.id}`, {
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
  .catch(error => {
    console.error('\n❌ Lỗi:', error.message);
    process.exit(1);
  });
