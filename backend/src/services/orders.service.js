const { supabaseAdmin } = require('./supabase.service');
const { httpError } = require('./auth.helpers');
const { createNotification } = require('./notification.service');
const paymentsService = require('./payments.service');
const { isDaNangCity, isDaNangDistrict, isDaNangOrder, textMentionsDaNang } = require('../utils/da_nang');

const CANCELLABLE_STATUSES = ['pending', 'matched', 'accepted', 'scheduled'];

function calcOrderExpiresAt(scheduledPickupTime) {
  const now = Date.now();
  if (!scheduledPickupTime) return new Date(now + 24 * 60 * 60 * 1000).toISOString();
  const pickup = new Date(scheduledPickupTime).getTime();
  const hoursUntilPickup = (pickup - now) / (1000 * 60 * 60);
  if (hoursUntilPickup <= 3)  return new Date(now + 30 * 60 * 1000).toISOString();
  if (hoursUntilPickup <= 24) return new Date(pickup - 2 * 60 * 60 * 1000).toISOString();
  return new Date(pickup - 24 * 60 * 60 * 1000).toISOString();
}
const PROVIDER_CANCELLABLE_STATUSES = ['accepted', 'picking_up', 'in_progress'];
const POINTS_PER_VIOLATION = 2;

const DELIVERY_PHOTOS_BUCKET = 'delivery-photos';
const EXT_BY_MIME = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

function splitAddress(raw) {
  const address = String(raw || '').trim() || 'Chưa nhập địa chỉ';
  if (textMentionsDaNang(address)) {
    const parts = address.split(',').map((s) => s.trim()).filter(Boolean);
    const district =
      parts.find((p) => isDaNangDistrict(p)) ||
      (parts.length >= 2 && !isDaNangCity(parts[parts.length - 1]) ? parts[parts.length - 2] : parts[0]) ||
      '';
    return { address, city: 'Đà Nẵng', district };
  }
  return { address, city: '', district: '' };
}

function resolveCity(bodyCity, addressRaw, districtRaw) {
  if (isDaNangCity(bodyCity) || isDaNangDistrict(bodyCity)) return 'Đà Nẵng';
  if (textMentionsDaNang(addressRaw) || isDaNangDistrict(districtRaw)) return 'Đà Nẵng';
  return bodyCity || splitAddress(addressRaw).city || 'Đà Nẵng';
}

function mapVehicleSize(body) {
  const raw = body.vehicle_size ?? body.vehicle_type;
  const map = {
    motorbike: 'small_truck',
    van: 'small_truck',
    truck: 'medium_truck',
    pickup: 'medium_truck',
    truck_1t: 'medium_truck',
    truck_2t: 'large_truck',
    truck_5t: 'large_truck',
  };
  if (raw && map[raw]) return map[raw];
  if (raw) return raw;
  const st = body.service_type || 'standard';
  if (st === 'premium') return 'large_truck';
  if (st === 'express') return 'medium_truck';
  return 'small_truck';
}

function defaultPricing(serviceType, floorNumber) {
  const baseByType = { standard: 500000, express: 800000, premium: 1200000 };
  const basePrice = baseByType[serviceType] || 500000;
  const floorPrice = Math.max(0, Number(floorNumber) || 0) * 50000;
  return {
    base_price: basePrice,
    distance_price: 0,
    floor_price: floorPrice,
    service_fee: 0,
    total_price: basePrice + floorPrice,
  };
}

async function normalizeCreatePayload(customerId, payload) {
  const body = payload || {};

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('full_name, phone')
    .eq('id', customerId)
    .single();

  const contactName = body.pickup_contact_name || profile?.full_name || 'Khách hàng';
  const contactPhone = body.pickup_contact_phone || profile?.phone || '+84900000000';
  const serviceType = body.service_type || 'standard';
  const pickup = splitAddress(body.pickup_address);
  const delivery = splitAddress(body.delivery_address || body.dropoff_address);
  const floor = body.pickup_floor ?? body.floor_number ?? 1;

  const notes = [body.description, body.special_notes, body.pickup_notes, body.note]
    .filter(Boolean)
    .map(String)
    .join('\n');

  const noPrices = body.total_price == null && body.base_price == null;
  const quoteRequest =
    body.quote_request === true
    || (body.quote_request !== false && noPrices && !!(body.description || body.special_notes));

  let pricing;
  if (quoteRequest) {
    pricing = { base_price: 0, distance_price: 0, floor_price: 0, service_fee: 0, total_price: 0 };
  } else if (!noPrices) {
    pricing = {
      base_price: body.base_price,
      distance_price: body.distance_price || 0,
      floor_price: body.floor_price || 0,
      service_fee: body.service_fee || 0,
      total_price: body.total_price,
    };
  } else {
    pricing = defaultPricing(serviceType, floor);
  }

  return {
    ...body,
    vehicle_size: mapVehicleSize(body),
    service_type: serviceType,
    pickup_address: pickup.address,
    pickup_city: resolveCity(body.pickup_city, body.pickup_address, body.pickup_district),
    pickup_district: body.pickup_district || pickup.district,
    pickup_floor: floor,
    pickup_contact_name: contactName,
    pickup_contact_phone: contactPhone,
    pickup_notes: notes || body.pickup_notes || null,
    delivery_address: delivery.address,
    delivery_city: resolveCity(body.delivery_city, body.delivery_address || body.dropoff_address, body.delivery_district),
    delivery_district: body.delivery_district || delivery.district,
    delivery_contact_name: body.delivery_contact_name || contactName,
    delivery_contact_phone: body.delivery_contact_phone || contactPhone,
    number_of_helpers: body.number_of_helpers ?? body.num_helpers ?? 0,
    quote_request: quoteRequest,
    ...pricing,
  };
}

