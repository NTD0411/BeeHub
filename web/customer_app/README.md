# UniMove Customer Web App

Web app dành cho **khách hàng** sử dụng dịch vụ chuyển trọ UniMove.

## Các trang

| Route | Tính năng |
|---|---|
| `/login` | Đăng nhập |
| `/register` | Đăng ký tài khoản |
| `/forgot-password` | Quên mật khẩu (OTP email) |
| `/home` | Trang chủ - Dịch vụ, đơn gần đây |
| `/booking/location` | Chọn địa điểm chuyển trọ |
| `/booking/dorm-details` | Mô tả đồ đạc & gửi yêu cầu báo giá |
| `/orders` | Lịch sử đơn hàng (filter theo trạng thái) |
| `/orders/[id]` | Chi tiết đơn hàng |
| `/marketplace` | Chợ sinh viên - Mua bán đồ cũ |
| `/marketplace/new` | Đăng tin bán đồ |
| `/marketplace/[id]` | Chi tiết tin đăng |
| `/marketplace/[id]/chat` | Chat với người bán |
| `/payments` | Lịch sử thanh toán |
| `/notifications` | Thông báo hệ thống |
| `/profile` | Hồ sơ cá nhân |
| `/profile/edit` | Chỉnh sửa thông tin |
| `/profile/change-password` | Đổi mật khẩu |
| `/reference-prices` | Bảng phụ phí tham khảo |

## Cài đặt & Chạy

```bash
cd web/customer_app

# Copy biến môi trường
copy .env.example .env.local

# Cài dependencies
npm install

# Chạy development
npm run dev
# → http://localhost:3001
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
- JWT authentication (localStorage + cookie)
