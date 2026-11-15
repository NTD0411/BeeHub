const { supabaseAdmin } = require('../services/supabase.service');
const { verifyAccessToken } = require('../utils/jwt');

/**
 * Bearer JWT do Node API phát hành — dùng cho mọi route bảo vệ.
 */
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Thiếu access token',
      });
    }

    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    req.accessToken = token;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn',
      code: 'invalid_token',
    });
  }
}

/** @deprecated Dùng requireAuth — giữ alias để không vỡ import cũ. */
const requireNodeAuth = requireAuth;

function requireRole(...roles) {
  return async (req, res, next) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ success: false, message: 'Thiếu access token' });
      }

      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('role, status')
        .eq('id', req.user.id)
        .single();

      if (error || !profile) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin người dùng',
        });
      }

      // Only block truly disabled accounts. Providers may be in pending_verification
      // but still need to access some flows (e.g., upload documents).
      if (profile.status === 'inactive') {
        return res.status(403).json({
          success: false,
          message: 'Tài khoản đã bị vô hiệu hóa',
        });
      }
      if (profile.status === 'suspended') {
        return res.status(403).json({
          success: false,
          message: 'Tài khoản đã bị tạm khóa',
        });
      }

      const role = profile.role;
      req.user.role = role;

      if (!role || !roles.includes(role)) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền truy cập',
        });
      }

      req.userRole = role;
      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi kiểm tra quyền',
      });
    }
  };
}

module.exports = { requireAuth, requireNodeAuth, requireRole };
