-- =============================================================================
-- SEED ĐÁNH GIÁ DEMO — nhà xe UniMove Test Transport & Hùng Move Express Test
-- =============================================================================
-- Chạy trên Supabase SQL Editor SAU:
--   1. seed-e2e-test-accounts.sql
--   2. seed-demo-orders-ui.sql (tùy chọn — có đơn hoàn thành DEMO-C-*)
--
-- Tạo ~14 đánh giá thật trong bảng `reviews` + cập nhật provider_reviews_summary
-- =============================================================================

BEGIN;

-- Xóa seed cũ (chạy lại an toàn)
DELETE FROM reviews
WHERE order_id IN (
  SELECT id FROM orders WHERE order_number LIKE 'DEMO-R-%'
);

DELETE FROM orders WHERE order_number LIKE 'DEMO-R-%';

-- Xóa review trên đơn hoàn thành demo (nếu đã seed trước đó)
DELETE FROM reviews
WHERE order_id IN (
  'e5000001-0001-4001-8001-000000000008',
  'e5000001-0001-4001-8001-000000000009'
);

DO $$
DECLARE
  prov1 UUID := 'd4000001-0001-4001-8001-000000000001';
  prov2 UUID := 'd4000001-0001-4001-8001-000000000002';
  cust_main UUID := 'c3000001-0001-4001-8001-000000000001';
  now_ts TIMESTAMPTZ := NOW();

  -- Khách hàng đánh giá (profiles)
  c1 UUID := 'c3000001-0001-4001-8001-000000000011';
  c2 UUID := 'c3000001-0001-4001-8001-000000000012';
  c3 UUID := 'c3000001-0001-4001-8001-000000000013';
  c4 UUID := 'c3000001-0001-4001-8001-000000000014';
  c5 UUID := 'c3000001-0001-4001-8001-000000000015';
  c6 UUID := 'c3000001-0001-4001-8001-000000000016';
  c7 UUID := 'c3000001-0001-4001-8001-000000000017';
  c8 UUID := 'c3000001-0001-4001-8001-000000000018';
  c9 UUID := 'c3000001-0001-4001-8001-000000000019';
  c10 UUID := 'c3000001-0001-4001-8001-000000000020';
  c11 UUID := 'c3000001-0001-4001-8001-000000000021';
  c12 UUID := 'c3000001-0001-4001-8001-000000000022';

  o8 UUID := 'e5000001-0001-4001-8001-000000000008';
  o9 UUID := 'e5000001-0001-4001-8001-000000000009';
