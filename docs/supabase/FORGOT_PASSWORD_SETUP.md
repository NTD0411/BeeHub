# Quên mật khẩu — Supabase + API Node (BE-007)

## API (Postman)

### 1. Gửi OTP / email recovery

```http
POST http://localhost:3000/api/auth/forgot-password
Content-Type: application/json

{
  "email": "thao0935851964@gmail.com"
}
```

**Thành công:**

```json
{
  "success": true,
  "data": {
    "email": "thao0935851964@gmail.com",
    "message": "Nếu email đã đăng ký, mã xác nhận đã được gửi."
  }
}
```

### 2. Đặt lại mật khẩu (sau khi nhận OTP)

```http
POST http://localhost:3000/api/auth/reset-password
Content-Type: application/json

{
  "email": "thao0935851964@gmail.com",
  "token": "123456",
  "new_password": "matkhauMoi123"
}
```

---

## Lỗi `Error sending magic link email` / `unexpected_failure`

Lỗi **không phải từ Node** — Supabase **gửi email thất bại**. Kiểm tra theo thứ tự:

### 1. Dán template đúng chỗ (hay nhầm nhất)

API `resetPasswordForEmail` dùng template **Reset password**, **không phải** chỉ Magic link.

| Template Supabase | Khi nào dùng |
|-------------------|--------------|
| **Reset password** | `POST /api/auth/forgot-password` ← **bắt buộc dán HTML ở đây** |
| **Magic link or OTP** | Đăng nhập OTP / magic link (khác flow) |

| Template | File HTML |
|----------|-----------|
| **Reset password** (API forgot-password) | `docs/supabase/email-reset-password-otp.html` |
| **Magic link or OTP** | `docs/supabase/email-magic-link-otp.html` (cùng giao diện + nút liên kết) |

### 2. Biến template sai → `Token is not a method but has arguments`

Supabase **không** hỗ trợ tách từng chữ số OTP.

| Cú pháp | Kết quả |
|---------|---------|
| `{{ .Token 0 }}` `{{ .Token 1 }}` | ❌ Sai |
| `{{ index .Token 0 }}` | ❌ Lỗi *Token is not a method but has arguments* |
| `{{ .Token }}` | ✅ Đúng |

**Chỉ dùng:**

```html
{{ .Token }}
{{ .Email }}
{{ .SiteURL }}
{{ .ConfirmationURL }}
```

File repo đã cập nhật: một khối mã + `letter-spacing` (giao diện gần 6 ô, không cần `index`).

### 3. SMTP Gmail (Custom SMTP bật)

- Host: `smtp.gmail.com`, Port: `587`
- Username: email Gmail đầy đủ
- Password: **App Password** (16 ký tự), **không** dùng mật khẩu đăng nhập Gmail thường  
  → Google Account → Security → 2-Step Verification → **App passwords**
- Bật 2FA trước khi tạo App Password

Nếu SMTP sai, Supabase trả đúng `unexpected_failure` / `Error sending magic link email`.

**Tạm test:** tắt Custom SMTP → dùng email mặc định Supabase (giới hạn rate, chỉ dev).

### 4. Email chưa có trong Auth Users

Email phải tồn tại trong **Authentication → Users** (đã đăng ký). Email lạ vẫn có thể trả 200 tùy cấu hình, nhưng không nhận mail.

### 5. URL Configuration

**Authentication → URL Configuration**

- Site URL: ví dụ `http://localhost:3000`
- Redirect URLs: thêm `http://localhost:3000/**` hoặc URL app

`.env` (repo root):

```env
AUTH_REDIRECT_URL=http://localhost:3000
```

### 6. OTP expiry khớp copy email

**Sign In / Providers → Email** → Email OTP expiration = `600` (10 phút) nếu email ghi "10 phút".

---

## Checklist nhanh

- [ ] HTML dán vào **Reset password** + Save  
- [ ] Không còn `{{ .Token 1 }}` — chỉ `{{ index .Token 0 }}` hoặc `{{ .Token }}`  
- [ ] SMTP: App Password Gmail hoặc tắt Custom SMTP để test  
- [ ] User có trong Authentication → Users  
- [ ] `npm run dev` trong `backend/`  
- [ ] Postman `POST /api/auth/forgot-password`  
- [ ] Xem **Authentication → Logs** trên Supabase nếu vẫn lỗi  

---

## File code

| File | Vai trò |
|------|---------|
| `backend/src/routes/auth.routes.js` | Route |
| `backend/src/services/auth.service.js` | Gọi Supabase Auth |
| `docs/supabase/email-reset-password-otp.html` | Template HTML |
