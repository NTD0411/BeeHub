-- =============================================================================
-- SEED TÀI KHOẢN E2E TEST — chạy thủ công trên Supabase SQL Editor
-- =============================================================================
-- Mật khẩu tất cả tài khoản: Test1234!
-- (bcrypt hash rounds=10, khớp backend seed-e2e-test-accounts.js)
--
-- Cách chạy:
--   1. Supabase Dashboard → SQL Editor → New query
--   2. Dán toàn bộ file này → Run
--
-- KHÔNG chạy file seed-e2e-test-accounts.js (.js) trong SQL Editor.
-- =============================================================================

BEGIN;

-- bcrypt('Test1234!', 10)
-- Sinh bằng: node -e "require('bcryptjs').hash('Test1234!',10).then(console.log)"
DO $$
DECLARE
  pwd_hash TEXT := '$2a$10$twEjDnLad3vC2Ic9Q8hnAOtmZ0i0lsUSb60TfoyCWdSYNbxXcJ6t6';
  now_ts TIMESTAMPTZ := NOW();
BEGIN
  -- ── Customer ──────────────────────────────────────────────────────────────
  INSERT INTO profiles (
    id, email, phone, full_name, role, status, onboarding_completed, created_at, updated_at
  ) VALUES (
    'c3000001-0001-4001-8001-000000000001',
    'test.customer@unimove.test',
    '+84909000001',
    'Khách Test E2E',
    'customer',
    'active',
    TRUE,
    now_ts,
    now_ts
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    onboarding_completed = EXCLUDED.onboarding_completed,
    updated_at = now_ts;

  INSERT INTO customer_profiles (
    id, university, city, district, total_orders, total_spent, loyalty_points
  ) VALUES (
    'c3000001-0001-4001-8001-000000000001',
    'ĐH Test',
    'Đà Nẵng',
    'Hải Châu',
    0,
    0,
    0
  )
  ON CONFLICT (id) DO UPDATE SET
    university = EXCLUDED.university,
    city = EXCLUDED.city,
    district = EXCLUDED.district;

  INSERT INTO user_credentials (user_id, password_hash, created_at, updated_at)
  VALUES ('c3000001-0001-4001-8001-000000000001', pwd_hash, now_ts, now_ts)
  ON CONFLICT (user_id) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    updated_at = now_ts;

  -- ── Provider 1 ────────────────────────────────────────────────────────────
  INSERT INTO profiles (
    id, email, phone, full_name, role, status, onboarding_completed, created_at, updated_at
  ) VALUES (
    'd4000001-0001-4001-8001-000000000001',
    'test.provider@unimove.test',
    '+84909000002',
    'Nguyễn Văn Provider',
    'provider',
    'active',
    TRUE,
    now_ts,
    now_ts
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    onboarding_completed = EXCLUDED.onboarding_completed,
    updated_at = now_ts;

  INSERT INTO provider_profiles (
    id, business_name, vehicle_type, vehicle_plate,
    base_price, price_per_km, price_per_floor,
    rating, total_reviews, total_orders, total_earnings,
    is_verified, is_available, verification_status, verified_at, service_area
  ) VALUES (
    'd4000001-0001-4001-8001-000000000001',
    'UniMove Test Transport',
    'medium_truck',
    '43A-12345',
    450000, 12000, 50000,
    4.7, 12, 48, 18500000,
    TRUE, TRUE, 'approved', now_ts,
    ARRAY['Đà Nẵng', 'TP.HCM']::TEXT[]
  )
  ON CONFLICT (id) DO UPDATE SET
    business_name = EXCLUDED.business_name,
    vehicle_type = EXCLUDED.vehicle_type,
    vehicle_plate = EXCLUDED.vehicle_plate,
    base_price = EXCLUDED.base_price,
    price_per_km = EXCLUDED.price_per_km,
    price_per_floor = EXCLUDED.price_per_floor,
    rating = EXCLUDED.rating,
    total_reviews = EXCLUDED.total_reviews,
    total_orders = EXCLUDED.total_orders,
    total_earnings = EXCLUDED.total_earnings,
    is_verified = EXCLUDED.is_verified,
    is_available = EXCLUDED.is_available,
    verification_status = EXCLUDED.verification_status,
    verified_at = EXCLUDED.verified_at,
    service_area = EXCLUDED.service_area;

  INSERT INTO user_credentials (user_id, password_hash, created_at, updated_at)
  VALUES ('d4000001-0001-4001-8001-000000000001', pwd_hash, now_ts, now_ts)
  ON CONFLICT (user_id) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    updated_at = now_ts;

  -- ── Provider 2 (test bidding — 2 nhà xe báo giá) ───────────────────────
  INSERT INTO profiles (
    id, email, phone, full_name, role, status, onboarding_completed, created_at, updated_at
  ) VALUES (
    'd4000001-0001-4001-8001-000000000002',
    'test.provider2@unimove.test',
    '+84909000003',
    'Trần Văn Provider 2',
    'provider',
    'active',
    TRUE,
    now_ts,
    now_ts
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    onboarding_completed = EXCLUDED.onboarding_completed,
    updated_at = now_ts;

  INSERT INTO provider_profiles (
    id, business_name, vehicle_type, vehicle_plate,
    base_price, price_per_km, price_per_floor,
    rating, total_reviews, total_orders, total_earnings,
    is_verified, is_available, verification_status, verified_at, service_area
  ) VALUES (
    'd4000001-0001-4001-8001-000000000002',
    'Hùng Move Express Test',
    'small_truck',
    '43B-67890',
    420000, 11000, 45000,
    4.75, 60, 126, 22000000,
    TRUE, TRUE, 'approved', now_ts,
    ARRAY['Đà Nẵng']::TEXT[]
  )
  ON CONFLICT (id) DO UPDATE SET
    business_name = EXCLUDED.business_name,
    vehicle_type = EXCLUDED.vehicle_type,
    vehicle_plate = EXCLUDED.vehicle_plate,
    base_price = EXCLUDED.base_price,
    is_verified = EXCLUDED.is_verified,
    is_available = EXCLUDED.is_available,
    verification_status = EXCLUDED.verification_status,
    verified_at = EXCLUDED.verified_at,
    service_area = EXCLUDED.service_area;

  INSERT INTO user_credentials (user_id, password_hash, created_at, updated_at)
  VALUES ('d4000001-0001-4001-8001-000000000002', pwd_hash, now_ts, now_ts)
  ON CONFLICT (user_id) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    updated_at = now_ts;

END $$;

COMMIT;

-- Kiểm tra sau khi chạy:
-- SELECT id, email, role FROM profiles
-- WHERE email LIKE 'test.%@unimove.test';
