# Hướng dẫn: Code ở đâu cho Auth & Profile (yêu cầu cô)

Tài liệu này giúp **5 thành viên** (và người làm BE-001 → BE-010) **không code lộn app / lộn layer**.  
Task ID tham chiếu: [BE_TASK_DIVISION_AUTH.md](./BE_TASK_DIVISION_AUTH.md), chi tiết spec: [BE_TASK_DIVISION.csv](./BE_TASK_DIVISION.csv).

---

## 1. Ba tầng — ai làm gì

```
┌─────────────────────────────────────────────────────────────────┐
│  Flutter Customer App (UI + gọi API)                            │
│  mobile/customer_app/                                           │
└───────────────────────────┬─────────────────────────────────────┘
                            │ Bearer JWT (sau login)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Node.js Express API (business + auth wrapper nếu cần)          │
│  backend/src/                                                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │ service role / Auth Admin API
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Supabase (Auth + PostgreSQL + Storage + RLS)                   │
│  backend/supabase/migrations/ + Dashboard cấu hình              │
└─────────────────────────────────────────────────────────────────┘
```

| Tầng | Làm | Không làm |
|------|-----|-----------|
| **Supabase** | User/password hash, email confirm, Google OAuth provider, bảng `profiles`, bucket `avatars`, RLS | Logic UI, PayOS, tính giá đơn |
| **Node API** | Route `/api/auth/*`, `/api/customers/me`, validate JWT (`auth.middleware.js`), upload avatar qua server (nếu team chọn không upload thẳng từ Flutter) | Lưu password plain vào `profiles` |
| **Flutter Customer** | Màn login/register/profile, gọi Supabase Auth hoặc Node API theo convention nhóm | Sửa `provider_app` / `admin_dashboard` cho tính năng **sinh viên** |

**Quy ước dự án (docs/nodejs-api.md):**  
- **Đăng nhập / session:** Node JWT (`AuthTokenStorage` + `ApiClient`).  
- **Profile đọc/sửa, avatar:** nên đi **Node API** (`GET/PATCH /api/customers/me`) để thống nhất với các API khác — tránh mỗi người query `profiles` rải rác trong UI.

---

## 2. KHÔNG code nhầm chỗ

| Yêu cầu cô (customer) | ❌ Không sửa | ✅ Sửa |
|------------------------|-------------|--------|
| Đăng ký / login / Google / logout | `mobile/provider_app/` | `mobile/customer_app/` |
| Profile sinh viên | `web/admin_dashboard/` (admin login khác) | `customer_app` → `profile_page.dart` |
| API auth customer | `providers.routes.js`, `orders.routes.js` | Tạo **`auth.routes.js`** + **`customers.routes.js`** |
| Password | Cột mới trong `profiles` | Chỉ **`auth.users`** (Supabase Auth) |
| Avatar | Bucket `provider-docs` | Bucket **`avatars`** (customer) |

**Provider** (nhà xe) có auth riêng: `provider_app/lib/features/auth/` — **không** gộp với task cô giao cho app sinh viên.

---

## 3. Cấu trúc thư mục — nên tạo / mở rộng

### 3.1 Backend Node (Leader / BE-001–BE-010)

**Leader chỉ push scaffold** (routes + controller + service stub `501`). Team implement logic trong `auth.service.js` / `customers.service.js`.  
Chi tiết phạm vi: [AUTH_SCAFFOLD_LEADER.md](./AUTH_SCAFFOLD_LEADER.md).

Tạo module mới, **không** nhét auth vào `orders.controller.js`:

```
backend/src/
├── routes/
│   ├── index.js                 ← ĐĂNG KÝ router mới ở đây
│   ├── auth.routes.js           ← BE-001,003,004,005,006,007
│   └── customers.routes.js      ← BE-008,009,010
├── controllers/
│   ├── auth.controller.js
│   └── customers.controller.js
└── services/
    ├── auth.service.js          ← Node JWT + bcrypt (user_credentials) — BE-001→007
    └── customers.service.js     ← profiles qua supabaseAdmin — BE-008→010
├── utils/
    ├── jwt.js                   ← signAccessToken / verifyAccessToken
    └── password.js              ← bcrypt + OTP reset token
```

**Đã có — chỉ dùng, không copy logic auth sang file khác:**

| File | Vai trò |
|------|---------|
| `middleware/auth.middleware.js` | `requireAuth` (Node JWT), `requireRole` |
| `services/supabase.service.js` | `supabaseAdmin` (Postgres service role, không Auth) |
| `supabase/migrations/20240113000000_node_auth.sql` | **Chạy thủ công** trên Supabase SQL Editor (xem `docs/AUTH_NODE_MODULE.md`) |
| `routes/index.js` | Thêm `router.use('/auth', authRoutes)` và `router.use('/customers', customersRoutes)` |

**Cập nhật tài liệu API:** `docs/nodejs-api.md` (BE-002, BE-016).

---

### 3.2 Supabase (DB + Auth + Storage)

