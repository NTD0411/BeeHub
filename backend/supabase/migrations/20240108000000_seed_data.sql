-- UniMove Database Schema - Seed Data
-- Description: Initial data for development and testing

-- =====================================================
-- NOTIFICATION TEMPLATES
-- =====================================================

-- Xóa data cũ nếu có
DELETE FROM notification_templates;

INSERT INTO notification_templates (template_key, notification_type, title_template, body_template, language, default_priority, send_push, send_email) VALUES
-- Order notifications
('order_created', 'order_created', 'Đơn hàng đã được tạo', 'Đơn hàng {{order_number}} của bạn đã được tạo thành công. Chúng tôi đang tìm kiếm nhà cung cấp phù hợp.', 'vi', 'normal', true, true),
('order_accepted', 'order_accepted', 'Đơn hàng đã được chấp nhận', 'Nhà cung cấp {{provider_name}} đã chấp nhận đơn hàng {{order_number}} của bạn.', 'vi', 'high', true, true),
('order_started', 'order_started', 'Đơn hàng đang được thực hiện', 'Nhà cung cấp đang trên đường đến điểm lấy hàng. Theo dõi vị trí real-time trong ứng dụng.', 'vi', 'high', true, false),
('order_completed', 'order_completed', 'Đơn hàng hoàn thành', 'Đơn hàng {{order_number}} đã hoàn thành. Hãy đánh giá trải nghiệm của bạn!', 'vi', 'normal', true, true),
('order_cancelled', 'order_cancelled', 'Đơn hàng đã bị hủy', 'Đơn hàng {{order_number}} đã bị hủy. {{cancellation_reason}}', 'vi', 'high', true, true),

-- Payment notifications
('payment_received', 'payment_received', 'Thanh toán thành công', 'Thanh toán {{amount}} VNĐ cho đơn hàng {{order_number}} đã được xác nhận.', 'vi', 'normal', true, true),
('payment_failed', 'payment_failed', 'Thanh toán thất bại', 'Thanh toán cho đơn hàng {{order_number}} không thành công. Vui lòng thử lại.', 'vi', 'high', true, true),

-- Provider notifications
('new_order_available', 'order_created', 'Đơn hàng mới trong khu vực', 'Có đơn hàng mới phù hợp với bạn. Xem chi tiết và chấp nhận ngay!', 'vi', 'high', true, false),
('provider_nearby', 'provider_nearby', 'Nhà cung cấp đang đến gần', 'Nhà cung cấp đang cách bạn {{distance}} km. Dự kiến đến trong {{eta}} phút.', 'vi', 'normal', true, false),

-- Chat notifications
('new_message', 'new_message', 'Tin nhắn mới', '{{sender_name}}: {{message_preview}}', 'vi', 'normal', true, false),

-- Promotion notifications
('promotion_available', 'promotion', 'Ưu đãi đặc biệt dành cho bạn', 'Sử dụng mã {{promo_code}} để giảm {{discount}}% cho đơn hàng tiếp theo!', 'vi', 'low', true, true),

-- System notifications
('system_announcement', 'system_announcement', 'Thông báo hệ thống', '{{announcement_content}}', 'vi', 'normal', true, false);

-- =====================================================
-- SAMPLE PROMOTIONS
-- =====================================================

-- Xóa data cũ nếu có
DELETE FROM promotion_usage;
DELETE FROM promotions;

INSERT INTO promotions (code, name, description, discount_type, discount_value, max_discount_amount, min_order_amount, max_uses, max_uses_per_user, valid_from, valid_until, is_active) VALUES
('WELCOME10', 'Chào mừng khách hàng mới', 'Giảm 10% cho đơn hàng đầu tiên', 'percentage', 10.00, 50000, 100000, 1000, 1, NOW(), NOW() + INTERVAL '30 days', true),
('STUDENT15', 'Ưu đãi sinh viên', 'Giảm 15% cho sinh viên', 'percentage', 15.00, 100000, 200000, NULL, 5, NOW(), NOW() + INTERVAL '90 days', true),
('SAVE50K', 'Giảm 50K', 'Giảm ngay 50,000đ cho đơn từ 500K', 'fixed_amount', 50000, 50000, 500000, 500, 3, NOW(), NOW() + INTERVAL '60 days', true),
('FREESHIP', 'Miễn phí vận chuyển', 'Miễn phí vận chuyển cho đơn từ 300K', 'percentage', 100.00, 100000, 300000, 200, 2, NOW(), NOW() + INTERVAL '45 days', true);

