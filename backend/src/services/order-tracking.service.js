const ACTIVE_STATUSES = ['accepted', 'scheduled', 'picking_up', 'picked_up', 'in_progress', 'delivering'];
const fail = (status, message) => Object.assign(new Error(message), { status });

function createOrderTrackingService(db, now = () => Date.now()) {
  async function authorizedOrder(id, user) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw fail(400, 'Mã đơn hàng không hợp lệ');
    const { data, error } = await db.from('orders')
      .select('id, customer_id, provider_id, status, order_number, created_at, provider_accepted_at, completed_at, pickup_address, delivery_address, pickup_latitude, pickup_longitude, delivery_latitude, delivery_longitude, delivery_photo_url')
      .eq('id', id).maybeSingle();
    if (error) throw fail(500, 'Không tải được chuyến đi');
    if (!data) throw fail(404, 'Không tìm thấy đơn hàng');
    if (!user?.id || ![data.customer_id, data.provider_id].includes(user.id)) throw fail(403, 'Bạn không được xem vị trí của chuyến đi này');
    return data;
  }
  async function read(id, user) {
    const order = await authorizedOrder(id, user);
    const active = ACTIVE_STATUSES.includes(order.status);
    const [history, position] = await Promise.all([
      db.from('order_status_history').select('id, to_status, created_at').eq('order_id', id).order('created_at', { ascending: true }).limit(100),
      active && order.provider_id
        ? db.from('provider_locations').select('latitude, longitude, accuracy, created_at, is_online').eq('current_order_id', id).eq('provider_id', order.provider_id).order('created_at', { ascending: false }).limit(1).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);
    if (history.error || position.error) throw fail(500, 'Không tải được dữ liệu theo dõi');
    const row = position.data;
    const location = row?.is_online ? {
      latitude: Number(row.latitude), longitude: Number(row.longitude),
      accuracy: row.accuracy == null ? null : Number(row.accuracy), updated_at: row.created_at,
      stale: now() - Date.parse(row.created_at) > 60000,
    } : null;
    return { order_id: id, order_number: order.order_number, status: order.status, active,
      can_share: active && user.id === order.provider_id,
      server_time: new Date(now()).toISOString(), location,
      sharing: location ? (location.stale ? 'stale' : 'live') : 'off',
      pickup: { address: order.pickup_address, latitude: order.pickup_latitude, longitude: order.pickup_longitude },
      delivery: { address: order.delivery_address, latitude: order.delivery_latitude, longitude: order.delivery_longitude },
      started_at: order.provider_accepted_at || (history.data || []).find(event => ACTIVE_STATUSES.includes(event.to_status))?.created_at || null, completed_at: order.completed_at,
      delivery_photo_url: order.status === 'completed' ? order.delivery_photo_url : null,
      events: history.data || [],
    };
  }
  async function publish(id, user, body) {
    const order = await authorizedOrder(id, user);
    if (user.id !== order.provider_id) throw fail(403, 'Chỉ nhà xe được phân công mới có thể chia sẻ vị trí');
    if (!ACTIVE_STATUSES.includes(order.status)) throw fail(409, 'Chuyến đi chưa bắt đầu hoặc đã kết thúc');
    const { latitude, longitude, accuracy, captured_at } = body || {};
    if (typeof latitude !== 'number' || !Number.isFinite(latitude) || Math.abs(latitude) > 90 ||
        typeof longitude !== 'number' || !Number.isFinite(longitude) || Math.abs(longitude) > 180 ||
        typeof accuracy !== 'number' || !Number.isFinite(accuracy) || accuracy < 0 || accuracy > 50000) {
      throw fail(400, 'Tọa độ hoặc độ chính xác GPS không hợp lệ');
    }
    const captured = typeof captured_at === 'string' ? Date.parse(captured_at) : NaN;
    if (!Number.isFinite(captured) || now() - captured > 60000 || captured - now() > 15000) throw fail(400, 'Vị trí GPS đã cũ. Vui lòng lấy lại vị trí');
    // The database stores one current position per provider (UNIQUE provider_id).
    const { error } = await db.from('provider_locations').upsert({
      provider_id: user.id, current_order_id: id, latitude, longitude, accuracy,
      is_online: true, created_at: new Date(captured).toISOString(),
    }, { onConflict: 'provider_id' });
    if (error) {
      console.error('[order-tracking] location write failed:', error.code || 'unknown');
      throw fail(500, 'Không gửi được vị trí. Vui lòng thử lại');
    }
    return { updated_at: new Date(captured).toISOString() };
  }
  async function stop(id, user) {
    const order = await authorizedOrder(id, user);
    if (user.id !== order.provider_id) throw fail(403, 'Chỉ nhà xe được phân công mới có thể dừng chia sẻ');
    const { error } = await db.from('provider_locations').update({ is_online: false })
      .eq('current_order_id', id).eq('provider_id', user.id).eq('is_online', true);
    if (error) throw fail(500, 'Chưa dừng được chia sẻ. Vui lòng thử lại');
    return { sharing: 'off' };
  }
  return { read, publish, stop };
}
module.exports = { createOrderTrackingService, ACTIVE_STATUSES };
