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
    .select('id, total_price, created_at, status')
    .eq('provider_id', providerId)
    .eq('status', 'completed')
    .gte('created_at', from.toISOString())
    .order('created_at', { ascending: true });

  if (error) throw httpError(500, error.message, 'db_error');

  const orders = data || [];
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

/**
 * Cập nhật lịch làm việc của provider.
 * @param {string} providerId
 * @param {Array<{day_of_week: number, start_time: string, end_time: string, is_available?: boolean}>} slots
 */
async function updateSchedule(providerId, slots) {
  if (!Array.isArray(slots)) throw httpError(400, 'slots phải là mảng', 'validation_error');

  for (const s of slots) {
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
