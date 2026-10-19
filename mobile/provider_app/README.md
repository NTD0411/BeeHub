# UniMove Provider App

## Auth

Đăng ký / đăng nhập qua **Node API** (`/api/auth/register`, `/api/auth/login`) với `role: provider`.

Chạy backend trước: `cd backend && npm run dev`.

Android emulator: API base `http://10.0.2.2:3000` (xem `lib/core/config/api_config.dart`).

Migration DB: `docs/supabase/20240113000000_node_auth.sql` trên Supabase SQL Editor.
