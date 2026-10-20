const { httpError, normalizePhone } = require('./auth.helpers');
const { supabaseAdmin } = require('./supabase.service');
const { getImageExtFromMime, ensurePublicImageBucket, COMMON_IMAGE_MIME_TYPES } = require('./storage.helpers');

const AVATAR_BUCKET = 'avatars';

/** Validation helpers */
function validateFullName(fullName) {
  const trimmed = String(fullName || '').trim();
  if (!trimmed) {
    throw httpError(400, 'Tên đầy đủ không được để trống', 'validation_error');
  }
  if (trimmed.length > 255) {
    throw httpError(400, 'Tên đầy đủ không được vượt quá 255 ký tự', 'validation_error');
  }
  return trimmed;
}

function validateGender(gender) {
  const valid = ['male', 'female'];
  if (!valid.includes(String(gender || '').toLowerCase())) {
    throw httpError(400, 'Giới tính chỉ có thể là male hoặc female', 'validation_error');
  }
  return String(gender).toLowerCase();
}

function validateDateOfBirth(date) {
  if (!date) return null;
  const trimmed = String(date).trim();
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(trimmed)) {
    throw httpError(400, 'Ngày sinh phải có format YYYY-MM-DD', 'validation_error');
  }
  const dateObj = new Date(trimmed);
  if (isNaN(dateObj.getTime())) {
    throw httpError(400, 'Ngày sinh không hợp lệ', 'validation_error');
  }
  const now = new Date();
  if (dateObj > now) {
    throw httpError(400, 'Ngày sinh không thể ở trong tương lai', 'validation_error');
  }
  const age = now.getFullYear() - dateObj.getFullYear();
  if (age < 13) {
    throw httpError(400, 'Tuổi phải từ 13 tuổi trở lên', 'validation_error');
  }
  return trimmed;
}

function validateAvatarUrl(url) {
  if (!url) return null;
  const trimmed = String(url).trim();
  try {
    new URL(trimmed);
    return trimmed;
  } catch (err) {
    throw httpError(400, 'URL avatar không hợp lệ', 'validation_error');
  }
}

function validateAddress(address) {
  if (!address) return null;
  const trimmed = String(address).trim();
  if (trimmed.length > 255) {
    throw httpError(400, 'Địa chỉ không được vượt quá 255 ký tự', 'validation_error');
  }
  return trimmed;
}

/** API-008 — GET /api/customers/me */
async function getProfile(userId) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select(`
      id, email, full_name, phone, avatar_url, role, status,
      date_of_birth, gender, referral_code, last_seen_at,
      created_at, updated_at,
      customer_profiles (
        student_id, university, address, city, district, ward,
        total_orders, total_spent, loyalty_points, preferred_payment_method
      )
    `)
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw httpError(404, 'Không tìm thấy profile', 'not_found');
  }

  const { customer_profiles: cp, ...profile } = data;
  const cpRow = Array.isArray(cp) ? cp[0] : cp;
  return { ...profile, ...(cpRow || {}) };
}

