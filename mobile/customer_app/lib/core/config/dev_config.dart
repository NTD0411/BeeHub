import 'package:flutter/foundation.dart';

/// Cấu hình phát triển — chỉ bật khi `flutter run` (debug).
abstract final class DevConfig {
  /// Dùng tài khoản demo, không gọi Supabase auth/profile.
  static bool get useMockAuth => kDebugMode;

  /// Email / mật khẩu demo trên màn Login.
  static const demoEmail = 'demo@unimove.local';
  static const demoPassword = 'demo1234';
}