async function enrichOrderWithProvider(order) {
  if (!order?.provider_id) return order;

  const { data: profile } = await supabaseAdmin
    .from('provider_profiles')
    .select(
      'business_name, vehicle_type, rating, license_plate, profiles!provider_profiles_id_fkey(full_name, avatar_url, phone)',
    )
    .eq('id', order.provider_id)
    .maybeSingle();

  const userProfile = profile?.profiles;
  const nestedProfile = Array.isArray(userProfile) ? userProfile[0] : userProfile;

  return {
    ...order,
    provider_name: profile?.business_name || nestedProfile?.full_name || null,
    provider_phone: nestedProfile?.phone || null,
    provider_avatar_url: nestedProfile?.avatar_url || null,
    provider_rating: profile?.rating ?? null,
    provider_plate: profile?.license_plate || null,
    provider: {
      id: order.provider_id,
      full_name: profile?.business_name || nestedProfile?.full_name || 'Nhà xe',
      phone: nestedProfile?.phone || null,
      avatar_url: nestedProfile?.avatar_url || null,
      rating: profile?.rating ?? null,
      vehicle_type: profile?.vehicle_type || null,
    },
  };
}

async function enrichProviderOrdersList(orders, providerId) {
  if (!orders?.length) return [];

  const orderIds = orders.map((o) => o.id);
  const customerIds = [...new Set(orders.map((o) => o.customer_id).filter(Boolean))];

  const [{ data: quotes }, { data: profiles }] = await Promise.all([
    supabaseAdmin
      .from('order_quotes')
      .select('order_id, total_price, status, note, created_at')
      .eq('provider_id', providerId)
      .in('order_id', orderIds),
    customerIds.length
      ? supabaseAdmin.from('profiles').select('id, full_name, phone').in('id', customerIds)
      : Promise.resolve({ data: [] }),
  ]);

  const quoteByOrder = Object.fromEntries((quotes || []).map((q) => [q.order_id, q]));
  const profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));

  return orders.map((order) => ({
    ...order,
    dropoff_address: order.dropoff_address || order.delivery_address,
    estimated_price: order.estimated_price ?? order.total_price ?? order.base_price ?? null,
    customer: profileMap[order.customer_id] ?? null,
    my_quote: quoteByOrder[order.id] ?? null,
  }));
}

async function listOrdersForUser(userId, role, queryParams = {}) {
  let query = supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false });

  if (role === 'customer') {
    query = query.eq('customer_id', userId);
  } else if (role === 'provider') {
    // Lấy danh sách đơn provider đã từ chối hoặc bỏ qua để loại ra khỏi kết quả
    const { data: dismissed } = await supabaseAdmin
      .from('order_provider_responses')
      .select('order_id')
      .eq('provider_id', userId)
      .in('response', ['declined', 'skipped']);

    const declinedIds = (dismissed || []).map((r) => r.order_id);

    query = query.or(`provider_id.eq.${userId},status.eq.pending,status.eq.matched`);

    if (declinedIds.length > 0) {
      query = query.not('id', 'in', `(${declinedIds.join(',')})`);
    }
  }

  const { status, ward } = queryParams;
  if (ward && role === 'provider') {
    // Filter orders where delivery ward matches provider's ward
    query = query.ilike('delivery_district', `%${ward}%`);
  }
  if (status) {
    const statuses = String(status)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (statuses.length === 1) {
      query = query.eq('status', statuses[0]);
    } else if (statuses.length > 1) {
      query = query.in('status', statuses);
    }
  }

  const { data, error } = await query;
  if (error) throw Object.assign(new Error(error.message), { status: 400 });

  if (role === 'provider') {
    const filtered = (data || []).filter((order) => {
      if (order.provider_id === userId) return true;
      if (order.provider_id && order.provider_id !== userId) return false;
      if (order.status !== 'pending' && order.status !== 'matched') return false;
      return isDaNangOrder(order);
    });
    return enrichProviderOrdersList(filtered, userId);
  }

  return Promise.all((data || []).map(enrichOrderWithProvider));
}

