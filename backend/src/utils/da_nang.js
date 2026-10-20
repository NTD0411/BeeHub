/** Chuẩn hóa kiểm tra đơn / nhà xe thuộc khu vực Đà Nẵng. */
function normalizeCity(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/đ/g, 'd') // đ does not decompose under NFD — must map before accent strip
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function isDaNangCity(value) {
  const n = normalizeCity(value);
  return n.includes('da nang') || n.includes('danang');
}

/** Quận / huyện thuộc Đà Nẵng (không ghi tên thành phố trong địa chỉ ngắn). */
const DA_NANG_DISTRICTS = [
  'ngu hanh son',
  'hai chau',
  'thanh khe',
  'son tra',
  'cam le',
  'lien chieu',
  'hoa vang',
  'hoa khanh',
  'thanh binh',
  'an hai',
  'an khe',
  'man thai',
  'hoa cuong',
  'hoa xuan',
];

/** Bounding box gần đúng TP. Đà Nẵng */
const DANANG_BBOX = {
  minLat: 15.85,
  maxLat: 16.25,
  minLng: 107.85,
  maxLng: 108.35,
};

function isDaNangDistrict(value) {
  const n = normalizeCity(value);
  if (!n) return false;
  return DA_NANG_DISTRICTS.some((d) => n.includes(d));
}

function textMentionsDaNang(value) {
  if (!value) return false;
  if (isDaNangCity(value)) return true;
  return isDaNangDistrict(value);
}

function coordsInDaNang(lat, lng) {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return false;
  return (
    la >= DANANG_BBOX.minLat &&
    la <= DANANG_BBOX.maxLat &&
    ln >= DANANG_BBOX.minLng &&
    ln <= DANANG_BBOX.maxLng
  );
}

function isDaNangOrder(order) {
  if (!order) return false;

  if (
    textMentionsDaNang(order.pickup_city) ||
    textMentionsDaNang(order.delivery_city)
  ) {
    return true;
  }

  if (
    textMentionsDaNang(order.pickup_district) ||
    textMentionsDaNang(order.delivery_district)
  ) {
    return true;
  }

  if (
    textMentionsDaNang(order.pickup_address) ||
    textMentionsDaNang(order.delivery_address)
  ) {
    return true;
  }

  if (
    coordsInDaNang(order.pickup_latitude, order.pickup_longitude) ||
    coordsInDaNang(order.delivery_latitude, order.delivery_longitude)
  ) {
    return true;
  }

  return false;
}

module.exports = {
  normalizeCity,
  isDaNangCity,
  isDaNangDistrict,
  coordsInDaNang,
  textMentionsDaNang,
  isDaNangOrder,
};
