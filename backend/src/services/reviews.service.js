const { supabaseAdmin } = require('./supabase.service');

function httpError(status, message, code) {
  return Object.assign(new Error(message), { status, code });
}

// ── GET /api/providers/me/reviews ─────────────────────────────────────────────
async function getProviderReviews(providerId) {
  const { data, error } = await supabaseAdmin
    .from('reviews')
    .select(`
      id, rating, title, comment, tags, images,
      service_quality_rating, punctuality_rating,
      professionalism_rating, value_for_money_rating,
      provider_response, provider_responded_at,
      created_at,
      orders (order_number),
      profiles!reviews_customer_id_fkey (full_name)
    `)
    .eq('provider_id', providerId)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) throw httpError(500, error.message, 'db_error');

  return (data || []).map((r) => ({
    id: r.id,
    order_number: r.orders?.order_number ?? '—',
    customer_name: r.profiles?.full_name ?? 'Khách hàng',
    rating: r.rating,
    title: r.title,
    comment: r.comment,
    tags: r.tags ?? [],
    service_quality: r.service_quality_rating,
    punctuality: r.punctuality_rating,
    professionalism: r.professionalism_rating,
    value_for_money: r.value_for_money_rating,
    provider_response: r.provider_response,
    provider_responded_at: r.provider_responded_at,
    created_at: r.created_at,
  }));
}

// ── PATCH /api/reviews/:id/respond ────────────────────────────────────────────
async function respondToReview(reviewId, providerId, response) {
  if (!response || !response.trim())
    throw httpError(400, 'Nội dung phản hồi không được để trống', 'validation_error');

  const { data: review, error: fetchErr } = await supabaseAdmin
    .from('reviews')
    .select('id, provider_id')
    .eq('id', reviewId)
    .maybeSingle();

  if (fetchErr) throw httpError(500, fetchErr.message, 'db_error');
  if (!review) throw httpError(404, 'Không tìm thấy đánh giá', 'not_found');
  if (review.provider_id !== providerId)
    throw httpError(403, 'Bạn không có quyền phản hồi đánh giá này', 'forbidden');

  const { data, error } = await supabaseAdmin
    .from('reviews')
    .update({
      provider_response: response.trim(),
      provider_responded_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .select('id, provider_response, provider_responded_at')
    .single();

  if (error) throw httpError(500, error.message, 'db_error');
  return data;
}

// ── POST /api/reviews ─────────────────────────────────────────────────────────
async function createReview(customerId, orderId, payload) {
  const { rating, service_quality_rating, punctuality_rating,
    professionalism_rating, value_for_money_rating, comment, tags } = payload;

  if (!rating || rating < 1 || rating > 5)
    throw httpError(400, 'Số sao phải từ 1 đến 5', 'validation_error');

  const { data: order, error: oErr } = await supabaseAdmin
    .from('orders')
    .select('id, status, customer_id, provider_id')
    .eq('id', orderId)
    .maybeSingle();

  if (oErr || !order) throw httpError(404, 'Không tìm thấy đơn hàng');
  if (order.customer_id !== customerId) throw httpError(403, 'Không có quyền đánh giá đơn này');
  if (order.status !== 'completed') throw httpError(400, 'Chỉ đánh giá được đơn đã hoàn thành');
  if (!order.provider_id) throw httpError(400, 'Đơn chưa có nhà xe');

  const { data: existing } = await supabaseAdmin
    .from('reviews').select('id').eq('order_id', orderId).maybeSingle();
  if (existing) throw httpError(409, 'Bạn đã đánh giá đơn hàng này rồi');

  const { data: review, error: rErr } = await supabaseAdmin
    .from('reviews')
    .insert({
      order_id: orderId,
      customer_id: customerId,
      provider_id: order.provider_id,
      rating,
      service_quality_rating: service_quality_rating ?? null,
      punctuality_rating: punctuality_rating ?? null,
      professionalism_rating: professionalism_rating ?? null,
      value_for_money_rating: value_for_money_rating ?? null,
      comment: comment?.trim() || null,
      tags: tags ?? [],
      is_published: true,
      is_verified: true,
    })
    .select('id, rating, comment, tags, created_at')
    .single();

  if (rErr) throw httpError(500, rErr.message, 'db_error');

  await refreshProviderSummary(order.provider_id);
  return review;
}

async function refreshProviderSummary(providerId) {
  const { data: reviews } = await supabaseAdmin
    .from('reviews')
    .select('rating, service_quality_rating, punctuality_rating, professionalism_rating, value_for_money_rating, provider_response')
    .eq('provider_id', providerId)
    .eq('is_published', true);

  if (!reviews || reviews.length === 0) return;

  const total = reviews.length;
  const avg = (key) => reviews.reduce((s, r) => s + (Number(r[key]) || 0), 0) / total;
  const countStar = (n) => reviews.filter((r) => r.rating === n).length;
  const responseCount = reviews.filter((r) => r.provider_response).length;
  const avgRating = avg('rating');

  await supabaseAdmin.from('provider_reviews_summary').upsert({
    provider_id: providerId,
    total_reviews: total,
    average_rating: Math.round(avgRating * 100) / 100,
    rating_5_count: countStar(5),
    rating_4_count: countStar(4),
    rating_3_count: countStar(3),
    rating_2_count: countStar(2),
    rating_1_count: countStar(1),
    avg_service_quality: Math.round(avg('service_quality_rating') * 100) / 100,
    avg_punctuality: Math.round(avg('punctuality_rating') * 100) / 100,
    avg_professionalism: Math.round(avg('professionalism_rating') * 100) / 100,
    avg_value_for_money: Math.round(avg('value_for_money_rating') * 100) / 100,
    response_count: responseCount,
    response_rate: Math.round((responseCount / total) * 10000) / 100,
    updated_at: new Date().toISOString(),
  });

  await supabaseAdmin
    .from('provider_profiles')
    .update({ rating: Math.round(avgRating * 100) / 100, total_reviews: total })
    .eq('id', providerId);
}

module.exports = { getProviderReviews, respondToReview, createReview };
