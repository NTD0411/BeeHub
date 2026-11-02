const { supabaseAdmin } = require('./supabase.service');
const { httpError } = require('./auth.helpers');
const { ensurePublicImageBucket, getImageExtFromMime, COMMON_IMAGE_MIME_TYPES } = require('./storage.helpers');

const PROVIDER_DOCS_BUCKET = 'provider-documents';
/**
 * providers.service.js — Business logic cho Provider module.
 *
 * Features:
 * - #36 Register Provider Account  → auth.service.js (role = provider)
 * - #37 Provider Log In            → auth.service.js (role = provider)
 * - #38 Upload Verification Documents → uploadProviderDocuments()
 * - #39 View Verification Status   → getMyProfile(), getMyDocuments(), requestVerification()
 * - #40 View Provider Dashboard    → getDashboard(), getEarnings(), getSchedule(), updateSchedule()
 */
const { httpError } = require('./auth.helpers');
const { supabaseAdmin } = require('./supabase.service');
const { ensurePublicImageBucket, getImageExtFromMime, COMMON_IMAGE_MIME_TYPES } = require('./storage.helpers');

const PROVIDER_DOCS_BUCKET = 'provider-documents';

/** Mapping key từ frontend upload sang document_type chuẩn trong DB */
const FIELD_TO_DOC_TYPE = {
  cccd_front: 'id_card',
  cccd_back: 'id_card',
  vehicle_registration: 'vehicle_registration',
  driver_license: 'license',
  vehicle_photo: 'insurance',
};

const VALID_DOC_TYPES = ['cccd_front', 'cccd_back', 'vehicle_registration', 'driver_license', 'vehicle_photo'];

const PROVIDER_SELECT = `
  id,
  business_name,
  vehicle_type,
  vehicle_plate,
  base_price,
  price_per_km,
  price_per_floor,
  rating,
  total_reviews,
  total_orders,
  is_verified,
  is_available,
  service_area,
  profiles!provider_profiles_id_fkey(full_name, avatar_url, phone)
`;

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
  if (error) throw Object.assign(new Error(error.message), { status: 400 });

  if (city) {
    const needle = String(city).toLowerCase();
    return (data || []).filter((row) => {
      const areas = Array.isArray(row.service_area) ? row.service_area : [];
      if (areas.length === 0) return needle.includes('đà nẵng') || needle.includes('da nang');
      return areas.some(
        (a) =>
          String(a).toLowerCase().includes(needle) ||
          needle.includes(String(a).toLowerCase()),
      );
    });
  }

  return data;
}

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

async function loadProviderRow(providerId) {
  const { data, error } = await supabaseAdmin
    .from('provider_profiles')
    .select(PROVIDER_SELECT)
    .eq('id', providerId)
    .maybeSingle();

  if (error) {
    if (error.code === '42P01') {
      return loadProviderFromProfilesOnly(providerId);
    }
    throw httpError(500, error.message, 'db_error');
  }
  if (data) return data;

  return loadProviderFromProfilesOnly(providerId);
}

/** Gộp profiles (metadata) + provider_profiles (nhà xe) — tránh SELECT cột không có trên profiles. */
async function loadProviderFromProfilesOnly(providerId) {
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, avatar_url, phone, role')
    .eq('id', providerId)
    .eq('role', 'provider')
    .maybeSingle();

  if (profileError) {
    throw httpError(500, profileError.message, 'db_error');
  }
  if (!profile) return null;

  const { data: pp, error: ppError } = await supabaseAdmin
    .from('provider_profiles')
    .select(
      'id, business_name, vehicle_type, vehicle_plate, base_price, price_per_km, price_per_floor, rating, total_reviews, is_verified, is_available, service_area',
    )
    .eq('id', providerId)
    .maybeSingle();

  if (ppError && ppError.code !== '42P01') {
    throw httpError(500, ppError.message, 'db_error');
  }

  if (!pp) {
    return {
      id: profile.id,
      business_name: profile.full_name,
      vehicle_type: null,
      vehicle_plate: null,
      base_price: null,
      price_per_km: null,
      price_per_floor: null,
      rating: 0,
      total_reviews: 0,
      is_verified: false,
      is_available: false,
      service_area: [],
      profiles: {
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        phone: profile.phone,
      },
    };
  }

  return {
    ...pp,
    profiles: {
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      phone: profile.phone,
    },
  };
}

