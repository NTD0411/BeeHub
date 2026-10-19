# Hướng dẫn chạy Customer App (UniMove)

Tài liệu cho thành viên **pull code lần đầu** — chạy được app khách hàng trên máy Windows (Android emulator, điện thoại thật, hoặc Windows desktop).

---

## 1. Cần cài gì trước

| Công cụ | Phiên bản gợi ý | Kiểm tra |
|---------|------------------|----------|
| **Git** | Mới nhất | `git --version` |
| **Flutter SDK** | ≥ 3.16 (project dùng Dart SDK ^3.2) | `flutter --version` |
| **Android Studio** | Có SDK + emulator (nếu chạy Android) | `flutter doctor` |
| **Node.js** | 18+ (chỉ khi chạy kèm backend) | `node --version` |
| **ADB** | Kèm Android SDK (USB debug) | `adb devices` |

Chạy một lần:

```powershell
flutter doctor
```

Sửa các mục báo đỏ (Android licenses: `flutter doctor --android-licenses`).

---

## 2. Lấy source code

```powershell
git clone <url-repo-cua-nhom>
cd wdp301-rbl-project-wdp_se18d08_group-4
```

(Tên thư mục có thể khác tùy repo — vào đúng **root** có `mobile/`, `backend/`, `docs/`.)

---

## 3. Hai cách chạy (chọn một)

### Cách A — Chỉ giao diện + dữ liệu mock (nhanh nhất, không cần backend)

Phù hợp: xem UI, demo Pass đồ, đặt chuyến mock, không cần Supabase.

1. Vào thư mục app:

```powershell
cd mobile\customer_app
flutter pub get
flutter run
```

2. **Đăng nhập demo** (chế độ debug tự bật mock):

| Field | Giá trị |
|-------|---------|
| Email | `demo@unimove.local` |
| Mật khẩu | `demo1234` |

Định nghĩa trong `lib/core/config/dev_config.dart`.

3. Luồng màn hình:
   - **Splash** (~4 giây) → **Onboarding** (lần đầu; debug luôn hiện onboarding) → **Login** → **Home** (4 tab dưới).
   - Nhiều tính năng dùng **mock** (đơn hàng, Pass đồ, thanh toán, thông báo…) — không cần API.

### Cách B — App + Backend API (đăng ký/đăng nhập thật, một phần API)

Phù hợp: test login, profile, tạo đơn, providers browse khi backend đã cấu hình.

#### B.1. Cấu hình backend (một lần)

Tại **root repo**:

```powershell
copy .env.example .env
```

Mở `.env`, điền (lấy từ leader / Supabase dashboard):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `JWT_SECRET` (chuỗi bí mật bất kỳ, đủ dài)

Chạy backend:

```powershell
cd backend
npm install
npm run dev
```

Kiểm tra: mở trình duyệt `http://localhost:3000/api/health` → JSON `success: true`.

#### B.2. Cấu hình app trỏ tới API

File: `mobile/customer_app/lib/core/config/api_config.dart`

| Môi trường | Gợi ý cấu hình |
|------------|----------------|
| **Emulator Android** | `useLanHost = false`, `useAdbReverse = false` → URL `http://10.0.2.2:3000` |
| **Điện thoại USB** | `useAdbReverse = true` → chạy `adb reverse tcp:3000 tcp:3000` |
| **Điện thoại Wi‑Fi cùng mạng PC** | `useLanHost = true`, `lanHost = '<IP-PC>'` (`ipconfig`) |
| **Windows desktop** | `flutter run -d windows` → `http://localhost:3000` |

#### B.3. Chạy một lệnh (khuyến nghị team)

Tại **root repo** (đã `npm install` ở root nếu dùng script):

```powershell
npm install
npm run dev:customer
```

Script `scripts/dev-customer.ps1` sẽ:

- Mở cửa sổ **backend** (nếu chưa chạy port 3000)
- Chạy `adb reverse` nếu có máy USB
- Chạy `flutter run` trong `mobile/customer_app`

Hoặc từ folder app:

```powershell
cd mobile\customer_app
.\run.ps1
```

(`run.ps1` gọi `npm run dev:customer` ở root.)

---

## 4. Chạy trên từng nền tảng

### Android Emulator

```powershell
cd mobile\customer_app
flutter pub get
flutter devices          # xem id emulator
flutter run
```

**Màn hình đen trên emulator (Windows):**

```powershell
.\scripts\emulator-fix.ps1
# đợi emulator boot ~60s
flutter run
```

### Điện thoại thật (USB)

1. Bật **USB debugging** trên máy.
2. Cắm USB, chấp nhận «Allow USB debugging».
3. `adb devices` → thấy `device`.
4. `adb reverse tcp:3000 tcp:3000` (nếu dùng backend local).
5. `api_config.dart`: `useAdbReverse = true`.
6. `flutter run` (chọn device điện thoại).

### Windows desktop (không cần emulator)