async function notifyDaNangProvidersNewOrder(order) {
  if (!isDaNangOrder(order)) return;

  const { data: providers, error } = await supabaseAdmin
    .from('provider_profiles')
    .select('id, service_area')
    .eq('is_verified', true)
    .eq('is_available', true);

  if (error || !providers?.length) return;

  const title = order.quote_request ? 'Yêu cầu báo giá mới tại Đà Nẵng' : 'Đơn mới tại Đà Nẵng';
  const body = order.quote_request
    ? `${order.pickup_address || 'Điểm lấy'} → ${order.delivery_address || 'Điểm giao'} — gửi báo giá ngay`
    : `${order.pickup_address || 'Điểm lấy'} → ${order.delivery_address || 'Điểm giao'}`;

  for (const p of providers) {
    const areas = Array.isArray(p.service_area) ? p.service_area : [];
    const servesDaNang = areas.length === 0 || areas.some((a) => isDaNangCity(a));
    if (!servesDaNang) continue;

    await createNotification(p.id, 'order_created', title, body, {
      actionData: { order_id: order.id },
      icon: 'truck',
    });
  }
}

async function createOrder(customerId, payload) {
  const p = await normalizeCreatePayload(customerId, payload);
  const photoUrls = Array.isArray(p.dorm_image_urls)
    ? p.dorm_image_urls.filter((u) => typeof u === 'string' && u.trim())
    : [];

  const baseRow = {
    customer_id: customerId,
    vehicle_size: p.vehicle_size,
    service_type: p.service_type || 'standard',
    pickup_address: p.pickup_address,
    pickup_city: p.pickup_city,
    pickup_district: p.pickup_district,
    pickup_floor: p.pickup_floor ?? 1,
    pickup_has_elevator: p.pickup_has_elevator ?? false,
    pickup_notes: p.pickup_notes || null,
    pickup_latitude: p.pickup_latitude ?? null,
    pickup_longitude: p.pickup_longitude ?? null,
    pickup_contact_name: p.pickup_contact_name,
    pickup_contact_phone: p.pickup_contact_phone,
    delivery_address: p.delivery_address,
    delivery_city: p.delivery_city,
    delivery_district: p.delivery_district,
    delivery_floor: p.delivery_floor ?? 1,
    delivery_has_elevator: p.delivery_has_elevator ?? false,
    delivery_notes: p.delivery_notes || null,
    delivery_latitude: p.delivery_latitude ?? null,
    delivery_longitude: p.delivery_longitude ?? null,
    delivery_contact_name: p.delivery_contact_name,
    delivery_contact_phone: p.delivery_contact_phone,
    base_price: p.quote_request === true ? 0 : p.base_price,
    distance_price: p.quote_request === true ? 0 : p.distance_price || 0,
    floor_price: p.quote_request === true ? 0 : p.floor_price || 0,
    service_fee: p.quote_request === true ? 0 : p.service_fee || 0,
    total_price: p.quote_request === true ? 0 : p.total_price,
    scheduled_pickup_time: p.scheduled_pickup_time,
    number_of_rooms: p.number_of_rooms || 1,
    requires_helpers: p.requires_helpers ?? false,
    number_of_helpers: p.number_of_helpers ?? 0,
    status: 'pending',
    order_expires_at: calcOrderExpiresAt(p.scheduled_pickup_time),
    ...(photoUrls.length > 0 ? { dorm_image_urls: photoUrls } : {}),
  };

  let insertRow = { ...baseRow, quote_request: p.quote_request === true };
  let { data, error } = await supabaseAdmin.from('orders').insert(insertRow).select('*').single();

  if (error && /quote_request/i.test(error.message)) {
    ({ data, error } = await supabaseAdmin.from('orders').insert(baseRow).select('*').single());
  }

  if (error && /dorm_image_urls/i.test(error.message) && photoUrls.length > 0) {
    const { dorm_image_urls: _d, ...withoutPhotos } = insertRow;
    ({ data, error } = await supabaseAdmin.from('orders').insert(withoutPhotos).select('*').single());
    if (error && /quote_request/i.test(error.message)) {
      const { quote_request: _q, ...fallbackRow } = withoutPhotos;
      ({ data, error } = await supabaseAdmin.from('orders').insert(fallbackRow).select('*').single());
    }
  }

  if (error) throw Object.assign(new Error(error.message), { status: 400 });
  await notifyDaNangProvidersNewOrder(data);
  return data;
}

