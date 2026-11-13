/**
 * SCAFFOLD — Chỉ gọi auth.service; không thêm logic ở đây.
 */
const authService = require('../services/auth.service');

async function register(req, res, next) {
  try {
    const data = await authService.register(req.body || {});
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const data = await authService.login(req.body || {});
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function me(req, res, next) {
  try {
    const user = await authService.getMe(req.user.id);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const data = await authService.updateProfile(req.user.id, req.body || {});
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const data = await authService.changePassword(req.user.id, req.body || {});
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body || {};
    const data = await authService.forgotPassword(email);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const data = await authService.resetPassword(req.body || {});
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function googleAuth(req, res, next) {
  try {
    const data = await authService.googleAuth(req.body || {});
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    const data = await authService.logout(req.accessToken);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function sendPhoneOtp(req, res, next) {
  try {
    const data = await authService.sendPhoneOtp(req.body || {});
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function verifyPhoneOtp(req, res, next) {
  try {
    const data = await authService.verifyPhoneOtp(req.body || {});
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function deactivateAccount(req, res, next) {
  try {
    const data = await authService.deactivateAccount(req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  me,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  googleAuth,
  logout,
  sendPhoneOtp,
  verifyPhoneOtp,
  deactivateAccount,
};
