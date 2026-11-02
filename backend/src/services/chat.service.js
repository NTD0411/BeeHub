const { supabaseAdmin } = require('./supabase.service');
const { createNotification } = require('./notification.service');
const { previewLabel, isImageMime } = require('./chat-attachments.service');
const { httpError } = require('./auth.helpers');

const CHAT_ELIGIBLE_STATUSES = ['matched', 'accepted', 'picking_up', 'in_progress', 'completed'];

async function loadProfilesMap(ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return {};
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, avatar_url, phone')
    .in('id', unique);
  if (error) throw httpError(500, error.message, 'db_error');
  return Object.fromEntries((data || []).map((p) => [p.id, p]));
}

// ── GET /api/conversations ────────────────────────────────────────────────────
async function listConversations(userId, role) {
  const isCustomer = role === 'customer';

  const { data, error } = await supabaseAdmin
    .from('conversations')
    .select(`
      id,
      order_id,
      customer_id,
      provider_id,
      is_active,
      last_message_preview,
      last_message_at,
      customer_unread_count,
      provider_unread_count,
      created_at
    `)
    .or(`customer_id.eq.${userId},provider_id.eq.${userId}`)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (error) throw httpError(500, error.message, 'db_error');

  const convRows = data || [];
  const orderIds = [...new Set(convRows.map((c) => c.order_id))];
  const profileIds = convRows.flatMap((c) => [c.customer_id, c.provider_id]);

  const [ordersRes, profilesMap] = await Promise.all([
    orderIds.length
      ? supabaseAdmin
          .from('orders')
          .select('id, status, service_type, created_at')
          .in('id', orderIds)
      : Promise.resolve({ data: [], error: null }),
    loadProfilesMap(profileIds),
  ]);

  if (ordersRes.error) throw httpError(500, ordersRes.error.message, 'db_error');
  const orderMap = Object.fromEntries((ordersRes.data || []).map((o) => [o.id, o]));

  const fromConversations = convRows.map((conv) => {
    const asCustomer = conv.customer_id === userId;
    const counterpartId = asCustomer ? conv.provider_id : conv.customer_id;
    return {
      id: conv.id,
      order_id: conv.order_id,
      is_active: conv.is_active,
      last_message_preview: conv.last_message_preview,
      last_message_at: conv.last_message_at,
      unread_count: asCustomer ? conv.customer_unread_count : conv.provider_unread_count,
      created_at: conv.created_at,
      order: orderMap[conv.order_id] ?? null,
      counterpart: profilesMap[counterpartId] ?? null,
    };
  });

  const existingOrderIds = new Set(fromConversations.map((c) => c.order_id));

  const { data: orders, error: ordersErr } = await supabaseAdmin
    .from('orders')
    .select('id, status, service_type, created_at, customer_id, provider_id')
    .or(`customer_id.eq.${userId},provider_id.eq.${userId}`)
    .not('provider_id', 'is', null)
    .in('status', CHAT_ELIGIBLE_STATUSES)
    .order('created_at', { ascending: false });

  if (ordersErr) throw httpError(500, ordersErr.error.message, 'db_error');

  const pendingOrders = (orders || []).filter((order) => !existingOrderIds.has(order.id));
  const pendingProfiles = await loadProfilesMap(
    pendingOrders.flatMap((o) => [o.customer_id, o.provider_id]),
  );

  const fromOrders = pendingOrders.map((order) => {
    const asCustomer = order.customer_id === userId;
    const counterpartId = asCustomer ? order.provider_id : order.customer_id;
    return {
      id: `pending-${order.id}`,
      order_id: order.id,
      is_active: true,
      last_message_preview: 'Bắt đầu trò chuyện với đối tác',
      last_message_at: null,
      unread_count: 0,
      created_at: order.created_at,
      order: {
        id: order.id,
        status: order.status,
        service_type: order.service_type,
        created_at: order.created_at,
      },
      counterpart: pendingProfiles[counterpartId] ?? null,
    };
  });

  return [...fromConversations, ...fromOrders].sort((a, b) => {
    const aTime = a.last_message_at || a.created_at;
    const bTime = b.last_message_at || b.created_at;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });
}

