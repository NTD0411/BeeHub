const crypto = require('crypto');
const { supabaseAdmin } = require('./supabase.service');
const { httpError } = require('./auth.helpers');

const PROVIDER_DOCS_BUCKET = 'provider-docs';
const SIGNED_URL_TTL_SECONDS = 60 * 60;
const REQUIRED_DOCUMENT_TYPES = [
  'id_card_front',
  'id_card_back',
  'license',
  'vehicle_registration',
];

const FIELD_TO_DOCUMENT_TYPE = {
  cccd_front: 'id_card_front',
  cccd_back: 'id_card_back',
  id_card_front: 'id_card_front',
  id_card_back: 'id_card_back',
  id_card: 'id_card',
  driver_license: 'license',
  license: 'license',
  vehicle_registration: 'vehicle_registration',
  vehicle_photo: 'vehicle_photo',
  insurance: 'insurance',
  business_license: 'business_license',
};

function fileExtension(file) {
  const mime = String(file?.mimetype || '').toLowerCase();
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/heic') return 'heic';
  if (mime === 'image/heif') return 'heif';
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
  return null;
}

async function ensureProviderDocsBucket() {
  const { data, error } = await supabaseAdmin.storage.getBucket(PROVIDER_DOCS_BUCKET);
  if (data && !error) return;

  const { error: createError } = await supabaseAdmin.storage.createBucket(PROVIDER_DOCS_BUCKET, {
    public: false,
    fileSizeLimit: '5MB',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
  });
  if (createError && !String(createError.message || '').toLowerCase().includes('already exists')) {
    throw httpError(500, `Không thể khởi tạo kho giấy tờ: ${createError.message}`, 'storage_error');
  }
}

async function getProviderProfile(providerId) {
  const { data, error } = await supabaseAdmin
    .from('provider_profiles')
    .select('id, business_name, vehicle_type, vehicle_plate, is_verified, is_available, verification_status, verification_notes, rating, total_orders, total_earnings, total_reviews')
    .eq('id', providerId)
    .maybeSingle();
  if (error) throw httpError(500, error.message, 'db_error');
  if (!data) throw httpError(404, 'Không tìm thấy hồ sơ nhà vận chuyển.', 'provider_not_found');
  return data;
}

async function signDocuments(documents = []) {
  return Promise.all(documents.map(async (doc) => {
    const { data, error } = await supabaseAdmin.storage
      .from(PROVIDER_DOCS_BUCKET)
      .createSignedUrl(doc.document_url, SIGNED_URL_TTL_SECONDS);
    return {
      ...doc,
      document_url: error ? null : data?.signedUrl ?? null,
      file_name: doc.document_url?.split('/').pop() ?? null,
    };
  }));
}

function documentTypeForFile(file, body = {}) {
  if (file.fieldname === 'file') {
    const requestedType = String(body.document_type || '').trim();
    return FIELD_TO_DOCUMENT_TYPE[requestedType] || null;
  }
  return FIELD_TO_DOCUMENT_TYPE[file.fieldname] || null;
}

function fieldValue(body, type, field, fallback = null) {
  return body[`${type}_${field}`] ?? body[field] ?? fallback;
}

