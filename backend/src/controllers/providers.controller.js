const providersService = require('../services/providers.service');

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

async function getById(req, res, next) {
  try {
    const reviewsLimit = req.query.reviews_limit
      ? parseInt(req.query.reviews_limit, 10)
      : 5;
    const data = await providersService.getProviderById(req.params.id, { reviewsLimit });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getEarnings(req, res, next) {
  try {
    const data = await providersService.getEarnings(req.user.id, req.query.period || 'week');
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getSchedule(req, res, next) {
  try {
    const data = await providersService.getSchedule(req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function updateSchedule(req, res, next) {
  try {
    const data = await providersService.updateSchedule(req.user.id, req.body.slots);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function uploadDocuments(req, res, next) {
  try {
    const data = await providersService.uploadProviderDocuments(req.user.id, req.files || {});
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getMyDocuments(req, res, next) {
  try {
    const data = await providersService.getMyDocuments(req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getQuotedOrders(req, res, next) {
  try {
    const data = await providersService.getQuotedOrders(req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function requestVerification(req, res, next) {
  try {
    const data = await providersService.requestVerification(req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  browse,
  getById,
  getEarnings,
  getSchedule,
  updateSchedule,
  uploadDocuments,
  getMyDocuments,
  getQuotedOrders,
  requestVerification,
};
