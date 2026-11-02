/**
 * Tạo tài khoản E2E test — customer + nhà xe đã xác minh (đăng nhập API thật).
 *
 * Chạy bằng Node (terminal):
 *   npm run seed:e2e
 *
 * Chạy thủ công trên Supabase SQL Editor — dùng file SQL, KHÔNG paste file .js này:
 *   backend/supabase/seed-e2e-test-accounts.sql
 */
require('dotenv').config();
const crypto = require('crypto');
const { supabaseAdmin } = require('./src/services/supabase.service');
const { hashPassword } = require('./src/utils/password');
const { normalizeEmail, normalizePhone } = require('./src/services/auth.helpers');

const PASSWORD = 'Test1234!';

const ACCOUNTS = {
  customer: {
    id: 'c3000001-0001-4001-8001-000000000001',
    email: 'test.customer@unimove.test',
    full_name: 'Khách Test E2E',
    phone: '0909000001',
    role: 'customer',
  },
  provider: {
    id: 'd4000001-0001-4001-8001-000000000001',
    email: 'test.provider@unimove.test',
    full_name: 'Nguyễn Văn Provider',
    phone: '0909000002',
    role: 'provider',
    business_name: 'UniMove Test Transport',
    vehicle_type: 'medium_truck',
    vehicle_plate: '43A-12345',
  },
  provider2: {
    id: 'd4000001-0001-4001-8001-000000000002',
    email: 'test.provider2@unimove.test',
    full_name: 'Trần Văn Provider 2',
    phone: '0909000003',
    role: 'provider',
    business_name: 'Hùng Move Express Test',
    vehicle_type: 'small_truck',
    vehicle_plate: '43B-67890',
  },
};

async function upsertCredentials(userId, password) {
  const passwordHash = await hashPassword(password);
  const { error } = await supabaseAdmin.from('user_credentials').upsert(
    { user_id: userId, password_hash: passwordHash },
    { onConflict: 'user_id' },
  );
  if (error) throw new Error(`Credentials: ${error.message}`);
}

async function upsertCustomer(account) {
  const email = normalizeEmail(account.email);
  const phone = normalizePhone(account.phone);
  const now = new Date().toISOString();

  const { error: pErr } = await supabaseAdmin.from('profiles').upsert(
    {
      id: account.id,
      email,
      full_name: account.full_name,
      phone,
      role: 'customer',
      status: 'active',
      onboarding_completed: true,
      created_at: now,
      updated_at: now,
    },
    { onConflict: 'id' },
  );
  if (pErr) throw new Error(`Profile customer: ${pErr.message}`);

  const { error: cpErr } = await supabaseAdmin.from('customer_profiles').upsert(
    {
      id: account.id,
      university: 'ĐH Test',
      city: 'Đà Nẵng',
      district: 'Hải Châu',
      total_orders: 0,
      total_spent: 0,
      loyalty_points: 0,
    },
    { onConflict: 'id' },
  );
  if (cpErr) throw new Error(`Customer profile: ${cpErr.message}`);

  await upsertCredentials(account.id, PASSWORD);
}

async function upsertProvider(account) {
  const email = normalizeEmail(account.email);
  const phone = normalizePhone(account.phone);
  const now = new Date().toISOString();

  const { error: pErr } = await supabaseAdmin.from('profiles').upsert(
    {
      id: account.id,
      email,
      full_name: account.full_name,
      phone,
      role: 'provider',
      status: 'active',
      onboarding_completed: true,
      created_at: now,
      updated_at: now,
    },
    { onConflict: 'id' },
  );
  if (pErr) throw new Error(`Profile provider: ${pErr.message}`);

  const { error: ppErr } = await supabaseAdmin.from('provider_profiles').upsert(
    {
      id: account.id,
      business_name: account.business_name,
      vehicle_type: account.vehicle_type,
      vehicle_plate: account.vehicle_plate,
      base_price: 450000,
      price_per_km: 12000,
      price_per_floor: 50000,
      rating: 4.7,
      total_reviews: 12,
      total_orders: 48,
      total_earnings: 18500000,
      is_verified: true,
      is_available: true,
      verification_status: 'approved',
      verified_at: now,
      service_area: ['Đà Nẵng', 'TP.HCM'],
    },
    { onConflict: 'id' },
  );
  if (ppErr) throw new Error(`Provider profile: ${ppErr.message}`);

  await upsertCredentials(account.id, PASSWORD);
}

async function main() {
  console.log('🚀 Tạo tài khoản E2E test (customer + nhà xe)...');

  await upsertCustomer(ACCOUNTS.customer);
  console.log('✅ Customer:', ACCOUNTS.customer.email);

  await upsertProvider(ACCOUNTS.provider);
  console.log('✅ Provider:', ACCOUNTS.provider.email, '—', ACCOUNTS.provider.business_name);

  await upsertProvider(ACCOUNTS.provider2);
  console.log('✅ Provider 2:', ACCOUNTS.provider2.email, '—', ACCOUNTS.provider2.business_name);

  console.log('\n📋 Đăng nhập trên app (API thật, KHÔNG dùng demo@unimove.local):');
  console.log('   Customer App :', ACCOUNTS.customer.email, '/', PASSWORD);
  console.log('   Provider App :', ACCOUNTS.provider.email, '/', PASSWORD);
  console.log('   Provider 2   :', ACCOUNTS.provider2.email, '/', PASSWORD);
  console.log('\n💡 Nhà xe đã is_verified=true → hiện trong GET /providers/browse');
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌', err.message);
      process.exit(1);
    });
}

module.exports = { ACCOUNTS, PASSWORD, main };
