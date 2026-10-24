require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { supabaseAdmin } = require('../src/services/supabase.service');
const { isDaNangOrder } = require('../src/utils/da_nang');

const PROVIDER_ID = 'd4000001-0001-4001-8001-000000000001';

async function main() {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, email, role')
    .eq('id', PROVIDER_ID)
    .single();
  console.log('Profile:', profile);

  const { data: allPending, error: e1 } = await supabaseAdmin
    .from('orders')
    .select('id, status, pickup_city, quote_request, provider_id')
    .eq('status', 'pending');
  console.log('\nAll pending orders:', allPending?.length, e1?.message);
  console.log(allPending?.slice(0, 5));

  const { data: orQuery, error: e2 } = await supabaseAdmin
    .from('orders')
    .select('*')
    .or(`provider_id.eq.${PROVIDER_ID},status.eq.pending,status.eq.matched`);
  console.log('\nOR query count:', orQuery?.length, e2?.message);

  const filtered = (orQuery || []).filter((order) => {
    if (order.provider_id === PROVIDER_ID) return true;
    if (order.status !== 'pending' && order.status !== 'matched') return false;
    return isDaNangOrder(order);
  });
  console.log('After Da Nang filter:', filtered.length);
  if (filtered[0]) console.log('First:', filtered[0].id, filtered[0].pickup_city, filtered[0].quote_request);
}

main().catch(console.error);
