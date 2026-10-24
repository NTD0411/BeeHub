const { supabaseAdmin } = require('./supabase.service');
const { createNotification } = require('./notification.service');
const { isDaNangOrder } = require('../utils/da_nang');
const { calcOrderExpiresAt } = require('./orders.service');

async function getOrderOrThrow(orderId) {
  const { data, error } = await supabaseAdmin.from('orders').select('*').eq('id', orderId).single();
  if (error || !data) throw Object.assign(new Error('Không tìm thấy đơn hàng'), { status: 404 });
  return data;
}

async function assertProviderCanQuote(providerId) {
  const { data, error } = await supabaseAdmin
    .from('provider_profiles')
    .select('id, is_verified, is_available, business_name, vehicle_type, rating, total_reviews, total_orders, base_price')
    .eq('id', providerId)
    .single();

  if (error || !data) throw Object.assign(new Error('Hồ sơ nhà xe không hợp lệ'), { status: 403 });
  if (!data.is_verified) throw Object.assign(new Error('Nhà xe chưa được xác minh'), { status: 403 });
  if (!data.is_available) throw Object.assign(new Error('Bật "Đang nhận đơn" để báo giá'), { status: 403 });
  return data;
}

function calcTotal(basePrice, surcharges) {
  const extra = (surcharges || []).reduce((sum, s) => sum + Number(s.amount || 0), 0);
  return Number(basePrice) + extra;
}

