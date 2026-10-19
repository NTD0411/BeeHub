# 🚚 UniMove - Platform Vận Chuyển Sinh Viên

> Nền tảng kết nối sinh viên cần vận chuyển đồ với nhà cung cấp dịch vụ vận chuyển

---

## 📋 Tổng Quan Dự Án

**UniMove** là một nền tảng marketplace kết nối:
- 🎓 **Khách hàng (Sinh viên)**: Cần vận chuyển đồ (chuyển nhà, mua bán đồ cũ...)
- 🚗 **Nhà cung cấp (Provider)**: Có phương tiện vận chuyển (xe tải, xe bán tải...)
- 👨‍💼 **Admin**: Quản lý hệ thống, duyệt nhà cung cấp, giải quyết khiếu nại

---

## 🏗️ Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────────────┐
│                    UNIMOVE PLATFORM                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Customer   │  │   Provider   │  │    Admin     │  │
│  │   Web App    │  │   Web App    │  │  Dashboard   │  │
│  │  (Next.js)   │  │  (Next.js)   │  │  (Next.js)   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                 │            │
│         └─────────────────┴─────────────────┘            │
│                           │                               │
│                  ┌────────▼────────┐                     │
│                  │   REST API      │                     │
│                  │   (Node.js)     │                     │
│                  │   + Express     │                     │
│                  └────────┬────────┘                     │
│                           │                               │
│                  ┌────────▼────────┐                     │
│                  │   Supabase      │                     │
│                  │   PostgreSQL    │                     │
│                  └─────────────────┘                     │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Cấu Trúc Thư Mục

```
wdp301-rbl-project-wdp_se18d08_group-4/
│
├── backend/                    # Node.js Backend API
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   ├── services/          # Business logic
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Auth, validation, error handling
│   │   ├── utils/             # JWT, password helpers
│   │   └── config/            # Environment config
│   ├── supabase/
│   │   └── migrations/        # Database migrations
│   ├── package.json
│   └── .env                   # Backend config
│
├── web/
│   ├── admin_dashboard/       # Admin Dashboard (Next.js)
│   │   ├── app/
│   │   │   ├── (auth)/       # Login page
│   │   │   └── (dashboard)/  # Protected admin pages
│   │   ├── components/        # UI components
│   │   ├── lib/
│   │   │   ├── queries/      # API calls
│   │   │   ├── api.ts        # API client
│   │   │   └── types.ts      # TypeScript types
│   │   ├── package.json
│   │   └── .env.local         # Frontend config
│   │
│   ├── customer_app/          # Customer App (Next.js) [TODO]
│   └── provider_app/          # Provider App (Next.js) [TODO]
│
├── IMPLEMENTATION_SUMMARY.md   # ✅ Tổng kết triển khai
├── TESTING_GUIDE.md            # 🧪 Hướng dẫn test
└── README.md                   # 📖 File này
```

---

## 🚀 Quick Start

### 1. Setup Database (Supabase)

```bash
# 1. Create Supabase project tại https://supabase.com
# 2. Copy connection info

# 3. Run migrations
cd backend/supabase/migrations
# Run từng file migration theo thứ tự trong Supabase SQL Editor
```

### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Điền các biến:
# - SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY
# - JWT_SECRET
# - PORT=3001

# Create admin account
node create-admin.js
# Email: admin@unimove.com
# Password: Admin@123

# Start backend
npm run dev
# Backend running at http://localhost:3001
```

### 3. Setup Admin Dashboard

```bash
cd web/admin_dashboard

# Install dependencies
npm install

# Create .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Start dashboard
npm run dev
# Dashboard running at http://localhost:3000
```

### 4. Test

```
http://localhost:3000/login

Email: admin@unimove.com
Password: Admin@123
```

---

## 🔑 Tech Stack

### Backend
- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **Database**: PostgreSQL (Supabase)
- **Authentication**: JWT
- **Password Hashing**: bcrypt
- **Validation**: express-validator
- **File Upload**: multer + Cloudinary

### Frontend (Admin Dashboard)
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: TailwindCSS 4
- **Components**: Radix UI + shadcn/ui
- **Charts**: Recharts
- **State Management**: Zustand
- **HTTP Client**: Fetch API

### Database Schema
- **Users**: profiles, customer_profiles, provider_profiles
- **Orders**: orders, order_status_history, order_items
- **Payments**: payments, refunds, provider_earnings
- **Disputes**: disputes, dispute_messages
- **Reviews**: reviews, review_votes
- **Notifications**: notifications, announcements
- **Platform**: platform_settings

---

## 📊 Database ERD

```
┌─────────────┐
│  profiles   │◄──────────┐
│  (users)    │           │
└──────┬──────┘           │
       │                  │
       ├──────┬───────┐   │
       │      │       │   │