/** API-009 — PATCH /api/customers/me */
async function updateProfile(userId, body) {
  if (body?.email !== undefined || body?.role !== undefined) {
    throw httpError(400, 'Không được sửa email hoặc role', 'validation_error');
  }

  // Blacklist sensitive fields
  const blacklistedFields = ['id', 'status', 'password', 'created_at', 'updated_at', 
                             'total_orders', 'total_spent', 'loyalty_points', 'referral_code'];
  for (const field of blacklistedFields) {
    if (body?.[field] !== undefined) {
      throw httpError(400, `Không được sửa field ${field}`, 'validation_error');
    }
  }

  const {
    full_name,
    phone,
    avatar_url,
    date_of_birth,
    gender,
    student_id,
    university,
    address,
    default_pickup_address,
  } = body || {};

  const profileUpdates = {};
  if (full_name !== undefined) {
    profileUpdates.full_name = validateFullName(full_name);
  }
  if (phone !== undefined) {
    profileUpdates.phone = normalizePhone(phone);
  }
  if (avatar_url !== undefined) {
    profileUpdates.avatar_url = validateAvatarUrl(avatar_url);
  }
  if (date_of_birth !== undefined) {
    profileUpdates.date_of_birth = validateDateOfBirth(date_of_birth);
  }
  if (gender !== undefined) {
    profileUpdates.gender = validateGender(gender);
  }
  if (default_pickup_address !== undefined) {
    profileUpdates.default_pickup_address = validateAddress(default_pickup_address);
  }

  if (Object.keys(profileUpdates).length > 0) {
    const { error } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdates)
      .eq('id', userId);
    if (error) throw httpError(500, error.message, 'db_error');
  }

  const customerUpdates = {};
  if (student_id !== undefined) customerUpdates.student_id = student_id;
  if (university !== undefined) customerUpdates.university = university;
  if (address !== undefined) customerUpdates.address = validateAddress(address);

  if (Object.keys(customerUpdates).length > 0) {
    const { error } = await supabaseAdmin
      .from('customer_profiles')
      .upsert({ id: userId, ...customerUpdates }, { onConflict: 'id' });
    if (error) throw httpError(500, error.message, 'db_error');
  }

  if (
    Object.keys(profileUpdates).length === 0 &&
    Object.keys(customerUpdates).length === 0
  ) {
    throw httpError(400, 'Không có trường hợp lệ để cập nhật', 'validation_error');
  }

  return getProfile(userId);
}

function shortPlaceTitle(address) {
  const parts = String(address)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return parts[0] || address;
}

const DEFAULT_COMBO_HINT =
  'Combo — giá niêm yết, không chờ báo giá. Bước sau: mô tả trọ → chọn ngày giờ → chọn gói.';

const DEFAULT_QUOTE_FLOW = {
  title: 'Báo giá minh bạch — không cần bản đồ',
  subtitle:
    'Bước tiếp: mô tả trọ → chọn giờ mong muốn → nhà xe báo giá theo khung đó.',
};

function placeFromAddress(address, lat, lng) {
  const trimmed = String(address || '').trim();
  if (!trimmed) return null;
  return {
    title: shortPlaceTitle(trimmed),
    address: trimmed,
    lat: lat != null ? Number(lat) : null,
    lng: lng != null ? Number(lng) : null,
  };
}