/** BE-020 — GET /api/providers/:id */
async function getProviderById(providerId, { reviewsLimit = 5 } = {}) {
  const id = String(providerId || '').trim();
  if (!id) {
    throw httpError(400, 'Thiếu id nhà xe', 'validation_error');
  }

  const providerRow = await loadProviderRow(id);
  if (!providerRow) {
    throw httpError(404, 'Không tìm thấy nhà xe', 'not_found');
  }

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

  if (packagesResult.error) {
    throw httpError(500, packagesResult.error.message, 'db_error');
  }
  if (reviewsResult.error) {
    throw httpError(500, reviewsResult.error.message, 'db_error');
  }
  if (summaryResult.error) {
    throw httpError(500, summaryResult.error.message, 'db_error');
  }

  const base = mapProviderRow(providerRow);

  return {
    ...base,
    packages: (packagesResult.data || []).map(mapServicePackage),
    reviews_summary: summaryResult.data
      ? {
          total_reviews: summaryResult.data.total_reviews ?? 0,
          average_rating: Number(summaryResult.data.average_rating ?? 0),
          rating_5_count: summaryResult.data.rating_5_count ?? 0,
          rating_4_count: summaryResult.data.rating_4_count ?? 0,
          rating_3_count: summaryResult.data.rating_3_count ?? 0,
          rating_2_count: summaryResult.data.rating_2_count ?? 0,
          rating_1_count: summaryResult.data.rating_1_count ?? 0,
          avg_service_quality: Number(summaryResult.data.avg_service_quality ?? 0),
          avg_punctuality: Number(summaryResult.data.avg_punctuality ?? 0),
          avg_professionalism: Number(summaryResult.data.avg_professionalism ?? 0),
          avg_value_for_money: Number(summaryResult.data.avg_value_for_money ?? 0),
          response_rate: Number(summaryResult.data.response_rate ?? 0),
        }
      : null,
    reviews: (reviewsResult.data || []).map(mapReview),
  };
}

// ── GET /api/providers/me/earnings?period=week|month|year ─────────────────────
async function getEarnings(providerId, period = 'week') {
  const now = new Date();
  let from;

  if (period === 'week') {
    from = new Date(now);
    from.setDate(now.getDate() - 6);
    from.setHours(0, 0, 0, 0);
  } else if (period === 'month') {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    from = new Date(now.getFullYear(), 0, 1);
// ---------------------------------------------------------------------------
// Feature #39 — View Verification Status / Provider Profile
// ---------------------------------------------------------------------------

/**
 * Lấy thông tin chi tiết của provider hiện tại (join profiles + provider_profiles).
 * @param {string} providerId
 */
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

  if (error || !data) {
    throw httpError(404, 'Không tìm thấy thông tin tài xế', 'not_found');
  }

  const { provider_profiles: pp, ...profile } = data;
  const ppRow = Array.isArray(pp) ? pp[0] : pp;
  return { ...profile, ...(ppRow || {}) };
}

/**
 * Lấy danh sách giấy tờ đã upload của provider.
 * Trả về cả chuẩn mới (document_type, document_url) lẫn backward-compatible (doc_type, file_url).
 * @param {string} providerId
 */
async function getMyDocuments(providerId) {
  const { data, error } = await supabaseAdmin
    .from('provider_documents')
    .select('id, document_type, document_url, document_number, issue_date, expiry_date, is_verified, notes, created_at')
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false });

  if (error) {
    throw httpError(500, error.message, 'db_error');
  }

  return (data || []).map((doc) => ({
    id: doc.id,
    doc_type: doc.notes || doc.document_type,
    document_type: doc.document_type,
    file_url: doc.document_url,
    document_url: doc.document_url,
    status: doc.is_verified ? 'verified' : 'pending',
    is_verified: doc.is_verified,
    notes: doc.notes,
    created_at: doc.created_at,
    uploaded_at: doc.created_at,
  }));
}

