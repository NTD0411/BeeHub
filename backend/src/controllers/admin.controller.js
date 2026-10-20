const { supabaseAdmin } = require('../services/supabase.service');
const authService = require('../services/auth.service');
const customersService = require('../services/customers.service');
const { normalizePhone } = require('../services/auth.helpers');
const { createNotification } = require('../services/notification.service');

/**
 * Admin login — Node JWT (user_credentials), không dùng Supabase Auth.
 * POST /api/admin/auth/login
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email và mật khẩu là bắt buộc',
      });
    }

    const data = await authService.login({ email, password });

    if (data.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập admin',
      });
    }

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
        code: error.code,
      });
    }
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng nhập',
    });
  }
}

/**
 * Get admin profile
 * GET /api/admin/auth/profile
 */
async function getProfile(req, res) {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, role, avatar_url, phone, created_at, updated_at')
      .eq('id', req.user.id)
      .single();

    if (error || !profile) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin admin',
      });
    }

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin admin',
    });
  }
}

/**
 * Update admin profile
 * PATCH /api/admin/auth/profile
 */
async function updateProfile(req, res) {
  try {
    const { full_name, phone } = req.body || {};

    if (req.body?.email !== undefined || req.body?.role !== undefined) {
      return res.status(400).json({
        success: false,
        message: 'Không được sửa email hoặc role',
      });
    }

    const updates = {};
    if (full_name !== undefined) {
      const name = String(full_name).trim();
      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Họ tên không được để trống',
        });
      }
      updates.full_name = name;
    }
    if (phone !== undefined) {
      const raw = String(phone).trim();
      updates.phone = raw ? normalizePhone(raw) : null;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có trường hợp lệ để cập nhật',
      });
    }

    updates.updated_at = new Date().toISOString();

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', req.user.id)
      .select('id, email, full_name, role, avatar_url, phone, created_at, updated_at')
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Cập nhật hồ sơ thành công',
      data: profile,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
        code: error.code,
      });
    }
    console.error('Update admin profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật hồ sơ',
    });
  }
}

/**
 * Upload admin avatar
 * POST /api/admin/auth/avatar
 */
async function uploadAvatar(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Không có file được upload (field: avatar)',
      });
    }

    await customersService.uploadAvatar(req.user.id, req.file);

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, role, avatar_url, phone, created_at, updated_at')
      .eq('id', req.user.id)
      .single();

    if (error || !profile) throw error || new Error('Profile not found');

    res.json({
      success: true,
      message: 'Cập nhật ảnh đại diện thành công',
      data: profile,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
        code: error.code,
      });
    }
    console.error('Upload admin avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi upload ảnh đại diện',
    });
  }
}

/**
 * Admin dashboard stats - Morning KPI Dashboard
 * GET /api/admin/dashboard
 */
async function getDashboard(req, res) {
  try {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // GMV Yesterday
    const { data: gmvYesterday } = await supabaseAdmin
      .from('orders')
      .select('total_price')
      .eq('status', 'completed')
      .gte('completed_at', yesterday.toISOString().split('T')[0])
      .lt('completed_at', now.toISOString().split('T')[0]);

    const gmv_yesterday = gmvYesterday?.reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0) || 0;

    // Orders Yesterday  
    const { count: orders_yesterday } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday.toISOString().split('T')[0])
      .lt('created_at', now.toISOString().split('T')[0]);

    // Active Users
    const { count: active_users } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Pending Verifications
    const { count: pending_verifications } = await supabaseAdmin
      .from('provider_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'pending');

    // Open Disputes
    const { count: open_disputes } = await supabaseAdmin
      .from('disputes')
      .select('*', { count: 'exact', head: true })
      .in('status', ['open', 'investigating']);

    // Platform Commission (this month)
    const { data: commissionsThisMonth } = await supabaseAdmin
      .from('provider_earnings')
      .select('platform_commission')
      .gte('created_at', startOfMonth.toISOString());

    const platform_commission = commissionsThisMonth?.reduce(
      (sum, earning) => sum + parseFloat(earning.platform_commission || 0), 0
    ) || 0;

    res.json({
      success: true,
      data: {
        gmv_yesterday,
        orders_yesterday: orders_yesterday || 0,
        active_users: active_users || 0,
        pending_verifications: pending_verifications || 0,
        open_disputes: open_disputes || 0,
        platform_commission,
      },
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy dashboard',
    });
  }
}

/** GET /api/admin/dashboard/stats */
async function getDashboardStats(req, res) {
  return getDashboard(req, res);
}

/** GET /api/admin/providers/pending */
async function getPendingProviders(req, res) {
  try {
    const { status = 'pending' } = req.query;
    const allowed = ['pending', 'approved', 'rejected'];
    const normalizedStatus = allowed.includes(String(status)) ? String(status) : 'pending';

    const { data: providers, error } = await supabaseAdmin
      .from('provider_profiles')
      .select(`
        id,
        business_name,
        vehicle_type,
        vehicle_plate,
        verification_status,
        created_at,
        profiles!provider_profiles_id_fkey(
          full_name,
          email,
          phone,
          avatar_url,
          address,
          ward,
          city
        ),
        provider_documents(
          id,
          document_type,
          document_url,
          document_number,
          issue_date,
          expiry_date,
          is_verified,
          notes,
          created_at
        )
      `)
      .eq('verification_status', normalizedStatus)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    res.json({
      success: true,
      data: providers || [],
      count: providers?.length || 0,
    });
  } catch (error) {
    console.error('Get pending providers error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách provider chờ duyệt',
      error: error.message,
    });
  }
}