async function uploadDocuments(providerId, files, body = {}) {
  if (!Array.isArray(files) || files.length === 0) {
    throw httpError(400, 'Vui lòng chọn ít nhất một ảnh giấy tờ.', 'validation_error');
  }

  const profile = await getProviderProfile(providerId);
  if (profile.is_verified || profile.verification_status === 'approved') {
    throw httpError(409, 'Tài khoản đã xác minh; không thể thay đổi giấy tờ.', 'verification_locked');
  }
  if (profile.verification_status === 'pending') {
    throw httpError(409, 'Hồ sơ đang chờ duyệt. Hãy đợi kết quả hoặc yêu cầu nộp lại sau khi bị từ chối.', 'verification_pending');
  }

  const prepared = files.map((file) => ({ file, type: documentTypeForFile(file, body) }));
  const unsupported = prepared.find((item) => !item.type);
  if (unsupported) {
    throw httpError(400, `Loại giấy tờ không được hỗ trợ: ${unsupported.file.fieldname}`, 'invalid_document_type');
  }

  const duplicateTypes = prepared.map((item) => item.type);
  if (new Set(duplicateTypes).size !== duplicateTypes.length) {
    throw httpError(400, 'Mỗi lần tải lên chỉ nhận một ảnh cho từng loại giấy tờ.', 'duplicate_document_type');
  }

  const plans = [];
  for (const { file, type } of prepared) {
    const extension = fileExtension(file);
    if (!extension) {
      throw httpError(400, 'Ảnh phải có định dạng JPG, PNG, WEBP, HEIC hoặc HEIF.', 'invalid_file_type');
    }
    const { data: existing, error: findError } = await supabaseAdmin
      .from('provider_documents')
      .select('*')
      .eq('provider_id', providerId)
      .eq('document_type', type)
      .maybeSingle();
    if (findError) throw httpError(500, findError.message, 'db_error');

    const objectPath = `${providerId}/${type}/${crypto.randomUUID()}.${extension}`;
    const documentNumber = fieldValue(body, type, 'document_number');
    const expiryDate = fieldValue(body, type, 'expiry_date');
    plans.push({
      file,
      type,
      existing,
      objectPath,
      record: {
        provider_id: providerId,
        document_type: type,
        document_url: objectPath,
        document_number: documentNumber ? String(documentNumber).trim() : null,
        expiry_date: expiryDate || null,
        is_verified: false,
        verified_by: null,
        notes: null,
      },
    });
  }

  await ensureProviderDocsBucket();
  const uploaded = [];
  const saved = [];
  try {
    for (const { file, objectPath } of plans) {
      const { error: uploadError } = await supabaseAdmin.storage
        .from(PROVIDER_DOCS_BUCKET)
        .upload(objectPath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
          cacheControl: '3600',
        });
      if (uploadError) throw httpError(500, uploadError.message, 'storage_error');
      uploaded.push(objectPath);
    }

    for (const plan of plans) {
      let query = supabaseAdmin.from('provider_documents');
      query = plan.existing
        ? query.update(plan.record).eq('id', plan.existing.id)
        : query.insert(plan.record);
      const { data, error: saveError } = await query.select().single();
      if (saveError) throw httpError(500, saveError.message, 'db_error');
      saved.push({ data, previous: plan.existing });
    }
  } catch (error) {
    for (const item of saved.reverse()) {
      if (item.previous) {
        await supabaseAdmin.from('provider_documents').update(item.previous).eq('id', item.previous.id);
      } else {
        await supabaseAdmin.from('provider_documents')
          .delete()
          .eq('provider_id', item.data.provider_id)
          .eq('document_type', item.data.document_type);
      }
    }
    if (uploaded.length) await supabaseAdmin.storage.from(PROVIDER_DOCS_BUCKET).remove(uploaded);
    throw error;
  }

  const oldPaths = plans.map((plan) => plan.existing?.document_url).filter(Boolean);
  if (oldPaths.length) await supabaseAdmin.storage.from(PROVIDER_DOCS_BUCKET).remove(oldPaths);
  const savedDocuments = saved.map((item) => item.data);

  if (profile.verification_status === 'rejected') {
    const { error } = await supabaseAdmin.from('provider_profiles').update({
      verification_status: 'incomplete',
      verification_notes: null,
    }).eq('id', providerId);
    if (error) throw httpError(500, error.message, 'db_error');
  }

  return signDocuments(savedDocuments);
}

async function getDocuments(providerId) {
  const { data, error } = await supabaseAdmin
    .from('provider_documents')
    .select('id, provider_id, document_type, document_url, document_number, issue_date, expiry_date, is_verified, notes, created_at')
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false });
  if (error) throw httpError(500, error.message, 'db_error');
  return signDocuments(data || []);
}

async function getVerification(providerId) {
  const [profile, documents] = await Promise.all([
    getProviderProfile(providerId),
    getDocuments(providerId),
  ]);
  return {
    status: profile.verification_status || 'incomplete',
    verification_status: profile.verification_status || 'incomplete',
    verification_notes: profile.verification_notes,
    is_verified: Boolean(profile.is_verified),
    documents,
  };
}

