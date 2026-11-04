const authService = require('../services/auth.service');
const providerService = require('../services/provider.service');

async function getDocuments(req, res, next) {
  try {
    const data = await providerService.getDocuments(req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function uploadDocuments(req, res, next) {
  try {
    const data = await providerService.uploadDocuments(req.user.id, req.files, req.body || {});
    res.status(201).json({ success: true, data, message: 'Đã tải giấy tờ lên.' });
  } catch (error) {
    next(error);
  }
}

async function getVerification(req, res, next) {
  try {
    const data = await providerService.getVerification(req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function requestVerification(req, res, next) {
  try {
    const data = await providerService.requestVerification(req.user.id);
    res.json({ success: true, data, message: 'Hồ sơ đã gửi để xét duyệt.' });
  } catch (error) {
    next(error);
  }
}

async function setAvailability(req, res, next) {
  try {
    const data = await providerService.setAvailability(req.user.id, req.body?.is_available);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getDashboard(req, res, next) {
  try {
    const data = await providerService.getDashboard(req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function adminLogin(req, res, next) {
  try {
    const data = await authService.login(req.body || {});
    if (data.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Tài khoản không có quyền quản trị.' });
    }
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getPendingProviders(req, res, next) {
  try {
    const providers = await providerService.getPendingProviders(req.query.status);
    res.json({ success: true, data: providers, count: providers.length });
  } catch (error) {
    next(error);
  }
}

async function getProviderDocuments(req, res, next) {
  try {
    const data = await providerService.getDocumentsForAdmin(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function reviewProvider(req, res, next) {
  try {
    const { action, notes } = req.body || {};
    const data = await providerService.reviewProvider(req.params.id, req.user.id, action, notes);
    res.json({ success: true, data, message: action === 'approve' ? 'Đã duyệt hồ sơ.' : 'Đã từ chối hồ sơ.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDocuments,
  uploadDocuments,
  getVerification,
  requestVerification,
  setAvailability,
  getDashboard,
  adminLogin,
  getPendingProviders,
  getProviderDocuments,
  reviewProvider,
};
