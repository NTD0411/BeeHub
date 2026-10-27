const { supabaseAdmin } = require('./supabase.service');
const { httpError } = require('./auth.helpers');
const {
  ensurePublicImageBucket,
  getImageExtFromMime,
  COMMON_IMAGE_MIME_TYPES,
} = require('./storage.helpers');

const PROVIDER_DOCS_BUCKET = 'provider-documents';
const FIELD_TO_DOC_TYPE = {
  cccd_front: 'id_card',
  cccd_back: 'id_card',
  vehicle_registration: 'vehicle_registration',
  driver_license: 'license',
  vehicle_photo: 'insurance',
};
const PROVIDER_SELECT = `
  id, business_name, vehicle_type, vehicle_plate, base_price, price_per_km,
  price_per_floor, rating, total_reviews, total_orders, is_verified,
  is_available, service_area,
  profiles!provider_profiles_id_fkey(full_name, avatar_url, phone)
`;

function mapProviderRow(row) {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  const fullName = profile?.full_name ?? null;
  const businessName = row.business_name ?? fullName ?? 'Nhà xe';
  return {
    id: row.id,
    name: businessName,
    business_name: row.business_name ?? businessName,
    full_name: fullName,
    avatar_url: profile?.avatar_url ?? null,
    phone: profile?.phone ?? null,
    vehicle_type: row.vehicle_type,
    vehicle_plate: row.vehicle_plate ?? null,
    base_price: row.base_price != null ? Number(row.base_price) : null,
    price_per_km: row.price_per_km != null ? Number(row.price_per_km) : null,
    price_per_floor: row.price_per_floor != null ? Number(row.price_per_floor) : null,
    rating: row.rating != null ? Number(row.rating) : 0,
    total_reviews: row.total_reviews ?? 0,
    completed_trips: row.total_orders ?? 0,
    is_verified: Boolean(row.is_verified),
    is_available: Boolean(row.is_available),
    service_area: row.service_area ?? [],
  };
}

function mapServicePackage(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    service_type: row.service_type,
    vehicle_size: row.vehicle_size,
    base_price: Number(row.base_price),
    price_per_km: Number(row.price_per_km ?? 0),
    price_per_floor: Number(row.price_per_floor ?? 0),
    helper_count: row.helper_count ?? 0,
    includes_packing: Boolean(row.includes_packing),
    includes_insurance: Boolean(row.includes_insurance),
    max_weight_kg: row.max_weight_kg != null ? Number(row.max_weight_kg) : null,
    estimated_duration_hours:
      row.estimated_duration_hours != null ? Number(row.estimated_duration_hours) : null,
  };
}

function mapReview(row) {
  const customer = Array.isArray(row.customer) ? row.customer[0] : row.customer;
  return {
    id: row.id,
    order_id: row.order_id,
    rating: row.rating,
    title: row.title ?? null,
    comment: row.comment ?? null,
    tags: row.tags ?? [],
    created_at: row.created_at,
    customer_name: customer?.full_name ?? 'Khách hàng',
  };
}

async function browseProviders({ city, minRating, limit = 20 }) {
  let query = supabaseAdmin
    .from('provider_profiles')
    .select(PROVIDER_SELECT)
    .eq('is_verified', true)
    .eq('is_available', true)
    .order('rating', { ascending: false })
    .limit(limit);

  if (minRating) query = query.gte('rating', minRating);

  const { data, error } = await query;
  if (error) throw httpError(400, error.message, 'db_error');

  if (!city) return (data || []).map(mapProviderRow);

  const needle = String(city).toLowerCase();
  return (data || [])
    .filter((row) => {
      const areas = Array.isArray(row.service_area) ? row.service_area : [];
      if (areas.length === 0) return needle.includes('đà nẵng') || needle.includes('da nang');
      return areas.some((area) => {
        const value = String(area).toLowerCase();
        return value.includes(needle) || needle.includes(value);
      });
    })
    .map(mapProviderRow);
}

