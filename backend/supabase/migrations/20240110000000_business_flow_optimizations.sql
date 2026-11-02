-- UniMove Database Schema - Business Flow Optimizations
-- Description: Bổ sung bảng/cột còn thiếu cho flow Customer, Provider, Admin, Payment Escrow
-- Run AFTER migration 20240109000000

-- =====================================================
-- ENUM TYPES
-- =====================================================

CREATE TYPE payment_purpose AS ENUM (
    'deposit',          -- Đặt cọc khi tạo đơn
    'final',            -- Thanh toán phần còn lại
    'full',             -- Thanh toán toàn bộ
    'refund',           -- Hoàn tiền
    'penalty'           -- Phạt provider/customer
);

CREATE TYPE provider_response AS ENUM (
    'accepted',
    'declined'
);

CREATE TYPE referral_status AS ENUM (
    'pending',
    'completed',
    'expired'
);

-- Momo payment method
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'momo' AFTER 'wallet';

-- =====================================================
-- PLATFORM SETTINGS (Admin config)
-- =====================================================

CREATE TABLE platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id)
);

INSERT INTO platform_settings (key, value, description) VALUES
    ('deposit_rate', '0.30', 'Tỷ lệ đặt cọc (30% tổng tiền)'),
    ('commission_rate', '0.15', 'Hoa hồng platform (15%)'),
    ('shared_move_discount_rate', '0.40', 'Giảm giá gộp đơn (40%)'),
    ('cancel_before_accept_refund_rate', '1.00', 'Hoàn 100% khi hủy trước khi provider nhận'),
    ('cancel_after_accept_refund_rate', '0.50', 'Hoàn 50% khi hủy sau khi provider nhận'),
    ('min_deposit_amount', '50000', 'Số tiền đặt cọc tối thiểu (VNĐ)'),
    ('referral_reward_amount', '30000', 'Thưởng referral (VNĐ)')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- SERVICE PACKAGES (Provider Onboarding - Step 4)
-- =====================================================

CREATE TABLE service_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    description TEXT,
    service_type service_type NOT NULL DEFAULT 'standard',
    vehicle_size vehicle_size NOT NULL,

    base_price DECIMAL(10,2) NOT NULL,
    price_per_km DECIMAL(10,2) NOT NULL DEFAULT 0,
    price_per_floor DECIMAL(10,2) NOT NULL DEFAULT 0,
    max_weight_kg DECIMAL(10,2),
    helper_count INTEGER NOT NULL DEFAULT 0,
    includes_packing BOOLEAN NOT NULL DEFAULT FALSE,
    includes_insurance BOOLEAN NOT NULL DEFAULT FALSE,

    estimated_duration_hours DECIMAL(4,1),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- PROVIDER AVAILABILITY (Daily Operations - Morning Routine)
-- =====================================================

CREATE TABLE provider_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (provider_id, day_of_week, start_time),
    CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- =====================================================
-- ORDER PROVIDER RESPONSES (Accept / Decline)
-- =====================================================

CREATE TABLE order_provider_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    response provider_response NOT NULL,
    decline_reason TEXT,
    responded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (order_id, provider_id)
);

-- =====================================================
-- SHARED MOVE GROUPS (AI gợi ý gộp đơn)
-- =====================================================

CREATE TABLE shared_move_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_code TEXT UNIQUE NOT NULL,

    pickup_city TEXT NOT NULL,
    pickup_district TEXT NOT NULL,
    delivery_city TEXT NOT NULL,
    delivery_district TEXT NOT NULL,
    scheduled_date DATE NOT NULL,

    max_orders INTEGER NOT NULL DEFAULT 3,
    current_orders INTEGER NOT NULL DEFAULT 0,
    discount_rate DECIMAL(5,2) NOT NULL DEFAULT 40.00,

    status TEXT NOT NULL DEFAULT 'open', -- open, full, completed, cancelled
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
);

-- =====================================================
-- REFERRALS (Completion Phase - Referral offer)
-- =====================================================

CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

    referral_code TEXT NOT NULL UNIQUE,
    status referral_status NOT NULL DEFAULT 'pending',
    reward_amount DECIMAL(10,2) NOT NULL DEFAULT 30000,

    first_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    rewarded_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 days')
);

-- =====================================================
-- EXTEND ORDERS (Booking, Tracking, Escrow, Completion)
-- =====================================================

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS service_package_id UUID REFERENCES service_packages(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS shared_move_group_id UUID REFERENCES shared_move_groups(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS provider_accepted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS customer_confirmed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS eta_minutes INTEGER,
    ADD COLUMN IF NOT EXISTS remaining_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS promotion_id UUID REFERENCES promotions(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS number_of_rooms INTEGER DEFAULT 1;

COMMENT ON COLUMN orders.service_package_id IS 'Gói dịch vụ provider đã chọn';
COMMENT ON COLUMN orders.provider_accepted_at IS 'Thời điểm provider accept đơn';
COMMENT ON COLUMN orders.customer_confirmed_at IS 'Customer xác nhận hoàn thành → release payment';
COMMENT ON COLUMN orders.eta_minutes IS 'ETA cập nhật real-time (phút)';
COMMENT ON COLUMN orders.remaining_amount IS 'Số tiền còn lại sau deposit';
COMMENT ON COLUMN orders.number_of_rooms IS 'Số phòng cần chuyển (booking search)';

-- =====================================================
-- EXTEND PAYMENTS (Escrow: deposit → hold → release)
-- =====================================================

ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS payment_purpose payment_purpose NOT NULL DEFAULT 'full',
    ADD COLUMN IF NOT EXISTS escrow_status TEXT NOT NULL DEFAULT 'pending';
    -- escrow_status: pending, held, released, refunded

COMMENT ON COLUMN payments.payment_purpose IS 'deposit | final | full | refund | penalty';
COMMENT ON COLUMN payments.escrow_status IS 'Trạng thái escrow: pending → held → released/refunded';

-- =====================================================
-- EXTEND PROFILES (Onboarding, Referral)
-- =====================================================

ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN profiles.onboarding_completed IS 'Customer: đã hoàn thành tutorial 5 bước';
COMMENT ON COLUMN profiles.referral_code IS 'Mã giới thiệu cá nhân';
COMMENT ON COLUMN profiles.referred_by IS 'Người giới thiệu (referral)';

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_service_packages_provider ON service_packages(provider_id);
CREATE INDEX idx_service_packages_active ON service_packages(provider_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_provider_availability_provider ON provider_availability(provider_id);
CREATE INDEX idx_provider_availability_day ON provider_availability(provider_id, day_of_week);
CREATE INDEX idx_order_provider_responses_order ON order_provider_responses(order_id);
CREATE INDEX idx_order_provider_responses_provider ON order_provider_responses(provider_id);
CREATE INDEX idx_shared_move_groups_status ON shared_move_groups(status);
CREATE INDEX idx_shared_move_groups_route ON shared_move_groups(pickup_city, delivery_city, scheduled_date);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_orders_service_package ON orders(service_package_id);
CREATE INDEX idx_orders_shared_move_group ON orders(shared_move_group_id);
CREATE INDEX idx_payments_purpose ON payments(payment_purpose);
CREATE INDEX idx_payments_escrow ON payments(escrow_status);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_service_packages_updated_at BEFORE UPDATE ON service_packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provider_availability_updated_at BEFORE UPDATE ON provider_availability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-calculate deposit & remaining amount on order insert/update
CREATE OR REPLACE FUNCTION calculate_order_deposit()
RETURNS TRIGGER AS $$
DECLARE
    v_deposit_rate DECIMAL(5,2);
BEGIN
    SELECT (value::text)::DECIMAL INTO v_deposit_rate
    FROM platform_settings WHERE key = 'deposit_rate';

    IF v_deposit_rate IS NULL THEN
        v_deposit_rate := 0.30;
    END IF;

    IF NEW.deposit_amount = 0 OR NEW.deposit_amount IS NULL THEN
        NEW.deposit_amount := ROUND(NEW.total_price * v_deposit_rate, 0);
    END IF;

    NEW.remaining_amount := NEW.total_price - NEW.deposit_amount;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_order_deposit_trigger
    BEFORE INSERT OR UPDATE OF total_price ON orders
    FOR EACH ROW
    EXECUTE FUNCTION calculate_order_deposit();

-- Release payment when customer confirms completion
CREATE OR REPLACE FUNCTION release_payment_on_confirm()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.customer_confirmed_at IS NOT NULL AND OLD.customer_confirmed_at IS NULL THEN
        NEW.payment_released := TRUE;
        NEW.payment_released_at := NOW();

        UPDATE payments
        SET escrow_status = 'released'
        WHERE order_id = NEW.id
          AND payment_purpose IN ('deposit', 'full')
          AND status = 'completed';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER release_payment_on_confirm_trigger
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION release_payment_on_confirm();

-- Update shared move group count
CREATE OR REPLACE FUNCTION update_shared_move_group_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.shared_move_group_id IS NOT NULL THEN
        UPDATE shared_move_groups
        SET current_orders = (
            SELECT COUNT(*) FROM orders WHERE shared_move_group_id = NEW.shared_move_group_id
        )
        WHERE id = NEW.shared_move_group_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_shared_move_group_count_trigger
    AFTER INSERT OR UPDATE OF shared_move_group_id ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_shared_move_group_count();

-- Generate referral code on profile insert
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := UPPER(SUBSTRING(REPLACE(NEW.id::TEXT, '-', ''), 1, 8));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_referral_code_trigger
    BEFORE INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION generate_referral_code();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Tìm shared move phù hợp (AI suggestion)
CREATE OR REPLACE FUNCTION find_shared_move_matches(
    p_pickup_city TEXT,
    p_pickup_district TEXT,
    p_delivery_city TEXT,
    p_delivery_district TEXT,
    p_scheduled_date DATE
)
RETURNS TABLE (
    group_id UUID,
    group_code TEXT,
    current_orders INTEGER,
    max_orders INTEGER,
    discount_rate DECIMAL,
    slots_available INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        smg.id,
        smg.group_code,
        smg.current_orders,
        smg.max_orders,
        smg.discount_rate,
        (smg.max_orders - smg.current_orders) AS slots_available
    FROM shared_move_groups smg
    WHERE smg.status = 'open'
      AND smg.pickup_city = p_pickup_city
      AND smg.pickup_district = p_pickup_district
      AND smg.delivery_city = p_delivery_city
      AND smg.delivery_district = p_delivery_district
      AND smg.scheduled_date = p_scheduled_date
      AND smg.current_orders < smg.max_orders
      AND smg.expires_at > NOW();
END;
$$ LANGUAGE plpgsql;

-- Browse providers với filter (Booking Flow - Browse Results)
CREATE OR REPLACE FUNCTION browse_providers(
    p_latitude DECIMAL DEFAULT NULL,
    p_longitude DECIMAL DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_min_rating DECIMAL DEFAULT 0,
    p_max_price DECIMAL DEFAULT NULL,
    p_vehicle_size TEXT DEFAULT NULL,
    p_sort_by TEXT DEFAULT 'rating',
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    provider_id UUID,
    business_name TEXT,
    full_name TEXT,
    rating DECIMAL,
    total_reviews INTEGER,
    vehicle_type TEXT,
    base_price DECIMAL,
    is_verified BOOLEAN,
    distance_km DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.business_name,
        p.full_name,
        p.rating,
        p.total_reviews,
        p.vehicle_type,
        p.base_price,
        p.is_verified,
        CASE
            WHEN p_latitude IS NOT NULL AND p_longitude IS NOT NULL AND pl.location IS NOT NULL THEN
                ROUND((ST_Distance(
                    pl.location,
                    ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
                ) / 1000)::numeric, 2)
            ELSE NULL
        END AS distance_km
    FROM profiles p
    LEFT JOIN provider_locations pl ON p.id = pl.provider_id
    WHERE p.role = 'provider'
      AND p.is_verified = TRUE
      AND p.is_available = TRUE
      AND p.status = 'active'
      AND (p_min_rating IS NULL OR p.rating >= p_min_rating)
      AND (p_max_price IS NULL OR p.base_price <= p_max_price)
      AND (p_vehicle_size IS NULL OR p.vehicle_type = p_vehicle_size)
      AND (p_city IS NULL OR p.city = p_city OR p_city = ANY(p.service_area))
    ORDER BY
        CASE WHEN p_sort_by = 'price' THEN p.base_price END ASC,
        CASE WHEN p_sort_by = 'rating' THEN p.rating END DESC,
        CASE WHEN p_sort_by = 'distance' AND pl.location IS NOT NULL THEN
            pl.location <-> ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
        END ASC NULLS LAST,
        p.rating DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Admin analytics: GMV & commission
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats(
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    gmv_yesterday DECIMAL,
    orders_yesterday BIGINT,
    active_users BIGINT,
    pending_verifications BIGINT,
    open_disputes BIGINT,
    platform_commission DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(CASE WHEN o.status = 'completed' AND DATE(o.completed_at) = p_date - 1 THEN o.total_price END), 0),
        COUNT(CASE WHEN DATE(o.created_at) = p_date - 1 THEN 1 END)::BIGINT,
        (SELECT COUNT(*) FROM profiles WHERE status = 'active' AND last_seen_at >= NOW() - INTERVAL '7 days')::BIGINT,
        (SELECT COUNT(*) FROM profiles WHERE role = 'provider' AND verification_status = 'pending')::BIGINT,
        (SELECT COUNT(*) FROM disputes WHERE status IN ('open', 'investigating'))::BIGINT,
        COALESCE(SUM(pe.platform_commission), 0)
    FROM orders o
    LEFT JOIN provider_earnings pe ON o.id = pe.order_id
    WHERE DATE(o.created_at) >= p_date - 30;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_provider_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_move_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view platform settings"
    ON platform_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage platform settings"
    ON platform_settings FOR ALL USING (is_admin());

CREATE POLICY "Everyone can view active service packages"
    ON service_packages FOR SELECT USING (is_active = TRUE OR is_admin());
CREATE POLICY "Providers can manage own packages"
    ON service_packages FOR ALL USING (auth.uid() = provider_id OR is_admin());

CREATE POLICY "Everyone can view provider availability"
    ON provider_availability FOR SELECT USING (true);
CREATE POLICY "Providers can manage own availability"
    ON provider_availability FOR ALL USING (auth.uid() = provider_id OR is_admin());

CREATE POLICY "Order participants can view provider responses"
    ON order_provider_responses FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM orders WHERE id = order_id AND (customer_id = auth.uid() OR provider_id = auth.uid()))
        OR auth.uid() = provider_id OR is_admin()
    );
CREATE POLICY "Providers can respond to orders"
    ON order_provider_responses FOR INSERT
    WITH CHECK (auth.uid() = provider_id AND is_provider());

CREATE POLICY "Everyone can view open shared move groups"
    ON shared_move_groups FOR SELECT USING (status = 'open' OR is_admin());
CREATE POLICY "Admins can manage shared move groups"
    ON shared_move_groups FOR ALL USING (is_admin());

CREATE POLICY "Users can view own referrals"
    ON referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id OR is_admin());
CREATE POLICY "System can create referrals"
    ON referrals FOR INSERT WITH CHECK (auth.uid() = referrer_id OR is_admin());

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE service_packages IS 'Gói dịch vụ do provider tạo (Provider Onboarding Step 4)';
COMMENT ON TABLE provider_availability IS 'Lịch rảnh/bận theo ngày trong tuần';
COMMENT ON TABLE order_provider_responses IS 'Provider accept/decline đơn hàng';
COMMENT ON TABLE shared_move_groups IS 'Nhóm gộp đơn Shared Move — giảm 40%';
COMMENT ON TABLE referrals IS 'Hệ thống giới thiệu bạn bè';
COMMENT ON TABLE platform_settings IS 'Cấu hình platform: commission, deposit rate, refund rules';
