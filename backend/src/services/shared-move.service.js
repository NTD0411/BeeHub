const SHARED_MOVE_DISCOUNT_RATE = 0.4;

function estimateSharedMovePrice(transportPrice, subtotal) {
  const transport = Math.max(0, Math.round(Number(transportPrice) || 0));
  const total = Math.max(0, Math.round(Number(subtotal) || 0));
  const discount = Math.min(Math.round(transport * SHARED_MOVE_DISCOUNT_RATE), total);
  return {
    transport_price: transport,
    discount_rate: SHARED_MOVE_DISCOUNT_RATE,
    discount_amount: discount,
    estimated_total: Math.max(0, total - discount),
  };
}

module.exports = { SHARED_MOVE_DISCOUNT_RATE, estimateSharedMovePrice };
