/**
 * Seed đánh giá demo — UniMove Test Transport & Hùng Move Express Test
 *
 * Chạy (cần backend/.env với SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY):
 *   npm run seed:reviews
 *
 * Hoặc Supabase SQL Editor:
 *   backend/supabase/seed-demo-reviews.sql
 */
require('dotenv').config();
const { supabaseAdmin } = require('./src/services/supabase.service');

const PROV1 = 'd4000001-0001-4001-8001-000000000001';
const PROV2 = 'd4000001-0001-4001-8001-000000000002';

const REVIEWERS = [
  { id: 'c3000001-0001-4001-8001-000000000011', name: 'Nguyễn Văn An', email: 'reviewer01@unimove.test' },
  { id: 'c3000001-0001-4001-8001-000000000012', name: 'Trần Thị Mai', email: 'reviewer02@unimove.test' },
  { id: 'c3000001-0001-4001-8001-000000000013', name: 'Lê Hoàng Nam', email: 'reviewer03@unimove.test' },
  { id: 'c3000001-0001-4001-8001-000000000014', name: 'Phạm Thu Trang', email: 'reviewer04@unimove.test' },
  { id: 'c3000001-0001-4001-8001-000000000015', name: 'Hoàng Văn Đức', email: 'reviewer05@unimove.test' },
  { id: 'c3000001-0001-4001-8001-000000000016', name: 'Đỗ Lan Anh', email: 'reviewer06@unimove.test' },
  { id: 'c3000001-0001-4001-8001-000000000017', name: 'Bùi Quốc Huy', email: 'reviewer07@unimove.test' },
  { id: 'c3000001-0001-4001-8001-000000000018', name: 'Võ Thị Mai', email: 'reviewer08@unimove.test' },
  { id: 'c3000001-0001-4001-8001-000000000019', name: 'Phan Thị Ngọc Quyên', email: 'reviewer09@unimove.test' },
  { id: 'c3000001-0001-4001-8001-000000000020', name: 'Nguyễn Bảo Châu', email: 'reviewer10@unimove.test' },
  { id: 'c3000001-0001-4001-8001-000000000021', name: 'Trịnh Văn Phú', email: 'reviewer11@unimove.test' },
  { id: 'c3000001-0001-4001-8001-000000000022', name: 'Lê Hoàng Cường', email: 'reviewer12@unimove.test' },
];