-- =====================================================
-- SAMPLE ADMIN USER (for testing)
-- =====================================================
-- Note: This requires manual creation in Supabase Auth first
-- Then update the profile with admin role

-- Example SQL to run after creating admin user in Supabase Auth:
-- UPDATE profiles SET role = 'admin' WHERE email = 'admin@unimove.com';

-- =====================================================
-- SAMPLE CITIES AND SERVICE AREAS
-- =====================================================

-- This data can be used for location-based features
-- You can expand this based on your target cities

-- =====================================================
-- SAMPLE VEHICLE TYPES AND PRICING
-- =====================================================

-- This is reference data that can be used in the application
-- Actual pricing should be set by providers

-- Comments for reference:
-- Motorbike: 30,000 - 50,000 VNĐ base + 5,000 VNĐ/km
-- Small Truck: 100,000 - 150,000 VNĐ base + 10,000 VNĐ/km
-- Medium Truck: 200,000 - 300,000 VNĐ base + 15,000 VNĐ/km
-- Large Truck: 400,000 - 600,000 VNĐ base + 20,000 VNĐ/km

-- Floor pricing: 10,000 - 20,000 VNĐ per floor (without elevator)
-- Helper pricing: 50,000 - 100,000 VNĐ per helper

-- =====================================================
-- SAMPLE TAGS FOR REVIEWS
-- =====================================================

-- Common review tags that can be suggested to users:
-- Positive: 'helpful', 'friendly', 'careful', 'fast', 'professional', 'punctual', 'clean_vehicle', 'good_communication'
-- Negative: 'late', 'careless', 'rude', 'damaged_items', 'poor_communication', 'dirty_vehicle'

-- =====================================================
-- INDEXES FOR PERFORMANCE (Additional)
-- =====================================================