// ---------------------------------------------------------------------------
// Feature #38 — Upload Verification Documents
// ---------------------------------------------------------------------------

/**
 * Upload giấy tờ xác minh của provider lên Supabase Storage và lưu DB.
 * @param {string} providerId
 * @param {Record<string, Express.Multer.File | Express.Multer.File[]>} filesMap
 */
async function uploadProviderDocuments(providerId, filesMap) {
  if (!filesMap || Object.keys(filesMap).length === 0) {
    throw httpError(400, 'Không có file nào được gửi lên', 'missing_files');
  }

  // Đảm bảo bucket public tồn tại
  try {
    await ensurePublicImageBucket(PROVIDER_DOCS_BUCKET, {
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: COMMON_IMAGE_MIME_TYPES,
    });
  } catch {
    // Ignore — bucket có thể được quản lý bởi migration
  }

  const uploaded = [];
  const uploadedUrls = {};

  for (const [field, files] of Object.entries(filesMap)) {
    if (!VALID_DOC_TYPES.includes(field) && !Object.keys(FIELD_TO_DOC_TYPE).includes(field)) {
      continue;
    }

    const file = Array.isArray(files) ? files[0] : files;
    if (!file?.buffer?.length) continue;

    const ext = getImageExtFromMime(file.mimetype);
    if (!ext) {
      throw httpError(400, `File ${field} không phải ảnh hợp lệ`, 'invalid_file_type');
    }

    const objectPath = `${providerId}/${field}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from(PROVIDER_DOCS_BUCKET)
      .upload(objectPath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
        cacheControl: '3600',
      });

    if (uploadError) {
      if (uploadError.message?.includes('Bucket not found')) {
        throw httpError(
          500,
          'Chưa có bucket provider-documents trên Supabase.',
          'storage_bucket_missing',
        );
      }
      throw httpError(500, `Upload ${field} thất bại: ${uploadError.message}`, 'storage_error');
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(PROVIDER_DOCS_BUCKET)
      .getPublicUrl(objectPath);

    const fileUrl = urlData?.publicUrl;
    if (!fileUrl) {
      throw httpError(500, `Không tạo được URL cho ${field}`, 'storage_error');
    }

    uploadedUrls[field] = fileUrl;
    const docType = FIELD_TO_DOC_TYPE[field] || field;

    // Lưu metadata vào bảng provider_documents
    const { error: dbError } = await supabaseAdmin
      .from('provider_documents')
      .upsert(
        {
          provider_id: providerId,
          document_type: docType,
          document_url: fileUrl,
          is_verified: false,
          notes: field,
        },
        { onConflict: 'provider_id,document_type' },
      );

    if (dbError) {
      // Fallback nếu không có constraint ON CONFLICT
      await supabaseAdmin.from('provider_documents').insert({
        provider_id: providerId,
        document_type: docType,
        document_url: fileUrl,
        is_verified: false,
        notes: field,
      });
    }

    uploaded.push({ field, url: fileUrl, document_type: docType });
  }

  if (uploaded.length === 0) {
    throw httpError(400, 'Không có file hợp lệ nào được xử lý', 'no_valid_files');
  }

  // Cập nhật trạng thái provider → pending_verification
  await supabaseAdmin
    .from('profiles')
    .update({ status: 'pending_verification' })
    .eq('id', providerId);

  await supabaseAdmin
    .from('provider_profiles')
    .update({
      verification_status: 'pending',
      is_verified: false,
      verified_at: null,
      verified_by: null,
    })
    .eq('id', providerId);

  // Gửi notification cho admin nếu có bảng notifications
  try {
    const { data: admins } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(10);

    if (admins && admins.length > 0) {
      await supabaseAdmin.from('notifications').insert(
        admins.map((admin) => ({
          user_id: admin.id,
          notification_type: 'provider_verified',
          title: 'Tài xế đã tải lên giấy tờ xác minh',
          body: 'Một tài xế mới đã nộp giấy tờ xác minh và đang chờ xét duyệt.',
          priority: 'high',
        })),
      );
    }
  } catch (_) {
    // Không block flow nếu lỗi thông báo
  }

  return {
    uploaded: uploaded.length,
    documents: uploaded,
    urls: uploadedUrls,
    message: 'Upload thành công. Chờ admin xét duyệt.',
  };
}

/**
 * Yêu cầu admin xét duyệt lại (khi bị reject hoặc nộp bổ sung).
 * @param {string} providerId
 */
async function requestVerification(providerId) {
  const profile = await getMyProfile(providerId);

  if (profile.verification_status === 'pending') {
    throw httpError(400, 'Hồ sơ đang chờ xét duyệt', 'already_pending');
  }
  if (profile.is_verified && profile.verification_status === 'approved') {
    throw httpError(400, 'Tài khoản đã được xác minh thành công', 'already_verified');
  }

  const { error: ppErr } = await supabaseAdmin
    .from('provider_profiles')
    .update({ verification_status: 'pending' })
    .eq('id', providerId);

  if (ppErr) throw httpError(500, ppErr.message, 'db_error');

  await supabaseAdmin
    .from('profiles')
    .update({ status: 'pending_verification' })
    .eq('id', providerId);

  return {
    verification_status: 'pending',
    message: 'Yêu cầu xác minh đã được gửi đến admin.',
  };
}

// ---------------------------------------------------------------------------
// Feature #40 — View Provider Dashboard & Earnings & Schedule
// ---------------------------------------------------------------------------

/**
 * Lấy dữ liệu tổng hợp cho màn hình Dashboard Provider.
 * @param {string} providerId
 */
async function getDashboard(providerId) {
  const profile = await getMyProfile(providerId);

  const { data: orders, error: ordersError } = await supabaseAdmin
    .from('orders')
    .select('id, status, total_price, created_at, pickup_address, delivery_address, service_type')
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false })
    .limit(30);

  if (ordersError) {
    throw httpError(500, ordersError.message, 'db_error');
  }

  const allOrders = orders ?? [];
  const pendingOrders = allOrders.filter((o) => ['pending', 'pending_provider'].includes(o.status));
  const activeOrders = allOrders.filter((o) =>
    ['accepted', 'provider_accepted', 'picking_up', 'in_progress'].includes(o.status),
  );
  const completedOrders = allOrders.filter((o) => o.status === 'completed');

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const earningsThisMonth = completedOrders
    .filter((o) => o.created_at >= monthStart)
    .reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);

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

/**
 * Lấy thu nhập chi tiết theo tuần / tháng / năm.
 * @param {string} providerId
 * @param {'week'|'month'|'year'} period
 */
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
    .select('id, total_price, created_at, status')
    .eq('provider_id', providerId)
    .eq('status', 'completed')
    .gte('created_at', from.toISOString())
    .order('created_at', { ascending: true });

  if (error) throw httpError(500, error.message, 'db_error');

  const orders = data || [];

  const byDate = {};
  for (const o of orders) {
    const date = o.completed_at.slice(0, 10);
    if (!byDate[date]) byDate[date] = { earned: 0, orders: 0 };
    byDate[date].earned += Number(o.total_price) || 0;
    byDate[date].orders += 1;
  const byDate = {};

  for (const o of orders) {
    const d = o.created_at ? o.created_at.slice(0, 10) : '';
    if (!d) continue;
    if (!byDate[d]) byDate[d] = { earned: 0, orders: 0 };
    byDate[d].earned += Number(o.total_price) || 0;
    byDate[d].orders += 1;
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

  const total_earned = orders.reduce((s, o) => s + (Number(o.total_price) || 0), 0);

  return { period, total_earned, total_orders: orders.length, breakdown };
}

// ── GET /api/providers/me/schedule ────────────────────────────────────────────
  const total_earnings = orders.reduce((s, o) => s + (Number(o.total_price) || 0), 0);

  return {
    period,
    from: from.toISOString(),
    to: now.toISOString(),
    total_earnings,
    total_earned: total_earnings,
    completed_orders: orders.length,
    orders,
    breakdown,
  };
}

/**
 * Lịch làm việc trong tuần của provider.
 * @param {string} providerId
 */
async function getSchedule(providerId) {
  const { data, error } = await supabaseAdmin
    .from('provider_availability')
    .select('id, day_of_week, start_time, end_time, is_available')
    .eq('provider_id', providerId)
    .order('day_of_week')
    .order('start_time');

  if (error) throw httpError(500, error.message, 'db_error');

  const DAY_NAMES = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

  const days = Array.from({ length: 7 }, (_, i) => ({
    day_of_week: i,
    day_name: DAY_NAMES[i],
    slots: [],
  }));

  for (const row of data || []) {
    days[row.day_of_week].slots.push({
      id: row.id,
      start_time: row.start_time,
      end_time: row.end_time,
      is_available: row.is_available,
    });
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

// ── PATCH /api/providers/me/schedule ─────────────────────────────────────────
/**
 * Cập nhật lịch làm việc của provider.
 * @param {string} providerId
 * @param {Array<{day_of_week: number, start_time: string, end_time: string, is_available?: boolean}>} slots
 */
async function updateSchedule(providerId, slots) {
  if (!Array.isArray(slots)) throw httpError(400, 'slots phải là mảng', 'validation_error');

  for (const s of slots) {
    if (s.day_of_week == null || s.day_of_week < 0 || s.day_of_week > 6)
      throw httpError(400, 'day_of_week phải từ 0 (CN) đến 6 (T7)', 'validation_error');
    if (!s.start_time || !s.end_time)
      throw httpError(400, 'Thiếu start_time hoặc end_time', 'validation_error');
    if (s.day_of_week == null || s.day_of_week < 0 || s.day_of_week > 6) {
      throw httpError(400, 'day_of_week phải từ 0 (CN) đến 6 (T7)', 'validation_error');
    }
    if (!s.start_time || !s.end_time) {
      throw httpError(400, 'Thiếu start_time hoặc end_time', 'validation_error');
    }
  }

  const { error: delErr } = await supabaseAdmin
    .from('provider_availability')
    .delete()
    .eq('provider_id', providerId);

  if (delErr) throw httpError(500, delErr.message, 'db_error');

  if (slots.length === 0) return getSchedule(providerId);

  const rows = slots.map((s) => ({
    provider_id: providerId,
    day_of_week: Number(s.day_of_week),
    start_time: s.start_time,
    end_time: s.end_time,
    is_available: s.is_available !== false,
  }));

  const { error: insErr } = await supabaseAdmin.from('provider_availability').insert(rows);
  if (insErr) throw httpError(500, insErr.message, 'db_error');

  return getSchedule(providerId);
}

// ── POST /api/providers/me/documents ─────────────────────────────────────────
async function uploadProviderDocuments(providerId, filesMap) {
  if (!filesMap || !Object.keys(filesMap).length) {
    throw httpError(400, 'Không có file được upload', 'validation_error');
  }

  await ensurePublicImageBucket(PROVIDER_DOCS_BUCKET, {
    fileSizeLimit: 5242880,
    allowedMimeTypes: COMMON_IMAGE_MIME_TYPES,
  });

  const uploaded = [];

  for (const [field, files] of Object.entries(filesMap)) {
    const file = Array.isArray(files) ? files[0] : files;
    if (!file?.buffer?.length) continue;

    const ext = getImageExtFromMime(file.mimetype);
    if (!ext) throw httpError(400, 'Chỉ chấp nhận file ảnh', 'invalid_file_type');

    const objectPath = `${providerId}/${field}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from(PROVIDER_DOCS_BUCKET)
      .upload(objectPath, file.buffer, { contentType: file.mimetype, upsert: true });

    if (uploadError) throw httpError(500, uploadError.message, 'storage_error');

    const { data: urlData } = supabaseAdmin.storage
      .from(PROVIDER_DOCS_BUCKET)
      .getPublicUrl(objectPath);
    const url = urlData?.publicUrl;
    if (!url) throw httpError(500, 'Không tạo được URL ảnh', 'storage_error');

    const docType = FIELD_TO_DOC_TYPE[field] || field;
    const { error: dbError } = await supabaseAdmin.from('provider_documents').upsert({
      provider_id: providerId,
      document_type: docType,
      document_url: url,
      is_verified: false,
      notes: field,
    }, { onConflict: 'provider_id,document_type' });

    if (dbError) throw httpError(500, dbError.message, 'db_error');

    uploaded.push({ field, url, document_type: docType });
  }

  if (!uploaded.length) {
    throw httpError(400, 'Không có file hợp lệ', 'validation_error');
  }

  await supabaseAdmin
    .from('profiles')
    .update({ status: 'pending_verification' })
    .eq('id', providerId);

  // If provider re-submits documents (even after being verified),
  // the admin should see them again in the "pending" verification list.
  await supabaseAdmin
    .from('provider_profiles')
    .update({
      verification_status: 'pending',
      is_verified: false,
      verified_at: null,
      verified_by: null,
    })
    .eq('id', providerId);

  return { uploaded: uploaded.length, documents: uploaded };
}

