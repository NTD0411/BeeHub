# Chiến lược Auth — gói Supabase Free (giới hạn email)

## Vấn đề

Gói **Free**: Supabase Auth gửi khoảng **3–4 email/giờ**. Test đăng ký / quên MK / resend nhiều lần → bị chặn (`unexpected_failure`, rate limit).

**Không cần bỏ hết Supabase** — chỉ cần **không phụ thuộc email Auth** cho luồng chính.

---

## Ba hướng (chọn 1)

### A. Giữ Supabase Auth, tắt email (nhanh nhất — khuyên dùng cho đồ án)

| Việc | Cấu hình |
|------|----------|
| Đăng ký + login | `signInWithPassword` / `signUp` — **không tốn email** nếu tắt confirm |
| Dashboard | **Sign In / Providers → Email** → tắt **Confirm email** |
| Quên MK / OTP | **Không dùng** trong demo, hoặc mock OTP trong app (dev) |
| Google | OAuth — hầu như không cần email OTP |
| Dev | `MockAuthSession` (đã có trong app) |

**Ưu:** Không sửa DB (`profiles.id` vẫn `auth.users`).  
**Nhược:** Quên MK thật bằng email phải làm sau (hướng B/C).

---

### B. Auth “bình thường” — Node.js JWT + Postgres (khuyên nếu bỏ Supabase Auth)

```
Flutter  →  POST /api/auth/register | /login  →  Node
Node     →  bcrypt hash  →  lưu DB
Node     →  trả JWT (access + refresh tuỳ chọn)
Flutter  →  Header Authorization: Bearer <JWT>
Node     →  verify JWT  →  query Supabase bằng service role
```

**DB cần đổi (migration mới, không sửa file cũ đã chạy):**

- Bỏ `profiles.id REFERENCES auth.users`
- `profiles.id` = `UUID` tự sinh (hoặc bảng `users` + `profiles.user_id`)
- Cột `password_hash` trên `users` hoặc bảng `user_credentials`
- Xóa / thay trigger `handle_new_user` trên `auth.users`

**Gửi email (sau):** Nodemailer + Gmail App Password từ **Node** — quota tách khỏi Supabase Auth.

**Ưu:** Kiểm soát full, không dính 3 email/giờ của Auth.  
**Nhược:** BE-001–BE-010 làm lại phần auth; RLS `auth.uid()` không dùng được → API đi qua Node + service role.

---

### C. Giữ Supabase Auth + email qua Node (lai)

- Login/register vẫn Supabase Auth (confirm tắt).
- Quên MK: Node tạo OTP lưu `password_reset_tokens`, gửi mail bằng Nodemailer, `POST /api/auth/reset-password` — **không** gọi `resetPasswordForEmail`.

**Ưu:** Ít đụng schema hơn B.  
**Nhược:** Hai hệ thống (Auth + OTP riêng).

---

## Khuyến nghị cho UniMove (nhóm 5 người)

| Giai đoạn | Làm gì |
|-----------|--------|
| **Tuần demo / nộp** | **A** — tắt Confirm email, login password, mock quên MK hoặc ẩn nút |
| **Sau nộp / production** | **B** hoặc nâng gói Supabase + SMTP |

**Vẫn dùng Supabase cho:** PostgreSQL, Storage avatar, Realtime chat (nếu có) — chỉ **không** dựa email Auth.

---

## Việc cụ thể nếu chọn A (ngay)

1. Dashboard: tắt **Confirm email**.
2. App: đăng ký xong → vào app luôn (không “check email”).
3. Ẩn / mock **Quên mật khẩu** (hoặc dialog “Liên hệ admin” trong demo).
4. Test: 1 tài khoản cố định + mock login — không spam resend.
5. Ghi trong báo cáo: *“Gói Free giới hạn email; xác thực email sẽ bật khi triển khai production.”*

---

## Việc cụ thể nếu chọn B (auth Node thuần)

| Layer | Task |
|-------|------|
| Migration | `users` + `password_hash`, `profiles` không FK `auth.users` |
| Node | `auth.service.js`: register, login, JWT, `auth.middleware` verify JWT custom |
| Flutter | `CustomerAuthRepository` gọi Node, lưu token `flutter_secure_storage` |
| Bỏ | `supabase.auth.signUp` / `signInWithPassword` trên client |
| Docs | Cập nhật `AUTH_PROFILE_WHERE_TO_CODE.md` |

Task map: BE-001–BE-007 điều chỉnh trong `BE_TASK_DIVISION.csv` (ghi chú “JWT Node, không Supabase Auth email”).

---

## Câu hỏi thường gặp

**Có nên bỏ Supabase hoàn toàn?**  
Không. Chỉ bỏ **phần gửi email Auth** (hoặc cả Auth nếu chọn B). DB + API vẫn trên Supabase.

**Google login?**  
Hướng A: giữ Supabase Google OAuth. Hướng B: Passport Google trên Node.

**RLS?**  
Client không gọi Supabase trực tiếp → Node dùng `service_role` + kiểm tra `userId` từ JWT trong controller.
