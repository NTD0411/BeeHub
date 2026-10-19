# UniMove - Nền Tảng Marketplace Dịch Vụ Chuyển Trọ Sinh Viên

## 📋 Tổng Quan Dự Án

UniMove là nền tảng marketplace kết nối sinh viên cần chuyển trọ với các đơn vị vận chuyển uy tín. Nền tảng cung cấp giá cả minh bạch, theo dõi thời gian thực và gợi ý gộp đơn thông minh nhằm giảm chi phí chuyển trọ lên đến 40%.

**Mục tiêu:** Xây dựng hệ sinh thái hỗ trợ sinh viên tìm kiếm dịch vụ chuyển trọ nhanh chóng, an toàn, minh bạch và tối ưu chi phí.

## 🏗️ Cấu Trúc Dự Án

### 📁 Tổng Quan Thư Mục

```
unimove/
├── backend/                    # Supabase Backend Configuration
├── mobile/                     # Flutter Mobile Applications
├── web/                       # Flutter Web Admin Dashboard
├── shared/                    # Shared Resources & Components
├── docs/                      # Project Documentation
├── scripts/                   # Build & Deploy Scripts
└── .github/                   # CI/CD Workflows
```

### 🎯 Phân Chia Theo Team

**Backend Team**
- Quản lý: `backend/` directory
- Trách nhiệm: Supabase configuration, Edge Functions, Database schema
- Branch pattern: `backend/feature-name`

**Mobile Team**
- Quản lý: `mobile/` directory  
- Trách nhiệm: Customer App, Provider App, Mobile-specific features
- Branch pattern: `mobile/feature-name`

**Web Team**
- Quản lý: `web/` directory
- Trách nhiệm: Admin Dashboard, Web-specific responsive design
- Branch pattern: `web/feature-name`

**DevOps Team**
- Quản lý: `scripts/`, `.github/` directories
- Trách nhiệm: CI/CD pipeline, Deployment automation
- Branch pattern: `devops/feature-name`

## 🛠️ Technology Stack

### Frontend
- **Flutter**: Cross-platform development cho mobile và web
- **Material Design 3**: Modern UI framework
- **Riverpod**: State management solution
- **Google Maps**: Location tracking và navigation

### Backend & Database
- **Supabase**: Backend-as-a-Service platform
- **PostgreSQL**: Primary database
- **Edge Functions**: Custom business logic
- **Row Level Security**: Advanced data protection

### External Services
- **PayOS**: Payment processing
- **Firebase Cloud Messaging**: Push notifications
- **Google Maps API**: Location services

## 🎨 Kiến Trúc Hệ Thống

### Kiến Trúc Tổng Thể
- **Flutter Layer**: Customer App, Provider App, Admin Dashboard
- **Supabase Layer**: Database, Authentication, Real-time, Storage
- **External Services**: PayOS, Google Maps, FCM

### Design Patterns
- Clean Architecture
- Repository Pattern
- MVVM-inspired structure
- Feature-first folder organization

## ⭐ Tính Năng Chính

### Customer Features
- **Booking System**: Tạo đơn chuyển trọ, chọn provider, thanh toán
- **Real-time Tracking**: Theo dõi vị trí provider trên Google Maps
- **Chat System**: Liên lạc trực tiếp với provider
- **Payment Integration**: Thanh toán an toàn qua PayOS
- **Review System**: Đánh giá và feedback

### Provider Features
- **Order Management**: Nhận đơn, cập nhật trạng thái
- **Location Tracking**: Chia sẻ vị trí real-time
- **Earnings Dashboard**: Theo dõi doanh thu
- **Document Verification**: Upload và xác thực giấy tờ

### Admin Features
- **User Management**: Quản lý customer và provider
- **Analytics Dashboard**: Báo cáo doanh thu và thống kê
- **Provider Verification**: Duyệt hồ sơ nhà cung cấp
- **Dispute Management**: Xử lý khiếu nại

## 🚀 Tính Năng Real-time

- **Order Tracking**: Cập nhật trạng thái đơn hàng tức thời
- **Location Updates**: Theo dõi vị trí provider real-time
- **Live Chat**: Tin nhắn tức thời giữa customer và provider
- **Push Notifications**: Thông báo quan trọng

## 📱 Ứng Dụng

### Customer App (Mobile)
- Dành cho sinh viên cần dịch vụ chuyển trọ
- Tìm kiếm, đặt dịch vụ, theo dõi đơn hàng
- Thanh toán và đánh giá

### Provider App (Mobile)  
- Dành cho đội ngũ vận chuyển
- Nhận đơn, quản lý lịch trình
- Cập nhật trạng thái và vị trí

### Admin Dashboard (Web)
- Quản trị hệ thống
- Phân tích dữ liệu và báo cáo
- Xử lý tranh chấp

## 🔒 Bảo Mật

- **Row Level Security (RLS)**: Bảo vệ dữ liệu cấp độ hàng
- **JWT Authentication**: Xác thực an toàn
- **API Security**: Rate limiting và validation
- **Data Encryption**: Mã hóa dữ liệu nhạy cảm

## 📈 Khả Năng Mở Rộng

- **Horizontal Scaling**: Tự động scale theo nhu cầu
- **Microservices Ready**: Kiến trúc modular
- **Cloud Native**: Tối ưu cho cloud deployment
- **Performance Optimization**: Caching và CDN

## 🎯 MVP Scope

### Phase 1 - Core Features
- Authentication system
- Basic booking flow
- Real-time tracking
- Payment integration
- Admin dashboard

### Phase 2 - Advanced Features  
- Chat system
- Review và rating
- Analytics dashboard
- Mobile app optimization

### Phase 3 - Scale Features
- AI-powered matching
- Advanced analytics
- Multi-language support
- Enterprise features

## 👥 Team Structure

**Recommended Team Size**: 4-6 developers

**Role Distribution**:
- **Backend Developer** (1-2): Supabase, Edge Functions, API integration
- **Mobile Developer** (2-3): Flutter apps, mobile-specific features  
- **Web Developer** (1): Admin dashboard, responsive design
- **DevOps/QA** (1): CI/CD, testing, deployment

## 📚 Documentation

Tham khảo các tài liệu chi tiết trong thư mục `docs/`:
- Architecture documentation
- API specifications  
- Development guides
- Deployment instructions

## 🚀 Getting Started

1. **Setup Environment**: Xem `docs/flutter-setup.md` và `docs/nodejs-api.md`
2. **Team Workflow**: Đọc `team-workflow.md`
3. **Development**: Follow coding standards trong `docs/`

## 📞 Support

- **Documentation**: Xem thư mục `docs/`
- **Issues**: Tạo GitHub issue
- **Team Communication**: Slack channels
- **Code Review**: GitHub Pull Requests

---

**UniMove** - UniMove - Making student moving easier with technology 🚚📱