/** PUT /api/admin/providers/:id/verify */
async function verifyProvider(req, res) {
  try {
    const { id } = req.params;
    const { action, notes } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action phải là "approve" hoặc "reject"',
      });
    }

    const verification_status = action === 'approve' ? 'approved' : 'rejected';
    const is_verified = action === 'approve';

    const { data: updatedProvider, error } = await supabaseAdmin
      .from('provider_profiles')
      .update({
        verification_status,
        is_verified,
        verification_notes: notes,
        verified_at: new Date().toISOString(),
        verified_by: req.user.id,
      })
      .eq('id', id)
      .select(`
        *,
        profiles!provider_profiles_id_fkey(full_name, email)
      `)
      .maybeSingle();

    // Khi approve: đánh dấu tất cả giấy tờ của provider là đã xác minh
    // và cập nhật profiles.status → active
    if (is_verified) {
      await supabaseAdmin
        .from('provider_documents')
        .update({ is_verified: true, verified_by: req.user.id })
        .eq('provider_id', id);

      await supabaseAdmin
        .from('profiles')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', id);
    }

    // Khi reject: xóa toàn bộ giấy tờ để provider phải upload lại từ đầu
    if (!is_verified) {
      await supabaseAdmin
        .from('provider_documents')
        .delete()
        .eq('provider_id', id);
    }

    if (error) {
      console.error('Update provider error:', error);
      throw error;
    }

    if (!updatedProvider) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy provider',
      });
    }

    try {
      await supabaseAdmin.from('notifications').insert({
        user_id: id,
        notification_type: 'provider_verified',
        title: action === 'approve' ? 'Tài khoản đã được xác thực' : 'Tài khoản bị từ chối',
        body:
          action === 'approve'
            ? 'Chúc mừng! Tài khoản nhà cung cấp của bạn đã được xác thực thành công.'
            : `Tài khoản của bạn bị từ chối. Lý do: ${notes || 'Không đạt yêu cầu'}`,
        priority: 'high',
      });
    } catch (notifError) {
      console.warn('Failed to create notification:', notifError.message);
    }

    res.json({
      success: true,
      message: `${action === 'approve' ? 'Duyệt' : 'Từ chối'} provider thành công`,
      data: updatedProvider,
    });
  } catch (error) {
    console.error('Verify provider error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xử lý duyệt provider',
      error: error.message,
    });
  }
}

/** GET /api/admin/disputes */
async function getDisputes(req, res) {
  try {
    const { status = 'all', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('disputes')
      .select(`
        id,
        dispute_type,
        subject,
        description,
        status,
        priority,
        evidence_images,
        refund_amount,
        created_at,
        resolved_at,
        orders!inner(
          order_number,
          total_price,
          status
        ),
        raised_by_profile:profiles!disputes_raised_by_fkey(
          full_name,
          email,
          role
        ),
        against_user_profile:profiles!disputes_against_user_id_fkey(
          full_name,
          email,
          role
        ),
        assigned_to_profile:profiles!disputes_assigned_to_fkey(
          full_name,
          email
        )
      `)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: disputes, error } = await query;
    if (error) {
      console.error('Supabase disputes error:', error);
      throw error;
    }

    let countQuery = supabaseAdmin.from('disputes').select('*', { count: 'exact', head: true });
    if (status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }
    const { count } = await countQuery;

    res.json({
      success: true,
      data: disputes || [],
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Get disputes error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách khiếu nại',
      error: error.message,
    });
  }
}

/** GET /api/admin/disputes/:id */
async function getDisputeDetails(req, res) {
  try {
    const { id } = req.params;

    const { data: dispute, error } = await supabaseAdmin
      .from('disputes')
      .select(`
        *,
        orders!inner(
          order_number,
          total_price,
          status,
          pickup_address,
          delivery_address,
          created_at
        ),
        raised_by_profile:profiles!disputes_raised_by_fkey(
          full_name,
          email,
          phone,
          role
        ),
        against_user_profile:profiles!disputes_against_user_id_fkey(
          full_name,
          email,
          phone,
          role
        ),
        dispute_messages(
          id,
          message,
          attachments,
          is_internal,
          created_at,
          sender:profiles!dispute_messages_sender_id_fkey(
            full_name,
            role
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase dispute details error:', error);
      throw error;
    }

    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khiếu nại',
      });
    }

    res.json({
      success: true,
      data: dispute,
    });
  } catch (error) {
    console.error('Get dispute details error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy chi tiết khiếu nại',
      error: error.message,
    });
  }
}

/** PUT /api/admin/disputes/:id/resolve */
async function resolveDispute(req, res) {
  try {
    const { id } = req.params;
    const { resolution, resolution_type, refund_amount, internal_notes } = req.body;

    if (!resolution || !resolution_type) {
      return res.status(400).json({
        success: false,
        message: 'Resolution và resolution_type là bắt buộc',
      });
    }

    const { data: updatedDispute, error } = await supabaseAdmin
      .from('disputes')
      .update({
        status: 'resolved',
        resolution,
        resolution_type,
        refund_amount: refund_amount || null,
        resolved_by: req.user.id,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        orders!inner(order_number),
        raised_by_profile:profiles!disputes_raised_by_fkey(full_name, email)
      `)
      .maybeSingle();

    if (error) {
      console.error('Update dispute error:', error);
      throw error;
    }

    if (!updatedDispute) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khiếu nại',
      });
    }

    if (internal_notes) {
      await supabaseAdmin.from('dispute_messages').insert({
        dispute_id: id,
        sender_id: req.user.id,
        message: internal_notes,
        is_internal: true,
      });
    }

    await supabaseAdmin.from('notifications').insert({
      user_id: updatedDispute.raised_by,
      notification_type: 'dispute_resolved',
      title: 'Khiếu nại đã được xử lý',
      body: `Khiếu nại cho đơn hàng ${updatedDispute.orders.order_number} đã được xử lý. ${resolution}`,
      priority: 'high',
    });

    if (refund_amount && refund_amount > 0) {
      const paymentsService = require('../services/payments.service');

      // Tìm payment của đơn để link refund đúng
      const { data: payment } = await supabaseAdmin
        .from('payments')
        .select('id')
        .eq('order_id', updatedDispute.order_id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (payment) {
        // Tạo refund record rồi gọi completeRefund để cộng ví + notify
        const { data: refundRecord } = await supabaseAdmin
          .from('refunds')
          .insert({
            payment_id: payment.id,
            order_id: updatedDispute.order_id,
            refund_amount,
            refund_reason: `Giải quyết khiếu nại: ${resolution}`,
            status: 'pending',
            requested_by: updatedDispute.raised_by,
          })
          .select('id')
          .single();

        if (refundRecord) {
          await paymentsService.completeRefund(refundRecord.id, req.user.id);
        }
      }
    }

    res.json({
      success: true,
      message: 'Xử lý khiếu nại thành công',
      data: updatedDispute,
    });
  } catch (error) {
    console.error('Resolve dispute error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xử lý khiếu nại',
      error: error.message,
    });
  }
}

/**
 * Users Management APIs
 */