async function providerRespond(orderId, providerId, response, declineReason) {
  if (response === 'accepted') await checkProviderBan(providerId);
  const order = await getOrderById(orderId);

  if (order.quote_request && response === 'accepted') {
    const matchedAfterDeposit =
      order.provider_id === providerId &&
      order.deposit_paid === true &&
      order.status === 'matched';

    if (!matchedAfterDeposit) {
      let message = 'Đơn báo giá — hãy gửi báo giá thay vì nhận trực tiếp';
      if (order.provider_id === providerId && order.status === 'matched' && !order.deposit_paid) {
        message = 'Chờ khách đặt cọc trước khi nhận đơn';
      } else if (order.provider_id && order.provider_id !== providerId) {
        message = 'Khách đã chốt nhà xe khác';
      }
      throw Object.assign(new Error(message), { status: 400 });
    }
  }

  if (response === 'accepted' && order.provider_id && order.provider_id !== providerId) {
    throw Object.assign(new Error('Khách đã chốt nhà xe khác'), { status: 403 });
  }

  const { error: responseError } = await supabaseAdmin.from('order_provider_responses').insert({
    order_id: orderId,
    provider_id: providerId,
    response,
    decline_reason: declineReason || null,
  });

  if (responseError) throw Object.assign(new Error(responseError.message), { status: 400 });

  if (response === 'accepted') {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({
        provider_id: providerId,
        status: 'accepted',
        provider_accepted_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select('*')
      .single();

    if (error) throw Object.assign(new Error(error.message), { status: 400 });

    await createNotification(
      order.customer_id,
      'order_accepted',
      'Nhà xe đã nhận đơn',
      `${order.pickup_address || 'Điểm lấy'} → ${order.delivery_address || 'Điểm giao'}`,
      {
        actionData: { order_id: orderId },
        icon: 'check-circle',
      },
    );

    return enrichOrderWithProvider(data);
  }

  return { order_id: orderId, response };
}

async function getOrderById(orderId) {
  const { data, error } = await supabaseAdmin.from('orders').select('*').eq('id', orderId).single();
  if (error) throw Object.assign(new Error(error.message), { status: 404 });

  const enriched = await enrichOrderWithProvider(data);

  if (data.customer_id) {
    const { data: cp } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, phone')
      .eq('id', data.customer_id)
      .maybeSingle();
    if (cp) enriched.customer = { id: cp.id, full_name: cp.full_name, phone: cp.phone };
  }

  if (data.status === 'completed') {
    const { data: rev } = await supabaseAdmin
      .from('reviews')
      .select('id, rating, comment, tags, created_at')
      .eq('order_id', orderId)
      .maybeSingle();
    if (rev) enriched.my_review = rev;
  }

  return enriched;
}

// ── PATCH /api/orders/:id/accept ──────────────────────────────────────────────
async function acceptOrder(orderId, providerId) {
  await checkProviderBan(providerId);
  const { data: order, error: fetchErr } = await supabaseAdmin
    .from('orders')
    .select('id, status, provider_id')
    .eq('id', orderId)
    .maybeSingle();

  if (fetchErr) throw Object.assign(new Error(fetchErr.message), { status: 500 });
  if (!order) throw Object.assign(new Error('Không tìm thấy đơn hàng'), { status: 404 });
  if (order.status !== 'pending')
    throw Object.assign(new Error('Đơn hàng không còn ở trạng thái chờ nhận'), { status: 409 });

  await supabaseAdmin.from('order_provider_responses').insert({
    order_id: orderId,
    provider_id: providerId,
    response: 'accepted',
  });

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({ provider_id: providerId, status: 'accepted' })
    .eq('id', orderId)
    .eq('status', 'pending')
    .select('*')
    .single();

  if (error) throw Object.assign(new Error(error.message), { status: 500 });
  if (!data)
    throw Object.assign(new Error('Đơn hàng vừa được nhận bởi provider khác'), { status: 409 });
  return enrichOrderWithProvider(data);
}

// ── PATCH /api/orders/:id/start ───────────────────────────────────────────────
async function startOrder(orderId, providerId) {
  const { data: order, error: fetchErr } = await supabaseAdmin
    .from('orders')
    .select('id, status, provider_id')
    .eq('id', orderId)
    .maybeSingle();

  if (fetchErr) throw Object.assign(new Error(fetchErr.message), { status: 500 });
  if (!order) throw Object.assign(new Error('Không tìm thấy đơn hàng'), { status: 404 });
  if (order.provider_id !== providerId)
    throw Object.assign(new Error('Bạn không phải provider của đơn hàng này'), { status: 403 });
  if (!['scheduled', 'accepted', 'picking_up'].includes(order.status))
    throw Object.assign(new Error('Chỉ có thể bắt đầu đơn đã được nhận'), { status: 409 });

  const nextStatus = order.status === 'scheduled' ? 'accepted'
    : order.status === 'accepted' ? 'picking_up'
    : 'in_progress';
  const extra = nextStatus === 'in_progress' ? { actual_pickup_time: new Date().toISOString() } : {};

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({ status: nextStatus, ...extra })
    .eq('id', orderId)
    .select('*')
    .single();

  if (error) throw Object.assign(new Error(error.message), { status: 500 });
  return data;
}

// ── PATCH /api/orders/:id/skip ────────────────────────────────────────────────
async function skipOrder(orderId, providerId) {
  const { data: order, error: fetchErr } = await supabaseAdmin
    .from('orders')
    .select('id, status')
    .eq('id', orderId)
    .maybeSingle();

  if (fetchErr) throw Object.assign(new Error(fetchErr.message), { status: 500 });
  if (!order) throw Object.assign(new Error('Không tìm thấy đơn hàng'), { status: 404 });

  await supabaseAdmin.from('order_provider_responses').upsert(
    { order_id: orderId, provider_id: providerId, response: 'skipped' },
    { onConflict: 'order_id,provider_id', ignoreDuplicates: false },
  );

  return { order_id: orderId };
}

// ── PATCH /api/orders/:id/decline ─────────────────────────────────────────────
async function declineOrder(orderId, providerId, reason) {
  const { data: order, error: fetchErr } = await supabaseAdmin
    .from('orders')
    .select('id, status')
    .eq('id', orderId)
    .maybeSingle();

  if (fetchErr) throw Object.assign(new Error(fetchErr.message), { status: 500 });
  if (!order) throw Object.assign(new Error('Không tìm thấy đơn hàng'), { status: 404 });
  if (order.status !== 'pending')
    throw Object.assign(new Error('Chỉ có thể từ chối đơn đang chờ nhận'), { status: 409 });

  await supabaseAdmin.from('order_provider_responses').insert({
    order_id: orderId,
    provider_id: providerId,
    response: 'declined',
    decline_reason: reason || null,
  });

  return { order_id: orderId, status: order.status };
}

// ── PATCH /api/orders/:id/complete ────────────────────────────────────────────
async function completeOrder(orderId, providerId) {
  const { data: order, error: fetchErr } = await supabaseAdmin
    .from('orders')
    .select('id, status, provider_id, delivery_photo_url')
    .eq('id', orderId)
    .maybeSingle();

  if (fetchErr) throw Object.assign(new Error(fetchErr.message), { status: 500 });
  if (!order) throw Object.assign(new Error('Không tìm thấy đơn hàng'), { status: 404 });
  if (order.provider_id !== providerId)
    throw Object.assign(new Error('Bạn không phải provider của đơn hàng này'), { status: 403 });
  if (order.status !== 'in_progress')
    throw Object.assign(new Error('Chỉ có thể hoàn thành đơn đang thực hiện'), { status: 409 });
  if (!order.delivery_photo_url) {
    throw Object.assign(
      new Error('Vui lòng tải ảnh giao hàng trước khi hoàn thành đơn'),
      { status: 400 },
    );
  }

  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({
      status: 'completed',
      completed_at: now,
      payment_released: true,
      payment_released_at: now,
      slot_locked_until: null, // xóa lock khung giờ khi đơn hoàn thành
    })
    .eq('id', orderId)
    .select('*')
    .single();

  if (error) throw Object.assign(new Error(error.message), { status: 500 });
  await supabaseAdmin
    .from('payments')
    .update({ escrow_status: 'released' })
    .eq('order_id', orderId)
    .eq('escrow_status', 'held');

  return enrichOrderWithProvider(data);
}

/**
 * BE-025 — PATCH /api/orders/:id/cancel
 * Khách hủy → tự tạo yêu cầu hoàn tiền pending (nếu có payment).
 * Provider hủy → hủy đơn đơn giản (không refund).
 */
async function cancelOrder(orderId, userId, reason) {
  const trimmedReason = String(reason || '').trim();

  const { data: order, error: fetchErr } = await supabaseAdmin
    .from('orders')
    .select('id, status, customer_id, provider_id, order_number, provider_accepted_at')
    .eq('id', orderId)
    .maybeSingle();

  if (fetchErr) throw Object.assign(new Error(fetchErr.message), { status: 500 });
  if (!order) throw Object.assign(new Error('Không tìm thấy đơn hàng'), { status: 404 });
  if (order.customer_id !== userId && order.provider_id !== userId) {
    throw Object.assign(new Error('Bạn không có quyền hủy đơn hàng này'), { status: 403 });
  }
  if (order.status === 'cancelled') {
    throw httpError(400, 'Đơn hàng đã được hủy trước đó', 'already_cancelled');
  }
  if (order.status === 'completed') {
    throw Object.assign(new Error('Đơn hàng đã hoàn thành hoặc đã hủy'), { status: 409 });
  }

  const isCustomer = order.customer_id === userId;

  if (isCustomer) {
    if (!trimmedReason) {
      throw httpError(400, 'Lý do hủy không được để trống', 'validation_error');
    }
    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      throw httpError(400, `Không thể hủy đơn ở trạng thái "${order.status}"`, 'cannot_cancel');
    }
  } else {
    // Provider: kiểm tra TRƯỚC khi update DB
    if (!PROVIDER_CANCELLABLE_STATUSES.includes(order.status)) {
      throw httpError(400, `Không thể hủy đơn ở trạng thái "${order.status}"`, 'cannot_cancel');
    }
  }

  const previousStatus = order.status;

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('orders')
    .update({
      status: 'cancelled',
      cancellation_reason: trimmedReason || null,
      cancelled_by: userId,
      cancelled_at: new Date().toISOString(),
      slot_locked_until: null, // xóa lock khung giờ khi đơn bị hủy
    })
    .eq('id', orderId)
    .select('*')
    .single();

  if (updateError) {
    if (isCustomer) throw httpError(500, updateError.message, 'db_error');
    throw Object.assign(new Error(updateError.message), { status: 500 });
  }

  if (!isCustomer) {
    await supabaseAdmin.from('order_status_history').insert({
      order_id: orderId,
      from_status: previousStatus,
      to_status: 'cancelled',
      changed_by: userId,
      notes: `Nhà xe hủy đơn${trimmedReason ? `: ${trimmedReason}` : ''}`,
    });

    await createNotification(
      order.customer_id,
      'order_cancelled',
      'Nhà xe đã hủy đơn của bạn',
      `Đơn ${order.order_number} bị hủy bởi nhà xe${trimmedReason ? `. Lý do: ${trimmedReason}` : ''}. Bạn có thể đặt lại.`,
      { priority: 'high', actionData: { order_id: orderId } },
    );

    await applyProviderViolation(userId, orderId, order.order_number);

    return enrichOrderWithProvider(updated);
  }

  await supabaseAdmin.from('order_status_history').insert({
    order_id: orderId,
    from_status: previousStatus,
    to_status: 'cancelled',
    changed_by: userId,
    notes: `Khách hàng hủy đơn: ${trimmedReason}`,
  });

  await createNotification(
    userId,
    'order_cancelled',
    'Đơn hàng đã bị hủy',
    `Đơn ${order.order_number} đã được hủy thành công.`,
    { priority: 'normal', actionData: { order_id: orderId } },
  );

  if (order.provider_id) {
    await createNotification(
      order.provider_id,
      'order_cancelled',
      'Đơn hàng đã bị hủy',
      `Đơn ${order.order_number} đã bị khách hủy. Lý do: ${trimmedReason}`,
      { priority: 'high', actionData: { order_id: orderId } },
    );
  }

  let refundRequest = null;
  let refundSkipReason = null;
  try {
    const minutesSinceAccepted = order.provider_accepted_at
      ? (Date.now() - new Date(order.provider_accepted_at).getTime()) / 60000
      : undefined;

    refundRequest = await paymentsService.requestRefundForOrder(
      userId,
      orderId,
      trimmedReason,
      {
        statusBeforeCancel: previousStatus,
        hadProvider: Boolean(order.provider_id),
        minutesSinceAccepted,
      },
    );
  } catch (err) {
    if (err.code === 'no_refundable_payment') {
      refundSkipReason = 'no_refundable_payment';
    } else {
      throw err;
    }
  }

  return {
    order: await enrichOrderWithProvider(updated),
    refund_request: refundRequest,
    refund_skip_reason: refundSkipReason,
  };
}

// ── POST /api/orders/:id/delivery-photo ───────────────────────────────────────
async function uploadDeliveryPhoto(orderId, providerId, file) {
  if (!file?.buffer?.length) throw Object.assign(new Error('Thiếu file ảnh'), { status: 400 });

  const ext = EXT_BY_MIME[file.mimetype];
  if (!ext) throw Object.assign(new Error('Chỉ chấp nhận ảnh JPG, PNG hoặc WebP'), { status: 400 });

  const { data: order, error: fetchErr } = await supabaseAdmin
    .from('orders')
    .select('id, status, provider_id')
    .eq('id', orderId)
    .maybeSingle();

  if (fetchErr) throw Object.assign(new Error(fetchErr.message), { status: 500 });
  if (!order) throw Object.assign(new Error('Không tìm thấy đơn hàng'), { status: 404 });
  if (order.provider_id !== providerId)
    throw Object.assign(new Error('Bạn không phải provider của đơn hàng này'), { status: 403 });
  if (order.status !== 'in_progress')
    throw Object.assign(new Error('Chỉ upload ảnh khi đơn đang thực hiện'), { status: 409 });

  const objectPath = `${orderId}/delivery-${Date.now()}.${ext}`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from(DELIVERY_PHOTOS_BUCKET)
    .upload(objectPath, file.buffer, { contentType: file.mimetype, upsert: true });

  if (uploadError) throw Object.assign(new Error(uploadError.message), { status: 500 });

  const { data: urlData } = supabaseAdmin.storage
    .from(DELIVERY_PHOTOS_BUCKET)
    .getPublicUrl(objectPath);
  const photoUrl = urlData?.publicUrl;
  if (!photoUrl) throw Object.assign(new Error('Không tạo được URL ảnh'), { status: 500 });

  const { error: updateErr } = await supabaseAdmin
    .from('orders')
    .update({ delivery_photo_url: photoUrl })
    .eq('id', orderId);

  if (updateErr) throw Object.assign(new Error(updateErr.message), { status: 500 });

  return { photo_url: photoUrl };
}

// ── GET /orders/:id/cancel-estimate ──────────────────────────────────────────
async function estimateCancelRefund(orderId, customerId) {
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, status, customer_id, provider_id, provider_accepted_at')
    .eq('id', orderId)
    .maybeSingle();

  if (!order) throw httpError(404, 'Không tìm thấy đơn hàng', 'not_found');
  if (order.customer_id !== customerId) throw httpError(403, 'Không có quyền', 'access_denied');

  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    return { cancellable: false, status: order.status };
  }

  const { data: payment } = await supabaseAdmin
    .from('payments')
    .select('amount')
    .eq('order_id', orderId)
    .eq('customer_id', customerId)
    .eq('status', 'completed')
    .in('payment_purpose', ['deposit', 'full', 'final'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const depositAmount = payment ? Number(payment.amount) : 0;

  let feePercent = 0;
  if (order.status === 'accepted' && order.provider_accepted_at) {
    const mins = (Date.now() - new Date(order.provider_accepted_at).getTime()) / 60000;
    feePercent = mins < 30 ? 10 : 30;
  }

  const feeAmount = Math.round(depositAmount * feePercent / 100);
  const refundAmount = depositAmount - feeAmount;

  return {
    cancellable: true,
    status: order.status,
    deposit_amount: depositAmount,
    fee_percent: feePercent,
    fee_amount: feeAmount,
    refund_amount: refundAmount,
  };
}

// ── Provider compliance score ─────────────────────────────────────────────────
async function applyProviderViolation(providerId, orderId, orderNumber) {
  const { data: pp } = await supabaseAdmin
    .from('provider_profiles')
    .select('compliance_score, warning_level, ban_until, last_violation_at')
    .eq('id', providerId)
    .maybeSingle();

  const MONTH_MS = 30 * 24 * 60 * 60 * 1000;
  const lastViolation = pp?.last_violation_at ? new Date(pp.last_violation_at).getTime() : 0;
  const shouldReset = lastViolation > 0 && (Date.now() - lastViolation) > MONTH_MS;

  let score = shouldReset ? 20 : (pp?.compliance_score ?? 20);
  let level = shouldReset ? 0 : (pp?.warning_level ?? 0);

  score = Math.max(0, score - POINTS_PER_VIOLATION);

  let banUntil = null;
  let newLevel = level;
  let title, body;

  if (score <= 0) {
    banUntil = new Date(Date.now() + MONTH_MS).toISOString();
    newLevel = 4;
    title = 'Tài khoản bị tạm khóa 30 ngày';
    body = `Điểm tuân thủ về 0. Không thể nhận đơn đến ${new Date(banUntil).toLocaleDateString('vi-VN')}.`;
  } else if (score <= 5) {
    if (level >= 3) {
      banUntil = new Date(Date.now() + MONTH_MS).toISOString();
      newLevel = 4;
      title = 'Tài khoản bị tạm khóa 30 ngày (tái phạm)';
      body = `Điểm tuân thủ còn ${score}/20. Tái phạm sau cảnh báo nghiêm trọng. Tạm khóa đến ${new Date(banUntil).toLocaleDateString('vi-VN')}.`;
    } else {
      banUntil = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      newLevel = 3;
      title = 'Cảnh báo nghiêm trọng — Tạm khóa 3 ngày';
      body = `Điểm tuân thủ còn ${score}/20. Tái phạm tiếp theo sẽ bị khóa 30 ngày.`;
    }
  } else if (score <= 10) {
    banUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    newLevel = 2;
    title = 'Cảnh báo lần 2 — Tạm khóa 1 ngày';
    body = `Điểm tuân thủ còn ${score}/20. Tiếp tục vi phạm sẽ bị tạm khóa lâu hơn.`;
  } else if (score <= 15) {
    newLevel = 1;
    title = 'Cảnh báo lần 1';
    body = `Hủy đơn ${orderNumber}: điểm tuân thủ còn ${score}/20. Tiếp tục vi phạm sẽ bị tạm khóa tài khoản.`;
  } else {
    title = 'Trừ điểm tuân thủ';
    body = `Hủy đơn ${orderNumber}: điểm tuân thủ còn ${score}/20.`;
  }

  await supabaseAdmin.from('provider_profiles').update({
    compliance_score: score,
    warning_level: newLevel,
    ban_until: banUntil,
    last_violation_at: new Date().toISOString(),
  }).eq('id', providerId);

  await createNotification(providerId, 'compliance_warning', title, body, {
    priority: 'high',
    actionData: { order_id: orderId },
  });

  return { score, warning_level: newLevel, ban_until: banUntil };
}

async function checkProviderBan(providerId) {
  const { data: pp } = await supabaseAdmin
    .from('provider_profiles')
    .select('ban_until, compliance_score')
    .eq('id', providerId)
    .maybeSingle();

  if (!pp?.ban_until) return;

  const banExpiry = new Date(pp.ban_until);
  if (banExpiry > new Date()) {
    const days = Math.ceil((banExpiry - new Date()) / (24 * 60 * 60 * 1000));
    throw httpError(403, `Tài khoản đang bị tạm khóa. Còn ${days} ngày.`, 'provider_banned');
  }
}

/**
 * Lấy lịch giao hàng của provider theo khoảng ngày.
 * Trả về các đơn accepted/scheduled/picking_up/in_progress để hiển thị calendar.
 */
async function getProviderSchedule(providerId, fromDate, toDate) {
  const from = fromDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const to   = toDate   || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select(`
      id, order_number, status,
      pickup_address, delivery_address,
      scheduled_pickup_time, estimated_duration,
      total_price, deposit_amount,
      customer:customer_id ( id, full_name, phone, avatar_url )
    `)
    .eq('provider_id', providerId)
    .in('status', ['accepted', 'scheduled', 'picking_up', 'picked_up', 'in_progress', 'delivering', 'completed'])
    .gte('scheduled_pickup_time', from)
    .lte('scheduled_pickup_time', to)
    .order('scheduled_pickup_time', { ascending: true });

  if (error) throw httpError(500, error.message, 'db_error');
  return data || [];
}

/**
 * Customer hủy đơn khi provider chưa bắt đầu sau giờ hẹn.
 * - accepted + scheduled_pickup_time + 30 phút đã qua → hoàn 100%
 * - scheduled → áp dụng chính sách hủy theo mốc ngày
 */
async function cancelByCustomerTimeout(orderId, customerId) {
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select('id, status, customer_id, provider_id, pickup_address, delivery_address, provider_accepted_at, scheduled_pickup_time, deposit_paid, deposit_amount')
    .eq('id', orderId)
    .maybeSingle();

  if (error || !order) throw httpError(404, 'Không tìm thấy đơn hàng', 'not_found');
  if (order.customer_id !== customerId) throw httpError(403, 'Không có quyền hủy đơn này', 'forbidden');

  const now = Date.now();

  if (order.status === 'accepted') {
    // Cho phép hủy khi còn ≤15 phút đến giờ hẹn mà provider chưa bắt đầu
    const pickupTime = order.scheduled_pickup_time
      ? new Date(order.scheduled_pickup_time).getTime()
      : null;
    if (!pickupTime || now < pickupTime - 15 * 60 * 1000) {
      const minutesLeft = pickupTime
        ? Math.ceil((pickupTime - 15 * 60 * 1000 - now) / 60000)
        : null;
      const msg = minutesLeft
        ? `Còn ${minutesLeft} phút nữa mới được hủy (nhà xe chưa đến giờ)`
        : 'Không thể hủy đơn này theo kịch bản nhà xe im lặng';
      throw httpError(400, msg, 'too_early');
    }
  } else if (order.status === 'scheduled') {
    // Cho phép hủy bất kể thời gian (chính sách hoàn tiền tính sau)
  } else {
    throw httpError(400, `Không thể hủy đơn ở trạng thái "${order.status}"`, 'cannot_cancel');
  }

  const nowIso = new Date().toISOString();
  await supabaseAdmin
    .from('orders')
    .update({
      status: 'cancelled',
      cancellation_reason: 'Khách hủy — nhà xe không phản hồi',
      cancelled_by: customerId,
      cancelled_at: nowIso,
      updated_at: nowIso,
    })
    .eq('id', orderId);

  // Tạo refund request nếu đã đặt cọc
  if (order.deposit_paid && order.deposit_amount > 0) {
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('order_id', orderId)
      .eq('payment_purpose', 'deposit')
      .eq('status', 'completed')
      .maybeSingle();

    if (payment) {
      await supabaseAdmin.from('refunds').insert({
        order_id: orderId,
        payment_id: payment.id,
        requested_by: customerId,
        refund_amount: order.deposit_amount,
        refund_reason: 'Nhà xe không bắt đầu chuyến sau 6 giờ xác nhận',
        status: 'pending',
      });
    }
  }

  const { createNotification } = require('./notification.service');
  if (order.provider_id) {
    await createNotification(
      order.provider_id,
      'order_cancelled',
      'Khách đã hủy đơn',
      `Đơn ${order.pickup_address || ''} → ${order.delivery_address || ''} đã bị hủy do không phản hồi.`,
      { priority: 'high', actionData: { order_id: orderId } },
    ).catch(() => {});
  }

  return { cancelled: true, refund_requested: order.deposit_paid };
}

module.exports = {
  listOrdersForUser,
  createOrder,
  providerRespond,
  getOrderById,
  acceptOrder,
  startOrder,
  skipOrder,
  declineOrder,
  completeOrder,
  cancelOrder,
  cancelByCustomerTimeout,
  getProviderSchedule,
  uploadDeliveryPhoto,
  checkProviderBan,
  estimateCancelRefund,
  calcOrderExpiresAt,
};
