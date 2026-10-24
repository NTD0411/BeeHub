const { supabaseAdmin } = require('./supabase.service');
const { httpError } = require('./auth.helpers');
const { createNotification, notifyAdmins } = require('./notification.service');

const EVIDENCE_BUCKET = 'dispute-evidence';
const EXT_BY_MIME = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const VALID_DISPUTE_TYPES = [
  'payment',
  'service_quality',
  'damage',
  'cancellation',
  'app_error',
  'other',
];

/**
 * Upload ảnh evidence lên Supabase Storage
 * @param {string} disputeId
 * @param {Express.Multer.File[]} files
 * @returns {Promise<string[]>} mảng URL
 */
async function uploadEvidenceImages(disputeId, files) {
  if (!files || files.length === 0) return [];

  const urls = [];
  for (const file of files) {
    const ext = EXT_BY_MIME[file.mimetype];
    if (!ext) continue;

    const objectPath = `${disputeId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from(EVIDENCE_BUCKET)
      .upload(objectPath, file.buffer, { contentType: file.mimetype, upsert: false });

    if (uploadError) {
      console.error('[dispute] upload evidence error:', uploadError.message);
      continue;
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(EVIDENCE_BUCKET)
      .getPublicUrl(objectPath);

    if (urlData?.publicUrl) urls.push(urlData.publicUrl);
  }
  return urls;
}

/**
 * POST /api/disputes
 * Customer hoặc Provider tạo khiếu nại cho 1 đơn hàng
 */
async function createDispute(userId, userRole, body, files) {
  const { order_id, dispute_type, subject, description } = body || {};

  if (!order_id) throw httpError(400, 'Thiếu order_id', 'validation_error');
  if (!dispute_type || !VALID_DISPUTE_TYPES.includes(dispute_type)) {
    throw httpError(
      400,
      `dispute_type phải là một trong: ${VALID_DISPUTE_TYPES.join(', ')}`,
      'validation_error',
    );
  }
  if (!subject || String(subject).trim().length < 5) {
    throw httpError(400, 'subject tối thiểu 5 ký tự', 'validation_error');
  }
  if (!description || String(description).trim().length < 10) {
    throw httpError(400, 'description tối thiểu 10 ký tự', 'validation_error');
  }

  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .select('id, order_number, status, customer_id, provider_id, pickup_address, delivery_address')
    .eq('id', order_id)
    .maybeSingle();

  if (orderErr) throw httpError(500, orderErr.message, 'db_error');
  if (!order) throw httpError(404, 'Không tìm thấy đơn hàng', 'order_not_found');

  const isCustomer = order.customer_id === userId;
  const isProvider = order.provider_id === userId;
  if (!isCustomer && !isProvider) {
    throw httpError(403, 'Bạn không có quyền khiếu nại đơn hàng này', 'access_denied');
  }

  const againstUserId = isCustomer ? order.provider_id : order.customer_id;

  const { data: existing } = await supabaseAdmin
    .from('disputes')
    .select('id, status')
    .eq('order_id', order_id)
    .eq('raised_by', userId)
    .in('status', ['open', 'investigating'])
    .maybeSingle();

  if (existing) {
    throw httpError(409, 'Bạn đã có khiếu nại đang xử lý cho đơn hàng này', 'dispute_already_exists');
  }

  const { data: dispute, error: insertErr } = await supabaseAdmin
    .from('disputes')
    .insert({
      order_id,
      raised_by: userId,
      raised_by_role: userRole,
      against_user_id: againstUserId || null,
      dispute_type,
      subject: String(subject).trim(),
      description: String(description).trim(),
      status: 'open',
      priority: ['damage', 'payment'].includes(dispute_type) ? 'high' : 'normal',
    })
    .select('*')
    .single();

  if (insertErr) throw httpError(500, insertErr.message, 'db_error');

  let evidenceUrls = [];
  if (files && files.length > 0) {
    evidenceUrls = await uploadEvidenceImages(dispute.id, files);
    if (evidenceUrls.length > 0) {
      await supabaseAdmin
        .from('disputes')
        .update({ evidence_images: evidenceUrls })
        .eq('id', dispute.id);
    }
  }

  await notifyAdmins(
    'system_announcement',
    'Khiếu nại mới',
    `Đơn ${order.order_number}: ${String(subject).trim()} (${dispute_type})`,
    { priority: 'high', actionData: { dispute_id: dispute.id, order_id } },
  );

  if (againstUserId) {
    await createNotification(
      againstUserId,
      'system_announcement',
      'Bạn nhận được khiếu nại',
      `Có khiếu nại mới liên quan đến đơn ${order.order_number}. Admin đang xem xét.`,
      { priority: 'high', actionData: { dispute_id: dispute.id, order_id } },
    );
  }

  return { ...dispute, evidence_images: evidenceUrls };
}

/**
 * GET /api/disputes/my
 * Lấy danh sách dispute của user hiện tại
 */
async function getMyDisputes(userId, query = {}) {
  const { status, page = 1, limit = 10 } = query;
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  let q = supabaseAdmin
    .from('disputes')
    .select(`
      id, dispute_type, subject, status, priority, created_at, resolved_at, resolution_type,
      orders!disputes_order_id_fkey(order_number, pickup_address, delivery_address)
    `)
    .eq('raised_by', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + parseInt(limit, 10) - 1);

  if (status) q = q.eq('status', status);

  const { data, error } = await q;
  if (error) throw httpError(500, error.message, 'db_error');

  return data || [];
}

/**
 * GET /api/disputes/:id
 * Lấy chi tiết 1 dispute — chỉ người liên quan mới xem được
 */
async function getDisputeById(disputeId, userId) {
  const { data, error } = await supabaseAdmin
    .from('disputes')
    .select(`
      *,
      orders!disputes_order_id_fkey(order_number, pickup_address, delivery_address, total_price),
      raised_by_profile:profiles!disputes_raised_by_fkey(full_name, email),
      against_user_profile:profiles!disputes_against_user_id_fkey(full_name, email),
      dispute_messages(
        id, message, attachments, is_internal, created_at,
        sender:profiles!dispute_messages_sender_id_fkey(full_name, role)
      )
    `)
    .eq('id', disputeId)
    .maybeSingle();

  if (error) throw httpError(500, error.message, 'db_error');
  if (!data) throw httpError(404, 'Không tìm thấy khiếu nại', 'not_found');

  if (data.raised_by !== userId && data.against_user_id !== userId) {
    throw httpError(403, 'Không có quyền xem khiếu nại này', 'access_denied');
  }

  data.dispute_messages = (data.dispute_messages || []).filter((m) => !m.is_internal);

  return data;
}

module.exports = { createDispute, getMyDisputes, getDisputeById };
