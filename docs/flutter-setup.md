# Flutter — Setup nhanh (Customer & Provider)

Hướng dẫn đầy đủ cho **customer app**: [HUONG_DAN_CHAY_CUSTOMER_APP.md](./HUONG_DAN_CHAY_CUSTOMER_APP.md).

## Customer app

```powershell
cd mobile/customer_app
flutter pub get
flutter run
```

Demo login (debug): `demo@unimove.local` / `demo1234`

Backend + app một lệnh (từ root repo):

```powershell
npm install
npm run dev:customer
```

## Provider app

```powershell
cd mobile/provider_app
flutter pub get
flutter run
```

Hoặc: `npm run dev:provider` từ root.

## API URL

Sửa `mobile/customer_app/lib/core/config/api_config.dart` (và tương tự provider nếu có).