/** GET /api/admin/users */
async function getUsers(req, res) {
  try {
    const { 
      role = 'all', 
      search = '', 
      status = 'all', 
      page = 1, 
      pageSize = 20 
    } = req.query;
    
    const offset = (page - 1) * pageSize;

    let query = supabaseAdmin
      .from('profiles')
      .select(`
        id,
        email,
        phone,
        full_name,
        avatar_url,
        role,
        status,
        created_at,
        updated_at,
        customer_profiles!customer_profiles_id_fkey (
          university,
          total_orders,
          total_spent
        ),
        provider_profiles!provider_profiles_id_fkey (
          business_name,
          vehicle_type,
          vehicle_plate,
          rating,
          total_reviews,
          total_orders,
          total_earnings,
          verification_status,
          is_verified
        )
      `)
      .range(offset, offset + pageSize - 1)
      .order('created_at', { ascending: false });

    if (role !== 'all') {
      query = query.eq('role', role);
    }
    
    if (status !== 'all') {
      query = query.eq('status', status);
    }
    
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data: users, error } = await query;
    if (error) throw error;

    const flattened = (users || []).map((user) => {
      const cp = Array.isArray(user.customer_profiles)
        ? user.customer_profiles[0]
        : user.customer_profiles;
      const pp = Array.isArray(user.provider_profiles)
        ? user.provider_profiles[0]
        : user.provider_profiles;
      const { customer_profiles, provider_profiles, ...base } = user;
      return {
        ...base,
        university: cp?.university ?? null,
        total_orders: cp?.total_orders ?? pp?.total_orders ?? 0,
        total_spent: cp?.total_spent ?? 0,
        business_name: pp?.business_name ?? null,
        vehicle_type: pp?.vehicle_type ?? null,
        vehicle_plate: pp?.vehicle_plate ?? null,
        rating: pp?.rating ?? null,
        total_reviews: pp?.total_reviews ?? 0,
        total_earnings: pp?.total_earnings ?? 0,
        verification_status: pp?.verification_status ?? 'pending',
        is_verified: pp?.is_verified ?? false,
      };
    });

    // Get total count for pagination
    let countQuery = supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true });
    if (role !== 'all') countQuery = countQuery.eq('role', role);
    if (status !== 'all') countQuery = countQuery.eq('status', status);
    if (search) countQuery = countQuery.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    
    const { count } = await countQuery;

    res.json({
      success: true,
      data: flattened,
      meta: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: count || 0,
        pages: Math.ceil((count || 0) / pageSize)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách người dùng'
    });
  }
}

/** PATCH /api/admin/users/:id/status */
async function updateUserStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['active', 'inactive', 'suspended', 'pending_verification'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status không hợp lệ'
      });
    }

    const { data: updatedUser, error } = await supabaseAdmin
      .from('profiles')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    // Create notification
    const statusMessages = {
      active: 'Tài khoản đã được kích hoạt',
      inactive: 'Tài khoản đã bị vô hiệu hóa',
      suspended: 'Tài khoản đã bị tạm khóa',
      pending_verification: 'Tài khoản cần xác minh'
    };

    await supabaseAdmin.from('notifications').insert({
      user_id: id,
      notification_type: 'account_status_update',
      title: 'Cập nhật trạng thái tài khoản',
      body: statusMessages[status],
      priority: status === 'suspended' ? 'high' : 'normal'
    });

    res.json({
      success: true,
      message: 'Cập nhật trạng thái người dùng thành công',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật trạng thái người dùng'
    });
  }
}

/**
 * Orders Management APIs
 */

/** GET /api/admin/orders */
async function getOrders(req, res) {
  try {
    const { 
      status = 'all', 
      search = '', 
      page = 1, 
      pageSize = 20,
      dateFrom,
      dateTo
    } = req.query;
    
    const offset = (page - 1) * pageSize;

    let query = supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        total_price,
        pickup_address,
        delivery_address,
        pickup_city,
        delivery_city,
        vehicle_size,
        scheduled_pickup_time,
        created_at,
        completed_at,
        customer:profiles!orders_customer_id_fkey(
          full_name,
          email,
          phone
        ),
        provider:provider_profiles!orders_provider_id_fkey(
          business_name,
          profiles!provider_profiles_id_fkey(
            full_name,
            phone
          )
        )
      `)
      .range(offset, offset + pageSize - 1)
      .order('created_at', { ascending: false });

    const STATUS_GROUPS = {
      pending: ['pending', 'matched', 'accepted'],
      shipping: ['picking_up', 'picked_up', 'in_progress'],
      completed: ['completed'],
      cancelled: ['cancelled'],
      disputed: ['disputed'],
    };
    const statusGroup = req.query.statusGroup;
    if (statusGroup && STATUS_GROUPS[statusGroup]) {
      query = query.in('status', STATUS_GROUPS[statusGroup]);
    } else if (status !== 'all') {
      query = query.eq('status', status);
    }
    
    if (search) {
      query = query.ilike('order_number', `%${search}%`);
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    const { data: orders, error } = await query;
    if (error) throw error;

    // Get total count
    let countQuery = supabaseAdmin.from('orders').select('*', { count: 'exact', head: true });
    if (statusGroup && STATUS_GROUPS[statusGroup]) {
      countQuery = countQuery.in('status', STATUS_GROUPS[statusGroup]);
    } else if (status !== 'all') countQuery = countQuery.eq('status', status);
    if (search) countQuery = countQuery.ilike('order_number', `%${search}%`);
    if (dateFrom) countQuery = countQuery.gte('created_at', dateFrom);
    if (dateTo) countQuery = countQuery.lte('created_at', dateTo);
    
    const { count } = await countQuery;

    res.json({
      success: true,
      data: orders || [],
      meta: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: count || 0,
        pages: Math.ceil((count || 0) / pageSize)
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách đơn hàng'
    });
  }
}

/** GET /api/admin/orders/:id */
async function getOrderById(req, res) {
  try {
    const { id } = req.params;

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        customer:profiles!orders_customer_id_fkey(
          full_name,
          email,
          phone,
          avatar_url
        ),
        provider:provider_profiles!orders_provider_id_fkey(
          business_name,
          vehicle_type,
          vehicle_plate,
          profiles!provider_profiles_id_fkey(
            full_name,
            phone,
            avatar_url
          )
        ),
        order_status_history(
          from_status,
          to_status,
          notes,
          created_at,
          changed_by_profile:profiles!order_status_history_changed_by_fkey(
            full_name,
            role
          )
        ),
        payments(
          id,
          amount,
          status,
          payment_method,
          created_at,
          paid_at
        ),
        order_items(
          item_name,
          quantity,
          estimated_weight,
          is_fragile,
          notes,
          image_url
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy chi tiết đơn hàng'
    });
  }
}

/** PUT /api/admin/orders/:id/cancel */
async function forceCancelOrder(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Lý do hủy đơn là bắt buộc'
      });
    }

    const { data: updatedOrder, error } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_by: req.user.id,
        cancelled_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        customer:profiles!orders_customer_id_fkey(full_name, email)
      `)
      .single();

    if (error) throw error;

    // Add to status history
    await supabaseAdmin.from('order_status_history').insert({
      order_id: id,
      from_status: updatedOrder.status,
      to_status: 'cancelled',
      changed_by: req.user.id,
      notes: `Admin hủy đơn: ${reason}`
    });

    // Notify customer
    await supabaseAdmin.from('notifications').insert({
      user_id: updatedOrder.customer_id,
      notification_type: 'order_cancelled',
      title: 'Đơn hàng đã bị hủy',
      body: `Đơn hàng ${updatedOrder.order_number} đã bị hủy bởi admin. Lý do: ${reason}`,
      priority: 'high',
      order_id: id
    });

    res.json({
      success: true,
      message: 'Hủy đơn hàng thành công',
      data: updatedOrder
    });
  } catch (error) {
    console.error('Force cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi hủy đơn hàng'
    });
  }
}

