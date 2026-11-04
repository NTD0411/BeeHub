const { supabaseAdmin } = require('./supabase.service');
const { httpError } = require('./auth.helpers');
const { estimateSharedMovePrice } = require('./shared-move.service');

const ORDER_FIELDS = [
  'vehicle_size', 'service_type',
  'pickup_address', 'pickup_city', 'pickup_district', 'pickup_ward',
  'pickup_latitude', 'pickup_longitude', 'pickup_floor', 'pickup_has_elevator',
  'pickup_contact_name', 'pickup_contact_phone', 'pickup_notes',
  'delivery_address', 'delivery_city', 'delivery_district', 'delivery_ward',
  'delivery_latitude', 'delivery_longitude', 'delivery_floor', 'delivery_has_elevator',
  'delivery_contact_name', 'delivery_contact_phone', 'delivery_notes',
  'estimated_distance', 'base_price', 'distance_price', 'floor_price', 'service_fee',
  'scheduled_pickup_time', 'number_of_rooms', 'estimated_weight', 'has_fragile_items',
  'requires_helpers', 'number_of_helpers', 'has_insurance', 'has_packing_service',
  'service_package_id', 'promotion_id', 'quote_request', 'description',
];

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.round(number)) : fallback;
}

function pickOrderFields(body) {
  const row = {};
  for (const key of ORDER_FIELDS) {
    if (body[key] !== undefined && body[key] !== null) row[key] = body[key];
  }
  return row;
}

async function createOrder(customerId, body = {}) {
  if (!String(body.pickup_address || '').trim() || !String(body.delivery_address || '').trim()) {
    throw httpError(400, 'Nhập đầy đủ địa chỉ lấy và giao hàng.', 'validation_error');
  }

  const isGroupOrder = body.is_group_order === true;
  const baseTotal = safeNumber(body.total_before_shared_move_discount, safeNumber(body.total_price));
  const transportPrice = safeNumber(body.shared_move_transport_price);
  const sharedMovePrice = estimateSharedMovePrice(transportPrice, baseTotal);
  const sharedDiscount = isGroupOrder ? sharedMovePrice.discount_amount : 0;
  const promotionDiscount = safeNumber(body.promotion_discount_amount);
  const totalPrice = isGroupOrder
    ? Math.max(0, baseTotal - sharedDiscount)
    : safeNumber(body.total_price, baseTotal);

  const row = {
    ...pickOrderFields(body),
    customer_id: customerId,
    provider_id: body.provider_id || null,
    status: 'pending',
    total_price: totalPrice,
    discount_amount: promotionDiscount + sharedDiscount,
    is_group_order: isGroupOrder,
    group_order_id: null,
    shared_move_discount: sharedDiscount,
    shared_move_group_id: null,
  };

  const { data, error } = await supabaseAdmin.from('orders').insert(row).select('*').single();
  if (error) throw httpError(500, error.message, 'db_error');
  return data;
}

function filterStatuses(query, statuses) {
  if (statuses?.length) return query.in('status', statuses);
  return query;
}