| Việc | Đường dẫn |
|------|-----------|
| Schema `profiles` | `backend/supabase/migrations/20240101000000_initial_schema.sql` |
| Trigger tạo profile sau signup | `backend/supabase/manual_fix_step5_auth_trigger.sql` |
| RLS `profiles` | `backend/supabase/migrations/20240107000000_rls_policies.sql` |
| Migration mới (bucket `avatars`, policy Storage) | `backend/supabase/migrations/20240112xxxxxx_avatars.sql` — **file mới**, không sửa migration cũ đã chạy |
| Bật email confirm, Google OAuth | **Supabase Dashboard** → Authentication (không commit secret vào git) |

**BE-002 (Node JWT):** Hash mật khẩu trong `user_credentials.password_hash` (bcrypt), **không** cột `password` trên `profiles`.  
Nếu team vẫn dùng Supabase Auth cho Flutter: hash nằm `auth.users` — khi chuyển hết sang Node thì bỏ phụ thuộc `auth.users`.

---

### 3.3 Flutter Customer App

```
mobile/customer_app/lib/
├── core/
│   ├── router/app_router.dart          ← Thêm route mới (đổi MK, quên MK)
│   ├── config/dev_config.dart          ← Mock auth (demo)
│   ├── mock/mock_auth_session.dart     ← Chỉ dev/demo
│   └── widgets/auth_form_field.dart    ← Input dùng chung form auth
│
├── features/
│   ├── auth/data/
│   │   └── customer_auth_repository.dart   ← TRUNG TÂM: signUp, signIn, signOut, Google, đổi MK
│   ├── login/presentation/pages/
│   │   └── login_page.dart                 ← BE-003,004,007 (link quên MK)
│   ├── register/presentation/pages/
│   │   └── register_page.dart              ← BE-001
│   ├── splash/presentation/pages/
│   │   └── splash_page.dart                ← Kiểm tra session → /home hoặc /login
│   └── home/presentation/pages/
│       ├── profile_page.dart               ← BE-005,008,009,010 (xem/sửa/avatar/đăng xuất)
│       └── home_page.dart                  ← Hiển thị avatar + tên (đọc profile)
│
└── (nên thêm khi làm BE-006,007)
    features/auth/presentation/pages/
        change_password_page.dart
        forgot_password_page.dart
```

**Tách UI mới vào `features/auth/presentation/`** thay vì nhét hết vào `profile_page.dart` (file đã dài).

**Repository pattern:** Mọi gọi Supabase/HTTP cho auth & profile customer → **`CustomerAuthRepository`** (hoặc tách `CustomerProfileRepository` trong cùng folder `features/auth/data/` nếu file quá lớn).

---

## 4. Map từng tính năng cô yêu cầu → file cụ thể

### BE-001 — Đăng ký + xác thực email

**Contract Cách A (khớp `register_page.dart`):** `email`, `password` (≥8), `full_name`, `phone`. Không có MSSV/trường lúc đăng ký — xem BE-009.

| Layer | Code ở đâu |
|-------|------------|
| UI | `register_page.dart` — 4 field + xác nhận MK + checkbox điều khoản |
| Flutter logic | `customer_auth_repository.dart` → `signUp()` → **Node API** (4 field; phone `+84`) |
| Node (Postman / sau này nối app) | `POST /api/auth/register` — cùng 4 field; `auth.service.js` `register()` |
| Supabase | Dashboard: **Enable confirm email** (khi bật flow xác thực email) |
| DB | `profiles`: email, full_name, phone, role=customer; `student_id`/`university` = PATCH profile (BE-009) |

---

### BE-002 — Mã hóa mật khẩu trong DB

| Layer | Code ở đâu |
|-------|------------|
| **Không code** hash tay | — |
| Document | `docs/nodejs-api.md` + section trong file này |
| Review | Đảm bảo không có `password` trong `profiles`; không log MK trong Node/Flutter |

---

### BE-003 — Đăng nhập email/mật khẩu

| Layer | Code ở đâu |
|-------|------------|
| UI | `login_page.dart` |
| Flutter | `customer_auth_repository.dart` → `signIn()` |
| Node | `POST /api/auth/login`, `GET /api/auth/me` → `auth.routes.js` |
| Session redirect | `splash_page.dart` — có session → `/home` |

---

### BE-004 — Đăng nhập Google

| Layer | Code ở đâu |
|-------|------------|
| UI | `login_page.dart` — nút **"Tiếp tục với Google"** |
| Flutter | `customer_auth_repository.dart` → `signInWithOAuth(OAuthProvider.google)` |
| Supabase Dashboard | Google Client ID/Secret, redirect URL (Android/iOS/deep link) |
| Node (tùy chọn) | `POST /api/auth/google` hoặc callback — chỉ nếu không dùng OAuth trực tiếp từ app |

**Không** cấu hình Google trong `provider_app` cho task này.

---

### BE-005 — Đăng xuất

| Layer | Code ở đâu |
|-------|------------|
| UI | `profile_page.dart` — nút Đăng xuất → `context.go('/login')` |
| Flutter | `customer_auth_repository.dart` → `signOut()` + `MockAuthSession.clear()` |
| Node | `POST /api/auth/logout` |

---