// ── GET /api/conversations/:orderId/messages ──────────────────────────────────
async function getMessages(orderId, userId) {
  const { data: conv, error: convErr } = await supabaseAdmin
    .from('conversations')
    .select('id, customer_id, provider_id')
    .eq('order_id', orderId)
    .maybeSingle();

  if (convErr) throw httpError(500, convErr.message, 'db_error');

  if (!conv) {
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('id, customer_id, provider_id, status')
      .eq('id', orderId)
      .maybeSingle();

    if (orderErr) throw httpError(500, orderErr.message, 'db_error');
    if (!order) throw httpError(404, 'Không tìm thấy đơn hàng', 'not_found');
    if (order.customer_id !== userId && order.provider_id !== userId) {
      throw httpError(403, 'Không có quyền truy cập cuộc trò chuyện này', 'forbidden');
    }
    if (!order.provider_id) {
      throw httpError(400, 'Đơn hàng chưa có nhà xe để nhắn tin', 'no_provider');
    }

    return { conversation_id: null, messages: [] };
  }

  if (conv.customer_id !== userId && conv.provider_id !== userId) {
    throw httpError(403, 'Không có quyền truy cập cuộc trò chuyện này', 'forbidden');
  }

  const isCustomer = conv.customer_id === userId;

  // Reset unread count for this user
  await supabaseAdmin
    .from('conversations')
    .update(isCustomer ? { customer_unread_count: 0 } : { provider_unread_count: 0 })
    .eq('id', conv.id);

  // Mark messages from the other side as read
  await supabaseAdmin
    .from('messages')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('conversation_id', conv.id)
    .eq('is_read', false)
    .neq('sender_id', userId);

  const { data: msgs, error: msgsErr } = await supabaseAdmin
    .from('messages')
    .select(`
      id,
      message_type,
      content,
      media_url,
      media_type,
      latitude,
      longitude,
      location_name,
      is_read,
      read_at,
      created_at,
      sender:profiles!sender_id(id, full_name, avatar_url),
      reply_to:messages!reply_to_id(id, content, sender_id)
    `)
    .eq('conversation_id', conv.id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });

  if (msgsErr) throw httpError(500, msgsErr.message, 'db_error');

  return {
    conversation_id: conv.id,
    messages: (msgs || []).map((m) => ({
      id: m.id,
      message_type: m.message_type,
      content: m.content,
      media_url: m.media_url ?? null,
      media_type: m.media_type ?? null,
      latitude: m.latitude ?? null,
      longitude: m.longitude ?? null,
      location_name: m.location_name ?? null,
      is_read: m.is_read,
      read_at: m.read_at ?? null,
      is_mine: m.sender?.id === userId,
      sender: m.sender,
      reply_to: m.reply_to ?? null,
      created_at: m.created_at,
    })),
  };
}

// ── POST /api/conversations/:orderId/messages ─────────────────────────────────
async function sendMessage(orderId, userId, body) {
  const {
    content,
    reply_to_id,
    media_url,
    media_type,
    media_size,
    media_name,
  } = body || {};

  const textContent = content ? String(content).trim() : '';
  const hasMedia = !!(media_url && media_type);

  if (!textContent && !hasMedia) {
    throw httpError(400, 'Nội dung tin nhắn không được để trống', 'validation_error');
  }

  // Verify user is a participant in this order
  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .select('id, customer_id, provider_id, status')
    .eq('id', orderId)
    .maybeSingle();

  if (orderErr) throw httpError(500, orderErr.message, 'db_error');
  if (!order) throw httpError(404, 'Không tìm thấy đơn hàng', 'not_found');

  if (order.customer_id !== userId && order.provider_id !== userId) {
    throw httpError(403, 'Không có quyền gửi tin nhắn trong cuộc trò chuyện này', 'forbidden');
  }
  if (!order.provider_id) {
    throw httpError(400, 'Đơn hàng chưa có nhà xe để nhắn tin', 'no_provider');
  }

  const isCustomer = order.customer_id === userId;
  const senderRole = isCustomer ? 'customer' : 'provider';
  const recipientId = isCustomer ? order.provider_id : order.customer_id;

  // Get or create conversation
  let conv;
  const { data: existing } = await supabaseAdmin
    .from('conversations')
    .select('id, customer_unread_count, provider_unread_count')
    .eq('order_id', orderId)
    .maybeSingle();

  if (existing) {
    conv = existing;
  } else {
    const { data: newConv, error: createErr } = await supabaseAdmin
      .from('conversations')
      .insert([{
        order_id: orderId,
        customer_id: order.customer_id,
        provider_id: order.provider_id,
      }])
      .select('id, customer_unread_count, provider_unread_count')
      .single();

    if (createErr) throw httpError(500, createErr.message, 'db_error');
    conv = newConv;
  }

  const messageType = hasMedia
    ? (isImageMime(media_type) ? 'image' : 'text')
    : 'text';
  const storedContent = textContent || previewLabel({
    text: '',
    mediaUrl: media_url,
    mediaType: media_type,
    mediaName: media_name,
  });

  // Insert message
  const { data: msg, error: msgErr } = await supabaseAdmin
    .from('messages')
    .insert([{
      conversation_id: conv.id,
      sender_id: userId,
      sender_role: senderRole,
      message_type: messageType,
      content: storedContent,
      media_url: hasMedia ? media_url : null,
      media_type: hasMedia ? media_type : null,
      media_size: hasMedia ? (media_size ?? null) : null,
      reply_to_id: reply_to_id || null,
    }])
    .select('id, message_type, content, media_url, media_type, created_at')
    .single();

  if (msgErr) throw httpError(500, msgErr.message, 'db_error');

  // Update conversation metadata
  const preview = previewLabel({
    text: storedContent,
    mediaUrl: msg.media_url,
    mediaType: msg.media_type,
    mediaName: media_name,
  });
  const currentUnread = isCustomer
    ? (conv.provider_unread_count || 0)
    : (conv.customer_unread_count || 0);

  await supabaseAdmin
    .from('conversations')
    .update({
      last_message_id: msg.id,
      last_message_at: msg.created_at,
      last_message_preview: preview,
      ...(isCustomer
        ? { provider_unread_count: currentUnread + 1 }
        : { customer_unread_count: currentUnread + 1 }),
    })
    .eq('id', conv.id);

  // Notify recipient (fire-and-forget)
  createNotification(
    recipientId,
    'new_message',
    'Bạn có tin nhắn mới',
    preview,
    { actionData: { order_id: orderId }, icon: 'chat' },
  ).catch(() => {});

  return {
    id: msg.id,
    message_type: msg.message_type,
    content: msg.content,
    media_url: msg.media_url ?? null,
    media_type: msg.media_type ?? null,
    created_at: msg.created_at,
    is_mine: true,
  };
}

module.exports = { listConversations, getMessages, sendMessage };
