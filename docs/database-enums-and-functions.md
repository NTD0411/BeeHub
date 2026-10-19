# UniMove Database - Part 3: ENUMs, Views & Functions

## 🏷️ PHẦN 7: ENUM TYPES (10 types)

### 1. `user_role`
**Giá trị**: 
- `customer` - Khách hàng (sinh viên)
- `provider` - Nhà cung cấp dịch vụ
- `admin` - Quản trị viên

---

### 2. `user_status`
**Giá trị**:
- `active` - Đang hoạt động
- `inactive` - Không hoạt động
- `suspended` - Bị đình chỉ
- `pending_verification` - Chờ xác thực

---

### 3. `gender_type`
**Giá trị**:
- `male` - Nam
- `female` - Nữ

---

### 4. `order_status`
**Giá trị** (theo thứ tự workflow):
- `pending` - Đơn mới tạo, chờ tìm provider
- `matched` - Đã match với provider
- `accepted` - Provider đã chấp nhận
- `in_progress` - Đang thực hiện
- `picking_up` - Đang đến điểm lấy hàng
- `picked_up` - Đã lấy hàng
- `delivering` - Đang giao hàng
- `completed` - Hoàn thành
- `cancelled` - Đã hủy
- `disputed` - Có tranh chấp

---

### 5. `service_type`
**Giá trị**:
- `standard` - Dịch vụ tiêu chuẩn
- `express` - Dịch vụ nhanh (ưu tiên)
- `premium` - Dịch vụ cao cấp (có bảo hiểm)
- `group` - Dịch vụ gộp đơn (tiết kiệm chi phí)

---

### 6. `vehicle_size`
**Giá trị**:
- `motorbike` - Xe máy (< 50kg)
- `small_truck` - Xe tải nhỏ (< 500kg)
- `medium_truck` - Xe tải trung (< 1000kg)
- `large_truck` - Xe tải lớn (> 1000kg)

---

### 7. `payment_status`
**Giá trị**:
- `pending` - Chờ thanh toán
- `processing` - Đang xử lý
- `completed` - Thành công
- `failed` - Thất bại
- `refunded` - Đã hoàn tiền
- `partially_refunded` - Hoàn một phần
- `cancelled` - Đã hủy

---

### 8. `payment_method`
**Giá trị**:
- `payos` - PayOS payment gateway
- `cash` - Tiền mặt
- `bank_transfer` - Chuyển khoản ngân hàng
- `wallet` - Ví điện tử
- `credit_card` - Thẻ tín dụng
- `debit_card` - Thẻ ghi nợ

---

### 9. `transaction_type`
**Giá trị**:
- `order_payment` - Thanh toán đơn hàng
- `refund` - Hoàn tiền
- `commission` - Hoa hồng
- `withdrawal` - Rút tiền
- `deposit` - Nạp tiền
- `penalty` - Phạt
- `bonus` - Thưởng

---

### 10. `message_type`
**Giá trị**:
- `text` - Tin nhắn văn bản
- `image` - Hình ảnh
- `location` - Vị trí GPS
- `system` - Tin nhắn hệ thống
- `order_update` - Cập nhật đơn hàng

---

### 11. `notification_type`
**Giá trị**:
- `order_created` - Đơn hàng được tạo
- `order_accepted` - Đơn hàng được chấp nhận
- `order_started` - Đơn hàng bắt đầu
- `order_completed` - Đơn hàng hoàn thành
- `order_cancelled` - Đơn hàng bị hủy
- `payment_received` - Thanh toán thành công
- `payment_failed` - Thanh toán thất bại
- `new_message` - Tin nhắn mới
- `provider_nearby` - Provider đang đến gần
- `promotion` - Khuyến mãi
- `system_announcement` - Thông báo hệ thống

---

### 12. `notification_priority`
**Giá trị**:
- `low` - Thấp
- `normal` - Bình thường
- `high` - Cao
- `urgent` - Khẩn cấp

---

## 📊 PHẦN 8: VIEWS (4 views)

### 1. `active_orders_view`
**Mục đích**: Xem tất cả đơn hàng đang hoạt động với thông tin customer & provider