async function getMyDocuments(providerId) {
  const { supabaseAdmin } = require('./supabase.service');
  const { data, error } = await supabaseAdmin
    .from('provider_documents')
    .select('id, document_type, document_url, document_number, issue_date, expiry_date, is_verified, notes, created_at')
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

async function getQuotedOrders(providerId) {
  const { supabaseAdmin } = require('./supabase.service');

  // Lấy tất cả quotes đã gửi của provider này
/**
 * Lấy danh sách các đơn mà provider đã gửi báo giá (bidding quotes).
 * @param {string} providerId
 */
async function getQuotedOrders(providerId) {
  const { data: quotes, error: qErr } = await supabaseAdmin
    .from('order_quotes')
    .select('order_id, total_price, status, created_at, note')
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false });

  if (qErr) throw qErr;
  if (!quotes || quotes.length === 0) return { orders: [] };

  const orderIds = [...new Set(quotes.map((q) => q.order_id))];

  // Lấy thông tin order (không join trực tiếp với users)
  const { data: orders, error: oErr } = await supabaseAdmin
    .from('orders')
    .select('id, status, deposit_paid, pickup_address, delivery_address, base_price, total_price, created_at, customer_id')
    .in('id', orderIds)
    .order('created_at', { ascending: false });

  if (oErr) throw oErr;

  // Lấy thông tin profiles của từng customer
  const customerIds = [...new Set((orders || []).map((o) => o.customer_id).filter(Boolean))];
  let profileMap = {};
  if (customerIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, phone')
      .in('id', customerIds);
    profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
  }

  // Gắn thêm quote info và customer vào mỗi order
  const quoteByOrder = Object.fromEntries(quotes.map((q) => [q.order_id, q]));
  const result = (orders || []).map((o) => ({
    ...o,
    customer: profileMap[o.customer_id] ?? null,
    my_quote: quoteByOrder[o.id] ?? null,
  }));

  return { orders: result };
}

