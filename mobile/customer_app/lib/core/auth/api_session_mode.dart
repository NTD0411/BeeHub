import '../config/dev_config.dart';
import 'auth_token_storage.dart';
import '../mock/mock_auth_session.dart';

/// Phân biệt phiên JWT thật vs demo mock (debug).
abstract final class ApiSessionMode {
  static Future<bool> hasRealSession() =>
      AuthTokenStorage.instance.hasSession();

  /// true = dùng mock data, không gọi API đơn hàng/thanh toán.
  static Future<bool> useMockData() async {
    if (await hasRealSession()) return false;
    if (DevConfig.useMockAuth && await MockAuthSession.isSignedIn()) return true;
    return false;
  }

  static Future<bool> useMockQuotes() async {
    if (await hasRealSession()) return false;
    if (DevConfig.useMockAuth && await MockAuthSession.isSignedIn()) return true;
    return !(await hasRealSession());
  }
}
