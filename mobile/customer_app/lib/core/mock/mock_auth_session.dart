import 'package:shared_preferences/shared_preferences.dart';

import '../config/dev_config.dart';

const _prefsKey = 'mock_customer_signed_in';

/// Phiên đăng nhập demo (persist qua hot restart).
abstract final class MockAuthSession {
  static bool? _memory;

  static bool get isEnabled => DevConfig.useMockAuth;

  static Future<bool> isSignedIn() async {
    if (!isEnabled) return false;
    if (_memory != null) return _memory!;
    final prefs = await SharedPreferences.getInstance();
    _memory = prefs.getBool(_prefsKey) ?? false;
    return _memory!;
  }

  static Future<void> signIn() async {
    if (!isEnabled) return;
    _memory = true;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_prefsKey, true);
  }

  static Future<void> signOut() async {
    _memory = false;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_prefsKey);
  }

  static bool isDemoCredential({required String email, required String password}) {
    return email.trim().toLowerCase() == DevConfig.demoEmail &&
        password == DevConfig.demoPassword;
  }
}
