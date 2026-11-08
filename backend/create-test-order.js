#!/usr/bin/env node
/**
 * Create Test Order for Payment API Testing
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function createTestOrder() {
  try {
    console.log('🔧 Creating Test Order...\n');

    // Get test customer
    console.log('1️⃣  Finding test customer...');
    const { data: customer, error: customerError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('email', 'test-payment@unimove.local')
      .single();

    if (customerError || !customer) {
      console.log('   ❌ Test customer not found');
      console.log('   Run: node create-test-customer.js');
      return;
    }

    console.log(`   ✅ Customer: ${customer.full_name}`);

    // Create test order
    console.log('\n2️⃣  Creating test order...');
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: customer.id,
        from_address: '123 Nguyen Hue, District 1, HCMC',
        to_address: '456 Le Loi, District 2, HCMC',
        from_lat: 10.7769,
        from_lon: 106.6991,
        to_lat: 10.7924,
        to_lon: 106.7265,
        service_type: 'moving',
        status: 'pending',
        estimated_price: 150000,
        estimated_distance: 5,
        estimated_duration: 60,
        description: 'Test order for payment API',
        items: [],
      })
      .select()
      .single();

    if (orderError) {
      console.error('   ❌ Error creating order:', orderError.message);
      return;
    }

    console.log(`   ✅ Order created`);
    console.log(`   ID: ${order.id}`);
    console.log(`   From: ${order.from_address}`);
    console.log(`   To: ${order.to_address}`);
    console.log(`   Estimated Price: ${order.estimated_price} VND`);

    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ TEST ORDER CREATED');
    console.log('='.repeat(50));
    console.log(`\n📋 Use this order ID for testing:\n\n   ${order.id}\n`);
    console.log('Now run: node test-payment-real.js\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTestOrder();
