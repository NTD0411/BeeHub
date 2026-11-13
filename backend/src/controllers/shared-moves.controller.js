const sharedMovesService = require('../services/shared-moves.service');

async function listAvailableSharedGroups(req, res, next) {
  try {
    const data = await sharedMovesService.listAvailableGroupsForProvider(req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function acceptSharedGroup(req, res, next) {
  try {
    const data = await sharedMovesService.acceptSharedGroup(req.params.id, req.user.id);
    res.json({ success: true, message: 'Nhận chuyến ghép thành công!', data });
  } catch (error) {
    next(error);
  }
}

async function proposePair(req, res, next) {
  try {
    const myOrderId = req.body.myOrderId || req.body.my_order_id;
    const candidateOrderId = req.body.candidateOrderId || req.body.candidate_order_id;
    if (!myOrderId || !candidateOrderId) {
      return res.status(400).json({ success: false, message: 'Thiếu myOrderId hoặc candidateOrderId' });
    }
    const data = await sharedMovesService.proposePairOrders(req.user.id, myOrderId, candidateOrderId);
    res.json({ success: true, message: 'Ghép đơn vào chuyến thành công!', data });
  } catch (error) {
    next(error);
  }
}

// Admin controllers
async function adminListGroups(req, res, next) {
  try {
    const data = await sharedMovesService.adminListSharedGroups(req.query);
    res.json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
}

async function adminGetGroup(req, res, next) {
  try {
    const data = await sharedMovesService.adminGetSharedGroupDetails(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function adminAddOrder(req, res, next) {
  try {
    const orderId = req.body.orderId || req.body.order_id;
    if (!orderId) return res.status(400).json({ success: false, message: 'Thiếu orderId' });
    const data = await sharedMovesService.adminAddOrderToGroup(req.params.id, orderId);
    res.json({ success: true, message: 'Đã thêm đơn vào nhóm ghép', data });
  } catch (error) {
    next(error);
  }
}

async function adminRemoveOrder(req, res, next) {
  try {
    const orderId = req.body.orderId || req.body.order_id;
    if (!orderId) return res.status(400).json({ success: false, message: 'Thiếu orderId' });
    const data = await sharedMovesService.adminRemoveOrderFromGroup(req.params.id, orderId);
    res.json({ success: true, message: 'Đã tách đơn khỏi nhóm ghép', data });
  } catch (error) {
    next(error);
  }
}

async function adminAssignProvider(req, res, next) {
  try {
    const providerId = req.body.providerId || req.body.provider_id;
    if (!providerId) return res.status(400).json({ success: false, message: 'Thiếu providerId' });
    const data = await sharedMovesService.adminAssignProvider(req.params.id, providerId);
    res.json({ success: true, message: 'Đã phân công tài xế cho nhóm ghép', data });
  } catch (error) {
    next(error);
  }
}

async function adminCancelGroup(req, res, next) {
  try {
    const { reason } = req.body;
    const data = await sharedMovesService.adminCancelGroup(req.params.id, reason);
    res.json({ success: true, message: 'Đã hủy nhóm ghép', data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listAvailableSharedGroups,
  acceptSharedGroup,
  proposePair,
  adminListGroups,
  adminGetGroup,
  adminAddOrder,
  adminRemoveOrder,
  adminAssignProvider,
  adminCancelGroup,
};
