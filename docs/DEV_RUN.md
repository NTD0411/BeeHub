# Chạy dev — Backend tự reload + Flutter hot restart

## Cách khuyên dùng (2 terminal — hot restart thoải mái)

**Terminal 1 — Backend** (tự reload khi sửa file trong `backend/src/`):

```powershell
cd backend
npm run dev
```

**Terminal 2 — Flutter** (hot reload / hot restart, không cần chạy lại BE):

```powershell
cd mobile/customer_app
flutter run
```

Trong terminal Flutter:

| Phím | Tác dụng |
|------|----------|
| `r` | Hot reload (nhanh, giữ state) |
| `R` | Hot restart |
| `q` | Thoát app |

Provider: thay `customer_app` → `provider_app`.

### Lỗi đăng ký / đăng nhập timeout

1. Terminal chạy `npm run dev:be` — mở `http://localhost:3000/api/health` trên trình duyệt PC.
2. **Emulator Android:** app dùng `http://10.0.2.2:3000` (mặc định).
3. **Điện thoại thật / Vysor (USB):** chọn một trong hai:
   - **Wi‑Fi:** `useLanHost = true`, `lanHost = '192.168.1.60'` (IP PC — xem `ipconfig`), điện thoại **cùng Wi‑Fi**.
   - **USB (khuyên khi dùng Vysor):** `adb reverse tcp:3000 tcp:3000` rồi trong `api_config.dart`: `useAdbReverse = true`, `useLanHost = false`.
4. Cho phép firewall Windows cổng **3000** (Private network).

---

## Một lệnh (khuyên dùng — tránh lỗi Ctrl+C)

```powershell
npm install
cd mobile/customer_app && flutter pub get

npm run dev:customer   # hoặc dev:provider
```

- **Backend** mở **cửa sổ PowerShell riêng**.
- Terminal hiện tại chỉ chạy **Flutter** → `Ctrl+C` **không** báo lỗi exit code 2 của `concurrently`.
- Sửa UI: **`R`** hot restart — **không cần** `Ctrl+C`.
- Tắt backend: `Ctrl+C` ở **cửa sổ backend**.

### Nếu vẫn thấy "terminal exited with code 2"

Thường do `Ctrl+C` khi chạy `dev:customer:all` (concurrently) — **bỏ qua**, hoặc dùng `npm run dev:customer` (script tách cửa sổ).

### Chạy cả hai trong một terminal (cũ)

```powershell
npm run dev:customer:all
```

`Ctrl+C` có thể hiện cảnh báo VS Code — vẫn an toàn, chỉ là cách dừng process trên Windows.

---

## Chỉ backend (Postman / test API)

```powershell
npm run dev:be
```
