import 'package:flutter/foundation.dart';

abstract final class ApiConfig {
  /// May that qua Wi-Fi cung mang voi PC.
  static const useLanHost = true;

  /// IP PC (Wi-Fi) — chi khi useLanHost = true.
  /// Lay bang lenh: ipconfig (Windows) hoac ifconfig (Mac/Linux)
  static const lanHost = '192.168.1.38';

  /// USB + `adb reverse tcp:3000 tcp:3000`
  static const useAdbReverse = false;

  static String get baseUrl {
    if (useAdbReverse) return 'http://127.0.0.1:3000';
    if (useLanHost && lanHost.isNotEmpty) return 'http://$lanHost:3000';
    const fromEnv = String.fromEnvironment('API_BASE_URL');
    if (fromEnv.isNotEmpty) return fromEnv;
    if (kIsWeb) return 'http://localhost:3000';
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return 'http://10.0.2.2:3000';
      default:
        return 'http://localhost:3000';
    }
  }

  static const apiPrefix = '/api';
  static String get displayUrl => '$baseUrl$apiPrefix';
}
