# UniMove Mobile Apps - Flutter

## 📁 Cấu Trúc Mobile

```
mobile/
├── customer_app/               # App khách hàng
│   ├── lib/
│   │   ├── main.dart
│   │   ├── core/              # Core utilities
│   │   │   ├── constants/
│   │   │   ├── theme/
│   │   │   ├── utils/
│   │   │   └── services/
│   │   ├── features/          # Feature modules
│   │   │   ├── auth/
│   │   │   │   ├── data/
│   │   │   │   ├── domain/
│   │   │   │   └── presentation/
│   │   │   ├── booking/
│   │   │   │   ├── data/
│   │   │   │   ├── domain/
│   │   │   │   └── presentation/
│   │   │   ├── tracking/
│   │   │   ├── chat/
│   │   │   ├── payment/
│   │   │   └── profile/
│   │   └── shared/            # Shared components
│   │       ├── widgets/
│   │       ├── models/
│   │       └── providers/
│   ├── android/
│   ├── ios/
│   ├── assets/
│   └── pubspec.yaml
├── provider_app/              # App nhà cung cấp
│   ├── lib/
│   │   ├── main.dart
│   │   ├── core/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── orders/
│   │   │   ├── tracking/
│   │   │   ├── earnings/
│   │   │   ├── chat/
│   │   │   └── profile/
│   │   └── shared/
│   ├── android/
│   ├── ios/
│   └── pubspec.yaml
└── shared_mobile/             # Shared code giữa 2 apps
    ├── lib/
    │   ├── models/
    │   ├── services/
    │   ├── widgets/
    │   └── utils/
    └── pubspec.yaml
```

## 🎯 Feature-First Architecture

### Cấu trúc từng Feature
```
features/booking/
├── data/
│   ├── datasources/
│   │   ├── booking_remote_datasource.dart
│   │   └── booking_local_datasource.dart
│   ├── models/
│   │   └── booking_model.dart
│   └── repositories/
│       └── booking_repository_impl.dart
├── domain/
│   ├── entities/
│   │   └── booking.dart
│   ├── repositories/
│   │   └── booking_repository.dart
│   └── usecases/
│       ├── create_booking.dart
│       └── get_bookings.dart
└── presentation/
    ├── pages/
    │   ├── booking_page.dart
    │   └── booking_detail_page.dart
    ├── widgets/
    │   ├── booking_card.dart
    │   └── booking_form.dart
    └── providers/
        └── booking_provider.dart
```

## 🚀 Setup Mobile

```bash
# Customer App
cd mobile/customer_app
flutter pub get
flutter run

# Provider App  
cd mobile/provider_app
flutter pub get
flutter run

# Shared package
cd mobile/shared_mobile
flutter pub get
```

## 📋 Team Workflow

### Phát triển Feature mới
1. Tạo nhánh `mobile/feature-booking`
2. Implement trong `features/booking/`
3. Test trên cả 2 apps
4. Tạo PR và review
5. Merge vào `main`

### Shared Components
1. Develop trong `shared_mobile/`
2. Import vào cả 2 apps
3. Version control với pubspec.yaml