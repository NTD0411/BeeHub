/**
 * Auth API — routes đã mount tại /api/auth (xem routes/index.js).
 * Auth Node JWT — register, login, me, forgot/reset password.
 *
 * | Method | Path              | Task   | Middleware      |
 * |--------|-------------------|--------|-----------------|
 * | POST   | /register         | BE-001 | body: email, password, full_name, phone |
 * | POST   | /login            | BE-003 | —               |
 * | GET    | /me               | BE-003 | requireNodeAuth |
 * | POST   | /change-password  | BE-006 | requireNodeAuth — đổi MK khi đã login |
 * | POST   | /forgot-password  | BE-007 | gửi OTP qua email |
 * | POST   | /reset-password   | BE-007 | email + token (OTP) + new_password |
 */
const express = require('express');
const authController = require('../controllers/auth.controller');
const { requireAuth, requireNodeAuth } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', requireAuth, authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/google', authController.googleAuth);
router.post('/send-phone-otp', requireNodeAuth, authController.sendPhoneOtp);
router.post('/verify-phone-otp', requireNodeAuth, authController.verifyPhoneOtp);

router.get('/me', requireNodeAuth, authController.me);
router.patch('/me', requireNodeAuth, authController.updateProfile);
router.post('/change-password', requireNodeAuth, authController.changePassword);
router.delete('/me', requireNodeAuth, authController.deactivateAccount);

module.exports = router;