-- Create additional indexes for common queries
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_status ON orders(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_provider_status ON orders(provider_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_status_created ON payments(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_provider_published ON reviews(provider_id, is_published, created_at DESC);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View: Active orders with customer and provider info
CREATE OR REPLACE VIEW active_orders_view AS
SELECT 
    o.*,
    c.full_name as customer_name,
    c.phone as customer_phone,
    c.avatar_url as customer_avatar,
    p.business_name as provider_name,
    p.vehicle_type,
    p.vehicle_plate,
    p.full_name as provider_contact_name,
    p.phone as provider_phone,
    p.avatar_url as provider_avatar
FROM orders o
LEFT JOIN profiles c ON o.customer_id = c.id
LEFT JOIN profiles p ON o.provider_id = p.id AND p.role = 'provider'
WHERE o.status NOT IN ('completed', 'cancelled');

-- View: Provider statistics
CREATE OR REPLACE VIEW provider_statistics_view AS
SELECT 
    p.id as provider_id,
    p.business_name,
    p.full_name,
    p.avatar_url,
    p.rating,
    p.total_reviews,
    p.total_orders,
    p.total_earnings,
    p.is_verified,
    p.is_available,
    COUNT(DISTINCT CASE WHEN o.status IN ('accepted', 'matched', 'in_progress', 'picking_up', 'picked_up', 'delivering') THEN o.id END) as active_orders,
    COUNT(DISTINCT CASE WHEN o.status = 'completed' AND o.completed_at >= NOW() - INTERVAL '30 days' THEN o.id END) as orders_last_30_days,
    COALESCE(SUM(CASE WHEN pe.status = 'available' THEN pe.net_earnings ELSE 0 END), 0) as available_earnings
FROM profiles p
LEFT JOIN orders o ON p.id = o.provider_id
LEFT JOIN provider_earnings pe ON p.id = pe.provider_id
WHERE p.role = 'provider'
GROUP BY p.id, p.business_name, p.full_name, p.avatar_url, p.rating, p.total_reviews, p.total_orders, p.total_earnings, p.is_verified, p.is_available;

-- View: Customer order history summary
CREATE OR REPLACE VIEW customer_order_summary_view AS
SELECT 
    p.id as customer_id,
    p.full_name,
    p.email,
    p.phone,
    p.total_orders,
    p.total_spent,
    p.loyalty_points,
    COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.id END) as completed_orders,
    COUNT(DISTINCT CASE WHEN o.status = 'cancelled' THEN o.id END) as cancelled_orders,
    COUNT(DISTINCT CASE WHEN o.status IN ('pending', 'matched', 'accepted', 'in_progress', 'picking_up', 'picked_up', 'delivering') THEN o.id END) as active_orders,
    MAX(o.created_at) as last_order_date
FROM profiles p
LEFT JOIN orders o ON p.id = o.customer_id
WHERE p.role = 'customer'
GROUP BY p.id, p.full_name, p.email, p.phone, p.total_orders, p.total_spent, p.loyalty_points;

-- View: Daily revenue summary
CREATE OR REPLACE VIEW daily_revenue_view AS
SELECT 
    DATE(p.paid_at) as date,
    COUNT(DISTINCT p.id) as total_payments,
    COUNT(DISTINCT p.order_id) as total_orders,
    SUM(p.amount) as total_revenue,
    AVG(p.amount) as average_order_value,
    SUM(CASE WHEN p.payment_method = 'payos' THEN p.amount ELSE 0 END) as payos_revenue,
    SUM(CASE WHEN p.payment_method = 'cash' THEN p.amount ELSE 0 END) as cash_revenue
FROM payments p
WHERE p.status = 'completed' AND p.paid_at IS NOT NULL
GROUP BY DATE(p.paid_at)
ORDER BY date DESC;

-- =====================================================
-- FUNCTIONS FOR ANALYTICS
-- =====================================================

-- Function to get order statistics for a date range
CREATE OR REPLACE FUNCTION get_order_statistics(
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ
)
RETURNS TABLE (
    total_orders BIGINT,
    completed_orders BIGINT,
    cancelled_orders BIGINT,
    total_revenue DECIMAL,
    average_order_value DECIMAL,
    completion_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_orders,
        COUNT(CASE WHEN o.status = 'completed' THEN 1 END)::BIGINT as completed_orders,
        COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END)::BIGINT as cancelled_orders,
        COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.total_price ELSE 0 END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN o.status = 'completed' THEN o.total_price END), 0) as average_order_value,
        CASE 
            WHEN COUNT(*) > 0 THEN ROUND((COUNT(CASE WHEN o.status = 'completed' THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL * 100)::numeric, 2)
            ELSE 0
        END as completion_rate
    FROM orders o
    WHERE o.created_at BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql;

-- Function to get top providers by rating
CREATE OR REPLACE FUNCTION get_top_providers(
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    provider_id UUID,
    business_name TEXT,
    rating DECIMAL,
    total_reviews INTEGER,
    total_orders INTEGER,
    completion_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pp.id,
        pp.business_name,
        pp.rating,
        pp.total_reviews,
        pp.total_orders,
        CASE 
            WHEN COUNT(o.id) > 0 THEN 
                ROUND((COUNT(CASE WHEN o.status = 'completed' THEN 1 END)::DECIMAL / COUNT(o.id)::DECIMAL * 100)::numeric, 2)
            ELSE 0
        END as completion_rate
    FROM profiles pp
    LEFT JOIN orders o ON pp.id = o.provider_id
    WHERE pp.role = 'provider' AND pp.is_verified = TRUE
    GROUP BY pp.id, pp.business_name, pp.rating, pp.total_reviews, pp.total_orders
    ORDER BY pp.rating DESC, pp.total_reviews DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON VIEW active_orders_view IS 'Active orders with customer and provider details';
COMMENT ON VIEW provider_statistics_view IS 'Provider performance statistics';
COMMENT ON VIEW customer_order_summary_view IS 'Customer order history summary';
COMMENT ON VIEW daily_revenue_view IS 'Daily revenue and payment statistics';
COMMENT ON FUNCTION get_order_statistics IS 'Get order statistics for a date range';
COMMENT ON FUNCTION get_top_providers IS 'Get top-rated providers';