async function requestVerification(providerId) {
  const profile = await getProviderProfile(providerId);
  if (profile.is_verified || profile.verification_status === 'approved') {
    throw httpError(409, 'Tài khoản đã được xác minh.', 'already_verified');
  }
  const documents = await getDocuments(providerId);
  const types = new Set(documents.map((doc) => doc.document_type));
  const hasLegacyIdCard = types.has('id_card');
  const missing = REQUIRED_DOCUMENT_TYPES.filter((type) => !types.has(type) && !(hasLegacyIdCard && type.startsWith('id_card_')));
  if (missing.length) {
    throw httpError(400, `Hồ sơ còn thiếu: ${missing.join(', ')}`, 'missing_documents');
  }

  const { error: providerError } = await supabaseAdmin.from('provider_profiles').update({
    verification_status: 'pending',
    verification_notes: null,
    is_verified: false,
  }).eq('id', providerId);
  if (providerError) throw httpError(500, providerError.message, 'db_error');

  const { error: profileError } = await supabaseAdmin.from('profiles')
    .update({ status: 'pending_verification' })
    .eq('id', providerId);
  if (profileError) throw httpError(500, profileError.message, 'db_error');

  return getVerification(providerId);
}

async function setAvailability(providerId, isAvailable) {
  if (typeof isAvailable !== 'boolean') {
    throw httpError(400, 'is_available phải là true hoặc false.', 'validation_error');
  }
  const profile = await getProviderProfile(providerId);
  if (!profile.is_verified || profile.verification_status !== 'approved') {
    throw httpError(403, 'Cần hoàn tất xác minh trước khi bật nhận đơn.', 'verification_required');
  }
  const { data, error } = await supabaseAdmin.from('provider_profiles')
    .update({ is_available: isAvailable })
    .eq('id', providerId)
    .select('is_available')
    .single();
  if (error) throw httpError(500, error.message, 'db_error');
  return data;
}

async function getDashboard(providerId) {
  const [profile, account, openResult, ownResult, notificationResult] = await Promise.all([
    getProviderProfile(providerId),
    supabaseAdmin.from('profiles').select('id, full_name, email, phone, avatar_url').eq('id', providerId).maybeSingle(),
    supabaseAdmin.from('orders')
      .select('id, status, service_type, pickup_address, delivery_address, total_price, base_price, created_at, is_group_order, shared_move_discount')
      .is('provider_id', null)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(20),
    supabaseAdmin.from('orders')
      .select('id, status, service_type, pickup_address, delivery_address, total_price, base_price, created_at, is_group_order, shared_move_discount')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false })
      .limit(100),
    supabaseAdmin.from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', providerId)
      .eq('is_read', false),
  ]);

  if (openResult.error) throw httpError(500, openResult.error.message, 'db_error');
  if (ownResult.error) throw httpError(500, ownResult.error.message, 'db_error');
  if (account.error) throw httpError(500, account.error.message, 'db_error');

  const normalizeOrder = (order) => ({
    ...order,
    dropoff_address: order.delivery_address,
    estimated_price: order.total_price ?? order.base_price,
  });
  const myOrders = ownResult.data || [];
  const pendingOrders = profile.is_verified && profile.is_available
    ? (openResult.data || []).map(normalizeOrder)
    : [];
  const activeOrders = myOrders
    .filter((order) => ['accepted', 'picking_up', 'picked_up', 'in_progress'].includes(order.status))
    .map(normalizeOrder);
  const completedOrders = myOrders
    .filter((order) => order.status === 'completed')
    .map(normalizeOrder);

  return {
    profile: { ...(account.data || {}), ...profile },
    pending_orders: pendingOrders,
    active_orders: activeOrders,
    completed_orders: completedOrders,
    unread_notifications: notificationResult.error ? 0 : notificationResult.count || 0,
    counts: {
      pending: pendingOrders.length,
      active: activeOrders.length,
      completed: completedOrders.length,
    },
  };
}

