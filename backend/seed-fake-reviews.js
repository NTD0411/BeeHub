/**
 * Seed đánh giá giả cho nhà xe (mọi provider hoặc lọc theo tên).
 *
 * Chạy:
 *   npm run seed:fake-reviews
 *   npm run seed:fake-reviews -- "huy vận tải"
 */
require('dotenv').config();
const crypto = require('crypto');
const { supabaseAdmin } = require('./src/services/supabase.service');

const SAMPLE_REVIEWS = [
  {
    rating: 5,
    title: 'Rất hài lòng',
    comment: 'Tài xế nhiệt tình, bốc xếp cẩn thận, đúng giờ hẹn.',
    tags: ['thân thiện', 'cẩn thận', 'đúng giờ'],
    response: 'Cảm ơn bạn đã tin tưởng dịch vụ của chúng tôi!',
  },
  {
    rating: 5,
    title: 'Giá tốt',
    comment: 'Giá hợp lý, không phát sinh thêm chi phí so với báo giá ban đầu.',
    tags: ['giá tốt', 'minh bạch'],
  },
  {
    rating: 4,
    title: 'Tốt, hơi trễ',
    comment: 'Dịch vụ tốt, tài xế có kinh nghiệm. Chỉ trễ khoảng 15 phút do kẹt xe.',
    tags: ['chuyên nghiệp'],
  },
  {
    rating: 5,
    title: 'Recommend',
    comment: 'Chuyển trọ nhanh gọn, sẽ book lại lần sau.',
    tags: ['nhanh', 'đúng giờ'],
    response: 'Rất vui được phục vụ bạn!',
  },
  {
    rating: 5,
    title: 'Xe sạch',
    comment: 'Xe sạch sẽ, bọc đồ cẩn thận. Rất hài lòng với chuyến chuyển.',
    tags: ['sạch sẽ', 'cẩn thận'],
  },
  {
    rating: 4,
    title: 'Ổn áp',
    comment: 'Dịch vụ ổn, tài xế xử lý đồ cồng kềnh khá gọn.',
    tags: ['kinh nghiệm'],
  },
];

const FAKE_CUSTOMERS = [
  { name: 'Nguyễn Văn An' },
  { name: 'Trần Thị Mai' },
  { name: 'Lê Hoàng Nam' },
  { name: 'Phạm Thu Trang' },
  { name: 'Hoàng Văn Đức' },
  { name: 'Đỗ Lan Anh' },
];

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

async function ensureFakeCustomer(idx) {
  const id = crypto.randomUUID();
  const c = FAKE_CUSTOMERS[idx % FAKE_CUSTOMERS.length];
  const email = `fake-reviewer-${idx}@unimove.local`;
  const now = new Date().toISOString();

  await supabaseAdmin.from('profiles').upsert(
    {
      id,
      email,
      full_name: c.name,
      role: 'customer',
      status: 'active',
      onboarding_completed: true,
      created_at: now,
      updated_at: now,
    },
    { onConflict: 'id' },
  );

  await supabaseAdmin.from('customer_profiles').upsert(
    {
      id,
      university: 'ĐH Đà Nẵng',
      city: 'Đà Nẵng',
      district: 'Hải Châu',
      total_orders: 1,
      total_spent: 0,
      loyalty_points: 0,
    },
    { onConflict: 'id' },
  );

  return { id, name: c.name };
}

async function syncProviderRating(providerId) {
  const { data: reviews } = await supabaseAdmin
    .from('reviews')
    .select('rating, service_quality_rating, punctuality_rating, professionalism_rating, value_for_money_rating, provider_response')
    .eq('provider_id', providerId)
    .eq('is_published', true);

  const list = reviews ?? [];
  if (!list.length) return;

  const total = list.length;
  const avg = Math.round((list.reduce((s, r) => s + r.rating, 0) / total) * 100) / 100;
  const dist = (n) => list.filter((r) => r.rating === n).length;
  const avgOf = (key) => {
    const vals = list.map((r) => r[key]).filter((v) => v != null);
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100 : 0;
  };
  const responseCount = list.filter((r) => r.provider_response).length;

  await supabaseAdmin.from('provider_reviews_summary').upsert(
    {
      provider_id: providerId,
      total_reviews: total,
      average_rating: avg,
      rating_5_count: dist(5),
      rating_4_count: dist(4),
      rating_3_count: dist(3),
      rating_2_count: dist(2),
      rating_1_count: dist(1),
      avg_service_quality: avgOf('service_quality_rating'),
      avg_punctuality: avgOf('punctuality_rating'),
      avg_professionalism: avgOf('professionalism_rating'),
      avg_value_for_money: avgOf('value_for_money_rating'),
      response_count: responseCount,
      response_rate: Math.round((responseCount / total) * 10000) / 100,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'provider_id' },
  );

  await supabaseAdmin
    .from('provider_profiles')
    .update({ rating: avg, total_reviews: total, updated_at: new Date().toISOString() })
    .eq('id', providerId);
}

