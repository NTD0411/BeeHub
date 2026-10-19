# UniMove Documentation

## 📁 Cấu trúc documentation

```
docs/
├── MARKETPLACE_MODEL.md            # Combo chuyển trọ, bảo hiểm đồ đạc
├── AUTH_PROFILE_WHERE_TO_CODE.md   # Code auth/profile ở đâu (team BE)
├── AUTH_NODE_MODULE.md             # Scaffold auth Node JWT
├── AUTH_SCAFFOLD_LEADER.md         # Phạm vi leader vs team implement
├── ADMIN_API.md                    # API Admin (/api/admin/*)
├── ADMIN_DASHBOARD_API.md          # Contract dashboard admin
├── BE_TASK_DIVISION.csv              # Chia việc backend + Use Case ID
├── BE_TASK_DIVISION.md               # Hướng dẫn đọc CSV
├── database-schema.md              # Tổng quan & chi tiết database (CHÍNH)
├── database-enums-and-functions.md # ENUM, Views, Functions chi tiết
├── HUONG_DAN_CHAY_CUSTOMER_APP.md  # Hướng dẫn chạy customer app (người mới)
├── flutter-setup.md                # Flutter setup tóm tắt
├── nodejs-api.md                   # Node.js Express API (auth/profile)
├── CUSTOMER_APP_API.md             # Toàn bộ API customer app + Pass đồ
├── CUSTOMER_APP_API.csv            # Import Google Sheets (danh sách API)
├── CUSTOMER_APP_API_TONG_HOP.csv   # Sheet tổng hợp số liệu
├── CUSTOMER_APP_API_IMPORT.md      # Hướng dẫn import CSV vào Sheets
├── setup-checklist.md              # Checklist setup dự án
├── slide-presentation.md           # Slide thuyết trình
└── supabase/                       # SQL tham chiếu, email templates
```

## 📋 Documentation standards

### Code documentation
- Tất cả public methods phải có dartdoc comments
- Complex business logic cần inline comments
- README.md cho mỗi major feature

### API documentation
- OpenAPI specs cho tất cả endpoints
- Request/response examples
- Error codes và handling

### Architecture documentation
- System diagrams
- Database ERD
- Sequence diagrams cho major flows

## 🚀 Documentation tools

### Recommended tools
- **Dartdoc**: Dart code documentation
- **Swagger/OpenAPI**: API documentation
- **Mermaid**: Diagrams in markdown
- **Figma**: UI/UX documentation
- **Notion**: Team knowledge base
