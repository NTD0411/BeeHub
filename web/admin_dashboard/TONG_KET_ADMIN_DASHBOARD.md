# Tổng kết Admin Dashboard — UniMove

> Tài liệu tổng hợp những gì đã triển khai cho trang quản trị web (`web/admin_dashboard`).

---

## 1. Tổng quan

Admin Dashboard là giao diện quản trị nền tảng UniMove, xây dựng bằng **Next.js** (App Router), kết nối **Backend Node.js/Express** qua REST API, dữ liệu lưu trên **Supabase (PostgreSQL)**.

| Thành phần | Công nghệ |
|---|---|
| Frontend | Next.js, TypeScript, Tailwind CSS, Radix UI |
| Backend | Node.js, Express, JWT |
| Database | Supabase PostgreSQL |
| Auth | JWT (`admin_token` cookie + localStorage) |

---

## 2. Cách chạy

### Backend (port 5000)

```bash
cd backend
npm install
npm run dev
```

File `backend/.env` cần có `PORT=5000` và biến Supabase.

### Frontend (port 3000)

```bash
cd web/admin_dashboard
npm install
npm run dev
```

File `web/admin_dashboard/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Tài khoản admin

```
Email:    admin@unimove.com
Password: Admin123!@#
```

Tạo admin (nếu chưa có): `node backend/scripts/create-admin-jwt.js`

### Seed dữ liệu demo

```bash
cd backend
npm run seed:admin
```

Dữ liệu demo gồm: 5 khách hàng, 6 nhà vận chuyển, ~23 đơn hàng, thanh toán, đánh giá, khiếu nại, hoàn tiền, thông báo. Email demo: `*@unimove.demo`.

---

## 3. Các trang đã triển khai

| Trang | Route | Chức năng chính |
|---|---|---|
| Đăng nhập | `/login` | Xác thực admin, lưu JWT |
| Tổng quan | `/dashboard` | KPI, biểu đồ doanh thu, phân bổ trạng thái đơn, bảng đơn mới nhất |
| Người dùng | `/users` | Tab Khách hàng / Nhà vận chuyển, tìm kiếm, lọc, khóa/mở tài khoản |
| Xác minh | `/verifications` | Duyệt/từ chối nhà vận chuyển, xem giấy tờ |
| Đơn hàng | `/orders` | Danh sách, lọc trạng thái, tìm kiếm, hủy đơn (admin) |
| Chi tiết đơn | `/orders/[id]` | Thông tin đơn, lịch sử trạng thái, thanh toán |
| Khiếu nại & Hoàn tiền | `/disputes` | Tab khiếu nại và hoàn tiền, xử lý tranh chấp |
| Đánh giá | `/reviews` | Kiểm duyệt: ẩn, bỏ ẩn, báo cáo |
| Thống kê | `/analytics` | GMV, thống kê đơn, top nhà vận chuyển, biểu đồ |
| Thông báo | `/notifications` | Tạo và quản lý thông báo hệ thống |
| Nhật ký hoạt động | `/activity-logs` | Lịch sử đơn hàng, xác minh, hoàn tiền |
| Cài đặt | `/settings` | Hồ sơ admin, giao diện, cấu hình nền tảng |

---

## 4. Kiến trúc Frontend

```
web/admin_dashboard/
├── app/
│   ├── (auth)/login/           # Trang đăng nhập
│   └── (dashboard)/            # Các trang sau khi đăng nhập
├── components/
│   ├── ui/                     # Button, Input, Dialog, Table...
│   └── dashboard/              # Sidebar, Header, Pagination, Charts...
├── lib/
│   ├── api.ts                  # Client-side API (browser)
│   ├── server-api.ts           # Server-side API (Server Actions, đọc cookie)
│   ├── normalize-meta.ts       # Chuẩn hóa meta phân trang (pages → totalPages)
│   ├── queries/                # Server Actions gọi backend API
│   ├── types.ts                # TypeScript types
│   └── formatters.ts           # formatVND, formatDateTime...
└── proxy.ts                    # Auth guard (Next.js middleware)
```

**Luồng dữ liệu:**

- **Server Components / Server Actions**: `lib/queries/*.ts` → `lib/server-api.ts` → Backend API
- **Client Components** (một số trang): `lib/api.ts` → Backend API (đọc token từ localStorage)

---

## 5. Backend API Admin

Tất cả endpoint nằm dưới prefix `/api/admin`, yêu cầu header `Authorization: Bearer <token>`.

Các nhóm API chính:

| Nhóm | Endpoint ví dụ |
|---|---|
| Dashboard | `GET /admin/dashboard`, `/dashboard/latest-orders`, `/dashboard/order-status-distribution` |
| Người dùng | `GET /admin/users`, `PATCH /admin/users/:id/status` |
| Xác minh | `GET /admin/providers/pending`, `PUT /admin/providers/:id/verify` |
| Đơn hàng | `GET /admin/orders`, `GET /admin/orders/:id`, `PUT /admin/orders/:id/cancel` |
| Khiếu nại | `GET /admin/disputes`, `PUT /admin/disputes/:id/resolve` |
| Đánh giá | `GET /admin/reviews`, `PUT /admin/reviews/:id/hide` |
| Thống kê | `GET /admin/analytics/gmv`, `/analytics/orders`, `/analytics/top-providers` |
| Thông báo | `GET /admin/announcements`, `POST /admin/announcements` |
| Nhật ký | `GET /admin/activity/orders`, `/activity/verifications`, `/activity/refunds` |

Controller: `backend/src/controllers/admin.controller.js`  
Routes: `backend/src/routes/admin.routes.js`

---

## 6. Tính năng UI đã hoàn thiện

### Giao diện chung

- Sidebar điều hướng với submenu Người dùng (Khách hàng / Nhà vận chuyển)
- Header: tìm kiếm toàn cục, thông báo, dark mode, profile admin
- Responsive, hỗ trợ dark/light mode
- Empty state, skeleton loading, badge trạng thái tiếng Việt

### Phân trang & cột STT

Các bảng dữ liệu đều có **phân trang 10 mục/trang** và **cột số thứ tự (STT)** liên tục qua các trang:

| Trang | File |
|---|---|
| Tổng quan — Đơn mới nhất | `app/(dashboard)/dashboard/orders-table-client.tsx` |
| Người dùng | `app/(dashboard)/users/page.tsx` |
| Đơn hàng | `app/(dashboard)/orders/orders-client.tsx` |
| Đánh giá | `app/(dashboard)/reviews/page.tsx` |
| Nhật ký hoạt động | `app/(dashboard)/activity-logs/page-client.tsx` |

STT được tính: `(trang - 1) × pageSize + vị trí trong trang`.

Meta phân trang backend trả `pages`, frontend chuẩn hóa qua `lib/normalize-meta.ts` thành `totalPages`.

---

## 7. Các vấn đề đã xử lý

| Vấn đề | Giải pháp |
|---|---|
| Login 404 / API không kết nối | Cấu hình `NEXT_PUBLIC_API_URL=http://localhost:5000/api`, backend `PORT=5000` |
| Backend thiếu module `ws` | `npm install ws` trong `backend/` |
| Users API trả lỗi 500 (PGRST201) | Chỉ định FK rõ ràng: `customer_profiles!customer_profiles_id_fkey`, `provider_profiles!provider_profiles_id_fkey` |
| Tab Nhà vận chuyển không chuyển | Đồng bộ `?tab=` với URL qua `useSearchParams` + `router.push` |
| Header search bar bị mất | Đổi `fixed` → `sticky`, chỉnh layout dashboard |
| Khách hàng/NVC không có data | Sửa API users + chạy `npm run seed:admin` |
| Đơn mới nhất không phân trang | Backend trả meta `{ page, pageSize, total, pages }`, mặc định 10/trang |

---

## 8. File quan trọng

| File | Mục đích |
|---|---|
| `backend/.env` | Cấu hình port, Supabase |
| `backend/seed-admin-data.js` | Script seed dữ liệu demo |
| `backend/src/controllers/admin.controller.js` | Logic API admin |
| `web/admin_dashboard/.env.local` | URL backend cho frontend |
| `web/admin_dashboard/lib/server-api.ts` | Gọi API phía server (Server Actions) |
| `web/admin_dashboard/lib/normalize-meta.ts` | Chuẩn hóa phân trang |
| `web/admin_dashboard/proxy.ts` | Bảo vệ route, redirect login |
| `web/admin_dashboard/HANDOFF.md` | Tài liệu chi tiết mapping UI ↔ API ↔ DB |

---

## 9. Helper & định dạng

```ts
// lib/formatters.ts
formatVND(450000)           // → "450.000đ"
formatOrderNumber("UNI-...") // → "#UNI-..."
formatDateTime(date)        // → "12:00 07/05/2026"
formatDate(date)            // → "07/05/2026"
formatRating(4.5)           // → "4.5"
```

Badge trạng thái đơn hàng: `components/dashboard/status-badge.tsx` — map enum DB sang nhãn tiếng Việt và màu sắc.

---

## 10. Ghi chú phát triển tiếp

1. Endpoint `GET /admin/notifications` (header bell) hiện trả 404 — cần triển khai hoặc trỏ sang `/admin/announcements`.
2. Một số đơn hàng demo chưa gán nhà vận chuyển → cột NVC hiển thị "Chưa có" / "Chưa ghép".
3. Sau khi sửa `admin.controller.js`, cần **restart backend** (`npm run dev`) để áp dụng thay đổi.
4. Không commit file `.env`, `.env.local` — chỉ dùng `.env.example` làm mẫu.

---

*Tài liệu cập nhật: tháng 6/2026*