async function seedProviderReviews(provider, count = 5) {
  const { count: existing } = await supabaseAdmin
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('provider_id', provider.id);

  if ((existing ?? 0) >= 3) {
    console.log(`  ↷ Bỏ qua "${provider.business_name || provider.id}" — đã có ${existing} đánh giá`);
    return 0;
  }

  const toAdd = SAMPLE_REVIEWS.slice(0, Math.min(count, SAMPLE_REVIEWS.length));
  let added = 0;

  for (let i = 0; i < toAdd.length; i++) {
    const item = toAdd[i];
    const customer = await ensureFakeCustomer(i);
    const orderId = crypto.randomUUID();
    const reviewId = crypto.randomUUID();
    const orderNumber = `FAKE-R-${orderId.slice(0, 8).toUpperCase()}`;
    const completedAt = daysAgo(3 + i);
    const createdAt = daysAgo(4 + i);

    const { error: oErr } = await supabaseAdmin.from('orders').insert({
      id: orderId,
      order_number: orderNumber,
      customer_id: customer.id,
      provider_id: provider.id,
      service_type: 'standard',
      vehicle_size: 'medium_truck',
      pickup_address: 'KTX ĐH Đà Nẵng, Ngũ Hành Sơn',
      pickup_city: 'Đà Nẵng',
      pickup_district: 'Ngũ Hành Sơn',
      pickup_contact_name: customer.name,
      pickup_contact_phone: '+84900000000',
      delivery_address: 'Lê Duẩn, Hải Châu, Đà Nẵng',
      delivery_city: 'Đà Nẵng',
      delivery_district: 'Hải Châu',
      delivery_contact_name: customer.name,
      delivery_contact_phone: '+84900000000',
      base_price: 350000,
      distance_price: 40000,
      floor_price: 50000,
      service_fee: 0,
      total_price: 440000,
      status: 'completed',
      deposit_paid: true,
      deposit_amount: 132000,
      completed_at: completedAt,
      requires_helpers: true,
      number_of_helpers: 2,
      items_description: 'Chuyển trọ (đánh giá demo)',
      created_at: createdAt,
      updated_at: completedAt,
    });
    if (oErr) {
      console.warn(`  ! Order lỗi: ${oErr.message}`);
      continue;
    }

    const row = {
      id: reviewId,
      order_id: orderId,
      customer_id: customer.id,
      provider_id: provider.id,
      rating: item.rating,
      service_quality_rating: item.rating,
      punctuality_rating: Math.max(4, item.rating - (item.title.includes('trễ') ? 1 : 0)),
      professionalism_rating: item.rating,
      value_for_money_rating: item.rating >= 5 ? 5 : 4,
      title: item.title,
      comment: item.comment,
      tags: item.tags,
      is_published: true,
      is_verified: true,
      created_at: completedAt,
      updated_at: completedAt,
    };

    if (item.response) {
      row.provider_response = item.response;
      row.provider_responded_at = completedAt;
    }

    const { error: rErr } = await supabaseAdmin.from('reviews').insert(row);
    if (rErr) {
      console.warn(`  ! Review lỗi: ${rErr.message}`);
      await supabaseAdmin.from('orders').delete().eq('id', orderId);
      continue;
    }

    added++;
  }

  if (added > 0) {
    await syncProviderRating(provider.id);
  }

  return added;
}

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong backend/.env');
    process.exit(1);
  }

  const nameFilter = process.argv[2]?.trim().toLowerCase();

  let query = supabaseAdmin
    .from('provider_profiles')
    .select('id, business_name, rating, total_reviews')
    .eq('is_verified', true);

  const { data: providers, error } = await query;
  if (error) throw new Error(error.message);

  let list = providers ?? [];
  if (nameFilter) {
    list = list.filter((p) => (p.business_name || '').toLowerCase().includes(nameFilter));
  }

  if (!list.length) {
    console.log(nameFilter ? `Không tìm thấy nhà xe khớp "${nameFilter}"` : 'Không có nhà xe verified');
    process.exit(0);
  }

  console.log(`Seed đánh giá giả cho ${list.length} nhà xe...`);
  let total = 0;

  for (const p of list) {
    const n = await seedProviderReviews(p);
    if (n > 0) {
      console.log(`  ✓ "${p.business_name || p.id}" — thêm ${n} đánh giá`);
      total += n;
    }
  }

  console.log(`\nHoàn tất: ${total} đánh giá mới. Reload trang báo giá để xem.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