┌──────▼──┐ ┌▼──────┐│   │
│customer │ │provider││   │
│_profiles│ │_profiles   │
└─────────┘ └┬───────┘│   │
             │        │   │
        ┌────▼────┐   │   │
        │provider │   │   │
        │documents│   │   │
        └─────────┘   │   │
                      │   │
┌─────────────────────▼───┴───┐
│         orders              │
└──────┬──────────┬───────────┘
       │          │
┌──────▼──┐  ┌───▼─────┐
│payments │  │disputes │
└─────────┘  └─────────┘
```

---

## 🔐 Authentication Flow

```
┌────────┐                    ┌─────────┐                  ┌──────────┐
│ Client │                    │ Backend │                  │ Database │
└───┬────┘                    └────┬────┘                  └────┬─────┘
    │                              │                            │
    │  POST /api/admin/auth/login  │                            │
    │ {email, password}            │                            │
    ├─────────────────────────────>│                            │
    │                              │                            │
    │                              │  SELECT * FROM profiles    │
    │                              │  JOIN user_credentials     │
    │                              ├───────────────────────────>│
    │                              │                            │
    │                              │  User + Password Hash      │
    │                              │<───────────────────────────┤
    │                              │                            │
    │                              │  bcrypt.compare()          │
    │                              │  ✅ Valid                  │
    │                              │                            │
    │                              │  jwt.sign({userId, role})  │
    │                              │  ✅ Token                  │
    │                              │                            │
    │  200 {user, token}           │                            │
    │<─────────────────────────────┤                            │
    │                              │                            │
    │  Store token in localStorage │                            │
    │                              │                            │
    │  GET /api/admin/dashboard    │                            │
    │  Authorization: Bearer <token>                            │
    ├─────────────────────────────>│                            │
    │                              │                            │
    │                              │  jwt.verify(token)         │
    │                              │  ✅ Valid + role=admin     │
    │                              │                            │
    │                              │  Query dashboard data      │
    │                              ├───────────────────────────>│
    │                              │<───────────────────────────┤
    │                              │                            │
    │  200 {dashboard stats}       │                            │
    │<─────────────────────────────┤                            │
    │                              │                            │
