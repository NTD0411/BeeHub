import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/auth/auth_token_storage.dart';
import '../../../core/config/dev_config.dart';
import '../../../core/mock/mock_auth_session.dart';
import '../../../core/mock/mock_provider_data.dart';
import '../../../core/network/api_client.dart';
import '../../../core/services/auth_session_notifier.dart';
import '../domain/provider_profile.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.watch(apiClientProvider));
});

final providerProfileProvider = FutureProvider<ProviderProfile?>((ref) async {
  if (!await AuthTokenStorage.instance.hasSession()) return null;
  if (await AuthTokenStorage.instance.isMockSession()) {
    return ProviderProfile.fromJson(MockProviderData.userJson);
  }
  return ref.watch(authRepositoryProvider).fetchProfile();
});

class AuthRepository {
  AuthRepository(this._api);

  final ApiClient _api;
  final _storage = AuthTokenStorage.instance;

  Future<bool> get isSignedIn => _storage.hasSession();

  Future<ProviderProfile?> fetchProfile() async {
    final envelope = await _api.guard(() => _api.get('/auth/me'));
    final me = Map<String, dynamic>.from(envelope['data'] as Map);
    return ProviderProfile.fromJson(me);
  }

  Future<void> signIn({required String email, required String password}) async {
    if (DevConfig.useMockAuth && DevConfig.isDemoCredential(email: email, password: password)) {
      await MockAuthSession.signIn();
      _api.setAccessToken(AuthTokenStorage.mockToken);
      authSessionNotifier.notifyAuthChanged();
      return;
    }

    final envelope = await _api.guard(
      () => _api.post('/auth/login', body: {
        'email': email.trim().toLowerCase(),
        'password': password,
      }),
    );
    await _persistAuth(envelope);
    await _validateProviderRole();
    authSessionNotifier.notifyAuthChanged();
  }

  Future<void> signUp({
    required String email,
    required String password,
    required String fullName,
    required String businessName,
  }) async {
    if (password.length < 8) {
      throw const AuthException('Mật khẩu tối thiểu 8 ký tự.');
    }

    final envelope = await _api.guard(
      () => _api.post('/auth/register', body: {
        'email': email.trim().toLowerCase(),
        'password': password,
        'full_name': fullName.trim(),
        'business_name': businessName.trim(),
        'role': 'provider',
      }),
    );

    await _persistAuth(envelope);
    authSessionNotifier.notifyAuthChanged();
  }

  Future<void> signOut() async {
    await _storage.clear();
    _api.setAccessToken(null);
    authSessionNotifier.notifyAuthChanged();
  }

  Future<void> _persistAuth(Map<String, dynamic> envelope) async {
    final data = Map<String, dynamic>.from(envelope['data'] as Map);
    final token = data['accessToken'] as String?;
    final user = data['user'] as Map?;
    if (token == null || user == null) {
      throw const AuthException('Phản hồi auth không hợp lệ.');
    }
    await _storage.save(
      accessToken: token,
      user: Map<String, dynamic>.from(user),
    );
    _api.setAccessToken(token);
  }

  Future<void> _validateProviderRole() async {
    final user = await _storage.loadUser();
    if (user?['role'] != 'provider') {
      await signOut();
      throw const AuthException('Tài khoản này không phải provider.');
    }
  }
}

class AuthException implements Exception {
  const AuthException(this.message);
  final String message;

  @override
  String toString() => message;
}
