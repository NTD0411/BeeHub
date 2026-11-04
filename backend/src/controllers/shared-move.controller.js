const { estimateSharedMovePrice } = require('../services/shared-move.service');

function estimate(req, res) {
  const transportPrice = Number(req.query.transport_price);
  const subtotal = Number(req.query.subtotal);
  if (!Number.isFinite(transportPrice) || transportPrice < 0 || !Number.isFinite(subtotal) || subtotal < 0) {
    return res.status(400).json({ success: false, message: 'transport_price và subtotal phải là số dương hoặc bằng 0.' });
  }
  return res.json({ success: true, data: estimateSharedMovePrice(transportPrice, subtotal) });
}

module.exports = { estimate };