### BE-006 — Đổi mật khẩu

| Layer | Code ở đâu |
|-------|------------|
| UI **mới** | `features/auth/presentation/pages/change_password_page.dart` |
| Route | `app_router.dart` → ví dụ `/profile/change-password` |
| Entry | `profile_page.dart` hoặc `financial_settings_page.dart` — **chỉ menu điều hướng**, không viết logic MK tại đây |
| Flutter | `customer_auth_repository.dart` → `updateUser` / reauthenticate |
| Node | `POST /api/auth/change-password` |

---

### BE-007 — Quên mật khẩu

| Layer | Code ở đâu |
|-------|------------|
| UI **mới** | `features/auth/presentation/pages/forgot_password_page.dart` |
| Link | `login_page.dart` → `/forgot-password` |
| Flutter | `customer_auth_repository.dart` → `resetPasswordForEmail` |
| Node | `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` |
| Deep link | Cấu hình scheme app (Android `AndroidManifest`, iOS) — không sửa booking routes |

---

### BE-008 — Xem profile

| Layer | Code ở đâu |
|-------|------------|
| UI | `profile_page.dart` → `_loadProfile()` |
| Flutter | Gọi `GET /api/customers/me` (tạo `CustomerProfileRepository` hoặc method trong auth repo) |
| Node | `customers.routes.js` → `GET /me` + `requireAuth` + `requireRole('customer')` |
| **Hiện tại** | Đang `Supabase.instance.client.from('profiles').select(...)` trực tiếp — **nên chuyển sang Node** khi BE-008 làm xong |

**Home header:** `home_page.dart` — chỉ hiển thị `full_name`, `avatar_url` từ cùng nguồn GET `/me`.

---

### BE-009 — Chỉnh sửa profile

| Layer | Code ở đâu |
|-------|------------|
| UI | `profile_page.dart` — form + nút Lưu (hoặc tách `edit_profile_page.dart`) |
| Flutter | `PATCH` qua repository, không `update` trực tiếp trong `build()` |
| Node | `PATCH /api/customers/me` — body: `full_name`, `phone`, `student_id`, `university`, … |
| **Không cho sửa** | `email`, `role` qua API này |

Phone chuẩn hóa: dùng `CustomerAuthRepository.normalizePhone()` (đã có).

---

### BE-010 — Đổi ảnh đại diện

| Layer | Code ở đâu |
|-------|------------|
| UI | `profile_page.dart` — `onTap` avatar → `image_picker` |
| Flutter | Upload: hoặc Supabase Storage SDK trong repository, hoặc `multipart` → Node |
| Node | `POST /api/customers/me/avatar` |
| Storage | Bucket `avatars`, path `{user_id}/avatar.jpg` |
| DB | `profiles.avatar_url` |
| Hiển thị lại | `profile_page.dart` + `home_page.dart` (`CachedNetworkImage`) |

**Không** dùng bucket `provider-docs` cho avatar sinh viên.

---

## 5. Phân công gợi ý (tránh đụng file)

| Người | Phạm vi file (giai đoạn Auth cô yêu cầu) |
|-------|------------------------------------------|
| **Quyên (Leader)** | `backend/src/routes/auth.*`, `customers.*`, `controllers/*`, `services/*`, `docs/nodejs-api.md`, review RLS |
| **Người hỗ trợ Flutter auth** | `customer_auth_repository.dart`, `login_page`, `register_page`, `splash_page`, pages mới trong `features/auth/presentation/` |
| **Người hỗ trợ profile** | `profile_page.dart`, `home_page.dart` (avatar/tên), `app_router.dart` |
| **Thảo / Vũ / Hoàng / Huy** | **Không** sửa auth trừ khi cần gắn `Authorization` header — làm booking/payment/provider theo BE-017+ |

Nếu hai người cùng sửa `profile_page.dart`: chia **một người UI layout**, **một người gọi API/repository**.

---

## 6. Checklist trước khi merge PR

- [ ] Chỉ touch `mobile/customer_app` cho tính năng sinh viên cô yêu cầu  
- [ ] Auth routes đăng ký trong `backend/src/routes/index.js`  
- [ ] Không commit `.env`, Google secret, Supabase service key  
- [ ] Không thêm cột password vào `profiles`  
- [ ] API customer dùng `requireRole('customer')`  
- [ ] Cập nhật `docs/nodejs-api.md` khi thêm endpoint  
- [ ] Chạy `flutter analyze` trong `mobile/customer_app`  

---

## 7. Liên kết nhanh

| Tài liệu | Nội dung |
|----------|----------|
| [BE_TASK_DIVISION_AUTH.md](./BE_TASK_DIVISION_AUTH.md) | Bảng task BE-001 → BE-010 |
| [BE_TASK_DIVISION.csv](./BE_TASK_DIVISION.csv) | Spec đầy đủ cột Note |
| [nodejs-api.md](./nodejs-api.md) | Convention API |
| [database-schema.md](./database-schema.md) | Bảng `profiles` |

**Câu hỏi “code ở đâu?”** → Mở bảng **mục 4** theo đúng mã BE-00x.