```

---

## 📱 Features

### 🎓 Customer Features (TODO)
- [ ] Đăng ký/Đăng nhập
- [ ] Tạo đơn vận chuyển
- [ ] Xem báo giá từ providers
- [ ] Chọn provider
- [ ] Thanh toán online
- [ ] Tracking real-time
- [ ] Chat với provider
- [ ] Đánh giá sau hoàn thành

### 🚗 Provider Features (TODO)
- [ ] Đăng ký/Xác minh tài khoản
- [ ] Xem đơn hàng mới
- [ ] Chấp nhận/Từ chối đơn
- [ ] Cập nhật trạng thái đơn
- [ ] Chat với customer
- [ ] Quản lý thu nhập
- [ ] Rút tiền

### 👨‍💼 Admin Features ✅
- [x] Đăng nhập admin
- [x] Dashboard KPIs
- [x] Quản lý users (customers & providers)
- [x] Duyệt hồ sơ providers
- [x] Quản lý đơn hàng
- [x] Giải quyết khiếu nại
- [x] Duyệt hoàn tiền
- [x] Kiểm duyệt reviews
- [x] Xem analytics & reports
- [x] Quản lý thông báo
- [x] Xem activity logs
- [x] Cấu hình hệ thống

---

## 🔗 API Endpoints

### Authentication
```
POST   /api/admin/auth/login          # Admin login
GET    /api/admin/auth/profile        # Get admin profile
```

### Dashboard
```
GET    /api/admin/dashboard                          # Dashboard stats
GET    /api/admin/dashboard/latest-orders            # Latest orders
GET    /api/admin/dashboard/order-status-distribution # Order distribution
```

### Users Management
```
GET    /api/admin/users                 # List users
PATCH  /api/admin/users/:id/status      # Ban/unban user
```

### Provider Management
```
GET    /api/admin/providers/pending             # Pending verifications
GET    /api/admin/providers/:id/documents       # Provider documents
PUT    /api/admin/providers/:id/verify          # Approve/reject
```

### Orders Management
```
GET    /api/admin/orders              # List orders
GET    /api/admin/orders/:id          # Order details
PUT    /api/admin/orders/:id/cancel   # Force cancel
```

### Disputes Management
```
GET    /api/admin/disputes              # List disputes
GET    /api/admin/disputes/:id          # Dispute details
PUT    /api/admin/disputes/:id/resolve  # Resolve dispute
```

### Reviews Management
```
GET    /api/admin/reviews              # List reviews
PUT    /api/admin/reviews/:id/hide     # Hide review
PUT    /api/admin/reviews/:id/unhide   # Unhide review
PUT    /api/admin/reviews/:id/flag     # Flag review
```

### Refunds Management
```
GET    /api/admin/refunds              # List refunds
PUT    /api/admin/refunds/:id/approve  # Approve refund
```

### Analytics
```
GET    /api/admin/analytics/gmv          # GMV stats
GET    /api/admin/analytics/orders       # Order statistics
GET    /api/admin/analytics/providers    # Top providers
GET    /api/admin/analytics/commission   # Commission by month
GET    /api/admin/analytics/revenue      # Revenue by month
```

### Announcements
```
GET    /api/admin/announcements            # List announcements
POST   /api/admin/announcements            # Create announcement
PUT    /api/admin/announcements/:id/publish # Publish
```

### Activity Logs
```
GET    /api/admin/activity/orders          # Order history
GET    /api/admin/activity/verifications   # Verification history
GET    /api/admin/activity/refunds         # Refund history
```

### Settings
```
GET    /api/admin/settings    # Get platform settings
PUT    /api/admin/settings    # Update settings
```

### Withdrawals
```
GET    /api/admin/withdrawals              # List withdrawals
PUT    /api/admin/withdrawals/:id/approve  # Approve withdrawal
PUT    /api/admin/withdrawals/:id/reject   # Reject withdrawal
```

**📝 Total: 40+ API endpoints triển khai đầy đủ**

---

## 🧪 Testing

Xem chi tiết trong [TESTING_GUIDE.md](./TESTING_GUIDE.md)

```bash
# 1. Start backend
cd backend && npm run dev

# 2. Start admin dashboard
cd web/admin_dashboard && npm run dev

# 3. Login
http://localhost:3000/login
Email: admin@unimove.com
Password: Admin@123
```

---

## 📚 Documentation

- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Tổng kết triển khai API
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Hướng dẫn test chi tiết
- **[HANDOFF.md](./web/admin_dashboard/HANDOFF.md)** - Tài liệu bàn giao UI

---

## 🔒 Security

- ✅ JWT Authentication với 7 days expiry
- ✅ Password hashing với bcrypt (10 rounds)
- ✅ Role-based access control (RBAC)
- ✅ Protected routes với middleware
- ✅ Input validation
- ✅ SQL injection prevention (Supabase)
- ✅ XSS prevention (React auto-escaping)
- ✅ CORS configuration

---

## 🐛 Known Issues & TODOs

### Backend
- [ ] Add rate limiting
- [ ] Add email service (nodemailer)
- [ ] Add SMS service (Twilio)
- [ ] Add push notifications
- [ ] Add file upload validation
- [ ] Add API documentation (Swagger)

### Frontend
- [ ] Add loading skeletons
- [ ] Add error boundaries
- [ ] Add offline support
- [ ] Add PWA features
- [ ] Add dark mode persistence
- [ ] Add keyboard shortcuts

### Features
- [ ] Customer app implementation
- [ ] Provider app implementation
- [ ] Real-time tracking (WebSocket)
- [ ] Payment gateway integration (PayOS)
- [ ] Map integration (Google Maps)
- [ ] Export to Excel/PDF
- [ ] Bulk operations

---

## 👥 Team

**WDP_SE18D08_Group-4**

- Developer 1: Backend API
- Developer 2: Admin Dashboard
- Developer 3: Customer App
- Developer 4: Provider App

---

## 📄 License

MIT License - UniMove Project 2024

---

## 🙏 Acknowledgments

- Supabase for database hosting
- Vercel for deployment
- shadcn/ui for UI components
- Radix UI for accessible components

---

## 📞 Support

Nếu gặp vấn đề, tạo issue tại GitHub repository hoặc liên hệ team.

**Happy Coding! 🚀**