**Columns trả về**:
- Tất cả columns từ bảng `orders`
- `customer_name` - Tên khách hàng
- `customer_phone` - SĐT khách hàng
- `customer_avatar` - Avatar khách hàng
- `provider_name` - Tên doanh nghiệp provider
- `vehicle_type` - Loại xe
- `vehicle_plate` - Biển số xe
- `provider_contact_name` - Tên liên hệ provider
- `provider_phone` - SĐT provider
- `provider_avatar` - Avatar provider

**Filter**: Chỉ lấy đơn NOT IN ('completed', 'cancelled')

**Cách dùng**:
```sql
SELECT * FROM active_orders_view 
WHERE customer_id = 'xxx' 
ORDER BY created_at DESC;
```

---

### 2. `provider_statistics_view`
**Mục đích**: Thống kê hiệu suất của provider

**Columns trả về**:
- `provider_id` - ID provider
- `business_name` - Tên doanh nghiệp
- `full_name` - Tên người
- `avatar_url` - Avatar
- `rating` - Đánh giá
- `total_reviews` - Tổng đánh giá
- `total_orders` - Tổng đơn
- `total_earnings` - Tổng thu nhập
- `is_verified` - Đã xác thực
- `is_available` - Đang rảnh
- `active_orders` - Số đơn đang làm
- `orders_last_30_days` - Số đơn 30 ngày qua
- `available_earnings` - Thu nhập có thể rút

**Cách dùng**:
```sql
SELECT * FROM provider_statistics_view 
WHERE is_verified = true 
ORDER BY rating DESC, total_reviews DESC 
LIMIT 10;
```

---

### 3. `customer_order_summary_view`
**Mục đích**: Tổng hợp lịch sử đơn hàng của customer

**Columns trả về**:
- `customer_id` - ID customer
- `full_name` - Tên
- `email` - Email
- `phone` - SĐT
- `total_orders` - Tổng đơn
- `total_spent` - Tổng chi tiêu
- `loyalty_points` - Điểm tích lũy
- `completed_orders` - Số đơn hoàn thành
- `cancelled_orders` - Số đơn hủy
- `active_orders` - Số đơn đang làm
- `last_order_date` - Đơn cuối cùng

**Cách dùng**:
```sql
SELECT * FROM customer_order_summary_view 
WHERE customer_id = 'xxx';
```

---

### 4. `daily_revenue_view`
**Mục đích**: Báo cáo doanh thu theo ngày

**Columns trả về**:
- `date` - Ngày
- `total_payments` - Tổng số thanh toán
- `total_orders` - Tổng số đơn
- `total_revenue` - Tổng doanh thu
- `average_order_value` - Giá trị đơn trung bình
- `payos_revenue` - Doanh thu qua PayOS
- `cash_revenue` - Doanh thu tiền mặt

**Filter**: Chỉ lấy payments có status = 'completed'

**Cách dùng**:
```sql
SELECT * FROM daily_revenue_view 
WHERE date >= '2024-05-01' 
ORDER BY date DESC;
```

---

## ⚙️ PHẦN 9: FUNCTIONS (15+ functions)

### 1. `update_updated_at_column()`
**Mục đích**: Trigger function tự động cập nhật cột `updated_at`

**Cách hoạt động**: 
- Được gọi bởi TRIGGER trước khi UPDATE
- Set `NEW.updated_at = NOW()`

**Áp dụng cho**: Hầu hết các bảng có cột `updated_at`

---

### 2. `generate_order_number()`
**Mục đích**: Tạo mã đơn hàng unique

**Format**: `UNI-YYYYMMDD-XXXX`
- VD: `UNI-20240527-0001`

**Logic**:
- Lấy ngày hiện tại
- Đếm số đơn trong ngày
- Tạo số thứ tự 4 chữ số

**Cách dùng**: Tự động gọi khi INSERT order mới

---

### 3. `set_order_number()`
**Mục đích**: Trigger function set order_number tự động

**Cách hoạt động**:
- Nếu order_number NULL → gọi generate_order_number()
- Set vào NEW.order_number

---

### 4. `track_order_status_change()`
**Mục đích**: Tự động log thay đổi trạng thái đơn hàng