BEGIN
  -- ── Profiles khách đánh giá ─────────────────────────────────────────────
  INSERT INTO profiles (id, email, full_name, role, status, onboarding_completed, created_at, updated_at)
  VALUES
    (c1, 'reviewer01@unimove.test', 'Nguyễn Văn An', 'customer', 'active', TRUE, now_ts, now_ts),
    (c2, 'reviewer02@unimove.test', 'Trần Thị Mai', 'customer', 'active', TRUE, now_ts, now_ts),
    (c3, 'reviewer03@unimove.test', 'Lê Hoàng Nam', 'customer', 'active', TRUE, now_ts, now_ts),
    (c4, 'reviewer04@unimove.test', 'Phạm Thu Trang', 'customer', 'active', TRUE, now_ts, now_ts),
    (c5, 'reviewer05@unimove.test', 'Hoàng Văn Đức', 'customer', 'active', TRUE, now_ts, now_ts),
    (c6, 'reviewer06@unimove.test', 'Đỗ Lan Anh', 'customer', 'active', TRUE, now_ts, now_ts),
    (c7, 'reviewer07@unimove.test', 'Bùi Quốc Huy', 'customer', 'active', TRUE, now_ts, now_ts),
    (c8, 'reviewer08@unimove.test', 'Võ Thị Mai', 'customer', 'active', TRUE, now_ts, now_ts),
    (c9, 'reviewer09@unimove.test', 'Phan Thị Ngọc Quyên', 'customer', 'active', TRUE, now_ts, now_ts),
    (c10, 'reviewer10@unimove.test', 'Nguyễn Bảo Châu', 'customer', 'active', TRUE, now_ts, now_ts),
    (c11, 'reviewer11@unimove.test', 'Trịnh Văn Phú', 'customer', 'active', TRUE, now_ts, now_ts),
    (c12, 'reviewer12@unimove.test', 'Lê Hoàng Cường', 'customer', 'active', TRUE, now_ts, now_ts)
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    updated_at = now_ts;

  INSERT INTO customer_profiles (id, university, city, district, total_orders, total_spent, loyalty_points)
  SELECT id, 'ĐH Đà Nẵng', 'Đà Nẵng', 'Hải Châu', 1, 0, 0
  FROM (VALUES
    (c1), (c2), (c3), (c4), (c5), (c6), (c7), (c8), (c9), (c10), (c11), (c12)
  ) AS t(id)
  ON CONFLICT (id) DO NOTHING;

  -- ── Đơn hoàn thành chỉ để gắn review ───────────────────────────────────
  INSERT INTO orders (
    id, order_number, customer_id, provider_id, service_type, vehicle_size,
    pickup_address, pickup_city, pickup_district, pickup_contact_name, pickup_contact_phone,
    delivery_address, delivery_city, delivery_district, delivery_contact_name, delivery_contact_phone,
    base_price, distance_price, floor_price, service_fee, total_price,
    status, deposit_paid, deposit_amount, provider_accepted_at, completed_at,
    requires_helpers, number_of_helpers, items_description, created_at, updated_at
  ) VALUES
  ('f6000001-0001-4001-8001-000000000001', 'DEMO-R-0001', c1, prov1, 'standard', 'medium_truck',
   'KTX ĐH Đà Nẵng, Ngũ Hành Sơn', 'Đà Nẵng', 'Ngũ Hành Sơn', 'Nguyễn Văn An', '+84901120001',
   'Chung cư Monarchy, Ngũ Hành Sơn', 'Đà Nẵng', 'Ngũ Hành Sơn', 'Nguyễn Văn An', '+84901120001',
   350000, 40000, 50000, 0, 440000, 'completed', TRUE, 132000, now_ts - INTERVAL '10 days', now_ts - INTERVAL '9 days',
   TRUE, 2, 'Chuyển trọ', now_ts - INTERVAL '11 days', now_ts - INTERVAL '9 days'),
  ('f6000001-0001-4001-8001-000000000002', 'DEMO-R-0002', c2, prov1, 'standard', 'medium_truck',
   '254 Nguyễn Văn Linh, Thanh Khê', 'Đà Nẵng', 'Thanh Khê', 'Trần Thị Mai', '+84901120002',
   '45 Lê Duẩn, Hải Châu', 'Đà Nẵng', 'Hải Châu', 'Trần Thị Mai', '+84901120002',
   320000, 35000, 45000, 0, 400000, 'completed', TRUE, 120000, now_ts - INTERVAL '8 days', now_ts - INTERVAL '7 days',
   FALSE, 0, 'Vali, sách', now_ts - INTERVAL '9 days', now_ts - INTERVAL '7 days'),
  ('f6000001-0001-4001-8001-000000000003', 'DEMO-R-0003', c3, prov1, 'standard', 'medium_truck',
   'KTX FPT, Ngũ Hành Sơn', 'Đà Nẵng', 'Ngũ Hành Sơn', 'Lê Hoàng Nam', '+84901120003',
   'An Thượng, Ngũ Hành Sơn', 'Đà Nẵng', 'Ngũ Hành Sơn', 'Lê Hoàng Nam', '+84901120003',
   380000, 42000, 55000, 0, 477000, 'completed', TRUE, 143100, now_ts - INTERVAL '7 days', now_ts - INTERVAL '6 days',
   TRUE, 2, 'Bàn ghế, tủ', now_ts - INTERVAL '8 days', now_ts - INTERVAL '6 days'),
  ('f6000001-0001-4001-8001-000000000004', 'DEMO-R-0004', c4, prov1, 'premium', 'large_truck',
   '35 Nguyễn Minh Châu, Ngũ Hành Sơn', 'Đà Nẵng', 'Ngũ Hành Sơn', 'Phạm Thu Trang', '+84901120004',
   'FPT City, Ngũ Hành Sơn', 'Đà Nẵng', 'Ngũ Hành Sơn', 'Phạm Thu Trang', '+84901120004',
   520000, 60000, 80000, 0, 660000, 'completed', TRUE, 198000, now_ts - INTERVAL '6 days', now_ts - INTERVAL '5 days',
   TRUE, 3, 'Tủ lạnh, máy giặt', now_ts - INTERVAL '7 days', now_ts - INTERVAL '5 days'),
  ('f6000001-0001-4001-8001-000000000005', 'DEMO-R-0005', c5, prov1, 'standard', 'medium_truck',
   '152 Huỳnh Tấn Phát, Hải Châu', 'Đà Nẵng', 'Hải Châu', 'Hoàng Văn Đức', '+84901120005',
   'Khu Sơn Trà, Sơn Trà', 'Đà Nẵng', 'Sơn Trà', 'Hoàng Văn Đức', '+84901120005',
   360000, 38000, 48000, 0, 446000, 'completed', TRUE, 133800, now_ts - INTERVAL '5 days', now_ts - INTERVAL '4 days',
   TRUE, 2, 'Đồ phòng trọ', now_ts - INTERVAL '6 days', now_ts - INTERVAL '4 days'),
  ('f6000001-0001-4001-8001-000000000006', 'DEMO-R-0006', c6, prov1, 'standard', 'medium_truck',
   'KTX ĐH Đà Nẵng, Ngũ Hành Sơn', 'Đà Nẵng', 'Ngũ Hành Sơn', 'Đỗ Lan Anh', '+84901120006',
   'Chung cư Golden House, Hải Châu', 'Đà Nẵng', 'Hải Châu', 'Đỗ Lan Anh', '+84901120006',
   400000, 50000, 60000, 0, 510000, 'completed', TRUE, 153000, now_ts - INTERVAL '4 days', now_ts - INTERVAL '3 days',
   TRUE, 2, 'Combo phòng trọ', now_ts - INTERVAL '5 days', now_ts - INTERVAL '3 days'),
  ('f6000001-0001-4001-8001-000000000007', 'DEMO-R-0007', c7, prov1, 'standard', 'medium_truck',
   'Cầu Rồng, Hải Châu', 'Đà Nẵng', 'Hải Châu', 'Bùi Quốc Huy', '+84901120007',
   'Vincom Đà Nẵng, Hải Châu', 'Đà Nẵng', 'Hải Châu', 'Bùi Quốc Huy', '+84901120007',
   450000, 55000, 70000, 0, 575000, 'completed', TRUE, 172500, now_ts - INTERVAL '3 days', now_ts - INTERVAL '2 days',
   TRUE, 2, 'Đồ lớn', now_ts - INTERVAL '4 days', now_ts - INTERVAL '2 days'),
  ('f6000001-0001-4001-8001-000000000008', 'DEMO-R-0008', c8, prov1, 'standard', 'medium_truck',
   'Khu đô thị Hòa Xuân, Cẩm Lệ', 'Đà Nẵng', 'Cẩm Lệ', 'Võ Thị Mai', '+84901120008',
   'KTX FPT, Ngũ Hành Sơn', 'Đà Nẵng', 'Ngũ Hành Sơn', 'Võ Thị Mai', '+84901120008',
   330000, 36000, 42000, 0, 408000, 'completed', TRUE, 122400, now_ts - INTERVAL '2 days', now_ts - INTERVAL '1 day',
   TRUE, 2, 'Chuyển phòng', now_ts - INTERVAL '3 days', now_ts - INTERVAL '1 day'),
  ('f6000001-0001-4001-8001-000000000009', 'DEMO-R-0009', c9, prov1, 'standard', 'medium_truck',
   '35, Đường Nguyễn Minh Châu, Ngũ Hành Sơn', 'Đà Nẵng', 'Ngũ Hành Sơn', 'Phan Thị Ngọc Quyên', '+84901120009',
   'Huỳnh Lắm, Ngũ Hành Sơn', 'Đà Nẵng', 'Ngũ Hành Sơn', 'Phan Thị Ngọc Quyên', '+84901120009',
   310000, 32000, 40000, 0, 382000, 'completed', TRUE, 114600, now_ts - INTERVAL '15 days', now_ts - INTERVAL '14 days',
   TRUE, 2, 'Ít đồ', now_ts - INTERVAL '16 days', now_ts - INTERVAL '14 days'),
  ('f6000001-0001-4001-8001-000000000010', 'DEMO-R-0010', c10, prov1, 'standard', 'medium_truck',
   'Hòa Khánh, Liên Chiểu', 'Đà Nẵng', 'Liên Chiểu', 'Nguyễn Bảo Châu', '+84901120010',
   'Sơn Trà, Sơn Trà', 'Đà Nẵng', 'Sơn Trà', 'Nguyễn Bảo Châu', '+84901120010',
   290000, 30000, 35000, 0, 355000, 'completed', TRUE, 106500, now_ts - INTERVAL '12 days', now_ts - INTERVAL '11 days',
   FALSE, 0, 'Vali', now_ts - INTERVAL '13 days', now_ts - INTERVAL '11 days'),
  ('f6000001-0001-4001-8001-000000000011', 'DEMO-R-0011', c11, prov1, 'standard', 'medium_truck',
   'Lê Văn Hiến, Ngũ Hành Sơn', 'Đà Nẵng', 'Ngũ Hành Sơn', 'Trịnh Văn Phú', '+84901120011',
   'Lê Duẩn, Hải Châu', 'Đà Nẵng', 'Hải Châu', 'Trịnh Văn Phú', '+84901120011',
   20000, 0, 5000, 0, 25000, 'completed', TRUE, 7500, now_ts - INTERVAL '3 days', now_ts - INTERVAL '2 days',
   FALSE, 0, 'Thử nghiệm', now_ts - INTERVAL '4 days', now_ts - INTERVAL '2 days'),
  ('f6000001-0001-4001-8001-000000000012', 'DEMO-R-0012', c12, prov1, 'standard', 'medium_truck',
   'KTX ĐH Đà Nẵng, Ngũ Hành Sơn', 'Đà Nẵng', 'Ngũ Hành Sơn', 'Lê Hoàng Cường', '+84901120012',
   'Chung cư Monarchy, Ngũ Hành Sơn', 'Đà Nẵng', 'Ngũ Hành Sơn', 'Lê Hoàng Cường', '+84901120012',
   370000, 40000, 52000, 0, 462000, 'completed', TRUE, 138600, now_ts - INTERVAL '20 days', now_ts - INTERVAL '19 days',
   TRUE, 2, 'Cuối kỳ', now_ts - INTERVAL '21 days', now_ts - INTERVAL '19 days');

  -- ── Reviews cho UniMove Test Transport (prov1) ───────────────────────────
  INSERT INTO reviews (
    id, order_id, customer_id, provider_id,
    rating, service_quality_rating, punctuality_rating, professionalism_rating, value_for_money_rating,
    title, comment, tags, is_published, is_verified,
    provider_response, provider_responded_at, created_at, updated_at
  ) VALUES
  ('a7000001-0001-4001-8001-000000000001', 'f6000001-0001-4001-8001-000000000001', c1, prov1,
   5, 5, 5, 5, 5, 'Rất hài lòng',
   'Tài xế nhiệt tình, bốc xếp cẩn thận, đúng giờ hẹn. Đồ đạc không bị trầy xước.',
   ARRAY['thân thiện', 'cẩn thận', 'đúng giờ'], TRUE, TRUE,
   'Cảm ơn bạn đã tin tưởng UniMove Test Transport!', now_ts - INTERVAL '8 days',
   now_ts - INTERVAL '9 days', now_ts - INTERVAL '9 days'),
  ('a7000001-0001-4001-8001-000000000002', 'f6000001-0001-4001-8001-000000000002', c2, prov1,
   5, 5, 5, 4, 5, 'Giá tốt',
   'Giá hợp lý, không phát sinh thêm chi phí so với báo giá ban đầu.',
   ARRAY['giá tốt', 'minh bạch'], TRUE, TRUE,
   NULL, NULL, now_ts - INTERVAL '7 days', now_ts - INTERVAL '7 days'),
  ('a7000001-0001-4001-8001-000000000003', 'f6000001-0001-4001-8001-000000000003', c3, prov1,
   5, 5, 5, 5, 4, 'Đóng gói kỹ',
   'Đồ đạc được bọc kỹ, đội ngũ thân thiện và chuyên nghiệp.',
   ARRAY['cẩn thận', 'chuyên nghiệp'], TRUE, TRUE,
   'Rất vui được phục vụ bạn!', now_ts - INTERVAL '6 days',
   now_ts - INTERVAL '6 days', now_ts - INTERVAL '6 days'),
  ('a7000001-0001-4001-8001-000000000004', 'f6000001-0001-4001-8001-000000000004', c4, prov1,
   4, 4, 4, 5, 4, 'Tốt, hơi trễ',
   'Dịch vụ tốt, tài xế có kinh nghiệm. Chỉ trễ khoảng 15 phút do kẹt xe.',
   ARRAY['chuyên nghiệp'], TRUE, TRUE,
   NULL, NULL, now_ts - INTERVAL '5 days', now_ts - INTERVAL '5 days'),
  ('a7000001-0001-4001-8001-000000000005', 'f6000001-0001-4001-8001-000000000005', c5, prov1,
   5, 5, 5, 5, 5, 'Recommend',
   'Chuyển trọ nhanh gọn, sẽ book lại lần sau. Recommend cho bạn bè!',
   ARRAY['nhanh', 'đúng giờ'], TRUE, TRUE,
   'Cảm ơn bạn!', now_ts - INTERVAL '4 days',
   now_ts - INTERVAL '4 days', now_ts - INTERVAL '4 days'),
  ('a7000001-0001-4001-8001-000000000006', 'f6000001-0001-4001-8001-000000000006', c6, prov1,
   5, 5, 5, 5, 5, 'Uy tín',
   'Nhà xe uy tín, hỗ trợ lên tầng cao không cắt phí thêm bất ngờ.',
   ARRAY['uy tín', 'minh bạch'], TRUE, TRUE,
   NULL, NULL, now_ts - INTERVAL '3 days', now_ts - INTERVAL '3 days'),
  ('a7000001-0001-4001-8001-000000000007', 'f6000001-0001-4001-8001-000000000007', c7, prov1,
   4, 4, 4, 4, 4, 'Ổn áp',
   'Dịch vụ ổn, tài xế có kinh nghiệm xử lý đồ cồng kềnh.',
   ARRAY['kinh nghiệm'], TRUE, TRUE,
   'Cảm ơn phản hồi của bạn!', now_ts - INTERVAL '2 days',
   now_ts - INTERVAL '2 days', now_ts - INTERVAL '2 days'),
  ('a7000001-0001-4001-8001-000000000008', 'f6000001-0001-4001-8001-000000000008', c8, prov1,
   5, 5, 5, 5, 5, 'Xe sạch',
   'Xe sạch sẽ, bọc đồ cẩn thận. Rất hài lòng với chuyến chuyển.',
   ARRAY['sạch sẽ', 'cẩn thận'], TRUE, TRUE,
   NULL, NULL, now_ts - INTERVAL '1 day', now_ts - INTERVAL '1 day'),
  ('a7000001-0001-4001-8001-000000000009', 'f6000001-0001-4001-8001-000000000009', c9, prov1,
   5, 5, 5, 5, 4, 'Hài lòng',
   'Rất hài lòng với UniMove Test Transport, đúng giờ và giá rõ ràng.',
   ARRAY['đúng giờ', 'minh bạch'], TRUE, TRUE,
   'Hẹn gặp lại bạn!', now_ts - INTERVAL '14 days',
   now_ts - INTERVAL '14 days', now_ts - INTERVAL '14 days'),
  ('a7000001-0001-4001-8001-000000000010', 'f6000001-0001-4001-8001-000000000010', c10, prov1,
   4, 4, 4, 4, 5, 'Giá tốt',
   'Giá tốt so với thị trường, phù hợp sinh viên.',
   ARRAY['giá tốt'], TRUE, TRUE,
   NULL, NULL, now_ts - INTERVAL '11 days', now_ts - INTERVAL '11 days'),
  ('a7000001-0001-4001-8001-000000000011', 'f6000001-0001-4001-8001-000000000011', c11, prov1,
   5, 5, 5, 5, 5, 'Tuyệt vời',
   'Đúng giờ 100%, cảm ơn anh tài xế! Sẽ dùng lại dịch vụ.',
   ARRAY['đúng giờ', 'thân thiện'], TRUE, TRUE,
   'Cảm ơn bạn!', now_ts - INTERVAL '2 days',
   now_ts - INTERVAL '2 days', now_ts - INTERVAL '2 days'),
  ('a7000001-0001-4001-8001-000000000012', 'f6000001-0001-4001-8001-000000000012', c12, prov1,
   5, 5, 5, 5, 5, 'Xuất sắc',
   'Chuyển trọ cuối kỳ rất mượt, không lo đồ hỏng. 10 điểm!',
   ARRAY['cẩn thận', 'nhanh'], TRUE, TRUE,
   NULL, NULL, now_ts - INTERVAL '19 days', now_ts - INTERVAL '19 days');

  -- Reviews trên đơn DEMO-C-* (nếu đã chạy seed-demo-orders-ui)
  IF EXISTS (SELECT 1 FROM orders WHERE id = o8) THEN
    INSERT INTO reviews (
      id, order_id, customer_id, provider_id,
      rating, service_quality_rating, punctuality_rating, professionalism_rating, value_for_money_rating,
      title, comment, tags, is_published, is_verified, created_at, updated_at
    ) VALUES (
      'a7000001-0001-4001-8001-000000000013', o8, cust_main, prov1,
      5, 5, 5, 5, 4, 'Chuyển Tết ổn',
      'Chuyển trọ dịp Tết ổn áp, nhà xe phản hồi nhanh.',
      ARRAY['nhanh', 'uy tín'], TRUE, TRUE,
      now_ts - INTERVAL '1 day', now_ts - INTERVAL '1 day'
    ) ON CONFLICT (order_id) DO NOTHING;
  END IF;

  IF EXISTS (SELECT 1 FROM orders WHERE id = o9) THEN
    INSERT INTO reviews (
      id, order_id, customer_id, provider_id,
      rating, service_quality_rating, punctuality_rating, professionalism_rating, value_for_money_rating,
      title, comment, tags, is_published, is_verified, created_at, updated_at
    ) VALUES (
      'a7000001-0001-4001-8001-000000000014', o9, cust_main, prov1,
      5, 5, 4, 5, 5, 'Gói cao cấp ok',
      'Gói premium xứng đáng, đội ngũ 3 người làm việc rất gọn.',
      ARRAY['chuyên nghiệp', 'cẩn thận'], TRUE, TRUE,
      now_ts - INTERVAL '4 days', now_ts - INTERVAL '4 days'
    ) ON CONFLICT (order_id) DO NOTHING;
  END IF;

  -- ── 3 reviews cho provider 2 ────────────────────────────────────────────
  INSERT INTO orders (
    id, order_number, customer_id, provider_id, service_type, vehicle_size,
    pickup_address, pickup_city, pickup_district, pickup_contact_name, pickup_contact_phone,
    delivery_address, delivery_city, delivery_district, delivery_contact_name, delivery_contact_phone,
    base_price, total_price, status, deposit_paid, completed_at, created_at, updated_at
  ) VALUES
  ('f6000001-0001-4001-8001-000000000021', 'DEMO-R-P2-01', c1, prov2, 'standard', 'small_truck',
   'Thanh Khê, Đà Nẵng', 'Đà Nẵng', 'Thanh Khê', 'Nguyễn Văn An', '+84901120001',
   'Hải Châu, Đà Nẵng', 'Đà Nẵng', 'Hải Châu', 'Nguyễn Văn An', '+84901120001',
   380000, 380000, 'completed', TRUE, now_ts - INTERVAL '5 days', now_ts - INTERVAL '6 days', now_ts - INTERVAL '5 days'),
  ('f6000001-0001-4001-8001-000000000022', 'DEMO-R-P2-02', c2, prov2, 'standard', 'small_truck',
   'Ngũ Hành Sơn, Đà Nẵng', 'Đà Nẵng', 'Ngũ Hành Sơn', 'Trần Thị Mai', '+84901120002',
   'Sơn Trà, Đà Nẵng', 'Đà Nẵng', 'Sơn Trà', 'Trần Thị Mai', '+84901120002',
   350000, 350000, 'completed', TRUE, now_ts - INTERVAL '8 days', now_ts - INTERVAL '9 days', now_ts - INTERVAL '8 days'),
  ('f6000001-0001-4001-8001-000000000023', 'DEMO-R-P2-03', c3, prov2, 'standard', 'small_truck',
   'Liên Chiểu, Đà Nẵng', 'Đà Nẵng', 'Liên Chiểu', 'Lê Hoàng Nam', '+84901120003',
   'Cẩm Lệ, Đà Nẵng', 'Đà Nẵng', 'Cẩm Lệ', 'Lê Hoàng Nam', '+84901120003',
   320000, 320000, 'completed', TRUE, now_ts - INTERVAL '12 days', now_ts - INTERVAL '13 days', now_ts - INTERVAL '12 days')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO reviews (
    id, order_id, customer_id, provider_id,
    rating, service_quality_rating, punctuality_rating, professionalism_rating, value_for_money_rating,
    title, comment, tags, is_published, is_verified, created_at, updated_at
  ) VALUES
  ('a7000001-0001-4001-8001-000000000021', 'f6000001-0001-4001-8001-000000000021', c1, prov2,
   5, 5, 5, 4, 5, 'Nhanh', 'Hùng Move giao nhanh, giá ok.', ARRAY['nhanh'], TRUE, TRUE,
   now_ts - INTERVAL '5 days', now_ts - INTERVAL '5 days'),
  ('a7000001-0001-4001-8001-000000000022', 'f6000001-0001-4001-8001-000000000022', c2, prov2,
   5, 4, 5, 5, 4, 'Tốt', 'Tài xế thân thiện, recommend.', ARRAY['thân thiện'], TRUE, TRUE,
   now_ts - INTERVAL '8 days', now_ts - INTERVAL '8 days'),
  ('a7000001-0001-4001-8001-000000000023', 'f6000001-0001-4001-8001-000000000023', c3, prov2,
   4, 4, 4, 4, 4, 'Ổn', 'Dịch vụ ổn, không có gì phàn nàn.', ARRAY['ổn'], TRUE, TRUE,
   now_ts - INTERVAL '12 days', now_ts - INTERVAL '12 days')
  ON CONFLICT (order_id) DO NOTHING;

  -- Đồng bộ provider_profiles từ summary (trigger chỉ cập nhật profiles)
  UPDATE provider_profiles pp
  SET
    rating = s.average_rating,
    total_reviews = s.total_reviews,
    updated_at = now_ts
  FROM provider_reviews_summary s
  WHERE pp.id = s.provider_id
    AND pp.id IN (prov1, prov2);

END $$;

COMMIT;

-- Kiểm tra:
-- SELECT r.rating, r.title, r.comment, p.full_name AS customer
-- FROM reviews r
-- JOIN profiles p ON p.id = r.customer_id
-- WHERE r.provider_id = 'd4000001-0001-4001-8001-000000000001'
-- ORDER BY r.created_at DESC;
--
-- SELECT * FROM provider_reviews_summary
-- WHERE provider_id = 'd4000001-0001-4001-8001-000000000001';
