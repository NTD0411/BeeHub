# 🚀 QUICK START - UNIMOVE ADMIN DASHBOARD

## Chạy ứng dụng trong 3 bước

### Bước 1: Start Backend
```bash
cd backend
npm run dev
```
✅ Backend chạy tại: http://localhost:3000

### Bước 2: Start Frontend (Terminal mới)
```bash
cd web/admin_dashboard
npm run dev -- --port 3002
```
✅ Frontend chạy tại: http://localhost:3002

### Bước 3: Đăng nhập
1. Mở: http://localhost:3002/login
2. Email: `admin@unimove.com`
3. Password: `Admin123!@#`
4. Click "Đăng nhập"

---

## 📱 Các trang có sẵn

- `/dashboard` - Tổng quan
- `/users` - Quản lý người dùng
- `/verifications` - Xác minh nhà vận chuyển
- `/orders` - Quản lý đơn hàng
- `/disputes` - Khiếu nại & hoàn tiền
- `/reviews` - Quản lý đánh giá
- `/analytics` - Thống kê & báo cáo
- `/notifications` - Thông báo
- `/activity-logs` - Nhật ký hoạt động
- `/settings` - Cài đặt

---

## 🐛 Nếu gặp lỗi

### Port đã sử dụng (EADDRINUSE)
```bash
# Xem process nào đang dùng port
netstat -ano | findstr :3000
netstat -ano | findstr :3002

# Kill process (thay <PID>)
taskkill /F /PID <PID>
```

### Login không hoạt động
1. Check backend đang chạy
2. Clear browser cache & cookies
3. Thử lại login

### Dashboard trống
1. Mở F12 Console
2. Check API errors
3. Verify token: `localStorage.getItem('admin_token')`

---

📚 **Chi tiết đầy đủ**: Xem `COMPLETION_SUMMARY.md`