/**
 * Reviews Management APIs
 */

/** GET /api/admin/reviews */
async function getReviews(req, res) {
  try {
    const { 
      flagged = 'all', 
      hidden = 'all', 
      page = 1, 
      pageSize = 20 
    } = req.query;
    
    const offset = (page - 1) * pageSize;

    let query = supabaseAdmin
      .from('reviews')
      .select(`
        id,
        rating,
        title,
        comment,
        is_published,
        is_flagged,
        flagged_reason,
        is_hidden,
        hidden_reason,
        created_at,
        moderated_at,
        order:orders!reviews_order_id_fkey(
          order_number
        ),
        customer:profiles!reviews_customer_id_fkey(
          full_name,
          email
        ),
        provider:provider_profiles!reviews_provider_id_fkey(
          business_name,
          profiles!provider_profiles_id_fkey(
            full_name
          )
        ),
        moderated_by_profile:profiles!reviews_moderated_by_fkey(
          full_name
        )
      `)
      .range(offset, offset + pageSize - 1)
      .order('created_at', { ascending: false });

    if (flagged === 'true') {
      query = query.eq('is_flagged', true);
    } else if (flagged === 'false') {
      query = query.eq('is_flagged', false);
    }
    
    if (hidden === 'true') {
      query = query.eq('is_hidden', true);
    } else if (hidden === 'false') {
      query = query.eq('is_hidden', false);
    }

    const { data: reviews, error } = await query;
    if (error) throw error;

    // Get total count
    let countQuery = supabaseAdmin.from('reviews').select('*', { count: 'exact', head: true });
    if (flagged === 'true') countQuery = countQuery.eq('is_flagged', true);
    else if (flagged === 'false') countQuery = countQuery.eq('is_flagged', false);
    if (hidden === 'true') countQuery = countQuery.eq('is_hidden', true);
    else if (hidden === 'false') countQuery = countQuery.eq('is_hidden', false);
    
    const { count } = await countQuery;

    res.json({
      success: true,
      data: reviews || [],
      meta: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: count || 0,
        pages: Math.ceil((count || 0) / pageSize)
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách đánh giá'
    });
  }
}

/** PUT /api/admin/reviews/:id/hide */
async function hideReview(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const { data: updatedReview, error } = await supabaseAdmin
      .from('reviews')
      .update({
        is_hidden: true,
        hidden_reason: reason,
        is_published: false,
        moderated_by: req.user.id,
        moderated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Ẩn đánh giá thành công',
      data: updatedReview
    });
  } catch (error) {
    console.error('Hide review error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi ẩn đánh giá'
    });
  }
}

/** PUT /api/admin/reviews/:id/unhide */
async function unhideReview(req, res) {
  try {
    const { id } = req.params;

    const { data: updatedReview, error } = await supabaseAdmin
      .from('reviews')
      .update({
        is_hidden: false,
        hidden_reason: null,
        is_published: true,
        moderated_by: req.user.id,
        moderated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Hiện đánh giá thành công',
      data: updatedReview
    });
  } catch (error) {
    console.error('Unhide review error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi hiện đánh giá'
    });
  }
}

/** PUT /api/admin/reviews/:id/flag */
async function flagReview(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const { data: updatedReview, error } = await supabaseAdmin
      .from('reviews')
      .update({
        is_flagged: true,
        flagged_reason: reason
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Gắn cờ đánh giá thành công',
      data: updatedReview
    });
  } catch (error) {
    console.error('Flag review error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi gắn cờ đánh giá'
    });
  }
}

/**
 * Refunds Management APIs
 */

/** GET /api/admin/refunds */
async function getRefunds(req, res) {
  try {
    const { 
      status = 'all', 
      page = 1, 
      pageSize = 20 
    } = req.query;
    
    const offset = (page - 1) * pageSize;

    let query = supabaseAdmin
      .from('refunds')
      .select(`
        id,
        refund_amount,
        refund_reason,
        status,
        created_at,
        processed_at,
        order:orders!refunds_order_id_fkey(
          order_number,
          total_price
        ),
        payment:payments!refunds_payment_id_fkey(
          payment_code,
          amount
        ),
        requested_by_profile:profiles!refunds_requested_by_fkey(
          full_name,
          email
        ),
        approved_by_profile:profiles!refunds_approved_by_fkey(
          full_name
        )
      `)
      .range(offset, offset + pageSize - 1)
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: refunds, error } = await query;
    if (error) throw error;

    // Get total count
    let countQuery = supabaseAdmin.from('refunds').select('*', { count: 'exact', head: true });
    if (status !== 'all') countQuery = countQuery.eq('status', status);
    
    const { count } = await countQuery;

    res.json({
      success: true,
      data: refunds || [],
      meta: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: count || 0,
        pages: Math.ceil((count || 0) / pageSize)
      }
    });
  } catch (error) {
    console.error('Get refunds error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách hoàn tiền'
    });
  }
}

/** PUT /api/admin/refunds/:id/approve */
async function approveRefund(req, res) {
  try {
    const paymentsService = require('../services/payments.service');
    const data = await paymentsService.completeRefund(req.params.id, req.user.id);

    res.json({
      success: true,
      message: data.message || 'Duyệt hoàn tiền thành công',
      data,
    });
  } catch (error) {
    console.error('Approve refund error:', error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Lỗi server khi duyệt hoàn tiền',
      ...(error.code ? { code: error.code } : {}),
    });
  }
}

