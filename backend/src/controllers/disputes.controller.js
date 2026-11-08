const disputeService = require('../services/dispute.service');
const { supabaseAdmin } = require('../services/supabase.service');

/**
 * POST /api/disputes
 * Body: { order_id, dispute_type, subject, description }
 * Files: evidence[] (tối đa 5 ảnh, multipart/form-data)
 */
async function createDispute(req, res, next) {
  try {
    const files = req.files || [];
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    const role = profile?.role || req.user.role;
    const dispute = await disputeService.createDispute(req.user.id, role, req.body, files);
    res.status(201).json({ success: true, data: dispute });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/disputes/my
 * Lấy danh sách dispute của user hiện tại
 */
async function getMyDisputes(req, res, next) {
  try {
    const data = await disputeService.getMyDisputes(req.user.id, req.query);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/disputes/:id
 */
async function getDispute(req, res, next) {
  try {
    const data = await disputeService.getDisputeById(req.params.id, req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = { createDispute, getMyDisputes, getDispute };