```powershell
cd mobile\customer_app
.\run_windows.ps1
# hoặc: flutter run -d windows
```

Backend: `http://localhost:3000` (không cần adb reverse).

---

## 5. Luồng app sau khi vào được (tóm tắt)

Chi tiết từng màn + API: [CUSTOMER_APP_API.csv](./CUSTOMER_APP_API.csv) / [CUSTOMER_APP_API.md](./CUSTOMER_APP_API.md).

| Tab / khu vực | Mô tả ngắn |
|---------------|------------|
| **Trang chủ** | Đặt chuyến, Combo chuyển trọ, Khuân vác, Pass đồ, So sánh nhà xe |
| **Thanh toán** | Ví, lịch sử GD (mock nếu chưa nối API) |
| **Hoạt động** | Đơn đang chạy / lịch sử |
| **Tin nhắn** | Thông báo & khuyến mãi (**không** phải chat nhà xe) |

**Chat nhà xe:** từ thẻ đơn trên Trang chủ / Hoạt động / Theo dõi chuyến.

**Pass đồ:** mua quan tâm → chat → seller chốt đơn → «Đặt xe lấy đồ» → booking → thanh toán cọc.

---

## 6. Đăng nhập & dữ liệu

| Chế độ | Cách đăng nhập |
|--------|----------------|
| **Debug + mock** | `demo@unimove.local` / `demo1234` |
| **API thật** | Đăng ký `/register` hoặc login email trên backend đã seed |
| **Google** | Cần `--dart-define=GOOGLE_SERVER_CLIENT_ID=...` + backend cấu hình Google |

Mock auth **chỉ bật khi `flutter run` (debug)** — `DevConfig.useMockAuth = kDebugMode`.

Bản **release** (`flutter build apk --release`): không dùng mock; cần API thật.

---

## 7. Lệnh hữu ích

```powershell
# Cài dependency Flutter
cd mobile\customer_app
flutter pub get

# Phân tích lỗi
flutter analyze

# Xem thiết bị
flutter devices

# Chỉ backend
cd backend
npm run dev

# Backend + app (root)
npm run dev:customer

# Provider app (repo khác trong monorepo)
npm run dev:provider
```

---

## 8. Xử lý lỗi thường gặp

| Triệu chứng | Hướng xử lý |
|-------------|-------------|
| `flutter` không nhận lệnh | Thêm Flutter vào PATH hoặc dùng Android Studio terminal |
| Emulator màn đen | `.\scripts\emulator-fix.ps1` hoặc `flutter run -d windows` |
| Login API lỗi / timeout | Backend chạy chưa? `curl http://localhost:3000/api/health` |
| Điện thoại không gọi được API | `adb reverse tcp:3000 tcp:3000` hoặc đổi `lanHost` + `useLanHost = true` |
| Onboarding hiện mỗi lần mở | Bình thường ở **debug**; release mới nhớ đã xem |
| `pub get` lỗi | `flutter clean` → `flutter pub get` |
| Port 3000 bị chiếm | Tắt process cũ hoặc đổi `PORT` trong `.env` |

---

## 9. Cấu trúc thư mục app (tham khảo)

```
mobile/customer_app/
├── lib/
│   ├── main.dart              # Khởi động, load token
│   ├── app.dart               # MaterialApp + router
│   ├── core/
│   │   ├── config/api_config.dart   # URL backend ← SỬA KHI ĐỔI MẠNG
│   │   ├── config/dev_config.dart   # Tài khoản demo mock
│   │   └── router/app_router.dart   # Toàn bộ route
│   └── features/              # auth, booking, pass_items, orders, ...
├── android/ ios/ windows/
├── pubspec.yaml
├── run.ps1                    # Backend + Flutter (gọi root npm script)
└── scripts/emulator-fix.ps1
```

---

## 10. Tài liệu liên quan

| File | Nội dung |
|------|----------|
| [CUSTOMER_APP_API.csv](./CUSTOMER_APP_API.csv) | Danh sách API + luồng người dùng (import Sheet) |
| [nodejs-api.md](./nodejs-api.md) | Contract auth/profile |
| [database-schema.md](./database-schema.md) | Database |
| [../backend/README.md](../backend/README.md) | Backend riêng |
| [../mobile/provider_app/README.md](../mobile/provider_app/README.md) | App nhà cung cấp |

---

## 11. Checklist nhanh cho người mới

- [ ] `flutter doctor` không còn lỗi nghiêm trọng  
- [ ] `cd mobile/customer_app` → `flutter pub get`  
- [ ] Chạy được `flutter run` (emulator hoặc Windows)  
- [ ] Đăng nhập demo hoặc tài khoản API  
- [ ] (Tuỳ chọn) `.env` + `npm run dev` backend + health OK  
- [ ] (Tuỳ chọn) `api_config.dart` khớp thiết bị (emulator / USB / LAN)  

Nếu kẹt bước nào, gửi leader: output `flutter doctor -v`, `flutter run` log, và ảnh `api_config.dart`.