async function loadProviderRow(providerId) {
  const { data, error } = await supabaseAdmin
    .from('provider_profiles')
    .select(PROVIDER_SELECT)
    .eq('id', providerId)
    .maybeSingle();

  if (error) {
    if (error.code === '42P01') return loadProviderFromProfilesOnly(providerId);
    throw httpError(500, error.message, 'db_error');
  }
  if (data) return data;
  return loadProviderFromProfilesOnly(providerId);
}

async function loadProviderFromProfilesOnly(providerId) {
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, avatar_url, phone, role')
    .eq('id', providerId)
    .eq('role', 'provider')
    .maybeSingle();

  if (profileError) throw httpError(500, profileError.message, 'db_error');
  if (!profile) return null;

  const { data: provider, error: providerError } = await supabaseAdmin
    .from('provider_profiles')
    .select(
      'id, business_name, vehicle_type, vehicle_plate, base_price, price_per_km, price_per_floor, rating, total_reviews, is_verified, is_available, service_area',
    )
    .eq('id', providerId)
    .maybeSingle();

  if (providerError && providerError.code !== '42P01') {
    throw httpError(500, providerError.message, 'db_error');
  }

  return {
    id: providerId,
    business_name: provider?.business_name ?? profile.full_name,
    vehicle_type: provider?.vehicle_type ?? null,
    vehicle_plate: provider?.vehicle_plate ?? null,
    base_price: provider?.base_price ?? null,
    price_per_km: provider?.price_per_km ?? null,
    price_per_floor: provider?.price_per_floor ?? null,
    rating: provider?.rating ?? 0,
    total_reviews: provider?.total_reviews ?? 0,
    is_verified: provider?.is_verified ?? false,
    is_available: provider?.is_available ?? false,
    service_area: provider?.service_area ?? [],
    profiles: {
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      phone: profile.phone,
    },
  };
}

async function getProviderById(providerId, { reviewsLimit = 5 } = {}) {
  const id = String(providerId || '').trim();
  if (!id) throw httpError(400, 'Thiếu id nhà xe', 'validation_error');

  const providerRow = await loadProviderRow(id);
  if (!providerRow) throw httpError(404, 'Không tìm thấy nhà xe', 'not_found');

  const limit = Math.min(Math.max(parseInt(String(reviewsLimit), 10) || 5, 1), 20);
  const [packagesResult, reviewsResult, summaryResult] = await Promise.all([
    supabaseAdmin
      .from('service_packages')
      .select(
        'id, name, description, service_type, vehicle_size, base_price, price_per_km, price_per_floor, helper_count, includes_packing, includes_insurance, max_weight_kg, estimated_duration_hours, sort_order',
      )
      .eq('provider_id', id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabaseAdmin
      .from('reviews')
      .select(
        'id, order_id, rating, title, comment, tags, created_at, customer:profiles!customer_id(full_name)',
      )
      .eq('provider_id', id)
      .eq('is_published', true)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .limit(limit),
    supabaseAdmin.from('provider_reviews_summary').select('*').eq('provider_id', id).maybeSingle(),
  ]);

  for (const result of [packagesResult, reviewsResult, summaryResult]) {
    if (result.error) throw httpError(500, result.error.message, 'db_error');
  }

  const summary = summaryResult.data;
  return {
    ...mapProviderRow(providerRow),
    packages: (packagesResult.data || []).map(mapServicePackage),
    reviews_summary: summary
      ? {
          total_reviews: summary.total_reviews ?? 0,
          average_rating: Number(summary.average_rating ?? 0),
          rating_5_count: summary.rating_5_count ?? 0,
          rating_4_count: summary.rating_4_count ?? 0,
          rating_3_count: summary.rating_3_count ?? 0,
          rating_2_count: summary.rating_2_count ?? 0,
          rating_1_count: summary.rating_1_count ?? 0,
          avg_service_quality: Number(summary.avg_service_quality ?? 0),
          avg_punctuality: Number(summary.avg_punctuality ?? 0),
          avg_professionalism: Number(summary.avg_professionalism ?? 0),
          avg_value_for_money: Number(summary.avg_value_for_money ?? 0),
          response_rate: Number(summary.response_rate ?? 0),
        }
      : null,
    reviews: (reviewsResult.data || []).map(mapReview),
  };
}

async function getMyProfile(providerId) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select(`
      id, email, full_name, phone, avatar_url, role, status,
      created_at, updated_at,
      provider_profiles (
        business_name, vehicle_type, vehicle_plate, is_verified, verification_status,
        verification_notes, base_price, price_per_km, price_per_floor,
        rating, total_reviews, total_orders, compliance_score, is_available, service_area
      )
    `)
    .eq('id', providerId)
    .single();

  if (error || !data) throw httpError(404, 'Không tìm thấy thông tin tài xế', 'not_found');
  const { provider_profiles: providerProfile, ...profile } = data;
  const provider = Array.isArray(providerProfile) ? providerProfile[0] : providerProfile;
  return { ...profile, ...(provider || {}) };
}