async function submitQuote(orderId, providerId, payload) {
  const order = await getOrderOrThrow(orderId);

  if (!order.quote_request) {
    throw Object.assign(new Error('Đơn này không mở báo giá — dùng Nhận đơn trực tiếp'), { status: 400 });
  }
  if (order.status !== 'pending') {
    throw Object.assign(new Error('Đơn không còn nhận báo giá'), { status: 400 });
  }
  if (order.provider_id) {
    throw Object.assign(new Error('Khách đã chốt nhà xe khác'), { status: 409 });
  }
  if (!isDaNangOrder(order)) {
    throw Object.assign(new Error('Đơn ngoài khu vực phục vụ'), { status: 400 });
  }

  await assertProviderCanQuote(providerId);

  const scheduleFit = payload.schedule_fit || 'exact_match';
  if (!['exact_match', 'alternate_proposed', 'unavailable'].includes(scheduleFit)) {
    throw Object.assign(new Error('schedule_fit không hợp lệ'), { status: 400 });
  }
  if (scheduleFit === 'unavailable') {
    throw Object.assign(new Error('Chọn exact_match hoặc alternate_proposed để gửi báo giá'), { status: 400 });
  }

  const basePrice = Number(payload.base_price);
  if (!Number.isFinite(basePrice) || basePrice <= 0) {
    throw Object.assign(new Error('base_price phải lớn hơn 0'), { status: 400 });
  }

  const surcharges = Array.isArray(payload.surcharges) ? payload.surcharges : [];
  const totalPrice = calcTotal(basePrice, surcharges);

  const row = {
    order_id: orderId,
    provider_id: providerId,
    base_price: basePrice,
    surcharges,
    total_price: totalPrice,
    schedule_fit: scheduleFit,
    proposed_pickup_at: payload.proposed_pickup_at || null,
    note: payload.note || null,
    status: 'submitted',
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from('order_quotes')
    .upsert(row, { onConflict: 'order_id,provider_id' })
    .select('*')
    .single();

  if (error) throw Object.assign(new Error(error.message), { status: 400 });

  const provider = await assertProviderCanQuote(providerId);
  await createNotification(
    order.customer_id,
    'quote_received',
    'Có báo giá mới',
    `${provider.business_name || 'Nhà xe'} báo ${Math.round(totalPrice).toLocaleString('vi-VN')}đ`,
    {
      actionData: { order_id: orderId, quote_id: data.id },
      icon: 'tag',
    },
  );

  return enrichQuote(data);
}

async function enrichQuote(quoteRow) {
  const { data: profile } = await supabaseAdmin
    .from('provider_profiles')
    .select('business_name, vehicle_type, rating, total_reviews, total_orders')
    .eq('id', quoteRow.provider_id)
    .maybeSingle();

  const { data: userProfile } = await supabaseAdmin
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', quoteRow.provider_id)
    .maybeSingle();

  return {
    ...quoteRow,
    provider_name: profile?.business_name || userProfile?.full_name || 'Nhà xe',
    provider_avatar_url: userProfile?.avatar_url || null,
    provider_rating: profile?.rating ?? 4.5,
    provider_review_count: profile?.total_reviews ?? 0,
    provider_completed_trips: profile?.total_orders ?? 0,
    vehicle_label: profile?.vehicle_type || 'medium_truck',
  };
}

async function listQuotes(orderId, userId, role) {
  const order = await getOrderOrThrow(orderId);

  if (role === 'customer') {
    if (order.customer_id !== userId) {
      throw Object.assign(new Error('Không có quyền xem báo giá'), { status: 403 });
    }
  } else if (role === 'provider') {
    const canSee =
      order.provider_id === userId ||
      (order.status === 'pending' && order.quote_request && isDaNangOrder(order));
    if (!canSee) throw Object.assign(new Error('Không có quyền xem báo giá'), { status: 403 });
  } else {
    throw Object.assign(new Error('Không có quyền'), { status: 403 });
  }

  let query = supabaseAdmin
    .from('order_quotes')
    .select('*')
    .eq('order_id', orderId)
    .order('total_price', { ascending: true });

  if (role === 'provider' && order.provider_id !== userId) {
    query = query.eq('provider_id', userId);
  }

  const { data, error } = await query;
  if (error) throw Object.assign(new Error(error.message), { status: 400 });

  const quotes = await Promise.all((data || []).map(enrichQuote));
  return { order, quotes };
}

async function selectQuote(orderId, quoteId, customerId) {
  const order = await getOrderOrThrow(orderId);

  if (order.customer_id !== customerId) {
    throw Object.assign(new Error('Không có quyền chốt báo giá'), { status: 403 });
  }
  if (!order.quote_request) {
    throw Object.assign(new Error('Đơn không ở chế độ báo giá'), { status: 400 });
  }
  if (order.status !== 'pending' && order.status !== 'matched') {
    throw Object.assign(new Error('Đơn không thể chốt báo giá ở trạng thái hiện tại'), { status: 400 });
  }

  const { data: quote, error: qErr } = await supabaseAdmin
    .from('order_quotes')
    .select('*')
    .eq('id', quoteId)
    .eq('order_id', orderId)
    .single();

  if (qErr || !quote) throw Object.assign(new Error('Không tìm thấy báo giá'), { status: 404 });
  if (quote.status !== 'submitted') {
    throw Object.assign(new Error('Báo giá không còn hiệu lực'), { status: 400 });
  }
  if (quote.schedule_fit === 'unavailable') {
    throw Object.assign(new Error('Nhà xe không nhận khung giờ này'), { status: 400 });
  }

  const pickupTime =
    quote.schedule_fit === 'alternate_proposed' && quote.proposed_pickup_at
      ? quote.proposed_pickup_at
      : order.scheduled_pickup_time;

  const now = Date.now();

  // Lock tạm 15 phút chờ customer cọc — áp dụng cho mọi đơn (cả đặt trước)
  // Nếu 15 phút không cọc → background job xóa lock, provider tự do nhận đơn khác
  const lockExpiresAt = new Date(now + 15 * 60 * 1000).toISOString();

  const orderExpiresAt = calcOrderExpiresAt(pickupTime);

  const { data: updatedOrder, error: oErr } = await supabaseAdmin
    .from('orders')
    .update({
      provider_id: quote.provider_id,
      base_price: quote.base_price,
      total_price: quote.total_price,
      scheduled_pickup_time: pickupTime,
      status: 'matched',
      lock_expires_at: lockExpiresAt,
      order_expires_at: orderExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('customer_id', customerId)
    .in('status', ['pending', 'matched'])
    .is('provider_id', null)
    .select('*')
    .single();

  if (oErr || !updatedOrder) {
    throw Object.assign(new Error('Không thể chốt báo giá — đơn đã được xử lý'), { status: 409 });
  }

  await supabaseAdmin
    .from('order_quotes')
    .update({ status: 'selected', updated_at: new Date().toISOString() })
    .eq('id', quoteId);

  await supabaseAdmin
    .from('order_quotes')
    .update({ status: 'expired', updated_at: new Date().toISOString() })
    .eq('order_id', orderId)
    .neq('id', quoteId)
    .eq('status', 'submitted');

  const enriched = await enrichQuote(quote);
  await createNotification(
    quote.provider_id,
    'quote_selected',
    'Khách đã chốt báo giá của bạn',
    `${order.pickup_address || 'Điểm lấy'} → ${order.delivery_address || 'Điểm giao'}`,
    {
      actionData: { order_id: orderId, quote_id: quoteId },
      icon: 'check-circle',
    },
  );

  return { order: updatedOrder, quote: enriched };
}

module.exports = {
  submitQuote,
  listQuotes,
  selectQuote,
};
