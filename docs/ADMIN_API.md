# UniMove Admin API Documentation

## Tổng quan

API Admin cho phép quản trị viên đăng nhập và truy cập các chức năng quản lý hệ thống UniMove.

## Authentication & Authorization

### Quy tắc phân quyền:
- **Admin**: Truy cập tất cả `/api/admin/*` endpoints
- **Customer/Provider**: Gọi `/api/admin/*` sẽ trả về `403 Forbidden`
- **Unauthenticated**: Gọi `/api/admin/*` (trừ login) sẽ trả về `401 Unauthorized`

## Endpoints

### 1. Admin Login

**POST** `/api/admin/auth/login`

Đăng nhập admin và nhận access token.

#### Request Body:
```json
{
  "email": "admin@unimove.com",
  "password": "Admin123!@#"
}
```

#### Response Success (200):
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@unimove.com",
      "full_name": "UniMove Admin",
      "role": "admin",
      "avatar_url": null,
      "created_at": "2024-01-01T00:00:00Z"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "refresh_token_here",
    "expires_at": 1640995200
  }
}
```

#### Response Error (401):
```json
{
  "success": false,
  "message": "Email hoặc mật khẩu không đúng"
}
```

#### Response Error (403):
```json
{
  "success": false,
  "message": "Bạn không có quyền truy cập admin"
}
```

---

### 2. Get Admin Profile

**GET** `/api/admin/auth/profile`

Lấy thông tin profile admin hiện tại.

#### Headers:
```
Authorization: Bearer <access_token>
```

#### Response Success (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@unimove.com",
    "full_name": "UniMove Admin",
    "role": "admin",
    "avatar_url": null,
    "phone": null,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### 3. Dashboard Statistics

**GET** `/api/admin/dashboard/stats`

Lấy thống kê tổng quan cho admin dashboard.

#### Headers:
```
Authorization: Bearer <access_token>
```

#### Response Success (200):
```json
{
  "success": true,
  "data": {
    "today": {
      "orders": 15,
      "completed_orders": 12,
      "revenue": 2500000,
      "completion_rate": 80.00
    },
    "month": {
      "orders": 450,
      "completed_orders": 380,
      "revenue": 75000000,
      "completion_rate": 84.44
    },
    "users": {
      "total_customers": 1250,
      "total_providers": 85,
      "active_providers": 45
    },
    "pending_tasks": {
      "disputes": 3,
      "verifications": 7
    }
  }
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Thiếu access token"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Không có quyền truy cập"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Không tìm thấy thông tin người dùng"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Lỗi server khi đăng nhập"
}
```

---

## Setup & Testing

### 1. Tạo Admin User

```bash
cd backend
npm run create-admin
```

Tạo admin user với:
- **Email**: `admin@unimove.com`
- **Password**: `Admin123!@#`
- **Role**: `admin`

### 2. Test API

```bash
# Start server
npm run dev

# Test admin auth (terminal khác)
npm run test:admin
```

### 3. Manual Testing với cURL

```bash
# Login
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@unimove.com","password":"Admin123!@#"}'

# Get profile (thay <token>)
curl -X GET http://localhost:3000/api/admin/auth/profile \
  -H "Authorization: Bearer <token>"

# Dashboard stats
curl -X GET http://localhost:3000/api/admin/dashboard/stats \
  -H "Authorization: Bearer <token>"
```

---

## Security Features

### ✅ Implemented:
- JWT token authentication
- Role-based access control (RBAC)
- Admin role verification
- User status check (active/inactive)
- Secure password hashing (Supabase Auth)
- Input validation

### 🔒 Security Notes:
- Admin routes chỉ accessible với `role = 'admin'`
- Customer/Provider gọi admin routes → `403 Forbidden`
- Token expired/invalid → `401 Unauthorized`
- User inactive → `403 Forbidden`

---

## Database Schema

### Admin User trong `profiles`:
```sql
INSERT INTO profiles (id, email, full_name, role, status) VALUES
('uuid', 'admin@unimove.com', 'UniMove Admin', 'admin', 'active');
```

### Required Tables:
- `profiles` (user info + role)
- `orders` (for statistics)
- `payments` (for revenue stats)
- `disputes` (for pending tasks)

---

## Next Steps

Sau khi API admin hoạt động:

1. **Flutter Web Admin Dashboard**
   - Login screen
   - Dashboard với stats
   - User management
   - Order monitoring

2. **Additional Admin APIs**
   - User management (CRUD)
   - Provider verification
   - Dispute resolution
   - System settings

3. **Advanced Features**
   - Admin activity logs
   - Role permissions
   - Multi-admin support
   - Admin notifications

---

*UniMove Admin API — WDP301 Group 4*