async function getPendingProviders(status = 'pending') {
  const allowedStatuses = new Set(['pending', 'approved', 'rejected']);
  const normalizedStatus = allowedStatuses.has(String(status)) ? String(status) : 'pending';
  const { data, error } = await supabaseAdmin
    .from('provider_profiles')
    .select('id, business_name, vehicle_type, vehicle_plate, is_verified, verification_status, verification_notes, verified_at, rating, total_orders, total_reviews, created_at, profiles!provider_profiles_id_fkey(id, full_name, email, phone, avatar_url, address, ward, city)')
    .eq('verification_status', normalizedStatus)
    .order('created_at', { ascending: false });
  if (error) throw httpError(500, error.message, 'db_error');
  return (data || []).map((provider) => ({
    ...provider,
    full_name: provider.profiles?.full_name ?? null,
    email: provider.profiles?.email ?? null,
    phone: provider.profiles?.phone ?? null,
    avatar_url: provider.profiles?.avatar_url ?? null,
    address: provider.profiles?.address ?? null,
    ward: provider.profiles?.ward ?? null,
    city: provider.profiles?.city ?? null,
  }));
}

async function getDocumentsForAdmin(providerId) {
  const documents = await getDocuments(providerId);
  return documents.map(({ provider_id, ...document }) => document);
}

async function reviewProvider(providerId, adminId, action, notes = '') {
  if (!['approve', 'reject'].includes(action)) {
    throw httpError(400, 'Action phải là approve hoặc reject.', 'validation_error');
  }
  if (action === 'reject' && !String(notes).trim()) {
    throw httpError(400, 'Nhập lý do từ chối để nhà xe biết cách nộp lại.', 'validation_error');
  }

  if (action === 'approve') {
    const docs = await getDocuments(providerId);
    const types = new Set(docs.map((doc) => doc.document_type));
    const hasIdCard = types.has('id_card') || (types.has('id_card_front') && types.has('id_card_back'));
    if (!hasIdCard || !types.has('license') || !types.has('vehicle_registration')) {
      throw httpError(409, 'Chưa đủ giấy tờ bắt buộc để duyệt hồ sơ.', 'missing_documents');
    }
  }

  const approved = action === 'approve';
  const { data: updated, error: providerError } = await supabaseAdmin.from('provider_profiles')
    .update({
      verification_status: approved ? 'approved' : 'rejected',
      is_verified: approved,
      verification_notes: approved ? null : String(notes).trim(),
      verified_at: new Date().toISOString(),
      verified_by: adminId,
    })
    .eq('id', providerId)
    .select('id, business_name, verification_status, is_verified, verification_notes, verified_at')
    .maybeSingle();
  if (providerError) throw httpError(500, providerError.message, 'db_error');
  if (!updated) throw httpError(404, 'Không tìm thấy nhà vận chuyển.', 'provider_not_found');

  const { error: documentsError } = await supabaseAdmin.from('provider_documents')
    .update({
      is_verified: approved,
      verified_by: adminId,
      notes: approved ? null : String(notes).trim(),
    })
    .eq('provider_id', providerId);
  if (documentsError) throw httpError(500, documentsError.message, 'db_error');

  const { error: profileError } = await supabaseAdmin.from('profiles')
    .update({ status: approved ? 'active' : 'pending_verification' })
    .eq('id', providerId);
  if (profileError) throw httpError(500, profileError.message, 'db_error');

  await supabaseAdmin.from('notifications').insert({
    user_id: providerId,
    notification_type: 'provider_verified',
    title: approved ? 'Tài khoản đã được xác minh' : 'Hồ sơ cần bổ sung',
    body: approved ? 'Hồ sơ nhà vận chuyển đã được duyệt.' : String(notes).trim(),
    is_read: false,
  });

  return updated;
}

module.exports = {
  REQUIRED_DOCUMENT_TYPES,
  uploadDocuments,
  getDocuments,
  getVerification,
  requestVerification,
  setAvailability,
  getDashboard,
  getPendingProviders,
  getDocumentsForAdmin,
  reviewProvider,
};