// ── POST /api/providers/me/request-verification ──────────────────────────────
// Tài xế yêu cầu admin xét duyệt lại sau khi đã upload đủ giấy tờ mới
async function requestVerification(providerId) {
  // Kiểm tra provider tồn tại và đang ở trạng thái rejected hoặc chưa verified
  const { data: pp, error: ppErr } = await supabaseAdmin
    .from('provider_profiles')
    .select('id, verification_status, is_verified')
    .eq('id', providerId)
    .maybeSingle();

  if (ppErr) throw httpError(500, ppErr.message, 'db_error');
  if (!pp) throw httpError(404, 'Không tìm thấy hồ sơ tài xế', 'not_found');

  if (pp.is_verified) {
    throw httpError(400, 'Tài khoản đã được xác minh, không cần yêu cầu lại', 'already_verified');
  }

  // Kiểm tra đã có ít nhất 1 giấy tờ chưa
  const { count, error: docErr } = await supabaseAdmin
    .from('provider_documents')
    .select('id', { count: 'exact', head: true })
    .eq('provider_id', providerId);

  if (docErr) throw httpError(500, docErr.message, 'db_error');
  if (!count || count === 0) {
    throw httpError(400, 'Vui lòng upload giấy tờ trước khi yêu cầu xác minh', 'no_documents');
  }

  // Chuyển về pending để admin duyệt lại
  const { error: updateErr } = await supabaseAdmin
    .from('provider_profiles')
    .update({
      verification_status: 'pending',
      verification_notes: null,
      verified_at: null,
      verified_by: null,
    })
    .eq('id', providerId);

  if (updateErr) throw httpError(500, updateErr.message, 'db_error');

  await supabaseAdmin
    .from('profiles')
    .update({ status: 'pending_verification' })
    .eq('id', providerId);

  // Gửi notification cho admin (không block nếu lỗi)
  try {
    const { data: admins } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(10);

    if (admins && admins.length > 0) {
      await supabaseAdmin.from('notifications').insert(
        admins.map((admin) => ({
          user_id: admin.id,
          notification_type: 'provider_verified',
          title: 'Tài xế yêu cầu xác minh lại',
          body: 'Một tài xế đã nộp lại giấy tờ và yêu cầu xét duyệt.',
          priority: 'high',
        })),
      );
    }
  } catch (_) {
    // Không block response nếu gửi notification lỗi
  }

  return { verification_status: 'pending', message: 'Yêu cầu xác minh đã được gửi đến admin.' };
}

