/**
 * providers.controller.js — Controller cho Provider API.
 *
 * Routes mount tại /api/providers (xem providers.routes.js).
 */
const providersService = require('../services/providers.service');
const { httpError } = require('../services/auth.helpers');

/** GET /api/providers/browse — Tìm kiếm danh sách nhà xe công khai */
async function browse(req, res, next) {
  try {
    const providers = await providersService.browseProviders({
      city: req.query.city,
      minRating: req.query.min_rating ? parseFloat(req.query.min_rating) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit, 10) : 20,
    });
    res.json({ success: true, data: providers });
  } catch (error) {
    next(error);
  }
}

/** GET /api/providers/:id — Xem profile công khai của 1 nhà xe */
async function getById(req, res, next) {
  try {
    const data = await providersService.getProviderById(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /api/providers/me — Xem profile provider hiện tại (Feature #39) */
async function getMe(req, res, next) {
  try {
    const data = await providersService.getMyProfile(req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /api/providers/me/documents — Xem danh sách giấy tờ đã upload (Feature #39) */
async function getMyDocuments(req, res, next) {
  try {
    const data = await providersService.getMyDocuments(req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** POST /api/providers/me/documents — Upload giấy tờ xác minh (Feature #38) */
async function uploadDocuments(req, res, next) {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return next(httpError(400, 'Không có file được upload', 'missing_files'));
    }
    const data = await providersService.uploadProviderDocuments(req.user.id, req.files);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** POST /api/providers/me/request-verification — Yêu cầu xét duyệt lại (Feature #39) */
async function requestVerification(req, res, next) {
  try {
    const data = await providersService.requestVerification(req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /api/providers/me/dashboard — Xem dashboard (Feature #40) */
async function getDashboard(req, res, next) {
  try {
    const data = await providersService.getDashboard(req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /api/providers/me/earnings — Xem thu nhập (Feature #40) */
async function getEarnings(req, res, next) {
  try {
    const period = req.query.period || 'month'; // week | month | year
    const data = await providersService.getEarnings(req.user.id, period);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /api/providers/me/schedule — Xem lịch làm việc */
async function getSchedule(req, res, next) {
  try {
    const data = await providersService.getSchedule(req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** PATCH /api/providers/me/schedule — Cập nhật lịch làm việc */
async function updateSchedule(req, res, next) {
  try {
    const data = await providersService.updateSchedule(req.user.id, req.body.slots);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/** GET /api/providers/me/quoted-orders — Xem các đơn đã báo giá */
async function getQuotedOrders(req, res, next) {
  try {
    const data = await providersService.getQuotedOrders(req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  browse,
  getById,
  getMe,
  getMyDocuments,
  uploadDocuments,
  requestVerification,
  getDashboard,
  getEarnings,
  getSchedule,
  updateSchedule,
  getQuotedOrders,
};
