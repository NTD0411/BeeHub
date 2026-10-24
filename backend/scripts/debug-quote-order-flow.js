/**
 * Debug: customer tạo đơn báo giá → provider thấy trong GET /orders
 * Chạy: node scripts/debug-quote-order-flow.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const BASE = process.env.API_BASE || 'http://127.0.0.1:3000/api';
const PASS = 'Test1234!';

async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function login(email) {
  const { status, json } = await req('POST', '/auth/login', { email, password: PASS });
  if (status !== 200) throw new Error(`Login ${email} failed: ${status} ${JSON.stringify(json)}`);
  return json.data.accessToken;
}

async function main() {
  console.log('API:', BASE);

  const customerToken = await login('test.customer@unimove.test');
  const providerToken = await login('test.provider@unimove.test');

  const orderBody = {
    vehicle_size: 'medium_truck',
    service_type: 'standard',
    pickup_address: '35 Nguyen Minh Chau, Ngu Hanh Son',
    pickup_city: 'Đà Nẵng',
    pickup_district: 'Ngũ Hành Sơn',
    pickup_floor: 1,
    pickup_has_elevator: false,
    pickup_notes: 'Mã báo giá: QR-DEBUG',
    pickup_contact_name: 'Khách Test',
    pickup_contact_phone: '+84909000001',
    delivery_address: 'Huynh Van Nghe, Ngu Hanh Son',
    delivery_city: 'Đà Nẵng',
    delivery_district: 'Ngũ Hành Sơn',
    delivery_floor: 1,
    delivery_has_elevator: false,
    delivery_contact_name: 'Khách Test',
    delivery_contact_phone: '+84909000001',
    base_price: 450000,
    total_price: 450000,
    quote_request: true,
    scheduled_pickup_time: new Date(Date.now() + 3 * 3600000).toISOString(),
  };

  const created = await req('POST', '/orders', orderBody, customerToken);
  console.log('\nPOST /orders:', created.status, JSON.stringify(created.json, null, 2));

  const listed = await req('GET', '/orders', null, providerToken);
  const orders = listed.json.data || [];
  const pending = orders.filter((o) => o.status === 'pending');
  console.log('\nProvider GET /orders — total:', orders.length, 'pending:', pending.length);
  if (pending.length) {
    console.log('Latest pending:', pending[0].id, pending[0].order_number, 'quote_request:', pending[0].quote_request);
  } else {
    console.log('⚠️ Provider không thấy đơn pending!');
    console.log('Sample orders:', orders.slice(0, 3).map((o) => ({ id: o.id, status: o.status, city: o.pickup_city })));
  }
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
