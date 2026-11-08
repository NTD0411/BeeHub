-- =============================================================================
-- SEED ĐƠN DEMO — làm đầy giao diện provider / customer (Đà Nẵng)
-- =============================================================================
-- Chạy trên Supabase SQL Editor SAU seed-e2e-test-accounts.sql
-- Tài khoản: test.customer@unimove.test / test.provider@unimove.test — Test1234!
-- =============================================================================

BEGIN;

DELETE FROM order_quotes
WHERE order_id IN (SELECT id FROM orders WHERE order_number LIKE 'DEMO-%');

DELETE FROM orders WHERE order_number LIKE 'DEMO-%';

DO $$
DECLARE
  cust UUID := 'c3000001-0001-4001-8001-000000000001';
  prov1 UUID := 'd4000001-0001-4001-8001-000000000001';
  prov2 UUID := 'd4000001-0001-4001-8001-000000000002';
  now_ts TIMESTAMPTZ := NOW();
  o1 UUID := 'e5000001-0001-4001-8001-000000000001';
  o2 UUID := 'e5000001-0001-4001-8001-000000000002';
  o3 UUID := 'e5000001-0001-4001-8001-000000000003';
  o4 UUID := 'e5000001-0001-4001-8001-000000000004';
  o5 UUID := 'e5000001-0001-4001-8001-000000000005';
  o6 UUID := 'e5000001-0001-4001-8001-000000000006';
  o7 UUID := 'e5000001-0001-4001-8001-000000000007';
  o8 UUID := 'e5000001-0001-4001-8001-000000000008';
  o9 UUID := 'e5000001-0001-4001-8001-000000000009';
  o10 UUID := 'e5000001-0001-4001-8001-000000000010';
