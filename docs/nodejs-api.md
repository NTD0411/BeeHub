# Node.js API — Auth and Profile Contract

> **Customer app (đầy đủ endpoint + Pass đồ):** xem [CUSTOMER_APP_API.md](./CUSTOMER_APP_API.md).

## Overview

This backend uses Supabase Auth for password storage and verification.
Passwords are encrypted and managed by Supabase in `auth.users.encrypted_password`.
The `profiles` table stores metadata only — no password, no password hash, no plaintext password.

## Design principles

- **Passwords are never manually hashed in Node for login/register/change password.**
- **Node API does not persist plaintext passwords in Postgres.**
- **Supabase Auth is the source of truth for credentials.**
- `profiles` is metadata only: `id`, `email`, `full_name`, `phone`, `role`, `status`, etc.
- `auth.users` stores the encrypted password securely in Supabase.

## Auth endpoints

### POST /api/auth/register

Registers a new user through Supabase Auth and then creates a profile row.

Request body:

```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "Nguyen Van A",
  "phone": "0123456789"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "user": { ...profile metadata... },
    "accessToken": "<node-jwt>"
  }
}
```

### POST /api/auth/login

Authenticates with Supabase Auth using `signInWithPassword()`.
If login succeeds, Node issues a JWT for `/api/auth/me` and `/api/auth/change-password`.

Request body:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### GET /api/auth/me

Returns the current profile metadata from `profiles`.
Requires `Authorization: Bearer <node-jwt>`.

### POST /api/auth/change-password

Validates the old password through Supabase Auth and updates the password using Supabase Auth admin API.

Request body:

```json
{
  "old_password": "old123",
  "new_password": "new456"
}
```

Requires `Authorization: Bearer <node-jwt>`.

### POST /api/auth/forgot-password

Generates a password reset token and stores the hashed token in `password_reset_tokens`.
The actual password remains stored in Supabase Auth.

Request body:

```json
{
  "email": "user@example.com"
}
```

### POST /api/auth/reset-password

Verifies the reset token and then updates the user password through Supabase Auth admin API.

Request body:

```json
{
  "email": "user@example.com",
  "token": "123456",
  "new_password": "new-password"
}
```

### POST /api/auth/google

Authenticates user with Google OAuth (id_token).
On first login, automatically creates a customer profile with data from Google metadata.
On subsequent logins, retrieves the existing profile.

Request body:

```json
{
  "id_token": "<google-id-token>"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "user@gmail.com",
      "full_name": "User Name",
      "avatar_url": "https://lh3.googleusercontent.com/...",
      "role": "customer",
      "status": "active"
    },
    "accessToken": "<node-jwt>"
  }
}
```

**Setup for Flutter (Google Sign-In)**:

```dart
import 'package:google_sign_in/google_sign_in.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

final GoogleSignIn googleSignIn = GoogleSignIn();
final GoogleSignInAccount? googleUser = await googleSignIn.signIn();
final GoogleSignInAuthentication googleAuth = await googleUser!.authentication;
final idToken = googleAuth.idToken;

// Send to Node API:
final response = await http.post(
  Uri.parse('$apiBase/api/auth/google'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({'id_token': idToken}),
);

if (response.statusCode == 200) {
  final json = jsonDecode(response.body);
  final accessToken = json['data']['accessToken'];
  // Store token and profile
}
```

**Setup (Google Cloud Console — không cần Supabase Auth)**:

1. Tạo OAuth 2.0 Client ID **Web application** trong Google Cloud Console.
2. Dùng Web client ID này làm `serverClientId` ở app Flutter và đặt `GOOGLE_CLIENT_ID` ở backend (audience khi verify).
3. Không cần bật Google provider trong Supabase — backend verify `id_token` trực tiếp.

When a new Google user signs in:
- App Flutter lấy `id_token` từ Google, gửi `POST /api/auth/google`.
- Backend verify `id_token` bằng `google-auth-library` (kiểm tra `audience = GOOGLE_CLIENT_ID`).
- Nếu chưa có `profiles` theo email → tạo mới (`role='customer'`, kèm `customer_profiles`).
- Trả về JWT Node (cùng format như login email).

## Implementation notes

- `backend/src/services/auth.service.js`
  - `register()` → tạo `profiles` + `user_credentials` (bcrypt) + `customer_profiles`/`provider_profiles`
  - `login()` → kiểm tra mật khẩu với `user_credentials` (bcrypt), phát JWT Node
  - `changePassword()` → verify mật khẩu cũ trong `user_credentials`, cập nhật hash mới
  - `forgotPassword()` / `resetPassword()` → OTP qua SMTP + bảng `password_reset_tokens`, cập nhật hash trong `user_credentials`
  - `googleAuth()` → verify Google `id_token` bằng `google-auth-library` (Node), phát JWT Node
- `backend/src/services/supabase.service.js`
  - chỉ export `supabaseAdmin` (service role) để truy cập Postgres — **không dùng Supabase Auth**
- `backend/src/middleware/auth.middleware.js`
  - Node JWT (`requireNodeAuth` / `requireAuth`) cho mọi route được bảo vệ

## Schema check

- Mật khẩu lưu ở bảng `user_credentials` (`password_hash`, bcrypt), **không** lưu trong `profiles`.
- Không sử dụng `auth.users` của Supabase Auth.

## Security checks

- Mật khẩu được hash bằng bcrypt (`user_credentials`) trong register/login/change-password.
- No password stored in `profiles`.
- Supabase Auth is responsible for secure password encryption.
- Google OAuth tokens are verified by Supabase Auth API.
- Node API only stores password reset tokens (hashed) when handling OTP-style resets.