/**
 * Analytics APIs
 */

/** GET /api/admin/analytics/gmv */
async function getGMVStats(req, res) {
  try {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // This month GMV
    const { data: thisMonthOrders } = await supabaseAdmin
      .from('orders')
      .select('total_price')
      .eq('status', 'completed')
      .gte('completed_at', thisMonth.toISOString());

    const thisGMV = thisMonthOrders?.reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0) || 0;

    // Last month GMV
    const { data: lastMonthOrders } = await supabaseAdmin
      .from('orders')
      .select('total_price')
      .eq('status', 'completed')
      .gte('completed_at', lastMonth.toISOString())
      .lte('completed_at', lastMonthEnd.toISOString());

    const lastGMV = lastMonthOrders?.reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0) || 0;

    const growth = lastGMV > 0 ? ((thisGMV - lastGMV) / lastGMV) * 100 : 0;

    res.json({
      success: true,
      data: {
        thisGMV,
        lastGMV,
        growth
      }
    });
  } catch (error) {
    console.error('Get GMV stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê GMV'
    });
  }
}

/** GET /api/admin/analytics/orders */
async function getOrderStatistics(req, res) {
  try {
    const { startDate, endDate } = req.query;
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const start = startDate ? new Date(startDate) : defaultStart;
    const end = endDate ? new Date(endDate) : now;

    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('id, status, total_price')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    const total_orders = orders?.length || 0;
    const completed_count = orders?.filter(o => o.status === 'completed').length || 0;
    const cancelled_count = orders?.filter(o => o.status === 'cancelled').length || 0;
    const total_revenue = orders?.filter(o => o.status === 'completed')
      .reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0) || 0;
    const average_order_value = completed_count > 0 ? total_revenue / completed_count : 0;
    const completion_rate = total_orders > 0 ? (completed_count / total_orders) * 100 : 0;

    res.json({
      success: true,
      data: {
        total_orders,
        completed_count,
        cancelled_count,
        total_revenue,
        average_order_value,
        completion_rate
      }
    });
  } catch (error) {
    console.error('Get order statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê đơn hàng'
    });
  }
}

/** GET /api/admin/analytics/providers */
async function getTopProviders(req, res) {
  try {
    const { limit = 10 } = req.query;

    const { data: providers } = await supabaseAdmin
      .from('provider_profiles')
      .select(`
        id,
        business_name,
        rating,
        total_reviews,
        total_orders,
        profiles!provider_profiles_id_fkey(
          full_name
        )
      `)
      .eq('is_verified', true)
      .order('total_orders', { ascending: false })
      .limit(limit);

    res.json({
      success: true,
      data: providers || []
    });
  } catch (error) {
    console.error('Get top providers error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy top nhà cung cấp'
    });
  }
}

/** GET /api/admin/analytics/commission */
async function getPlatformCommissionByMonth(req, res) {
  try {
    const { months = 6 } = req.query;
    const now = new Date();
    const results = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const { data: earnings } = await supabaseAdmin
        .from('provider_earnings')
        .select('platform_commission')
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      const commission = earnings?.reduce((sum, earning) => sum + parseFloat(earning.platform_commission || 0), 0) || 0;

      results.push({
        month: monthStart.toISOString().substr(0, 7), // YYYY-MM
        commission
      });
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Get commission by month error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê hoa hồng'
    });
  }
}

/** GET /api/admin/analytics/revenue */
async function getRevenueByMonth(req, res) {
  try {
    const { months = 12 } = req.query;
    const now = new Date();
    const results = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const { data: orders } = await supabaseAdmin
        .from('orders')
        .select('total_price')
        .eq('status', 'completed')
        .gte('completed_at', monthStart.toISOString())
        .lte('completed_at', monthEnd.toISOString());

      const revenue = orders?.reduce((sum, order) => sum + parseFloat(order.total_price || 0), 0) || 0;

      results.push({
        month: monthStart.toISOString().substr(0, 7), // YYYY-MM
        revenue
      });
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Get revenue by month error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy doanh thu theo tháng'
    });
  }
}

/** GET /api/admin/analytics/ga4 — Google Analytics 4 (nguồn traffic, trang, sự kiện) */
async function getGA4Analytics(req, res) {
  try {
    const ga4Service = require('../services/ga4.service');
    const data = await ga4Service.getGA4Dashboard();
    res.json({ success: true, data });
  } catch (error) {
    console.error('Get GA4 analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi lấy dữ liệu GA4',
    });
  }
}

/**
 * Notifications/Announcements APIs  
 */

/** GET /api/admin/announcements */
async function getAnnouncements(req, res) {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    const { data: announcements, error } = await supabaseAdmin
      .from('announcements')
      .select(`
        id,
        title,
        body,
        target_audience,
        target_cities,
        priority,
        scheduled_at,
        published_at,
        expires_at,
        is_published,
        is_active,
        sent_count,
        read_count,
        created_at,
        created_by_profile:profiles!announcements_created_by_fkey(
          full_name
        )
      `)
      .range(offset, offset + pageSize - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const { count } = await supabaseAdmin
      .from('announcements')
      .select('*', { count: 'exact', head: true });

    res.json({
      success: true,
      data: announcements || [],
      meta: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: count || 0,
        pages: Math.ceil((count || 0) / pageSize)
      }
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách thông báo'
    });
  }
}

/** POST /api/admin/announcements */
async function createAnnouncement(req, res) {
  try {
    const { 
      title, 
      body, 
      targetAudience = 'all', 
      targetCities, 
      priority = 'normal', 
      scheduledAt 
    } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Title và body là bắt buộc'
      });
    }

    const isPublished = !scheduledAt; // Publish ngay nếu không có scheduledAt

    const { data: announcement, error } = await supabaseAdmin
      .from('announcements')
      .insert({
        title,
        body,
        target_audience: targetAudience,
        target_cities: targetCities,
        priority,
        scheduled_at: scheduledAt,
        is_published: isPublished,
        published_at: isPublished ? new Date().toISOString() : null,
        created_by: req.user.id
      })
      .select('*')
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Tạo thông báo thành công',
      data: announcement
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo thông báo'
    });
  }
}