BEGIN
  -- ── Báo giá mới (tab Báo giá) ─────────────────────────────────────────────
  INSERT INTO orders (
    id, order_number, customer_id, service_type, vehicle_size,
    pickup_address, pickup_city, pickup_district, pickup_contact_name, pickup_contact_phone,
    pickup_notes, pickup_floor, pickup_has_elevator,
    delivery_address, delivery_city, delivery_district, delivery_contact_name, delivery_contact_phone,
    delivery_floor, delivery_has_elevator,
    base_price, distance_price, floor_price, service_fee, total_price,
    scheduled_pickup_time, status, quote_request, requires_helpers, number_of_helpers,
    items_description, created_at, updated_at
  ) VALUES
  (o1, 'DEMO-Q-0001', cust, 'standard', 'medium_truck',
   'KTX ĐH Đà Nẵng, Ngũ Hành Sơn', 'Đà Nẵng', 'Ngũ Hành Sơn', 'Trần Minh Anh', '+84901110001',
   'Hẻm 3m · Mã báo giá: QR-DEMO-01', 2, FALSE,
   'Chung cư Monarchy, Ngũ Hành Sơn', 'Đà Nẵng', 'Ngũ Hành Sơn', 'Trần Minh Anh', '+84901110001',
   8, TRUE,
   0, 0, 0, 0, 0, now_ts + INTERVAL '2 days', 'pending', TRUE, TRUE, 2,
   'Giường, tủ, bàn học', now_ts - INTERVAL '20 minutes', now_ts),
  (o2, 'DEMO-Q-0002', cust, 'standard', 'small_truck',
   '254 Nguyễn Văn Linh, Thanh Khê', 'Đà Nẵng', 'Thanh Khê', 'Lê Hoàng Nam', '+84901110002',
   'Mã báo giá: QR-DEMO-02', 1, FALSE,
   '45 Lê Duẩn, Hải Châu', 'Đà Nẵng', 'Hải Châu', 'Lê Hoàng Nam', '+84901110002',
   3, FALSE,
   0, 0, 0, 0, 0, now_ts + INTERVAL '1 day', 'pending', TRUE, FALSE, 0,
   'Vali, thùng sách', now_ts - INTERVAL '45 minutes', now_ts),
  (o3, 'DEMO-Q-0003', cust, 'premium', 'large_truck',
   '35 Nguyễn Minh Châu, Ngũ Hành Sơn', 'Đà Nẵng', 'Ngũ Hành Sơn', 'Phạm Thu Trang', '+84901110003',
   'Mã báo giá: QR-DEMO-03', 4, FALSE,
   'FPT City, Ngũ Hành Sơn', 'Đà Nẵng', 'Ngũ Hành Sơn', 'Phạm Thu Trang', '+84901110003',
   2, TRUE,
   0, 0, 0, 0, 0, now_ts + INTERVAL '3 days', 'pending', TRUE, TRUE, 3,
   'Tủ lạnh, máy giặt, sofa', now_ts - INTERVAL '1 hour', now_ts),
  (o4, 'DEMO-Q-0004', cust, 'standard', 'medium_truck',
   'Khu đô thị Hòa Xuân, Cẩm Lệ', 'Đà Nẵng', 'Cẩm Lệ', 'Nguyễn Bảo Châu', '+84901110004',
   'Mã báo giá: QR-DEMO-04', 1, TRUE,
   'KTX FPT, Ngũ Hành Sơn', 'Đà Nẵng', 'Ngũ Hành Sơn', 'Nguyễn Bảo Châu', '+84901110004',
   5, FALSE,
   0, 0, 0, 0, 0, now_ts + INTERVAL '4 days', 'pending', TRUE, TRUE, 2,
   'Chuyển phòng cuối kỳ', now_ts - INTERVAL '2 hours', now_ts);

  -- ── Chờ cọc (tab Chờ cọc) ────────────────────────────────────────────────
  INSERT INTO orders (
    id, order_number, customer_id, provider_id, service_type, vehicle_size,
    pickup_address, pickup_city, pickup_district, pickup_contact_name, pickup_contact_phone,
    delivery_address, delivery_city, delivery_district, delivery_contact_name, delivery_contact_phone,
    base_price, distance_price, floor_price, service_fee, total_price,
    scheduled_pickup_time, status, quote_request, deposit_paid, deposit_amount, remaining_amount,
    requires_helpers, number_of_helpers, items_description, created_at, updated_at
  ) VALUES (
    o5, 'DEMO-M-0001', cust, prov1, 'standard', 'medium_truck',
    '152 Huỳnh Tấn Phát, Hải Châu', 'Đà Nẵng', 'Hải Châu', 'Võ Thị Mai', '+84901110005',
    'Khu Sơn Trà, Sơn Trà', 'Đà Nẵng', 'Sơn Trà', 'Võ Thị Mai', '+84901110005',
    380000, 45000, 80000, 0, 505000,
    now_ts + INTERVAL '1 day 3 hours', 'matched', TRUE, FALSE, 0, 505000,
    TRUE, 2, 'Đồ phòng trọ vừa', now_ts - INTERVAL '3 hours', now_ts);

  -- ── Sẵn sàng nhận (tab Sẵn sàng) ────────────────────────────────────────
  INSERT INTO orders (
    id, order_number, customer_id, provider_id, service_type, vehicle_size,
    pickup_address, pickup_city, pickup_district, pickup_contact_name, pickup_contact_phone,
    delivery_address, delivery_city, delivery_district, delivery_contact_name, delivery_contact_phone,
    base_price, distance_price, floor_price, service_fee, total_price,
    scheduled_pickup_time, status, quote_request, deposit_paid, deposit_paid_at,
    deposit_amount, remaining_amount, requires_helpers, number_of_helpers,
    items_description, created_at, updated_at
  ) VALUES (
    o6, 'DEMO-M-0002', cust, prov1, 'standard', 'medium_truck',
    '35, Đường Nguyễn Minh Châu, Ngũ Hành Sơn', 'Đà Nẵng', 'Ngũ Hành Sơn', 'Phan Thị Ngọc Quyên', '+84901110006',
    'Huỳnh Lắm, Ngũ Hành Sơn', 'Đà Nẵng', 'Ngũ Hành Sơn', 'Phan Thị Ngọc Quyên', '+84901110006',
    8000, 1000, 2000, 0, 11000,
    now_ts + INTERVAL '8 hours', 'matched', TRUE, TRUE, now_ts - INTERVAL '30 minutes',
    3300, 7700, TRUE, 2,
    'Ít đồ · chuyển nhanh', now_ts - INTERVAL '5 hours', now_ts);

  -- ── Đang chạy (tab Đang chạy) ───────────────────────────────────────────
  INSERT INTO orders (
    id, order_number, customer_id, provider_id, service_type, vehicle_size,
    pickup_address, pickup_city, pickup_district, pickup_contact_name, pickup_contact_phone,
    delivery_address, delivery_city, delivery_district, delivery_contact_name, delivery_contact_phone,
    base_price, distance_price, floor_price, service_fee, total_price,
    scheduled_pickup_time, status, quote_request, deposit_paid, deposit_paid_at,
    deposit_amount, remaining_amount, provider_accepted_at,
    requires_helpers, number_of_helpers, items_description, created_at, updated_at
  ) VALUES (
    o7, 'DEMO-A-0001', cust, prov1, 'standard', 'medium_truck',
    'KTX ĐH Đà Nẵng, Ngũ Hành Sơn', 'Đà Nẵng', 'Ngũ Hành Sơn', 'Hoàng Văn Đức', '+84901110007',
    'Chung cư Golden House, Hải Châu', 'Đà Nẵng', 'Hải Châu', 'Hoàng Văn Đức', '+84901110007',
    420000, 55000, 60000, 0, 535000,
    now_ts + INTERVAL '6 hours', 'accepted', FALSE, TRUE, now_ts - INTERVAL '2 hours',
    160500, 374500, now_ts - INTERVAL '1 hour',
    TRUE, 2, 'Combo phòng trọ', now_ts - INTERVAL '1 day', now_ts);

  -- ── Hoàn thành (tab Hoàn thành + thu nhập) ───────────────────────────────
  INSERT INTO orders (
    id, order_number, customer_id, provider_id, service_type, vehicle_size,
    pickup_address, pickup_city, pickup_district, pickup_contact_name, pickup_contact_phone,
    delivery_address, delivery_city, delivery_district, delivery_contact_name, delivery_contact_phone,
    base_price, distance_price, floor_price, service_fee, total_price,
    status, deposit_paid, deposit_amount, provider_accepted_at, completed_at,
    requires_helpers, number_of_helpers, items_description, created_at, updated_at
  ) VALUES
  (o8, 'DEMO-C-0001', cust, prov1, 'standard', 'medium_truck',
   'KTX FPT, Ngũ Hành Sơn', 'Đà Nẵng', 'Ngũ Hành Sơn', 'Đỗ Lan Anh', '+84901110008',
   'An Thượng, Ngũ Hành Sơn', 'Đà Nẵng', 'Ngũ Hành Sơn', 'Đỗ Lan Anh', '+84901110008',
   350000, 40000, 50000, 0, 440000,
   'completed', TRUE, 132000, now_ts - INTERVAL '2 days', now_ts - INTERVAL '1 day',
   TRUE, 2, 'Chuyển trọ Tết', now_ts - INTERVAL '3 days', now_ts - INTERVAL '1 day'),
  (o9, 'DEMO-C-0002', cust, prov1, 'premium', 'large_truck',
   'Cầu Rồng, Hải Châu', 'Đà Nẵng', 'Hải Châu', 'Bùi Quốc Huy', '+84901110009',
   'Vincom Đà Nẵng, Hải Châu', 'Đà Nẵng', 'Hải Châu', 'Bùi Quốc Huy', '+84901110009',
   680000, 80000, 120000, 50000, 930000,
   'completed', TRUE, 279000, now_ts - INTERVAL '5 days', now_ts - INTERVAL '4 days',
   TRUE, 3, 'Trọn gói cao cấp', now_ts - INTERVAL '6 days', now_ts - INTERVAL '4 days');

  -- ── Đã hủy ──────────────────────────────────────────────────────────────
  INSERT INTO orders (
    id, order_number, customer_id, service_type, vehicle_size,
    pickup_address, pickup_city, pickup_district, pickup_contact_name, pickup_contact_phone,
    delivery_address, delivery_city, delivery_district, delivery_contact_name, delivery_contact_phone,
    base_price, total_price, status, quote_request, cancellation_reason, cancelled_at,
    created_at, updated_at
  ) VALUES (
    o10, 'DEMO-X-0001', cust, 'standard', 'small_truck',
    'Hòa Khánh, Liên Chiểu', 'Đà Nẵng', 'Liên Chiểu', 'Trịnh Văn Phú', '+84901110010',
    'Sơn Trà, Sơn Trà', 'Đà Nẵng', 'Sơn Trà', 'Trịnh Văn Phú', '+84901110010',
    280000, 280000, 'cancelled', TRUE, 'Khách đổi lịch', now_ts - INTERVAL '12 hours',
    now_ts - INTERVAL '2 days', now_ts - INTERVAL '12 hours');

  -- Báo giá mẫu (provider 2 đã báo DEMO-Q-0001)
  INSERT INTO order_quotes (
    order_id, provider_id, base_price, surcharges, total_price,
    schedule_fit, note, status, created_at, updated_at
  ) VALUES (
    o1, prov2, 420000, '[{"label":"Tầng không thang máy","amount":60000}]'::jsonb, 480000,
    'exact_match', 'Nhận đúng giờ khách chọn · 2 người bốc xếp', 'submitted',
    now_ts - INTERVAL '10 minutes', now_ts);

  -- Cập nhật thu nhập provider demo (rating sẽ được trigger/seed reviews tính lại)
  UPDATE provider_profiles SET
    total_orders = 52,
    total_earnings = 24850000
  WHERE id = prov1;

END $$;

COMMIT;

-- Kiểm tra:
-- SELECT order_number, status, quote_request, deposit_paid, total_price
-- FROM orders WHERE order_number LIKE 'DEMO-%' ORDER BY created_at DESC;
