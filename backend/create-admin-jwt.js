/**
 * Script tạo admin user cho JWT authentication
 * Chạy: node create-admin-jwt.js
 */

const { supabaseAdmin } = require('./src/services/supabase.service');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  try {
    console.log('🚀 Tạo admin user với JWT auth...');

    const adminEmail = 'admin@unimove.com';
    const adminPassword = 'Admin123!@#';
    const adminName = 'UniMove Admin';

    // 1. Check if admin already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', adminEmail)
      .single();

    let adminId;

    if (existingProfile) {
      console.log('⚠️  Admin profile đã tồn tại, sử dụng ID:', existingProfile.id);
      adminId = existingProfile.id;

      // Update profile to ensure role is admin
      await supabaseAdmin
        .from('profiles')
        .update({
          role: 'admin',
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', adminId);
    } else {
      // Create new profile
      const { data: newProfile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          email: adminEmail,
          full_name: adminName,
          role: 'admin',
          status: 'active',
          onboarding_completed: true,
        })
        .select()
        .single();

      if (profileError) throw profileError;
      
      adminId = newProfile.id;
      console.log('✅ Tạo profile mới:', adminId);
    }

    // 2. Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // 3. Check if credentials exist
    const { data: existingCreds } = await supabaseAdmin
      .from('user_credentials')
      .select('user_id')
      .eq('user_id', adminId)
      .single();

    if (existingCreds) {
      // Update password
      const { error: updateError } = await supabaseAdmin
        .from('user_credentials')
        .update({
          password_hash: passwordHash,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', adminId);

      if (updateError) throw updateError;
      console.log('✅ Cập nhật mật khẩu thành công');
    } else {
      // Insert credentials
      const { error: credsError } = await supabaseAdmin
        .from('user_credentials')
        .insert({
          user_id: adminId,
          password_hash: passwordHash
        });

      if (credsError) throw credsError;
      console.log('✅ Tạo credentials thành công');
    }

    console.log('\n🎉 Tạo admin user hoàn tất!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    ', adminEmail);
    console.log('🔑 Password: ', adminPassword);
    console.log('🌐 Login URL: http://localhost:3002/login');
    console.log('🔗 API URL:   POST http://localhost:3000/api/admin/auth/login');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Lỗi tạo admin user:', error.message);
    console.error(error);
    process.exit(1);
  }
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