**Cách hoạt động**:
- Khi UPDATE orders và status thay đổi
- Tự động INSERT vào order_status_history
- Ghi lại: from_status, to_status, changed_by, timestamp

---

### 5. `generate_payment_code()`
**Mục đích**: Tạo mã thanh toán unique

**Format**: `PAY-YYYYMMDD-XXXX`
- VD: `PAY-20240527-0001`

**Logic**: Tương tự generate_order_number()

---

### 6. `set_payment_code()`
**Mục đích**: Trigger function set payment_code tự động

---

### 7. `create_provider_earnings()`
**Mục đích**: Tự động tạo earnings record khi payment completed

**Cách hoạt động**:
- Khi payment status → 'completed'
- Tính commission (15% platform fee)
- Tính net_earnings = amount - commission
- INSERT vào provider_earnings
- UPDATE provider_profiles.total_earnings

**Logic tính toán**:
```
order_amount = 1,000,000 VNĐ
platform_commission = 1,000,000 × 15% = 150,000 VNĐ
net_earnings = 1,000,000 - 150,000 = 850,000 VNĐ
```

---

### 8. `update_location_geography()`
**Mục đích**: Tự động tạo PostGIS geography point từ lat/lng

**Cách hoạt động**:
- Khi INSERT/UPDATE với latitude, longitude
- Tự động tạo `location` column (PostGIS GEOGRAPHY)
- Dùng để query "tìm provider gần nhất"

**Áp dụng cho**:
- provider_locations
- location_history
- order_tracking_events

---

### 9. `archive_old_location_history()`
**Mục đích**: Xóa location history cũ để tiết kiệm storage

**Logic**:
- Xóa records > 30 ngày
- Xóa expired distance_matrix cache

**Cách dùng**: Chạy định kỳ (cron job)
```sql
SELECT archive_old_location_history();
```

---

### 10. `find_nearby_providers()`
**Mục đích**: Tìm providers gần vị trí cho trước

**Parameters**:
- `p_latitude` - Vĩ độ
- `p_longitude` - Kinh độ
- `p_radius_km` - Bán kính tìm kiếm (default 10km)
- `p_limit` - Số lượng kết quả (default 10)

**Returns**: Table với columns:
- `provider_id`
- `distance_km` - Khoảng cách (km)
- `latitude`, `longitude` - Vị trí provider
- `is_online` - Đang online không
- `current_order_id` - Đang làm đơn nào

**Cách dùng**:
```sql
SELECT * FROM find_nearby_providers(
    10.762622,  -- latitude
    106.660172, -- longitude
    5.0,        -- radius 5km
    10          -- top 10
);
```

---

### 11. `calculate_distance()`
**Mục đích**: Tính khoảng cách giữa 2 điểm GPS

**Parameters**:
- `lat1`, `lng1` - Điểm 1
- `lat2`, `lng2` - Điểm 2

**Returns**: DECIMAL - Khoảng cách (km)

**Cách dùng**:
```sql
SELECT calculate_distance(
    10.762622, 106.660172,  -- Điểm A
    10.772622, 106.670172   -- Điểm B
) as distance_km;
```

---

### 12. `is_within_geofence()`
**Mục đích**: Kiểm tra điểm có nằm trong geofence không

**Parameters**:
- `p_geofence_id` - ID geofence
- `p_latitude`, `p_longitude` - Điểm cần check

**Returns**: BOOLEAN (true/false)

**Cách dùng**:
```sql
SELECT is_within_geofence(
    'geofence-uuid',
    10.762622,
    106.660172
);
```

---

### 13. `update_conversation_on_message()`
**Mục đích**: Cập nhật conversation khi có tin nhắn mới

**Cách hoạt động**:
- Khi INSERT message mới
- UPDATE conversation:
  - last_message_id
  - last_message_at
  - last_message_preview (100 ký tự đầu)
  - Tăng unread_count của người nhận

---

### 14. `reset_unread_on_read()`
**Mục đích**: Giảm unread_count khi đọc tin nhắn

**Cách hoạt động**:
- Khi UPDATE message.is_read = true
- Giảm unread_count của conversation

---

### 15. `create_notification_from_template()`
**Mục đích**: Tạo notification từ template

