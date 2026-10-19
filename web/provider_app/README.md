# UniMove Provider Web App

Web app dành cho **nhà vận chuyển** (provider) của nền tảng UniMove.

## Các trang

| Route | Tính năng |
|---|---|
| `/login` | Đăng nhập nhà vận chuyển |
| `/register` | Đăng ký đối tác |
| `/forgot-password` | Quên mật khẩu |
| `/dashboard` | Tổng quan - Toggle online/offline, đơn mới, KPI |
| `/orders` | Danh sách đơn hàng (filter trạng thái) |
| `/orders/[id]` | Chi tiết đơn + Báo giá + Chấp nhận/Từ chối |
| `/earnings` | Thu nhập & lịch sử giao dịch |
| `/messages` | Thông báo hệ thống |
| `/documents` | Upload giấy tờ xác minh (CCCD, bằng lái, đăng ký xe) |
| `/profile` | Hồ sơ nhà vận chuyển |
| `/profile/edit` | Chỉnh sửa thông tin |
| `/profile/change-password` | Đổi mật khẩu |

## Cài đặt & Chạy

```bash
cd web/provider_app

# Copy biến môi trường
copy .env.example .env.local

# Cài dependencies
npm install

# Chạy development
npm run dev
# → http://localhost:3002
```

## Biến môi trường

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Tech Stack

- **Next.js 16** (App Router)
- **React 19** + TypeScript
- **Tailwind CSS v4**
- **Radix UI** components
- **lucide-react** icons
- JWT authentication