/** PUT /api/admin/announcements/:id/publish */
async function publishAnnouncement(req, res) {
  try {
    const { id } = req.params;

    const { data: announcement, error } = await supabaseAdmin
      .from('announcements')
      .update({
        is_published: true,
        published_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Xuất bản thông báo thành công',
      data: announcement
    });
  } catch (error) {
    console.error('Publish announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xuất bản thông báo'
    });
  }
}

/**
 * Activity Logs APIs
 */

/** GET /api/admin/activity/orders */
async function getOrderStatusHistory(req, res) {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    const { data: history, error } = await supabaseAdmin
      .from('order_status_history')
      .select(`
        id,
        from_status,
        to_status,
        notes,
        created_at,
        order:orders!order_status_history_order_id_fkey(
          order_number,
          customer:profiles!orders_customer_id_fkey(full_name)
        ),
        changed_by_profile:profiles!order_status_history_changed_by_fkey(
          full_name,
          role
        )
      `)
      .range(offset, offset + pageSize - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const { count } = await supabaseAdmin
      .from('order_status_history')
      .select('*', { count: 'exact', head: true });

    res.json({
      success: true,
      data: history || [],
      meta: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: count || 0,
        pages: Math.ceil((count || 0) / pageSize)
      }
    });
  } catch (error) {
    console.error('Get order status history error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy lịch sử đơn hàng'
    });
  }
}

/** GET /api/admin/activity/verifications */
async function getVerificationHistory(req, res) {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    const { data: history, error } = await supabaseAdmin
      .from('provider_profiles')
      .select(`
        id,
        business_name,
        verification_status,
        verification_notes,
        verified_at,
        profiles!provider_profiles_id_fkey(
          full_name,
          email
        ),
        verified_by_profile:profiles!provider_profiles_verified_by_fkey(
          full_name
        )
      `)
      .not('verified_at', 'is', null)
      .range(offset, offset + pageSize - 1)
      .order('verified_at', { ascending: false });

    if (error) throw error;

    const { count } = await supabaseAdmin
      .from('provider_profiles')
      .select('*', { count: 'exact', head: true })
      .not('verified_at', 'is', null);

    res.json({
      success: true,
      data: history || [],
      meta: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: count || 0,
        pages: Math.ceil((count || 0) / pageSize)
      }
    });
  } catch (error) {
    console.error('Get verification history error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy lịch sử xác minh'
    });
  }
}

/** GET /api/admin/activity/refunds */
async function getRefundHistory(req, res) {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    const { data: history, error } = await supabaseAdmin
      .from('refunds')
      .select(`
        id,
        refund_amount,
        refund_reason,
        status,
        processed_at,
        order:orders!refunds_order_id_fkey(
          order_number
        ),
        requested_by_profile:profiles!refunds_requested_by_fkey(
          full_name,
          email
        ),
        approved_by_profile:profiles!refunds_approved_by_fkey(
          full_name
        )
      `)
      .not('processed_at', 'is', null)
      .range(offset, offset + pageSize - 1)
      .order('processed_at', { ascending: false });

    if (error) throw error;

    const { count } = await supabaseAdmin
      .from('refunds')
      .select('*', { count: 'exact', head: true })
      .not('processed_at', 'is', null);

    res.json({
      success: true,
      data: history || [],
      meta: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: count || 0,
        pages: Math.ceil((count || 0) / pageSize)
      }
    });
  } catch (error) {
    console.error('Get refund history error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy lịch sử hoàn tiền'
    });
  }
}

/**
 * Platform Settings APIs
 */

/** GET /api/admin/settings */
async function getPlatformSettings(req, res) {
  try {
    const { data: settings, error } = await supabaseAdmin
      .from('platform_settings')
      .select('key, value, description, updated_at');

    if (error) throw error;

    // Convert array to object for easier frontend use
    const settingsObj = {};
    settings?.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });

    res.json({
      success: true,
      data: settingsObj
    });
  } catch (error) {
    console.error('Get platform settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy cài đặt hệ thống'
    });
  }
}

/** PUT /api/admin/settings */
async function updatePlatformSettings(req, res) {
  try {
    const settings = req.body;

    const updatePromises = Object.entries(settings).map(([key, value]) => {
      return supabaseAdmin
        .from('platform_settings')
        .upsert({
          key,
          value,
          updated_at: new Date().toISOString(),
          updated_by: req.user.id
        });
    });

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Cập nhật cài đặt thành công'
    });
  } catch (error) {
    console.error('Update platform settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật cài đặt'
    });
  }
}

/** GET /api/admin/providers/:id/documents */
async function getProviderDocuments(req, res) {
  try {
    const { id } = req.params;

    const { data: documents, error } = await supabaseAdmin
      .from('provider_documents')
      .select(`
        id,
        document_type,
        document_url,
        document_number,
        issue_date,
        expiry_date,
        is_verified,
        notes,
        created_at,
        verified_by_profile:profiles!provider_documents_verified_by_fkey(
          full_name
        )
      `)
      .eq('provider_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: documents || []
    });
  } catch (error) {
    console.error('Get provider documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy giấy tờ nhà cung cấp'
    });
  }
}

