-- UniMove Database Schema - Fixes & Optimizations
-- Description: Fix foreign key references, add missing fields, and optimize for business flow
-- Run this AFTER all previous migrations

-- =====================================================
-- FIX 1: provider_earnings — sai FK reference
-- provider_profiles không tồn tại, dùng profiles
-- =====================================================

ALTER TABLE provider_earnings
    DROP CONSTRAINT IF EXISTS provider_earnings_provider_id_fkey;

ALTER TABLE provider_earnings
    ADD CONSTRAINT provider_earnings_provider_id_fkey
    FOREIGN KEY (provider_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- =====================================================
-- FIX 2: provider_withdrawals — sai FK reference
-- =====================================================

ALTER TABLE provider_withdrawals
    DROP CONSTRAINT IF EXISTS provider_withdrawals_provider_id_fkey;

ALTER TABLE provider_withdrawals
    ADD CONSTRAINT provider_withdrawals_provider_id_fkey
    FOREIGN KEY (provider_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- =====================================================
-- FIX 3: conversations — sai FK reference
-- =====================================================

ALTER TABLE conversations
    DROP CONSTRAINT IF EXISTS conversations_provider_id_fkey;

ALTER TABLE conversations
    ADD CONSTRAINT conversations_provider_id_fkey
    FOREIGN KEY (provider_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- =====================================================
-- FIX 4: reviews — sai FK reference
-- =====================================================

ALTER TABLE reviews
    DROP CONSTRAINT IF EXISTS reviews_provider_id_fkey;

ALTER TABLE reviews
    ADD CONSTRAINT reviews_provider_id_fkey
    FOREIGN KEY (provider_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- =====================================================
-- FIX 5: provider_reviews_summary — sai FK reference
-- =====================================================

ALTER TABLE provider_reviews_summary
    DROP CONSTRAINT IF EXISTS provider_reviews_summary_provider_id_fkey;

ALTER TABLE provider_reviews_summary
    ADD CONSTRAINT provider_reviews_summary_provider_id_fkey
    FOREIGN KEY (provider_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- =====================================================
-- FIX 6: order_tracking_events — sai FK reference
-- =====================================================

ALTER TABLE order_tracking_events
    DROP CONSTRAINT IF EXISTS order_tracking_events_provider_id_fkey;

ALTER TABLE order_tracking_events
    ADD CONSTRAINT order_tracking_events_provider_id_fkey
    FOREIGN KEY (provider_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- =====================================================
-- FIX 7: location_history — sai FK reference
-- =====================================================

ALTER TABLE location_history
    DROP CONSTRAINT IF EXISTS location_history_provider_id_fkey;

ALTER TABLE location_history
    ADD CONSTRAINT location_history_provider_id_fkey
    FOREIGN KEY (provider_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- =====================================================
-- FIX 8: provider_locations — sai FK reference
-- =====================================================

ALTER TABLE provider_locations
    DROP CONSTRAINT IF EXISTS provider_locations_provider_id_fkey;

ALTER TABLE provider_locations
    ADD CONSTRAINT provider_locations_provider_id_fkey
    FOREIGN KEY (provider_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- =====================================================
-- FIX 9: geofence_events — sai FK reference
-- =====================================================

ALTER TABLE geofence_events
    DROP CONSTRAINT IF EXISTS geofence_events_provider_id_fkey;

ALTER TABLE geofence_events
    ADD CONSTRAINT geofence_events_provider_id_fkey
    FOREIGN KEY (provider_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- =====================================================
-- FIX 10: routes — sai FK reference
-- =====================================================

ALTER TABLE routes
    DROP CONSTRAINT IF EXISTS routes_provider_id_fkey;

ALTER TABLE routes
    ADD CONSTRAINT routes_provider_id_fkey
    FOREIGN KEY (provider_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- =====================================================
-- FIX 11: provider_locations — thêm UNIQUE constraint
-- Mỗi provider chỉ có 1 current location record (upsert pattern)
-- =====================================================

-- Xóa duplicate records trước (giữ record mới nhất)
DELETE FROM provider_locations a
USING provider_locations b
WHERE a.provider_id = b.provider_id
  AND a.created_at < b.created_at;

ALTER TABLE provider_locations
    ADD CONSTRAINT provider_locations_provider_id_unique UNIQUE (provider_id);

-- =====================================================
-- FIX 12: Thêm 'matched' vào order_status enum
-- Flow: pending → matched → accepted → picking_up → in_progress → completed
-- =====================================================

ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'matched' AFTER 'pending';

-- =====================================================
-- FIX 13: Thêm deposit fields vào orders (Escrow flow)
-- Customer trả deposit khi đặt, release khi hoàn thành
-- =====================================================

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS deposit_paid BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deposit_paid_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS payment_released BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS payment_released_at TIMESTAMPTZ;

COMMENT ON COLUMN orders.deposit_amount IS 'Số tiền đặt cọc (thường 30% tổng tiền)';
COMMENT ON COLUMN orders.deposit_paid IS 'Đã thanh toán đặt cọc chưa';
COMMENT ON COLUMN orders.payment_released IS 'Đã release payment cho provider chưa (sau khi customer confirm)';

-- =====================================================
-- FIX 14: Thêm Shared Move (Group Order) support
-- Flow: AI gợi ý gộp đơn → giảm 40% chi phí
-- =====================================================

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS is_group_order BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS group_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS shared_move_discount DECIMAL(10,2) DEFAULT 0;

COMMENT ON COLUMN orders.is_group_order IS 'Đơn gộp (Shared Move) — giảm chi phí 40%';
COMMENT ON COLUMN orders.group_order_id IS 'ID đơn chính nếu là đơn gộp';
COMMENT ON COLUMN orders.shared_move_discount IS 'Số tiền giảm từ Shared Move';

-- =====================================================
-- FIX 15: Thêm vehicle_capacity vào profiles (provider)
-- Cần cho filter theo loại xe
-- =====================================================

ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS vehicle_capacity TEXT,
    ADD COLUMN IF NOT EXISTS vehicle_images TEXT[];

COMMENT ON COLUMN profiles.vehicle_capacity IS 'Provider only: tải trọng xe (vd: 500kg, 1000kg)';
COMMENT ON COLUMN profiles.vehicle_images IS 'Provider only: ảnh xe';

-- =====================================================
-- FIX 16: Thêm FCM token field vào profiles
-- Để gửi push notification nhanh hơn
-- =====================================================

ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS fcm_token TEXT,
    ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

COMMENT ON COLUMN profiles.fcm_token IS 'Firebase Cloud Messaging token (latest device)';
COMMENT ON COLUMN profiles.last_seen_at IS 'Lần cuối online';

-- =====================================================
-- FIX 17: Thêm 'picked_up' vào order_status (đã có trong RLS nhưng thiếu trong enum)
-- Kiểm tra và thêm nếu chưa có
-- =====================================================

ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'picked_up' AFTER 'picking_up';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'delivering' AFTER 'picked_up';

-- =====================================================
-- FIX 18: Thêm notification type còn thiếu
-- =====================================================

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'review_received' AFTER 'new_message';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'withdrawal_processed' AFTER 'review_received';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'provider_verified' AFTER 'withdrawal_processed';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'shared_move_suggestion' AFTER 'provider_verified';

-- =====================================================
-- FIX 19: Thêm index cho group orders
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_orders_group_order ON orders(group_order_id) WHERE group_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_is_group ON orders(is_group_order) WHERE is_group_order = TRUE;

-- =====================================================
-- FIX 20: Cập nhật RLS policies cho provider (dùng profiles thay vì provider_profiles)
-- =====================================================

-- Drop các policy cũ tham chiếu provider_profiles
DROP POLICY IF EXISTS "Providers can view assigned orders" ON orders;
DROP POLICY IF EXISTS "Providers can view pending orders in their area" ON orders;
DROP POLICY IF EXISTS "Providers can update assigned orders" ON orders;

-- Tạo lại với profiles
CREATE POLICY "Providers can view assigned orders"
    ON orders FOR SELECT
    USING (auth.uid() = provider_id OR is_admin());

CREATE POLICY "Providers can view pending orders in their area"
    ON orders FOR SELECT
    USING (
        status IN ('pending', 'matched') AND
        is_provider() AND
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
              AND role = 'provider'
              AND is_verified = TRUE
              AND is_available = TRUE
        )
    );

CREATE POLICY "Providers can update assigned orders"
    ON orders FOR UPDATE
    USING (auth.uid() = provider_id AND is_provider());

-- =====================================================
-- FIX 21: Thêm notification templates còn thiếu
-- =====================================================

INSERT INTO notification_templates (template_key, notification_type, title_template, body_template, language, default_priority, send_push, send_email)
VALUES
    ('review_received', 'review_received', 'Bạn có đánh giá mới', 'Khách hàng vừa đánh giá {{rating}} sao cho đơn hàng {{order_number}}.', 'vi', 'normal', true, false),
    ('withdrawal_processed', 'withdrawal_processed', 'Yêu cầu rút tiền đã xử lý', 'Yêu cầu rút {{amount}} VNĐ của bạn đã được xử lý thành công.', 'vi', 'high', true, true),
    ('provider_verified', 'provider_verified', 'Tài khoản đã được xác thực', 'Chúc mừng! Tài khoản nhà cung cấp của bạn đã được xác thực. Bạn có thể bắt đầu nhận đơn hàng.', 'vi', 'high', true, true),
    ('shared_move_suggestion', 'shared_move_suggestion', 'Gợi ý gộp đơn — Tiết kiệm 40%', 'Có {{count}} đơn hàng cùng tuyến đường với bạn. Gộp đơn để tiết kiệm {{discount}}%!', 'vi', 'normal', true, false),
    ('order_matched', 'order_accepted', 'Đã tìm thấy nhà cung cấp', 'Đơn hàng {{order_number}} đã được ghép với nhà cung cấp {{provider_name}}.', 'vi', 'high', true, false)
ON CONFLICT (template_key) DO NOTHING;

-- =====================================================
-- FIX 22: Cập nhật view active_orders_view (fix JOIN)
-- =====================================================

CREATE OR REPLACE VIEW active_orders_view AS
SELECT
    o.*,
    c.full_name AS customer_name,
    c.phone AS customer_phone,
    c.avatar_url AS customer_avatar,
    p.business_name AS provider_name,
    p.vehicle_type,
    p.vehicle_plate,
    p.full_name AS provider_contact_name,
    p.phone AS provider_phone,
    p.avatar_url AS provider_avatar
FROM orders o
LEFT JOIN profiles c ON o.customer_id = c.id
LEFT JOIN profiles p ON o.provider_id = p.id
WHERE o.status NOT IN ('completed', 'cancelled');

-- =====================================================
-- FIX 23: Cập nhật view provider_statistics_view (fix JOIN)
-- =====================================================

CREATE OR REPLACE VIEW provider_statistics_view AS
SELECT
    p.id AS provider_id,
    p.business_name,
    p.full_name,
    p.avatar_url,
    p.rating,
    p.total_reviews,
    p.total_orders,
    p.total_earnings,
    p.is_verified,
    p.is_available,
    COUNT(DISTINCT CASE WHEN o.status IN ('accepted', 'matched', 'in_progress', 'picking_up', 'picked_up', 'delivering') THEN o.id END) AS active_orders,
    COUNT(DISTINCT CASE WHEN o.status = 'completed' AND o.completed_at >= NOW() - INTERVAL '30 days' THEN o.id END) AS orders_last_30_days,
    COALESCE(SUM(CASE WHEN pe.status = 'available' THEN pe.net_earnings ELSE 0 END), 0) AS available_earnings
FROM profiles p
LEFT JOIN orders o ON p.id = o.provider_id
LEFT JOIN provider_earnings pe ON p.id = pe.provider_id
WHERE p.role = 'provider'
GROUP BY p.id, p.business_name, p.full_name, p.avatar_url, p.rating, p.total_reviews, p.total_orders, p.total_earnings, p.is_verified, p.is_available;

-- =====================================================
-- FIX 24: Cập nhật function update_provider_rating (fix reference)
-- =====================================================

CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Upsert summary record
    INSERT INTO provider_reviews_summary (provider_id)
    VALUES (NEW.provider_id)
    ON CONFLICT (provider_id) DO NOTHING;

    -- Update summary statistics
    UPDATE provider_reviews_summary
    SET
        total_reviews = (SELECT COUNT(*) FROM reviews WHERE provider_id = NEW.provider_id AND is_published = TRUE),
        average_rating = (SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews WHERE provider_id = NEW.provider_id AND is_published = TRUE),
        rating_5_count = (SELECT COUNT(*) FROM reviews WHERE provider_id = NEW.provider_id AND rating = 5 AND is_published = TRUE),
        rating_4_count = (SELECT COUNT(*) FROM reviews WHERE provider_id = NEW.provider_id AND rating = 4 AND is_published = TRUE),
        rating_3_count = (SELECT COUNT(*) FROM reviews WHERE provider_id = NEW.provider_id AND rating = 3 AND is_published = TRUE),
        rating_2_count = (SELECT COUNT(*) FROM reviews WHERE provider_id = NEW.provider_id AND rating = 2 AND is_published = TRUE),
        rating_1_count = (SELECT COUNT(*) FROM reviews WHERE provider_id = NEW.provider_id AND rating = 1 AND is_published = TRUE),
        avg_service_quality = (SELECT ROUND(AVG(service_quality_rating)::numeric, 2) FROM reviews WHERE provider_id = NEW.provider_id AND service_quality_rating IS NOT NULL AND is_published = TRUE),
        avg_punctuality = (SELECT ROUND(AVG(punctuality_rating)::numeric, 2) FROM reviews WHERE provider_id = NEW.provider_id AND punctuality_rating IS NOT NULL AND is_published = TRUE),
        avg_professionalism = (SELECT ROUND(AVG(professionalism_rating)::numeric, 2) FROM reviews WHERE provider_id = NEW.provider_id AND professionalism_rating IS NOT NULL AND is_published = TRUE),
        avg_value_for_money = (SELECT ROUND(AVG(value_for_money_rating)::numeric, 2) FROM reviews WHERE provider_id = NEW.provider_id AND value_for_money_rating IS NOT NULL AND is_published = TRUE),
        response_count = (SELECT COUNT(*) FROM reviews WHERE provider_id = NEW.provider_id AND provider_response IS NOT NULL AND is_published = TRUE),
        updated_at = NOW()
    WHERE provider_id = NEW.provider_id;

    -- Update response rate
    UPDATE provider_reviews_summary
    SET response_rate = CASE
        WHEN total_reviews > 0 THEN ROUND((response_count::DECIMAL / total_reviews * 100)::numeric, 2)
        ELSE 0
    END
    WHERE provider_id = NEW.provider_id;

    -- Update provider profile rating (in profiles table)
    UPDATE profiles
    SET
        rating = (SELECT average_rating FROM provider_reviews_summary WHERE provider_id = NEW.provider_id),
        total_reviews = (SELECT total_reviews FROM provider_reviews_summary WHERE provider_id = NEW.provider_id)
    WHERE id = NEW.provider_id AND role = 'provider';

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FIX 25: Cập nhật function create_provider_earnings (fix reference)
-- =====================================================

CREATE OR REPLACE FUNCTION create_provider_earnings()
RETURNS TRIGGER AS $$
DECLARE
    v_order orders%ROWTYPE;
    v_commission_rate DECIMAL(5,2) := 15.00; -- 15% platform commission
    v_commission_amount DECIMAL(12,2);
    v_net_earnings DECIMAL(12,2);
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        SELECT * INTO v_order FROM orders WHERE id = NEW.order_id;

        IF v_order.provider_id IS NOT NULL THEN
            v_commission_amount := NEW.amount * (v_commission_rate / 100);
            v_net_earnings := NEW.amount - v_commission_amount;

            INSERT INTO provider_earnings (
                provider_id, order_id, payment_id,
                order_amount, platform_commission, net_earnings,
                commission_rate, status
            ) VALUES (
                v_order.provider_id, NEW.order_id, NEW.id,
                NEW.amount, v_commission_amount, v_net_earnings,
                v_commission_rate, 'available'
            );

            -- Update provider total earnings (in profiles table)
            UPDATE profiles
            SET total_earnings = total_earnings + v_net_earnings
            WHERE id = v_order.provider_id AND role = 'provider';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FIX 26: Thêm function find_nearby_providers (fix reference)
-- =====================================================

CREATE OR REPLACE FUNCTION find_nearby_providers(
    p_latitude DECIMAL,
    p_longitude DECIMAL,
    p_radius_km DECIMAL DEFAULT 10,
    p_vehicle_size TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    provider_id UUID,
    business_name TEXT,
    full_name TEXT,
    rating DECIMAL,
    vehicle_type TEXT,
    distance_km DECIMAL,
    is_online BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pl.provider_id,
        pr.business_name,
        pr.full_name,
        pr.rating,
        pr.vehicle_type,
        ROUND((ST_Distance(
            pl.location,
            ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
        ) / 1000)::numeric, 2) AS distance_km,
        pl.is_online
    FROM provider_locations pl
    JOIN profiles pr ON pl.provider_id = pr.id
    WHERE
        pl.is_online = TRUE
        AND pr.is_verified = TRUE
        AND pr.is_available = TRUE
        AND pr.role = 'provider'
        AND (p_vehicle_size IS NULL OR pr.vehicle_type = p_vehicle_size)
        AND ST_DWithin(
            pl.location,
            ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
            p_radius_km * 1000
        )
    ORDER BY pl.location <-> ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON COLUMN orders.deposit_amount IS 'Tiền đặt cọc (escrow) — thường 30% tổng tiền';
COMMENT ON COLUMN orders.is_group_order IS 'Shared Move: gộp đơn để giảm chi phí 40%';
COMMENT ON COLUMN profiles.fcm_token IS 'FCM token thiết bị mới nhất để gửi push notification';
