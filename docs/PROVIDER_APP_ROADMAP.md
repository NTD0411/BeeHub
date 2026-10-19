# Provider App — roadmap

## Hiện có

| Module | Trạng thái |
|--------|------------|
| Auth (login/register/splash) | Supabase + UI ShadCN đồng bộ customer |
| Onboarding 3 slide | Lần đầu mở app → Partner intro → login |
| Shell 5 tab | Trang chủ · Đơn hàng · Thu nhập · Tin nhắn · Hồ sơ |
| Dashboard | Stats, xác thực, quick actions |
| Orders inbox + detail | `GET /api/orders`, `POST /api/orders/:id/respond` |
| Documents UI | Scaffold upload (chưa Storage) |
| Theme | flex_color_scheme + shadcn + ScreenUtil + dark/light |
| API client | `dio` + Bearer Supabase JWT |

## Tiếp theo (gợi ý)

1. **Upload giấy tờ** — Storage `provider_documents`, chờ admin duyệt
2. **Thu nhập thật** — API payments/earnings cho provider
3. **Cập nhật trạng thái chuyến** — picking_up, completed
4. **Chat** — theo `order_id` (thay mock tin nhắn)

## Chạy thử

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd mobile/provider_app
flutter pub get
flutter run
```

Đăng nhập tài khoản `profiles.role = provider`. Trên emulator Android API base: `http://10.0.2.2:3000`.