/** GET /api/admin/dashboard/latest-orders */
async function getLatestOrders(req, res) {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    const { data: orders, error, count } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        total_price,
        pickup_city,
        delivery_city,
        created_at,
        customer:profiles!orders_customer_id_fkey(
          id,
          full_name,
          avatar_url
        ),
        provider:provider_profiles!orders_provider_id_fkey(
          business_name,
          profiles!provider_profiles_id_fkey(
            id,
            full_name,
            avatar_url
          )
        )
      `, { count: 'exact' })
      .range(offset, offset + pageSize - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: orders || [],
      meta: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: count || 0,
        pages: Math.ceil((count || 0) / pageSize)
      }
    });
  } catch (error) {
    console.error('Get latest orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy đơn hàng mới nhất'
    });
  }
}

/** GET /api/admin/dashboard/order-status-distribution */
async function getOrderStatusDistribution(req, res) {
  try {
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('status');

    const statusCounts = {};
    orders?.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });

    const distribution = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: orders?.length ? (count / orders.length * 100).toFixed(1) : 0
    }));

    res.json({
      success: true,
      data: distribution
    });
  } catch (error) {
    console.error('Get order status distribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy phân bố trạng thái đơn hàng'
    });
  }
}

/**
 * Provider Earnings & Withdrawals APIs
 */

/** GET /api/admin/provider-earnings */
async function getProviderEarnings(req, res) {
  try {
    const { 
      status = 'all', 
      page = 1, 
      pageSize = 20 
    } = req.query;
    
    const offset = (page - 1) * pageSize;

    let query = supabaseAdmin
      .from('provider_earnings')
      .select(`
        id,
        order_amount,
        platform_commission,
        net_earnings,
        commission_rate,
        status,
        created_at,
        withdrawn_at,
        provider:provider_profiles!provider_earnings_provider_id_fkey(
          business_name,
          profiles!provider_profiles_id_fkey(
            full_name,
            email
          )
        ),
        order:orders!provider_earnings_order_id_fkey(
          order_number
        )
      `)
      .range(offset, offset + pageSize - 1)
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: earnings, error } = await query;
    if (error) throw error;

    // Get total count
    let countQuery = supabaseAdmin.from('provider_earnings').select('*', { count: 'exact', head: true });
    if (status !== 'all') countQuery = countQuery.eq('status', status);
    
    const { count } = await countQuery;

    res.json({
      success: true,
      data: earnings || [],
      meta: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: count || 0,
        pages: Math.ceil((count || 0) / pageSize)
      }
    });
  } catch (error) {
    console.error('Get provider earnings error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thu nhập nhà cung cấp'
    });
  }
}

/** GET /api/admin/withdrawals */
async function getWithdrawals(req, res) {
  try {
    const { 
      status = 'all', 
      page = 1, 
      pageSize = 20 
    } = req.query;
    
    const offset = (page - 1) * pageSize;

    let query = supabaseAdmin
      .from('provider_withdrawals')
      .select(`
        id,
        amount,
        bank_name,
        bank_account_number,
        bank_account_name,
        status,
        requested_at,
        processed_at,
        rejection_reason,
        provider:provider_profiles!provider_withdrawals_provider_id_fkey(
          business_name,
          profiles!provider_profiles_id_fkey(
            full_name,
            email,
            phone
          )
        ),
        processed_by_profile:profiles!provider_withdrawals_processed_by_fkey(
          full_name
        )
      `)
      .range(offset, offset + pageSize - 1)
      .order('requested_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: withdrawals, error } = await query;
    if (error) throw error;

    // Get total count
    let countQuery = supabaseAdmin.from('provider_withdrawals').select('*', { count: 'exact', head: true });
    if (status !== 'all') countQuery = countQuery.eq('status', status);
    
    const { count } = await countQuery;

    res.json({
      success: true,
      data: withdrawals || [],
      meta: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: count || 0,
        pages: Math.ceil((count || 0) / pageSize)
      }
    });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách rút tiền'
    });
  }
}

/** PUT /api/admin/withdrawals/:id/approve */
async function approveWithdrawal(req, res) {
  try {
    const { id } = req.params;
    const { transaction_reference } = req.body;

    const { data: withdrawal, error } = await supabaseAdmin
      .from('provider_withdrawals')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
        processed_by: req.user.id,
        transaction_reference
      })
      .eq('id', id)
      .select(`
        *,
        provider:provider_profiles!provider_withdrawals_provider_id_fkey(
          profiles!provider_profiles_id_fkey(full_name, email)
        )
      `)
      .single();

    if (error) throw error;

    // Notify provider
    await supabaseAdmin.from('notifications').insert({
      user_id: withdrawal.provider_id,
      notification_type: 'withdrawal_approved',
      title: 'Yêu cầu rút tiền đã được duyệt',
      body: `Yêu cầu rút tiền ${withdrawal.amount.toLocaleString()}đ đã được xử lý thành công`,
      priority: 'normal'
    });

    res.json({
      success: true,
      message: 'Duyệt rút tiền thành công',
      data: withdrawal
    });
  } catch (error) {
    console.error('Approve withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi duyệt rút tiền'
    });
  }
}

/** PUT /api/admin/withdrawals/:id/reject */
async function rejectWithdrawal(req, res) {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    if (!rejection_reason) {
      return res.status(400).json({
        success: false,
        message: 'Lý do từ chối là bắt buộc'
      });
    }

    const { data: withdrawal, error } = await supabaseAdmin
      .from('provider_withdrawals')
      .update({
        status: 'rejected',
        processed_at: new Date().toISOString(),
        processed_by: req.user.id,
        rejection_reason
      })
      .eq('id', id)
      .select(`
        *,
        provider:provider_profiles!provider_withdrawals_provider_id_fkey(
          profiles!provider_profiles_id_fkey(full_name, email)
        )
      `)
      .single();

    if (error) throw error;

    // Notify provider
    await supabaseAdmin.from('notifications').insert({
      user_id: withdrawal.provider_id,
      notification_type: 'withdrawal_rejected',
      title: 'Yêu cầu rút tiền bị từ chối',
      body: `Yêu cầu rút tiền ${withdrawal.amount.toLocaleString()}đ bị từ chối. Lý do: ${rejection_reason}`,
      priority: 'high'
    });

    res.json({
      success: true,
      message: 'Từ chối rút tiền thành công',
      data: withdrawal
    });
  } catch (error) {
    console.error('Reject withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi từ chối rút tiền'
    });
  }
}

const MARKETPLACE_LISTING_STATUSES = ['active', 'reserved', 'hidden', 'closed'];

/** GET /api/admin/marketplace/listings */
async function getMarketplaceListings(req, res) {
  try {
    const {
      status = 'all',
      keyword,
      page = 1,
      pageSize = 20,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const size = Math.min(50, Math.max(1, parseInt(pageSize, 10) || 20));
    const offset = (pageNum - 1) * size;

    let query = supabaseAdmin
      .from('marketplace_listings')
      .select(
        `
        id, title, description, category, condition, area, price, images,
        status, fee_paid, created_at, updated_at,
        profiles:owner_id ( id, full_name, email, phone )
      `,
        { count: 'exact' },
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + size - 1);

    if (status === 'pending_fee') {
      query = query.eq('fee_paid', false);
    } else if (status !== 'all' && MARKETPLACE_LISTING_STATUSES.includes(String(status))) {
      query = query.eq('status', status);
    }

    const kw = String(keyword || '').trim();
    if (kw) {
      query = query.or(`title.ilike.%${kw}%,description.ilike.%${kw}%`);
    }

    const { data: listings, error, count } = await query;
    if (error) throw error;

    res.json({
      success: true,
      data: listings || [],
      meta: {
        page: pageNum,
        pageSize: size,
        total: count || 0,
        pages: Math.ceil((count || 0) / size),
      },
    });
  } catch (error) {
    console.error('Get marketplace listings error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách tin Pass đồ',
    });
  }
}

/** PUT /api/admin/marketplace/listings/:id/status */
async function updateMarketplaceListingStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!MARKETPLACE_LISTING_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status không hợp lệ. Chọn: ${MARKETPLACE_LISTING_STATUSES.join(', ')}`,
      });
    }

    const { data: existing, error: findErr } = await supabaseAdmin
      .from('marketplace_listings')
      .select('id, title, owner_id, status, fee_paid')
      .eq('id', id)
      .single();

    if (findErr || !existing) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tin đăng',
      });
    }

    if (status === 'active' && !existing.fee_paid) {
      return res.status(400).json({
        success: false,
        message: 'Tin chưa thanh toán phí đăng — không thể hiển thị lại',
      });
    }

    const { data: updated, error } = await supabaseAdmin
      .from('marketplace_listings')
      .update({ status })
      .eq('id', id)
      .select(
        `
        id, title, status, fee_paid, updated_at,
        profiles:owner_id ( id, full_name, email )
      `,
      )
      .single();

    if (error) throw error;

    if (existing.owner_id) {
      const actionLabel =
        status === 'hidden' ? 'đã bị ẩn' : status === 'closed' ? 'đã bị đóng' : 'đã được hiển thị lại';
      await createNotification(
        existing.owner_id,
        'system_announcement',
        'Tin Pass đồ được cập nhật',
        reason
          ? `Tin "${existing.title}" ${actionLabel}. Lý do: ${reason}`
          : `Tin "${existing.title}" ${actionLabel} bởi quản trị viên.`,
        { listingId: id, priority: 'normal' },
      );
    }

    res.json({
      success: true,
      message: 'Cập nhật trạng thái tin đăng thành công',
      data: updated,
    });
  } catch (error) {
    console.error('Update marketplace listing status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật tin đăng',
    });
  }
}

