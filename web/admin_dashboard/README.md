# UniMove Admin Dashboard

Admin web dashboard cho nền tảng **UniMove** — marketplace kết nối sinh viên với đơn vị vận chuyển.

## Tech Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4** — theme Royal Blue, dark mode qua `.dark` class
- **Radix UI** primitives (dialog, dropdown, tabs, select, avatar, switch...)
- **Recharts** — biểu đồ doanh thu, đơn hàng
- **lucide-react** — icons
- **Supabase** (`@supabase/ssr`) — auth + database
- **Zustand** — client state (sidebar, toast)

## Cài đặt

### 1. Cấu hình biến môi trường

```bash
cp .env.local.example .env.local
```

Điền vào `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>

# Tuỳ chọn: dùng service role key để bypass RLS cho admin operations
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

Lấy key tại: **Supabase Dashboard → Settings → API**

### 2. Cài dependencies & chạy dev server

```bash
npm install
npm run dev
```

Truy cập: [http://localhost:3000](http://localhost:3000) → tự redirect về `/login`.

## Đăng nhập Admin

Database và auth **đã được cấu hình sẵn** — không cần seed lại.

Điều kiện để đăng nhập được dashboard:
- Tài khoản phải tồn tại trong Supabase Auth (`auth.users`)
- Bản ghi trong `profiles` phải có `role = 'admin'`

Nếu cần tạo admin mới, dùng script sẵn có:
```bash
cd ../../backend
node create-admin.js
```

## Cấu trúc dự án

```
app/
├── (auth)/login/          # Trang đăng nhập
├── (dashboard)/
│   ├── layout.tsx         # Layout chung (Sidebar + Header)
│   ├── dashboard/         # Tổng quan
│   ├── users/             # Quản lý người dùng
│   ├── verifications/     # Duyệt nhà vận chuyển
│   ├── orders/            # Quản lý đơn hàng
│   ├── disputes/          # Khiếu nại & hoàn tiền
│   ├── reviews/           # Kiểm duyệt đánh giá
│   ├── analytics/         # Analytics & báo cáo
│   ├── notifications/     # Gửi thông báo hệ thống
│   ├── activity-logs/     # Nhật ký hoạt động
│   └── settings/          # Cài đặt tài khoản
components/
├── ui/                    # Primitives (Button, Input, Badge, Dialog...)
├── dashboard/             # Sidebar, Header, StatCard, Charts...
└── providers/             # ThemeProvider
lib/
├── supabase/              # client.ts (browser) + server.ts (SSR)
├── queries/               # Fetch functions theo domain
├── stores/                # Zustand stores
├── types.ts               # TypeScript types từ schema thật
└── formatters.ts          # formatVND, formatDateTime...
middleware.ts              # Auth guard — chỉ cho role=admin
```

## Tính năng

| Trang | Mô tả |
|---|---|
| Dashboard | Stat cards (GMV, đơn hàng, users), biểu đồ doanh thu, donut đơn theo status, bảng đơn mới nhất |
| Users | Quản lý customer + provider, search, ban/unban |
| Verifications | Duyệt/từ chối nhà vận chuyển, xem ảnh giấy tờ |
| Orders | Danh sách đơn, filter theo status, xem chi tiết, force cancel |
| Disputes & Refunds | Xử lý khiếu nại, duyệt hoàn tiền |
| Reviews | Ẩn/hiện/báo cáo đánh giá vi phạm |
| Analytics | Revenue chart, top providers, commission breakdown |
| Notifications | Soạn & broadcast thông báo hệ thống |
| Activity Logs | Lịch sử thay đổi status đơn, xác minh, hoàn tiền |
| Settings | Cấu hình tài khoản, giao diện dark/light, platform settings |

## Dark Mode

Toggle dark/light ở header (☀️/🌙). Preference lưu vào `localStorage`. Lần đầu tự động theo `prefers-color-scheme` của hệ thống.
