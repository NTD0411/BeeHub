# UniMove — Luồng Nghiệp Vụ & Hướng Dẫn Test

> Phiên bản 1.1 · Cập nhật 22/06/2026

---

## 1. Tổng Quan Luồng

```
Customer tạo đơn (pending)
    ↓
Provider báo giá (pending)
    ↓
Customer chọn báo giá (matched) ← lock_expires_at = now + 15 phút
    ↓
Customer đặt cọc qua PayOS
    ↓
Cùng ngày → accepted          Khác ngày → scheduled
    ↓                                ↓
                    (background job chuyển scheduled → accepted khi đến giờ)
                    ↓
Provider thực hiện: picking_up → in_progress → completed
    ↓
slot_locked_until = NULL (provider tự do nhận đơn mới)
```

---

## 2. Hai Loại Lock

| Trường | Mục đích | Khi set | Khi xóa |
|---|---|---|---|
| `lock_expires_at` | Lock tạm 15 phút chờ cọc | Khi customer chọn báo giá (`matched`) | Khi cọc xong hoặc hết 15 phút |
| `slot_locked_until` | Lock khung giờ thật sự | Khi cọc xong (`accepted`/`scheduled`) | Khi đơn `completed` hoặc `cancelled` |

**Công thức:**
- `lock_expires_at = now + 15 phút`
- `slot_locked_until = pickup_time + 30 phút buffer`

---

## 3. Quy tắc accepted vs scheduled

| Điều kiện | Status sau cọc |
|---|---|
| Pickup **cùng ngày** hôm nay (giờ VN) | `accepted` |
| Pickup **ngày mai trở đi** (khác ngày calendar VN) | `scheduled` |

Ví dụ:
- 16h PM 22/06 cọc, pickup 20h PM 22/06 → **accepted** (cùng ngày 22)
- 16h PM 22/06 cọc, pickup 7h AM 23/06 → **scheduled** (ngày 23 ≠ ngày 22)

---

## 4. First Deposit Wins

Khi provider báo giá 2 đơn cùng khung giờ, cả 2 customer đều chọn provider đó:
- Customer nào **cọc trước** → thắng
- Đơn còn lại tự động `cancelled` + notify customer bị ảnh hưởng: *"Nhà xe đã được chốt bởi khách khác cùng khung giờ"*

---

## 5. Background Job (chạy mỗi 2 phút)

| Trigger | Hành động |
|---|---|
| `matched` + `lock_expires_at < NOW()` | Reset về `pending`, unlock provider |
| `pending/matched` + `order_expires_at < NOW()` | Tự động `cancelled` |
| `scheduled` + `scheduled_pickup_time <= NOW()` | Chuyển sang `accepted` |
| `accepted` + pickup còn 28–32 phút | Gửi notification nhắc provider T-30 |

---

## 6. Provider App — Tự Cập Nhật

Provider app polling **10 giây** một lần khi đơn đang `pending` hoặc `matched` — tự reload trạng thái mà không cần F5.

---

## 7. Active Order Banner

Banner nổi cố định ở góc dưới màn hình khi có đơn đang thực hiện (`accepted`, `picking_up`, `in_progress`, `delivering`). Click vào chuyển đến trang chi tiết. Áp dụng cho cả customer và provider.

---

## 8. Hướng Dẫn Test Từng Bước

### Chuẩn bị

1. Đảm bảo đã chạy migration SQL:
```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS slot_locked_until TIMESTAMPTZ DEFAULT NULL;
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'order_reminder';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'pickup_reminder_30';
```

2. Seed tài khoản test:
```bash
cd backend && npm run seed:e2e
```

Tài khoản:
- Customer test: `test.customer@unimove.test` / `Test1234!`
- Provider test: `test.provider@unimove.test` / `Test1234!`

3. Khởi động server:
```bash
npm run dev:be+web
```

---

### Test 1 — lock_expires_at khi matched

**Bước:**
1. Customer tạo đơn chọn slot ngày mai (ví dụ 7h AM)
2. Provider vào đơn → gửi báo giá
3. Customer chọn báo giá của provider

**Kiểm tra DB:**
```sql
SET timezone = 'Asia/Ho_Chi_Minh';
SELECT id, status, lock_expires_at, slot_locked_until
FROM orders WHERE status = 'matched'
ORDER BY created_at DESC LIMIT 1;
```

**Kết quả mong đợi:**
- `status = matched`
- `lock_expires_at = now + 15 phút`
- `slot_locked_until = NULL`

---

### Test 2 — slot_locked_until sau khi cọc

**Bước (tiếp theo Test 1):**
1. Customer nhấn "Đặt cọc ngay" → màn hình PayOS hiện ra
2. Nhấn "Huỷ" trên trang PayOS → quay về trang chi tiết đơn
3. Nhấn **"Dev: Bỏ qua PayOS (giả lập thành công)"**
4. Chờ 2–3 giây

**Kiểm tra DB:**
```sql
SET timezone = 'Asia/Ho_Chi_Minh';
SELECT id, status, lock_expires_at, slot_locked_until,
       deposit_paid, scheduled_pickup_time
FROM orders WHERE deposit_paid = true
ORDER BY updated_at DESC LIMIT 1;
```