/** POST /api/admin/marketplace/listings/:id/approve-fee */
async function approveMarketplaceListingFee(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    const { data: existing, error: findErr } = await supabaseAdmin
      .from('marketplace_listings')
      .select('id, title, owner_id, fee_paid, status')
      .eq('id', id)
      .single();

    if (findErr || !existing) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tin đăng',
      });
    }

    if (existing.fee_paid) {
      return res.status(400).json({
        success: false,
        message: 'Tin đã thanh toán phí đăng',
      });
    }

    const { data: updated, error } = await supabaseAdmin
      .from('marketplace_listings')
      .update({ fee_paid: true, status: 'active' })
      .eq('id', id)
      .select(
        `
        id, title, status, fee_paid, updated_at,
        profiles:owner_id ( id, full_name, email )
      `,
      )
      .single();

    if (error) throw error;

    if (existing.owner_id) {
      await createNotification(
        existing.owner_id,
        'system_announcement',
        'Tin Pass đồ đã được kích hoạt',
        reason
          ? `Tin "${existing.title}" đã được admin duyệt phí đăng. ${reason}`
          : `Tin "${existing.title}" đã được admin duyệt và hiển thị trên Chợ sinh viên.`,
        { listingId: id, priority: 'normal' },
      );
    }

    res.json({
      success: true,
      message: 'Duyệt phí đăng tin thành công',
      data: updated,
    });
  } catch (error) {
    console.error('Approve marketplace listing fee error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi duyệt phí đăng tin',
    });
  }
}

/** DELETE /api/admin/marketplace/listings/:id */
async function deleteMarketplaceListing(req, res) {
  try {
    const { id } = req.params;
    const trimmedReason = String(req.body?.reason || '').trim();

    if (!trimmedReason) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập lý do xóa tin',
      });
    }

    const { data: existing, error: findErr } = await supabaseAdmin
      .from('marketplace_listings')
      .select('id, title, owner_id')
      .eq('id', id)
      .single();

    if (findErr || !existing) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tin đăng',
      });
    }

    if (existing.owner_id) {
      const notifyBody =
        `Tin "${existing.title}" đã bị quản trị viên xóa khỏi Chợ sinh viên.\n\nLý do: ${trimmedReason}`;
      const notifyOpts = {
        priority: 'high',
        listingId: existing.id,
        actionUrl: '/cho-sinh-vien/tin-cua-toi',
        actionData: {
          listing_id: existing.id,
          listing_title: existing.title,
          delete_reason: trimmedReason,
        },
      };

      let notifyResult = await createNotification(
        existing.owner_id,
        'marketplace_listing_deleted',
        'Tin Pass đồ đã bị xóa',
        notifyBody,
        notifyOpts,
      );

      if (notifyResult.error) {
        notifyResult = await createNotification(
          existing.owner_id,
          'system_announcement',
          'Tin Pass đồ đã bị xóa',
          notifyBody,
          notifyOpts,
        );
      }

      if (notifyResult.error) {
        console.error('Notify owner on listing delete failed:', notifyResult.error.message);
      }
    }

    const { error } = await supabaseAdmin
      .from('marketplace_listings')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Xóa tin đăng thành công. Người đăng đã được thông báo.',
    });
  } catch (error) {
    console.error('Delete marketplace listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa tin đăng',
    });
  }
}

module.exports = {
  login,
  getProfile,
  updateProfile,
  uploadAvatar,
  getDashboard,
  getDashboardStats,
  getPendingProviders,
  getProviderDocuments,
  verifyProvider,
  getDisputes,
  getDisputeDetails,
  resolveDispute,
  // Dashboard extras
  getLatestOrders,
  getOrderStatusDistribution,
  // Users Management
  getUsers,
  updateUserStatus,
  // Orders Management  
  getOrders,
  getOrderById,
  forceCancelOrder,
  // Reviews Management
  getReviews,
  hideReview,
  unhideReview,
  flagReview,
  // Marketplace (Pass đồ)
  getMarketplaceListings,
  updateMarketplaceListingStatus,
  approveMarketplaceListingFee,
  deleteMarketplaceListing,
  // Refunds Management
  getRefunds,
  approveRefund,
  // Provider Earnings & Withdrawals
  getProviderEarnings,
  getWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  // Analytics
  getGMVStats,
  getOrderStatistics,
  getTopProviders,
  getPlatformCommissionByMonth,
  getRevenueByMonth,
  getGA4Analytics,
  // Notifications/Announcements
  getAnnouncements,
  createAnnouncement,
  publishAnnouncement,
  // Activity Logs
  getOrderStatusHistory,
  getVerificationHistory,
  getRefundHistory,
  // Platform Settings
  getPlatformSettings,
  updatePlatformSettings,
};