function buildMapPreviewUrl(lat, lng) {
  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=14&size=800x320&markers=${lat},${lng},red-pushpin`;
}

async function getHiddenRecentAddresses(userId) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('hidden_recent_addresses')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw httpError(500, error.message, 'db_error');
  }

  const raw = data?.hidden_recent_addresses;
  if (!Array.isArray(raw)) return new Set();
  return new Set(raw.map((a) => String(a || '').trim()).filter(Boolean));
}

async function getSavedRecentPlaces(userId) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('saved_recent_places')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw httpError(500, error.message, 'db_error');
  }

  const raw = data?.saved_recent_places;
  if (!Array.isArray(raw)) return [];
  return raw;
}

async function collectAllRecentPlaces(userId, limit, hiddenSet = new Set()) {
  const saved = await getSavedRecentPlaces(userId);
  const fromOrders = await collectRecentPlacesFromOrders(userId, limit, hiddenSet);
  const seen = new Set();
  const places = [];

  for (const row of saved) {
    const address = String(row.address || '').trim();
    if (!address || hiddenSet.has(address) || seen.has(address)) continue;
    seen.add(address);
    const place = placeFromAddress(address, row.lat, row.lng);
    if (place) places.push(place);
    if (places.length >= limit) return places;
  }

  for (const place of fromOrders) {
    if (seen.has(place.address)) continue;
    seen.add(place.address);
    places.push(place);
    if (places.length >= limit) break;
  }

  return places;
}

async function collectRecentPlacesFromOrders(userId, limit, hiddenSet = new Set()) {
  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select(
      'pickup_address, delivery_address, pickup_latitude, pickup_longitude, delivery_latitude, delivery_longitude, created_at',
    )
    .eq('customer_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    throw httpError(500, error.message, 'db_error');
  }

  const seen = new Set();
  const places = [];

  for (const order of orders || []) {
    const candidates = [
      {
        address: order.delivery_address,
        lat: order.delivery_latitude,
        lng: order.delivery_longitude,
      },
      {
        address: order.pickup_address,
        lat: order.pickup_latitude,
        lng: order.pickup_longitude,
      },
    ];

    for (const row of candidates) {
      const address = String(row.address || '').trim();
      if (!address || seen.has(address) || hiddenSet.has(address)) continue;
      seen.add(address);

      const place = placeFromAddress(address, row.lat, row.lng);
      if (place) places.push(place);

      if (places.length >= limit) break;
    }
    if (places.length >= limit) break;
  }

  return places;
}

async function resolveDefaultPickup(userId) {
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('default_pickup_address, address, city, district')
    .eq('id', userId)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    throw httpError(500, profileError.message, 'db_error');
  }

  const explicit = String(profile?.default_pickup_address || '').trim();
  if (explicit) return placeFromAddress(explicit, null, null);

  const home = String(profile?.address || '').trim();
  if (home) return placeFromAddress(home, null, null);

  const { data: lastOrder, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('pickup_address, pickup_latitude, pickup_longitude')
    .eq('customer_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (orderError) {
    throw httpError(500, orderError.message, 'db_error');
  }

  const pickup = String(lastOrder?.pickup_address || '').trim();
  if (!pickup) return null;

  return placeFromAddress(
    pickup,
    lastOrder?.pickup_latitude,
    lastOrder?.pickup_longitude,
  );
}

async function getComboFlowHint() {
  const { data, error } = await supabaseAdmin
    .from('platform_settings')
    .select('value')
    .eq('key', 'combo_flow_hint')
    .maybeSingle();

  if (error) {
    throw httpError(500, error.message, 'db_error');
  }

  const value = data?.value;
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (value && typeof value === 'object' && typeof value.text === 'string') {
    return value.text.trim();
  }
  return DEFAULT_COMBO_HINT;
}

async function getQuoteFlowHint() {
  const { data, error } = await supabaseAdmin
    .from('platform_settings')
    .select('value')
    .eq('key', 'quote_flow_hint')
    .maybeSingle();

  if (error) {
    throw httpError(500, error.message, 'db_error');
  }

  const value = data?.value;
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (value && typeof value === 'object' && typeof value.text === 'string') {
    return value.text.trim();
  }
  return DEFAULT_QUOTE_FLOW;
}

/** BE-017 — GET /api/customers/me/recent-places */
async function getRecentPlaces(userId, limitParam) {
  const limit = Math.min(Math.max(parseInt(String(limitParam || 5), 10) || 5, 1), 20);
  const hidden = await getHiddenRecentAddresses(userId);
  return collectAllRecentPlaces(userId, limit, hidden);
}

/** POST /api/customers/me/recent-places — lưu địa chỉ đã chọn */
async function saveRecentPlace(userId, body) {
  const address = validateAddress(body?.address);
  if (!address) {
    throw httpError(400, 'Địa chỉ không hợp lệ', 'validation_error');
  }

  const title = String(body?.title || shortPlaceTitle(address)).trim();
  const lat = body?.lat != null && body.lat !== '' ? Number(body.lat) : null;
  const lng = body?.lng != null && body.lng !== '' ? Number(body.lng) : null;

  const saved = await getSavedRecentPlaces(userId);
  const entry = {
    title,
    address,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    saved_at: new Date().toISOString(),
  };

  const next = [entry, ...saved.filter((p) => String(p.address || '').trim() !== address)].slice(
    0,
    20,
  );

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ saved_recent_places: next })
    .eq('id', userId);

  if (error) throw httpError(500, error.message, 'db_error');

  return placeFromAddress(address, entry.lat, entry.lng);
}

/** GET /api/customers/me/booking-locations — payload for choose-location screen */
async function getBookingLocations(userId, limitParam) {
  const limit = Math.min(Math.max(parseInt(String(limitParam || 8), 10) || 8, 1), 20);
  const hidden = await getHiddenRecentAddresses(userId);
  const [defaultPickup, recentPlaces, comboFlowHint, quoteFlowHint] = await Promise.all([
    resolveDefaultPickup(userId),
    collectAllRecentPlaces(userId, limit, hidden),
    getComboFlowHint(),
    getQuoteFlowHint(),
  ]);

  const mapLat = defaultPickup?.lat ?? recentPlaces[0]?.lat ?? null;
  const mapLng = defaultPickup?.lng ?? recentPlaces[0]?.lng ?? null;

  return {
    default_pickup: defaultPickup,
    recent_places: recentPlaces,
    combo_flow_hint: comboFlowHint,
    quote_flow_hint: quoteFlowHint,
    map_preview_url: buildMapPreviewUrl(mapLat, mapLng),
  };
}

/** DELETE /api/customers/me/recent-places — ẩn toàn bộ địa điểm gần đây hiện tại */
async function clearRecentPlaces(userId) {
  const hidden = await getHiddenRecentAddresses(userId);
  const visible = await collectAllRecentPlaces(userId, 50, hidden);
  const merged = new Set(hidden);
  for (const place of visible) {
    merged.add(place.address);
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      hidden_recent_addresses: [...merged],
      saved_recent_places: [],
    })
    .eq('id', userId);

  if (error) {
    throw httpError(500, error.message, 'db_error');
  }

  return { cleared_count: visible.length };
}

/** BE-010 / API-010 — POST /api/customers/me/avatar (Supabase Storage bucket avatars) */
async function uploadAvatar(userId, file) {
  if (!file?.buffer?.length) {
    throw httpError(400, 'Thiếu file ảnh (field: avatar)', 'validation_error');
  }

  const ext = getImageExtFromMime(file.mimetype);
  if (!ext) throw httpError(400, 'Chỉ chấp nhận file ảnh', 'invalid_file_type');

  const objectPath = `${userId}/avatar.${ext}`;

  try {
    await ensurePublicImageBucket(AVATAR_BUCKET, {
      fileSizeLimit: 2 * 1024 * 1024,
      allowedMimeTypes: COMMON_IMAGE_MIME_TYPES,
    });
  } catch {
    // ignore - bucket may be managed by migration in some environments
  }

  const { error: uploadError } = await supabaseAdmin.storage
    .from(AVATAR_BUCKET)
    .upload(objectPath, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
      cacheControl: '3600',
    });

  if (uploadError) {
    if (uploadError.message?.includes('Bucket not found')) {
      throw httpError(
        500,
        'Chưa có bucket avatars trên Supabase. Chạy migration 20240114000000_avatars_storage.sql.',
        'storage_bucket_missing',
      );
    }
    throw httpError(500, uploadError.message, 'storage_error');
  }

  const { data: urlData } = supabaseAdmin.storage.from(AVATAR_BUCKET).getPublicUrl(objectPath);
  const avatarUrl = urlData?.publicUrl;
  if (!avatarUrl) {
    throw httpError(500, 'Không tạo được URL ảnh', 'storage_error');
  }

  const { error: dbError } = await supabaseAdmin
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId);

  if (dbError) throw httpError(500, dbError.message, 'db_error');

  return getProfile(userId);
}

module.exports = {
  getProfile,
  updateProfile,
  getRecentPlaces,
  saveRecentPlace,
  getBookingLocations,
  clearRecentPlaces,
  uploadAvatar,
};