**Kết quả mong đợi:**
- `status = scheduled` (pickup ngày mai) hoặc `accepted` (pickup hôm nay)
- `lock_expires_at = NULL`
- `slot_locked_until = pickup_time + 30 phút` (ví dụ: pickup 7h → slot_locked_until 7h30)
- `deposit_paid = true`

---

### Test 3 — First Deposit Wins

**Bước:**
1. Tạo 2 đơn (2 customer khác nhau) cùng slot 7h AM ngày mai
2. Provider báo giá cả 2 đơn
3. Customer A chọn báo giá provider
4. Customer B chọn báo giá provider (cùng provider)
5. Customer A đặt cọc trước (giả lập)

**Kiểm tra DB:**
```sql
SELECT id, status, cancellation_reason, cancelled_at
FROM orders
WHERE provider_id = '<provider_id>'
  AND status IN ('accepted', 'scheduled', 'cancelled')
ORDER BY updated_at DESC;
```

**Kết quả mong đợi:**
- Đơn của Customer A: `status = accepted/scheduled`
- Đơn của Customer B: `status = cancelled`, `cancellation_reason = 'Nhà xe đã được chốt bởi khách khác cùng khung giờ'`

---

### Test 4 — Provider app tự cập nhật

**Bước:**
1. Provider mở trang chi tiết đơn đang `matched`
2. Customer đặt cọc (giả lập) trên tab khác
3. Chờ tối đa 10 giây trên tab Provider

**Kết quả mong đợi:**
- Trang provider tự đổi status từ "Chờ đặt cọc" sang "Đã xác nhận" / "Đã lên lịch" **mà không cần F5**

---

### Test 5 — completed xóa slot_locked_until

**Bước:**
1. Set pickup về 1 phút nữa:
```bash
curl -X PATCH http://localhost:5000/api/dev/orders/<order_id>/set-pickup-now \
  -H "Content-Type: application/json" \
  -d "{\"minutes\": 1}"
```

2. Chờ 1 phút, trigger job:
```bash
curl -X POST http://localhost:5000/api/dev/jobs/run-timeout
```

3. Provider: nhấn "Đang đến lấy" → "Đã lấy hàng" → upload ảnh → "Hoàn thành"

**Kiểm tra DB:**
```sql
SELECT id, status, slot_locked_until, completed_at
FROM orders WHERE status = 'completed'
ORDER BY completed_at DESC LIMIT 1;
```

**Kết quả mong đợi:**
- `status = completed`
- `slot_locked_until = NULL`

---

### Test 6 — Notification T-30

**Bước:**
1. Đảm bảo đơn đang `accepted`
2. Set pickup về 30 phút nữa:
```bash
curl -X PATCH http://localhost:5000/api/dev/orders/<order_id>/set-pickup-now \
  -H "Content-Type: application/json" \
  -d "{\"minutes\": 30}"
```

3. Trigger job:
```bash
curl -X POST http://localhost:5000/api/dev/jobs/run-timeout
```

**Kiểm tra DB:**
```sql
SELECT user_id, notification_type, title, body, created_at
FROM notifications
WHERE notification_type = 'pickup_reminder_30'
ORDER BY created_at DESC LIMIT 3;
```

**Kết quả mong đợi:**
- Record mới với `notification_type = pickup_reminder_30`
- `title = '⏰ Còn 30 phút đến giờ chuyến!'`

---

## 9. Dev API Reference

| Method | URL | Body | Mô tả |
|---|---|---|---|
| POST | `/api/dev/payments/simulate` | `{ order_id }` | Giả lập thanh toán thành công |
| POST | `/api/dev/jobs/run-timeout` | — | Trigger background job thủ công |
| PATCH | `/api/dev/orders/:id/set-pickup-now` | `{ minutes: N }` | Set pickup = now + N phút |

> **Lưu ý:** Các API `/api/dev/*` chỉ hoạt động khi `NODE_ENV !== 'production'`

---

## 10. Query Tiện Dụng

**Xem tất cả đơn đang active (giờ VN):**
```sql
SET timezone = 'Asia/Ho_Chi_Minh';
SELECT id, status, lock_expires_at, slot_locked_until,
       deposit_paid, scheduled_pickup_time
FROM orders
WHERE status IN ('pending','matched','accepted','scheduled','picking_up','in_progress')
ORDER BY updated_at DESC;
```

**Xem notifications gần nhất của 1 đơn:**
```sql
SELECT user_id, notification_type, title, body, created_at
FROM notifications
WHERE action_data->>'order_id' = '<order_id>'
ORDER BY created_at DESC LIMIT 10;
```

**Repair đơn bị stuck (deposit_paid=true nhưng status=pending):**
```sql
UPDATE orders
SET status = CASE
    WHEN DATE(scheduled_pickup_time AT TIME ZONE 'Asia/Ho_Chi_Minh')
       = DATE(NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')
    THEN 'accepted'
    ELSE 'scheduled'
  END,
  lock_expires_at = NULL,
  slot_locked_until = scheduled_pickup_time + INTERVAL '30 minutes'
WHERE deposit_paid = true
  AND status = 'pending'
  AND provider_id IS NOT NULL;
```