const PROV1_REVIEWS = [
  {
    orderId: 'f6000001-0001-4001-8001-000000000001',
    orderNumber: 'DEMO-R-0001',
    reviewId: 'a7000001-0001-4001-8001-000000000001',
    customerIdx: 0,
    rating: 5,
    title: 'Rất hài lòng',
    comment: 'Tài xế nhiệt tình, bốc xếp cẩn thận, đúng giờ hẹn. Đồ đạc không bị trầy xước.',
    tags: ['thân thiện', 'cẩn thận', 'đúng giờ'],
    response: 'Cảm ơn bạn đã tin tưởng UniMove Test Transport!',
    daysAgo: 9,
  },
  {
    orderId: 'f6000001-0001-4001-8001-000000000002',
    orderNumber: 'DEMO-R-0002',
    reviewId: 'a7000001-0001-4001-8001-000000000002',
    customerIdx: 1,
    rating: 5,
    title: 'Giá tốt',
    comment: 'Giá hợp lý, không phát sinh thêm chi phí so với báo giá ban đầu.',
    tags: ['giá tốt', 'minh bạch'],
    daysAgo: 7,
  },
  {
    orderId: 'f6000001-0001-4001-8001-000000000003',
    orderNumber: 'DEMO-R-0003',
    reviewId: 'a7000001-0001-4001-8001-000000000003',
    customerIdx: 2,
    rating: 5,
    title: 'Đóng gói kỹ',
    comment: 'Đồ đạc được bọc kỹ, đội ngũ thân thiện và chuyên nghiệp.',
    tags: ['cẩn thận', 'chuyên nghiệp'],
    response: 'Rất vui được phục vụ bạn!',
    daysAgo: 6,
  },
  {
    orderId: 'f6000001-0001-4001-8001-000000000004',
    orderNumber: 'DEMO-R-0004',
    reviewId: 'a7000001-0001-4001-8001-000000000004',
    customerIdx: 3,
    rating: 4,
    title: 'Tốt, hơi trễ',
    comment: 'Dịch vụ tốt, tài xế có kinh nghiệm. Chỉ trễ khoảng 15 phút do kẹt xe.',
    tags: ['chuyên nghiệp'],
    daysAgo: 5,
  },
  {
    orderId: 'f6000001-0001-4001-8001-000000000005',
    orderNumber: 'DEMO-R-0005',
    reviewId: 'a7000001-0001-4001-8001-000000000005',
    customerIdx: 4,
    rating: 5,
    title: 'Recommend',
    comment: 'Chuyển trọ nhanh gọn, sẽ book lại lần sau. Recommend cho bạn bè!',
    tags: ['nhanh', 'đúng giờ'],
    response: 'Cảm ơn bạn!',
    daysAgo: 4,
  },
  {
    orderId: 'f6000001-0001-4001-8001-000000000006',
    orderNumber: 'DEMO-R-0006',
    reviewId: 'a7000001-0001-4001-8001-000000000006',
    customerIdx: 5,
    rating: 5,
    title: 'Uy tín',
    comment: 'Nhà xe uy tín, hỗ trợ lên tầng cao không cắt phí thêm bất ngờ.',
    tags: ['uy tín', 'minh bạch'],
    daysAgo: 3,
  },
  {
    orderId: 'f6000001-0001-4001-8001-000000000007',
    orderNumber: 'DEMO-R-0007',
    reviewId: 'a7000001-0001-4001-8001-000000000007',
    customerIdx: 6,
    rating: 4,
    title: 'Ổn áp',
    comment: 'Dịch vụ ổn, tài xế có kinh nghiệm xử lý đồ cồng kềnh.',
    tags: ['kinh nghiệm'],
    response: 'Cảm ơn phản hồi của bạn!',
    daysAgo: 2,
  },
  {
    orderId: 'f6000001-0001-4001-8001-000000000008',
    orderNumber: 'DEMO-R-0008',
    reviewId: 'a7000001-0001-4001-8001-000000000008',
    customerIdx: 7,
    rating: 5,
    title: 'Xe sạch',
    comment: 'Xe sạch sẽ, bọc đồ cẩn thận. Rất hài lòng với chuyến chuyển.',
    tags: ['sạch sẽ', 'cẩn thận'],
    daysAgo: 1,
  },
  {
    orderId: 'f6000001-0001-4001-8001-000000000009',
    orderNumber: 'DEMO-R-0009',
    reviewId: 'a7000001-0001-4001-8001-000000000009',
    customerIdx: 8,
    rating: 5,
    title: 'Hài lòng',
    comment: 'Rất hài lòng với UniMove Test Transport, đúng giờ và giá rõ ràng.',
    tags: ['đúng giờ', 'minh bạch'],
    response: 'Hẹn gặp lại bạn!',
    daysAgo: 14,
  },
  {
    orderId: 'f6000001-0001-4001-8001-000000000010',
    orderNumber: 'DEMO-R-0010',
    reviewId: 'a7000001-0001-4001-8001-000000000010',
    customerIdx: 9,
    rating: 4,
    title: 'Giá tốt',
    comment: 'Giá tốt so với thị trường, phù hợp sinh viên.',
    tags: ['giá tốt'],
    daysAgo: 11,
  },
  {
    orderId: 'f6000001-0001-4001-8001-000000000011',
    orderNumber: 'DEMO-R-0011',
    reviewId: 'a7000001-0001-4001-8001-000000000011',
    customerIdx: 10,
    rating: 5,
    title: 'Tuyệt vời',
    comment: 'Đúng giờ 100%, cảm ơn anh tài xế! Sẽ dùng lại dịch vụ.',
    tags: ['đúng giờ', 'thân thiện'],
    response: 'Cảm ơn bạn!',
    daysAgo: 2,
  },
  {
    orderId: 'f6000001-0001-4001-8001-000000000012',
    orderNumber: 'DEMO-R-0012',
    reviewId: 'a7000001-0001-4001-8001-000000000012',
    customerIdx: 11,
    rating: 5,
    title: 'Xuất sắc',
    comment: 'Chuyển trọ cuối kỳ rất mượt, không lo đồ hỏng. 10 điểm!',
    tags: ['cẩn thận', 'nhanh'],
    daysAgo: 19,
  },
];

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