async function getMyDocuments(providerId) {
  const { data, error } = await supabaseAdmin
    .from('provider_documents')
    .select(
      'id, document_type, document_url, document_number, issue_date, expiry_date, is_verified, notes, created_at',
    )
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false });

  if (error) throw httpError(500, error.message, 'db_error');
  return (data || []).map((doc) => ({
    ...doc,
    doc_type: doc.notes || doc.document_type,
    file_url: doc.document_url,
    status: doc.is_verified ? 'verified' : 'pending',
    uploaded_at: doc.created_at,
  }));
}

async function uploadProviderDocuments(providerId, filesMap) {
  if (!filesMap || Object.keys(filesMap).length === 0) {
    throw httpError(400, 'Không có file nào được gửi lên', 'missing_files');
  }

  await ensurePublicImageBucket(PROVIDER_DOCS_BUCKET, {
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: COMMON_IMAGE_MIME_TYPES,
  });

  const uploaded = [];
  const uploadedUrls = {};
  for (const [field, files] of Object.entries(filesMap)) {
    if (!Object.hasOwn(FIELD_TO_DOC_TYPE, field)) continue;
    const file = Array.isArray(files) ? files[0] : files;
    if (!file?.buffer?.length) continue;

    const ext = getImageExtFromMime(file.mimetype);
    if (!ext) throw httpError(400, `File ${field} không phải ảnh hợp lệ`, 'invalid_file_type');

    const objectPath = `${providerId}/${field}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from(PROVIDER_DOCS_BUCKET)
      .upload(objectPath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
        cacheControl: '3600',
      });

    if (uploadError) throw httpError(500, uploadError.message, 'storage_error');

    const { data: urlData } = supabaseAdmin.storage
      .from(PROVIDER_DOCS_BUCKET)
      .getPublicUrl(objectPath);
    const fileUrl = urlData?.publicUrl;
    if (!fileUrl) throw httpError(500, `Không tạo được URL cho ${field}`, 'storage_error');

    const documentType = FIELD_TO_DOC_TYPE[field];
    const { error: dbError } = await supabaseAdmin.from('provider_documents').upsert(
      {
        provider_id: providerId,
        document_type: documentType,
        document_url: fileUrl,
        is_verified: false,
        notes: field,
      },
      { onConflict: 'provider_id,document_type' },
    );
    if (dbError) throw httpError(500, dbError.message, 'db_error');

    uploadedUrls[field] = fileUrl;
    uploaded.push({ field, url: fileUrl, document_type: documentType });
  }

  if (uploaded.length === 0) {
    throw httpError(400, 'Không có file hợp lệ nào được xử lý', 'no_valid_files');
  }

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ status: 'pending_verification' })
    .eq('id', providerId);
  if (profileError) throw httpError(500, profileError.message, 'db_error');

  const { error: providerError } = await supabaseAdmin
    .from('provider_profiles')
    .update({
      verification_status: 'pending',
      is_verified: false,
      verified_at: null,
      verified_by: null,
    })
    .eq('id', providerId);
  if (providerError) throw httpError(500, providerError.message, 'db_error');

  return {
    uploaded: uploaded.length,
    documents: uploaded,
    urls: uploadedUrls,
    message: 'Upload thành công. Chờ admin xét duyệt.',
  };
}

async function requestVerification(providerId) {
  const profile = await getMyProfile(providerId);
  if (profile.verification_status === 'pending') {
    throw httpError(400, 'Hồ sơ đang chờ xét duyệt', 'already_pending');
  }
  if (profile.is_verified && profile.verification_status === 'approved') {
    throw httpError(400, 'Tài khoản đã được xác minh thành công', 'already_verified');
  }

  const { count, error: documentsError } = await supabaseAdmin
    .from('provider_documents')
    .select('id', { count: 'exact', head: true })
    .eq('provider_id', providerId);
  if (documentsError) throw httpError(500, documentsError.message, 'db_error');
  if (!count) throw httpError(400, 'Vui lòng upload giấy tờ trước khi yêu cầu xác minh', 'no_documents');

  const { error: providerError } = await supabaseAdmin
    .from('provider_profiles')
    .update({
      verification_status: 'pending',
      verification_notes: null,
      verified_at: null,
      verified_by: null,
    })
    .eq('id', providerId);
  if (providerError) throw httpError(500, providerError.message, 'db_error');

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ status: 'pending_verification' })
    .eq('id', providerId);
  if (profileError) throw httpError(500, profileError.message, 'db_error');

  return {
    verification_status: 'pending',
    message: 'Yêu cầu xác minh đã được gửi đến admin.',
  };
}

async function getDashboard(providerId) {
  const profile = await getMyProfile(providerId);
  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select('id, status, total_price, created_at, pickup_address, delivery_address, service_type')
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) throw httpError(500, error.message, 'db_error');

  const allOrders = orders || [];
  const pendingOrders = allOrders.filter((order) =>
    ['pending', 'pending_provider'].includes(order.status),
  );
  const activeOrders = allOrders.filter((order) =>
    ['accepted', 'provider_accepted', 'picking_up', 'in_progress'].includes(order.status),
  );
  const completedOrders = allOrders.filter((order) => order.status === 'completed');
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const earningsThisMonth = completedOrders
    .filter((order) => order.created_at >= monthStart.toISOString())
    .reduce((sum, order) => sum + (Number(order.total_price) || 0), 0);

  return {
    profile: {
      id: profile.id,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      business_name: profile.business_name,
      is_verified: profile.is_verified,
      verification_status: profile.verification_status,
      verification_notes: profile.verification_notes,
      rating: profile.rating,
      total_reviews: profile.total_reviews,
      compliance_score: profile.compliance_score,
      is_available: profile.is_available,
    },
    stats: {
      pending_orders: pendingOrders.length,
      active_orders: activeOrders.length,
      completed_orders: completedOrders.length,
      earnings_this_month: earningsThisMonth,
    },
    recent_orders: allOrders.slice(0, 10),
    pending_orders: pendingOrders,
    active_orders: activeOrders,
  };
}

async function getEarnings(providerId, period = 'month') {
  const now = new Date();
  let from;
  switch (period) {
    case 'week':
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      from = new Date(now.getFullYear(), 0, 1);
      break;
    case 'month':
    default:
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
  }

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('id, total_price, completed_at')
    .eq('provider_id', providerId)
    .eq('status', 'completed')
    .gte('completed_at', from.toISOString())
    .order('completed_at', { ascending: true });
  if (error) throw httpError(500, error.message, 'db_error');

  const orders = data || [];
  const byDate = {};
  for (const order of orders) {
    if (!order.completed_at) continue;
    const date = order.completed_at.slice(0, 10);
    if (!byDate[date]) byDate[date] = { earned: 0, orders: 0 };
    byDate[date].earned += Number(order.total_price) || 0;
    byDate[date].orders += 1;
  }

  const breakdown = [];
  const cursor = new Date(from);
  while (cursor <= now) {
    const date = cursor.toISOString().slice(0, 10);
    breakdown.push({
      date,
      earned: byDate[date]?.earned ?? 0,
      orders: byDate[date]?.orders ?? 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  const totalEarnings = orders.reduce((sum, order) => sum + (Number(order.total_price) || 0), 0);
  return {
    period,
    from: from.toISOString(),
    to: now.toISOString(),
    total_earnings: totalEarnings,
    total_earned: totalEarnings,
    completed_orders: orders.length,
    orders,
    breakdown,
  };
}

async function getSchedule(providerId) {
  const { data, error } = await supabaseAdmin
    .from('provider_availability')
    .select('id, day_of_week, start_time, end_time, is_available')
    .eq('provider_id', providerId)
    .order('day_of_week')
    .order('start_time');
  if (error) throw httpError(500, error.message, 'db_error');

  const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const days = Array.from({ length: 7 }, (_, day) => ({
    day_of_week: day,
    day_name: dayNames[day],
    slots: [],
  }));
  for (const row of data || []) {
    if (days[row.day_of_week]) {
      days[row.day_of_week].slots.push({
        id: row.id,
        start_time: row.start_time,
        end_time: row.end_time,
        is_available: row.is_available,
      });
    }
  }
  return days;
}

async function updateSchedule(providerId, slots) {
  if (!Array.isArray(slots)) throw httpError(400, 'slots phải là mảng', 'validation_error');
  for (const slot of slots) {
    if (slot.day_of_week == null || slot.day_of_week < 0 || slot.day_of_week > 6) {
      throw httpError(400, 'day_of_week phải từ 0 (CN) đến 6 (T7)', 'validation_error');
    }
    if (!slot.start_time || !slot.end_time) {
      throw httpError(400, 'Thiếu start_time hoặc end_time', 'validation_error');
    }
  }

  const { error: deleteError } = await supabaseAdmin
    .from('provider_availability')
    .delete()
    .eq('provider_id', providerId);
  if (deleteError) throw httpError(500, deleteError.message, 'db_error');
  if (slots.length === 0) return getSchedule(providerId);

  const rows = slots.map((slot) => ({
    provider_id: providerId,
    day_of_week: Number(slot.day_of_week),
    start_time: slot.start_time,
    end_time: slot.end_time,
    is_available: slot.is_available !== false,
  }));
  const { error: insertError } = await supabaseAdmin
    .from('provider_availability')
    .insert(rows);
  if (insertError) throw httpError(500, insertError.message, 'db_error');
  return getSchedule(providerId);
}

async function getQuotedOrders(providerId) {
  const { data: quotes, error: quotesError } = await supabaseAdmin
    .from('order_quotes')
    .select('order_id, total_price, status, created_at, note')
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false });
  if (quotesError) throw httpError(500, quotesError.message, 'db_error');
  if (!quotes?.length) return { orders: [] };

  const orderIds = [...new Set(quotes.map((quote) => quote.order_id))];
  const { data: orders, error: ordersError } = await supabaseAdmin
    .from('orders')
    .select('id, status, deposit_paid, pickup_address, delivery_address, base_price, total_price, created_at, customer_id')
    .in('id', orderIds)
    .order('created_at', { ascending: false });
  if (ordersError) throw httpError(500, ordersError.message, 'db_error');

  const customerIds = [...new Set((orders || []).map((order) => order.customer_id).filter(Boolean))];
  let profilesById = {};
  if (customerIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, phone')
      .in('id', customerIds);
    if (profilesError) throw httpError(500, profilesError.message, 'db_error');
    profilesById = Object.fromEntries((profiles || []).map((profile) => [profile.id, profile]));
  }

  const quotesByOrder = Object.fromEntries(quotes.map((quote) => [quote.order_id, quote]));
  return {
    orders: (orders || []).map((order) => ({
      ...order,
      customer: profilesById[order.customer_id] ?? null,
      my_quote: quotesByOrder[order.id] ?? null,
    })),
  };
}

module.exports = {
  browseProviders,
  getProviderById,
  getMyProfile,
  getMyDocuments,
  uploadProviderDocuments,
  requestVerification,
  getDashboard,
  getEarnings,
  getSchedule,
  updateSchedule,
  getQuotedOrders,
};
