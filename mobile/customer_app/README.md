# UniMove Customer App

App khách hàng — chuyển trọ, khuân vác, Pass đồ cũ.

## Chạy nhanh

```powershell
flutter pub get
flutter run
```

**Đăng nhập demo (debug):** `demo@unimove.local` / `demo1234`

## Hướng dẫn đầy đủ (cho người mới pull code)

**[docs/HUONG_DAN_CHAY_CUSTOMER_APP.md](../../docs/HUONG_DAN_CHAY_CUSTOMER_APP.md)** — cài đặt, mock vs backend, emulator/USB/Windows, xử lý lỗi.

## Backend + app một lệnh

Từ root repo:

```powershell
npm run dev:customer
```

Hoặc trong folder này: `.\run.ps1`

## Luồng màn hình

1. Splash → Onboarding (debug: mỗi lần mở) → Login  
2. Home — 4 tab: Trang chủ · Thanh toán · Hoạt động · Tin nhắn  

## Emulator màn đen (Windows)

```powershell
.\scripts\emulator-fix.ps1
flutter run
```

Windows desktop: `.\run_windows.ps1`
