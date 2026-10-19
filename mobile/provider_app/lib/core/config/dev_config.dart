import 'package:flutter/foundation.dart';

/// Cấu hình dev — bật khi `flutter run` (debug).
abstract final class DevConfig {
  static bool get useMockAuth => kDebugMode;

  static const demoEmail = 'partner@unimove.vn';
  static const demoPassword = 'partner123';

  static bool isDemoCredential({required String email, required String password}) {
    return email.trim().toLowerCase() == demoEmail && password == demoPassword;
  }
}