async function upsertReviewers() {
  const now = new Date().toISOString();
  for (const r of REVIEWERS) {
    const { error: pErr } = await supabaseAdmin.from('profiles').upsert(
      {
        id: r.id,
        email: r.email,
        full_name: r.name,
        role: 'customer',
        status: 'active',
        onboarding_completed: true,
        created_at: now,
        updated_at: now,
      },
      { onConflict: 'id' },
    );
    if (pErr) throw new Error(`Profile ${r.name}: ${pErr.message}`);

    await supabaseAdmin.from('customer_profiles').upsert(
      {
        id: r.id,
        university: 'ĐH Đà Nẵng',
        city: 'Đà Nẵng',
        district: 'Hải Châu',
        total_orders: 1,
        total_spent: 0,
        loyalty_points: 0,
      },
      { onConflict: 'id' },
    );
  }
}

async function cleanupDemoReviews() {
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('id')
    .or('order_number.like.DEMO-R-%,order_number.like.DEMO-R-P2-%');

  const ids = (orders ?? []).map((o) => o.id);
  if (ids.length) {
    await supabaseAdmin.from('reviews').delete().in('order_id', ids);
    await supabaseAdmin.from('orders').delete().in('id', ids);
  }
}

async function seedReviewRow(item, providerId) {
  const customer = REVIEWERS[item.customerIdx];
  const completedAt = daysAgo(item.daysAgo);
  const createdAt = daysAgo(item.daysAgo);

  const { error: oErr } = await supabaseAdmin.from('orders').upsert(
    {
      id: item.orderId,
      order_number: item.orderNumber,
      customer_id: customer.id,
      provider_id: providerId,
      service_type: 'standard',
      vehicle_size: 'medium_truck',
      pickup_address: 'KTX ĐH Đà Nẵng, Ngũ Hành Sơn',
      pickup_city: 'Đà Nẵng',
      pickup_district: 'Ngũ Hành Sơn',
      pickup_contact_name: customer.name,
      pickup_contact_phone: '+84901120000',
      delivery_address: 'Lê Duẩn, Hải Châu, Đà Nẵng',
      delivery_city: 'Đà Nẵng',
      delivery_district: 'Hải Châu',
      delivery_contact_name: customer.name,
      delivery_contact_phone: '+84901120000',
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
      items_description: 'Chuyển trọ demo',
      created_at: createdAt,
      updated_at: completedAt,
    },
    { onConflict: 'id' },
  );
  if (oErr) throw new Error(`Order ${item.orderNumber}: ${oErr.message}`);

  const detail = item.rating;
  const row = {
    id: item.reviewId,
    order_id: item.orderId,
    customer_id: customer.id,
    provider_id: providerId,
    rating: item.rating,
    service_quality_rating: detail,
    punctuality_rating: Math.max(4, detail - (item.rating === 4 ? 0 : 0)),
    professionalism_rating: detail,
    value_for_money_rating: item.rating >= 5 ? 5 : 4,
    title: item.title,
    comment: item.comment,
    tags: item.tags,
    is_published: true,
    is_verified: true,
    created_at: createdAt,
    updated_at: createdAt,
  };

  if (item.response) {
    row.provider_response = item.response;
    row.provider_responded_at = daysAgo(Math.max(0, item.daysAgo - 1));
  }

  const { error: rErr } = await supabaseAdmin.from('reviews').upsert(row, { onConflict: 'id' });
  if (rErr) throw new Error(`Review ${item.reviewId}: ${rErr.message}`);
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

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong backend/.env');
    console.log('Chạy thủ công file SQL: backend/supabase/seed-demo-reviews.sql');
    process.exit(1);
  }

  console.log('Đang seed đánh giá demo...');
  await cleanupDemoReviews();
  await upsertReviewers();

  for (const item of PROV1_REVIEWS) {
    await seedReviewRow(item, PROV1);
  }

  await syncProviderRating(PROV1);
  console.log(`✓ Đã seed ${PROV1_REVIEWS.length} đánh giá cho UniMove Test Transport`);
  console.log('Reload trang báo giá trên web để xem danh sách đánh giá.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
