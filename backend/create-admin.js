/**
 * Script để tạo admin user
 * Chạy: node backend/create-admin.js
 */

const { supabaseAdmin } = require('./src/services/supabase.service');

async function createAdminUser() {
  try {
    console.log('🚀 Tạo admin user...');

    const adminEmail = 'admin@unimove.com';
    const adminPassword = 'Admin123!@#';
    const adminName = 'UniMove Admin';

    // 1. Tạo user trong Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Tự động confirm email
      user_metadata: {
        full_name: adminName,
        role: 'admin'
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('⚠️  Admin user đã tồn tại, cập nhật profile...');
        
        // Lấy user hiện có
        const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
        const adminUser = existingUser.users.find(u => u.email === adminEmail);
        
        if (adminUser) {
          // Cập nhật profile
          await updateAdminProfile(adminUser.id, adminEmail, adminName);
          console.log('✅ Cập nhật admin profile thành công!');
          return;
        }
      }
      throw authError;
    }

    console.log('✅ Tạo auth user thành công:', authData.user.id);

    // 2. Tạo/cập nhật profile
    await updateAdminProfile(authData.user.id, adminEmail, adminName);

    console.log('🎉 Tạo admin user hoàn tất!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('🔗 Login URL: POST /api/admin/auth/login');

  } catch (error) {
    console.error('❌ Lỗi tạo admin user:', error.message);
    process.exit(1);
  }
}

async function updateAdminProfile(userId, email, fullName) {
  // Upsert profile với role admin
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: userId,
      email: email,
      full_name: fullName,
      role: 'admin',
      status: 'active',
      onboarding_completed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'id'
    });

  if (profileError) {
    throw profileError;
  }

  console.log('✅ Tạo/cập nhật profile thành công');
}

// Chạy script
if (require.main === module) {
  createAdminUser()
    .then(() => {
      console.log('✨ Script hoàn tất');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script thất bại:', error);
      process.exit(1);
    });
}

module.exports = { createAdminUser };