module.exports = {
  browseProviders,
  getProviderById,
  getEarnings,
  getSchedule,
  updateSchedule,
  uploadProviderDocuments,
  getMyDocuments,
  getQuotedOrders,
  requestVerification,
  const { data: orders, error: oErr } = await supabaseAdmin
    .from('orders')
    .select('id, status, deposit_paid, pickup_address, delivery_address, base_price, total_price, created_at, customer_id')
    .in('id', orderIds);

  if (oErr) throw oErr;
  return { orders: orders || [] };
}

/**
 * Tìm kiếm danh sách provider công khai (dành cho khách hàng duyệt).
 */
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

  if (city) {
    const needle = String(city).toLowerCase();
    return (data || []).filter((row) => {
      const areas = Array.isArray(row.service_area) ? row.service_area : [];
      if (areas.length === 0) return needle.includes('đà nẵng') || needle.includes('da nang');
      return areas.some(
        (a) =>
          String(a).toLowerCase().includes(needle) ||
          needle.includes(String(a).toLowerCase()),
      );
    });
  }

  return data;
}

/**
 * Xem profile công khai của 1 provider kèm gói dịch vụ và đánh giá.
 */
async function getProviderById(providerId) {
  const { data, error } = await supabaseAdmin
    .from('provider_profiles')
    .select(PROVIDER_SELECT)
    .eq('id', providerId)
    .single();

  if (error || !data) {
    throw httpError(404, 'Không tìm thấy nhà xe', 'not_found');
  }

  return data;
}

module.exports = {
  getMyProfile,
  getMyDocuments,
  uploadProviderDocuments,
  requestVerification,
  getDashboard,
  getEarnings,
  getSchedule,
  updateSchedule,
  getQuotedOrders,
  browseProviders,
  getProviderById,
};
