/**
 * Tạo tài khoản provider test (JWT + user_credentials).
 * Chạy: npm run seed:providers
 */

require('dotenv').config();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { supabaseAdmin } = require('./src/services/supabase.service');

const DEFAULT_PASSWORD = 'Provider123!@#';

const TEST_PROVIDERS = [
  {
    id: 'c3000001-0001-4001-8001-000000000001',
    email: 'provider@unimove.com',
    full_name: 'Nguyễn Văn Provider',
    phone: '0909111222',
    business_name: 'UniMove Transport Demo',
    vehicle_type: 'small_truck',
    vehicle_plate: '51A-99999',
    verification_status: 'approved',
    is_verified: true,
    status: 'active',
  },
  {
    id: 'c3000001-0001-4001-8001-000000000002',
    email: 'provider.pending@unimove.com',
    full_name: 'Trần Thị Pending',
    phone: '0909222333',
    business_name: 'Pending Logistics',
    vehicle_type: 'motorbike',
    vehicle_plate: '59-F1 8888',
    verification_status: 'pending',
    is_verified: false,
    status: 'pending_verification',
  },
  {
    id: 'c3000001-0001-4001-8001-000000000003',
    email: 'provider2@unimove.com',
    full_name: 'Lê Hoàng Vận Tải',
    phone: '0909333444',
    business_name: 'LeMove Express',
    vehicle_type: 'medium_truck',
    vehicle_plate: '51B-77777',
    verification_status: 'approved',
    is_verified: true,
    status: 'active',
  },
];

async function getAdminId() {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', 'admin@unimove.com')
    .maybeSingle();
  return data?.id ?? null;
}

async function upsertProvider(account, adminId, passwordHash) {
  const now = new Date().toISOString();

  const { error: profileErr } = await supabaseAdmin.from('profiles').upsert(
    {
      id: account.id,
      email: account.email,
      phone: account.phone,
      full_name: account.full_name,
      role: 'provider',
      status: account.status,
      onboarding_completed: true,
      created_at: now,
      updated_at: now,
    },
    { onConflict: 'id' }
  );
  if (profileErr) throw new Error(`Profile ${account.email}: ${profileErr.message}`);

  const { error: ppErr } = await supabaseAdmin.from('provider_profiles').upsert(
    {
      id: account.id,
      business_name: account.business_name,
      vehicle_type: account.vehicle_type,
      vehicle_plate: account.vehicle_plate,
      base_price: 100000,
      price_per_km: 10000,
      price_per_floor: 15000,
      rating: account.is_verified ? 4.5 : 0,
      total_reviews: account.is_verified ? 10 : 0,
      total_orders: account.is_verified ? 25 : 0,
      total_earnings: account.is_verified ? 12000000 : 0,
      is_verified: account.is_verified,
      is_available: true,
      verification_status: account.verification_status,
      verified_at: account.is_verified ? now : null,
      verified_by: account.is_verified ? adminId : null,
      verification_notes: account.is_verified ? 'Tài khoản test đã duyệt' : null,
    },
    { onConflict: 'id' }
  );
  if (ppErr) throw new Error(`Provider profile ${account.email}: ${ppErr.message}`);

  const { data: existingCreds } = await supabaseAdmin
    .from('user_credentials')
    .select('user_id')
    .eq('user_id', account.id)
    .maybeSingle();

  if (existingCreds) {
    const { error } = await supabaseAdmin
      .from('user_credentials')
      .update({ password_hash: passwordHash, updated_at: now })
      .eq('user_id', account.id);
    if (error) throw new Error(`Update credentials ${account.email}: ${error.message}`);
  } else {
    const { error } = await supabaseAdmin.from('user_credentials').insert({
      user_id: account.id,
      password_hash: passwordHash,
    });
    if (error) throw new Error(`Insert credentials ${account.email}: ${error.message}`);
  }

  if (account.verification_status === 'pending') {
    await supabaseAdmin.from('provider_documents').delete().eq('provider_id', account.id);
    await supabaseAdmin.from('provider_documents').insert([
      {
        id: crypto.randomUUID(),
        provider_id: account.id,
        document_type: 'license',
        document_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        document_number: 'B2-TEST-001',
        status: 'pending',
      },
      {
        id: crypto.randomUUID(),
        provider_id: account.id,
        document_type: 'id_card',
        document_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        document_number: 'CCCD-TEST-001',
        status: 'pending',
      },
    ]);
  }
}

async function main() {
  console.log('🚚 Tạo tài khoản provider test...\n');

  const adminId = await getAdminId();
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  for (const account of TEST_PROVIDERS) {
    await upsertProvider(account, adminId, passwordHash);
    console.log(`   ✅ ${account.email} (${account.verification_status})`);
  }

  console.log('\n🎉 Hoàn tất!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔑 Mật khẩu chung:', DEFAULT_PASSWORD);
  console.log('');
  console.log('Tài khoản:');
  for (const p of TEST_PROVIDERS) {
    console.log(`  • ${p.email} — ${p.verification_status}`);
  }
  console.log('');
  console.log('Login API: POST http://localhost:5000/api/auth/login');
  console.log('Body: { "email", "password", "role": "provider" }');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Lỗi:', err.message);
    process.exit(1);
  });
