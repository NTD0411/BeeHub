#!/usr/bin/env node
/**
 * Create Test Customer Account for PayOS Payment Testing
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function createTestCustomer() {
  try {
    console.log('🔧 Creating Test Customer...\n');

    // Test data
    const testEmail = 'test-payment@unimove.local';
    const testPassword = 'Test123456!';
    const testName = 'Test Customer';

    // 1. Create Supabase auth user
    console.log('1️⃣  Creating auth user...');
    const { data: { user }, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true // Auto-confirm email
    });

    if (authError) {
      console.error('   ❌ Auth error:', authError.message);
      process.exit(1);
    }

    console.log('   ✅ Auth user created');
    console.log(`   ID: ${user.id}`);

    // 2. Create customer profile
    console.log('\n2️⃣  Creating customer profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: testEmail,
        full_name: testName,
        role: 'customer',
        phone: '0123456789',
        avatar_url: null,
        status: 'active',
      })
      .select()
      .single();

    if (profileError) {
      console.error('   ❌ Profile error:', profileError.message);
      process.exit(1);
    }

    console.log('   ✅ Customer profile created');

    // 3. Create customer profile details
    console.log('\n3️⃣  Creating customer profile details...');
    const { data: customerProfile, error: customerError } = await supabase
      .from('customer_profiles')
      .insert({
        id: user.id,
        loyalty_points: 0,
        total_spent: 0,
        rating: 5,
        review_count: 0,
      })
      .select()
      .single();

    if (customerError) {
      console.error('   ❌ Customer details error:', customerError.message);
      process.exit(1);
    }

    console.log('   ✅ Customer profile details created');

    // 4. Test login
    console.log('\n4️⃣  Testing login...');
    const { data: session, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (loginError) {
      console.error('   ❌ Login error:', loginError.message);
      process.exit(1);
    }

    console.log('   ✅ Login successful');

    // Print results
    console.log('\n' + '='.repeat(50));
    console.log('✅ TEST CUSTOMER ACCOUNT CREATED');
    console.log('='.repeat(50));
    console.log('\n📧 Email:', testEmail);
    console.log('🔐 Password:', testPassword);
    console.log('👤 Name:', testName);
    console.log('🆔 User ID:', user.id);
    console.log('\n🔑 Auth Token:', session.session.access_token);
    console.log('\n' + '='.repeat(50));
    console.log('💡 Next: Use this token to test payment API\n');
    console.log('Example cURL command:');
    console.log(`\ncurl -X POST http://localhost:3000/api/customers/me/payments/deposit \\`);
    console.log(`  -H "Authorization: Bearer ${session.session.access_token.substring(0, 20)}..." \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"order_id":"<ORDER_UUID>","amount":50000}'\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestCustomer();
