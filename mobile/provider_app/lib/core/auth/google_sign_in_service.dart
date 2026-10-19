import 'package:google_sign_in/google_sign_in.dart';

import '../config/api_config.dart';

class GoogleSignInCancelled implements Exception {
  const GoogleSignInCancelled();
}

class GoogleSignInFailure implements Exception {
  const GoogleSignInFailure(this.message);
  final String message;
  @override
  String toString() => message;
}

/// Bọc google_sign_in 7.x cho provider app — trả về Google `id_token`.
class GoogleSignInService {
  GoogleSignInService._();
  static final GoogleSignInService instance = GoogleSignInService._();

  bool _initialized = false;

  Future<void> _ensureInitialized() async {
    if (_initialized) return;
    if (!ApiConfig.isGoogleConfigured) {
      throw const GoogleSignInFailure(
        'Chưa cấu hình Google Client ID. Truyền --dart-define=GOOGLE_SERVER_CLIENT_ID=...',
      );
    }
    await GoogleSignIn.instance.initialize(
      serverClientId: ApiConfig.googleServerClientId,
    );
    _initialized = true;
  }

  Future<String> signInAndGetIdToken() async {
    await _ensureInitialized();

    try {
      final account = await GoogleSignIn.instance.authenticate(
        scopeHint: const ['email', 'profile'],
      );
      final idToken = account.authentication.idToken;
      if (idToken == null || idToken.isEmpty) {
        throw const GoogleSignInFailure('Không lấy được id_token từ Google.');
      }
      return idToken;
    } on GoogleSignInException catch (e) {
      if (e.code == GoogleSignInExceptionCode.canceled) {
        throw const GoogleSignInCancelled();
      }
      throw GoogleSignInFailure('Đăng nhập Google thất bại: ${e.description ?? e.code.name}');
    }
  }

  Future<void> signOut() async {
    if (!_initialized) return;
    await GoogleSignIn.instance.signOut();
  }
}
