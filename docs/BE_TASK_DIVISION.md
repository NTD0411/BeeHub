# UniMove — Phân chia Backend

**File Sheet:** [BE_TASK_DIVISION.csv](./BE_TASK_DIVISION.csv)

## Cách đọc file

| Cột | Nội dung |
|-----|----------|
| **Use Case ID** | Mã use case (ví dụ `UC-11`). Nếu 1 task phục vụ nhiều UC thì ghi `UC-11;UC-12` |
| **Task** | Chỉ **tên việc** cần làm (ngắn) |
| **Note** | Mô tả chi tiết: giao diện Flutter, API, bảng/cột DB, tiêu chí hoàn thành |
| **Task Type** | Nhóm module |
| **Assignee** | Người phụ trách |

Trong **Note**, các mục dùng prefix:

- **【Giao diện】** — file/route `customer_app` hoặc `provider_app`
- **【API】** — method + path + body chính
- **【Database】** — bảng + cột migration (`backend/supabase/migrations/`)
- **【Backend】** — file JS hiện có cần sửa
- **【Hoàn thành khi】** — acceptance criteria
- **【Phụ thuộc】** — task/migration khác

### Lưu ý về stack (bám DB hiện có)

- **Database chính**: Supabase PostgreSQL (migrations trong `backend/supabase/migrations/`)
- **Chat**: lưu trên PostgreSQL bảng `conversations`, `messages` (không dùng MongoDB)
- **Cache/Queue**: hiện **chưa** dùng Redis ở scope MVP (nếu thêm sau sẽ tạo task mới)

---

## Phân công (11 task / người)

| Assignee | Task ID |
|----------|---------|
| Phan Thị Ngọc Quyên | BE-001 → BE-011 |
| Nguyễn Phương Thảo | BE-012 → BE-022 |
| Nguyễn Hữu Hoàng Vũ | BE-023 → BE-033 |
| Lê Văn Hoàng | BE-034 → BE-044 |
| Nguyễn Song Gia Huy | BE-045 → BE-055 |

---

## Google Sheets

1. Import `BE_TASK_DIVISION.csv` (Comma)
2. Hàng 1 merge: **UNIMOVE**
3. Cột **Progress Bar**: `=REPT("█",ROUND(G3*10/100,0))&REPT("░",10-ROUND(G3*10/100,0))`
4. Cột **Note** — bật Wrap text để đọc 【】sections

---

## Map nhanh: Tab / màn chính → Task

| Màn Flutter | Route | Task |
|-------------|-------|------|
| Splash / Login / Register | `/`, `/login`, `/register` | BE-001–004 |
| Profile | `/profile` | BE-005 |
| Home | `/home` | BE-005, BE-032 |
| Chọn địa điểm | `/booking/location` | BE-012, BE-013 |
| Gói dịch vụ | `/booking/packages` | BE-016 |
| Chọn nhà xe | `/booking/partners` | BE-014, BE-015 |
| Thanh toán đặt xe | `/booking/payment` | BE-017, BE-018, BE-023, BE-028, BE-031 |
| Khuân vác | `/booking/labor/*` | BE-021, BE-022 |
| Hoạt động / Lịch sử | tab + `/orders/history` | BE-019, BE-020 |
| Theo dõi đơn | `/orders/:id/tracking` | BE-045–048 |
| Đánh giá | `/orders/:id/review` | BE-054 |
| Tab Thanh toán | tab Thanh toán | BE-029, BE-030 |
| Phương thức TT | `/payments/methods/*` | BE-031 |
| Chi tiết GD | `/payments/:id` | BE-030 |
| Tab Tin nhắn (promo) | tab Tin nhắn | BE-051, BE-052 |
| Chat | `/chat/:id` | BE-049, BE-050 |

---

## Database tham chiếu (đã import Supabase)

| Migration | Bảng chính |
|-----------|------------|
| 01 | `profiles`, `provider_documents` |
| 02 | `orders`, `order_status_history` |
| 03 | `payments`, `refunds`, `wallets`, `promotions` |
| 04 | `provider_locations`, `order_tracking_events` |
| 05 | `conversations`, `messages`, `notifications` |
| 06 | `reviews`, `disputes` |
| 10 | `service_packages`, `platform_settings`, `order_provider_responses`, `referrals` |

Chi tiết từng task nằm trong cột **Note** của CSV.

**Mô hình marketplace (trung gian):** [MARKETPLACE_MODEL.md](./MARKETPLACE_MODEL.md)
