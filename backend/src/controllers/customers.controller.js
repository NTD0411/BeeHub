const customersService = require('../services/customers.service');
const { httpError } = require('../services/auth.helpers');

async function getMe(req, res, next) {
  try {
    const data = await customersService.getProfile(req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function patchMe(req, res, next) {
  try {
    const data = await customersService.updateProfile(req.user.id, req.body || {});
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getRecentPlaces(req, res, next) {
  try {
    const limit = req.query.limit;
    const data = await customersService.getRecentPlaces(req.user.id, limit);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getBookingLocations(req, res, next) {
  try {
    const limit = req.query.limit;
    const data = await customersService.getBookingLocations(req.user.id, limit);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function addRecentPlace(req, res, next) {
  try {
    const data = await customersService.saveRecentPlace(req.user.id, req.body || {});
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function clearRecentPlaces(req, res, next) {
  try {
    const data = await customersService.clearRecentPlaces(req.user.id);
    res.json({ success: true, data, message: 'Đã xóa địa điểm gần đây' });
  } catch (error) {
    next(error);
  }
}

async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) {
      return next(httpError(400, 'Không có file được upload (field: avatar)', 'missing_file'));
    }
    const data = await customersService.uploadAvatar(req.user.id, req.file);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMe,
  patchMe,
  getRecentPlaces,
  addRecentPlace,
  getBookingLocations,
  clearRecentPlaces,
  uploadAvatar,
};