async function listOrders(userId, role, statusQuery) {
  const statuses = String(statusQuery || '').split(',').map((value) => value.trim()).filter(Boolean);
  if (role === 'customer') {
    let query = supabaseAdmin.from('orders').select('*').eq('customer_id', userId)
      .order('created_at', { ascending: false }).limit(100);
    query = filterStatuses(query, statuses);
    const { data, error } = await query;
    if (error) throw httpError(500, error.message, 'db_error');
    return data || [];
  }

  if (role !== 'provider') throw httpError(403, 'Không có quyền xem đơn hàng.', 'forbidden');
  const { data: profile, error: profileError } = await supabaseAdmin.from('provider_profiles')
    .select('is_verified, is_available')
    .eq('id', userId)
    .maybeSingle();
  if (profileError) throw httpError(500, profileError.message, 'db_error');

  let ownQuery = supabaseAdmin.from('orders').select('*').eq('provider_id', userId)
    .order('created_at', { ascending: false }).limit(100);
  ownQuery = filterStatuses(ownQuery, statuses);
  const ownResult = await ownQuery;
  if (ownResult.error) throw httpError(500, ownResult.error.message, 'db_error');

  if (!profile?.is_verified || !profile?.is_available) return ownResult.data || [];
  const wantsOpen = !statuses.length || statuses.includes('pending');
  if (!wantsOpen) return ownResult.data || [];

  const openStatuses = statuses.length ? statuses.filter((status) => status === 'pending') : ['pending'];
  let openQuery = supabaseAdmin.from('orders').select('*').is('provider_id', null)
    .order('created_at', { ascending: false }).limit(100);
  openQuery = filterStatuses(openQuery, openStatuses);
  const openResult = await openQuery;
  if (openResult.error) throw httpError(500, openResult.error.message, 'db_error');

  const byId = new Map();
  for (const order of [...(openResult.data || []), ...(ownResult.data || [])]) byId.set(order.id, order);
  return [...byId.values()].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

async function getOrder(userId, role, orderId) {
  const { data: order, error } = await supabaseAdmin.from('orders').select('*').eq('id', orderId).maybeSingle();
  if (error) throw httpError(500, error.message, 'db_error');
  if (!order) throw httpError(404, 'Không tìm thấy đơn hàng.', 'not_found');
  const isCustomerOwner = role === 'customer' && order.customer_id === userId;
  const isProviderOwner = role === 'provider' && (order.provider_id === userId || (!order.provider_id && order.status === 'pending'));
  if (!isCustomerOwner && !isProviderOwner) throw httpError(403, 'Không có quyền xem đơn hàng này.', 'forbidden');
  return order;
}

async function respondToOrder(providerId, orderId, body = {}) {
  const response = body.response === 'accepted' || body.action === 'accept'
    ? 'accepted'
    : body.response === 'declined' || body.action === 'reject'
      ? 'declined'
      : null;
  if (!response) throw httpError(400, 'response phải là accepted hoặc declined.', 'validation_error');

  const { data: provider, error: providerError } = await supabaseAdmin.from('provider_profiles')
    .select('is_verified, verification_status')
    .eq('id', providerId)
    .maybeSingle();
  if (providerError) throw httpError(500, providerError.message, 'db_error');
  if (!provider?.is_verified || provider.verification_status !== 'approved') {
    throw httpError(403, 'Cần xác minh tài khoản trước khi nhận đơn.', 'verification_required');
  }

  const { data: order, error: orderError } = await supabaseAdmin.from('orders')
    .select('id, customer_id, provider_id, status')
    .eq('id', orderId)
    .maybeSingle();
  if (orderError) throw httpError(500, orderError.message, 'db_error');
  if (!order) throw httpError(404, 'Không tìm thấy đơn hàng.', 'not_found');
  if (order.status !== 'pending' || (order.provider_id && order.provider_id !== providerId)) {
    throw httpError(409, 'Đơn hàng đã được nhà xe khác xử lý.', 'order_unavailable');
  }

  if (response === 'declined') {
    const { error } = await supabaseAdmin.from('order_provider_responses').upsert({
      order_id: orderId,
      provider_id: providerId,
      response: 'declined',
      decline_reason: body.decline_reason ? String(body.decline_reason).slice(0, 500) : null,
      responded_at: new Date().toISOString(),
    }, { onConflict: 'order_id,provider_id' });
    if (error) throw httpError(500, error.message, 'db_error');
    return { id: orderId, response };
  }

  let acceptQuery = supabaseAdmin.from('orders')
    .update({ provider_id: providerId, status: 'accepted', provider_accepted_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('status', 'pending');
  acceptQuery = order.provider_id === providerId
    ? acceptQuery.eq('provider_id', providerId)
    : acceptQuery.is('provider_id', null);
  const { data: accepted, error } = await acceptQuery.select('*').maybeSingle();
  if (error) throw httpError(500, error.message, 'db_error');
  if (!accepted) throw httpError(409, 'Đơn hàng vừa được một nhà xe khác nhận.', 'order_unavailable');

  const { error: responseError } = await supabaseAdmin.from('order_provider_responses').upsert({
    order_id: orderId,
    provider_id: providerId,
    response: 'accepted',
    decline_reason: null,
    responded_at: new Date().toISOString(),
  }, { onConflict: 'order_id,provider_id' });
  if (responseError) throw httpError(500, responseError.message, 'db_error');

  return accepted;
}

module.exports = { createOrder, listOrders, getOrder, respondToOrder };