**Parameters**:
- `p_user_id` - Gửi cho ai
- `p_template_key` - Template nào (VD: 'order_created')
- `p_variables` - Biến thay thế (JSON)
- `p_order_id` - Liên quan đơn nào (optional)

**Returns**: UUID - notification_id

**Cách dùng**:
```sql
SELECT create_notification_from_template(
    'user-uuid',
    'order_created',
    '{"order_number": "UNI-20240527-0001"}'::jsonb,
    'order-uuid'
);
```

---

### 16. `update_provider_rating()`
**Mục đích**: Tự động cập nhật rating của provider khi có review mới

**Cách hoạt động**:
- Khi INSERT/UPDATE review
- Tính lại:
  - average_rating
  - rating distribution (5★, 4★, 3★, 2★, 1★)
  - avg_service_quality, avg_punctuality, etc.
  - response_rate
- UPDATE provider_reviews_summary
- UPDATE provider_profiles.rating

---

### 17. `update_review_helpfulness()`
**Mục đích**: Cập nhật số lượt vote hữu ích của review

**Cách hoạt động**:
- Khi INSERT/UPDATE/DELETE review_votes
- Đếm lại helpful_count và not_helpful_count
- UPDATE reviews

---

### 18. `get_order_statistics()`
**Mục đích**: Lấy thống kê đơn hàng theo khoảng thời gian

**Parameters**:
- `start_date` - Từ ngày
- `end_date` - Đến ngày

**Returns**: Table với:
- `total_orders` - Tổng đơn
- `completed_orders` - Đơn hoàn thành
- `cancelled_orders` - Đơn hủy
- `total_revenue` - Tổng doanh thu
- `average_order_value` - Giá trị đơn TB
- `completion_rate` - Tỷ lệ hoàn thành (%)

**Cách dùng**:
```sql
SELECT * FROM get_order_statistics(
    '2024-05-01'::timestamptz,
    '2024-05-31'::timestamptz
);
```

---

### 19. `get_top_providers()`
**Mục đích**: Lấy danh sách top providers theo rating

**Parameters**:
- `limit_count` - Số lượng (default 10)

**Returns**: Table với:
- `provider_id`
- `business_name`
- `rating`
- `total_reviews`
- `total_orders`
- `completion_rate` - Tỷ lệ hoàn thành (%)

**Cách dùng**:
```sql
SELECT * FROM get_top_providers(20);
```

---

## 🔒 PHẦN 10: RLS HELPER FUNCTIONS

### 1. `is_admin()`
**Mục đích**: Check user hiện tại có phải admin không

**Returns**: BOOLEAN

**Cách dùng trong RLS policy**:
```sql
CREATE POLICY "Admins can do anything"
    ON table_name FOR ALL
    USING (is_admin());
```

---

### 2. `is_customer()`
**Mục đích**: Check user hiện tại có phải customer không

**Returns**: BOOLEAN

---

### 3. `is_provider()`
**Mục đích**: Check user hiện tại có phải provider không

**Returns**: BOOLEAN

---

### 4. `get_user_role()`
**Mục đích**: Lấy role của user hiện tại

**Returns**: user_role ENUM (customer/provider/admin)

**Cách dùng**:
```sql
SELECT get_user_role();
```

---

## 📝 TÓM TẮT

### Tổng Quan Database:
- **42 bảng** chính
- **12 ENUM types** để standardize data
- **4 views** cho queries phức tạp
- **19 functions** tự động hóa logic
- **PostGIS** cho geospatial queries
- **Row Level Security** bảo vệ data

### Các Tính Năng Tự Động:
✅ Auto-generate order_number, payment_code
✅ Auto-track order status changes
✅ Auto-calculate provider earnings & commission
✅ Auto-update provider ratings
✅ Auto-update conversation unread counts
✅ Auto-create PostGIS geography points
✅ Auto-cleanup old location data

### Performance Optimizations:
✅ 50+ indexes cho queries nhanh
✅ Distance matrix cache
✅ PostGIS spatial indexes
✅ Views cho complex queries
✅ Efficient RLS policies

### Security:
✅ Row Level Security trên tất cả bảng
✅ Role-based access control
✅ Secure functions (SECURITY DEFINER)
✅ Input validation via constraints
