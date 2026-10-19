import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

class AuthTokenStorage {
  AuthTokenStorage._();
  static final AuthTokenStorage instance = AuthTokenStorage._();

  static const _tokenKey = 'provider_node_access_token';
  static const _userKey = 'provider_node_user_json';

  /// Token giả — mọi repository dùng mock, không gọi API.
  static const mockToken = 'mock_provider_session';

  String? _cachedToken;

  String? get cachedToken => _cachedToken;

  void setCachedToken(String? token) => _cachedToken = token;

  Future<void> save({required String accessToken, required Map<String, dynamic> user}) async {
    _cachedToken = accessToken;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, accessToken);
    await prefs.setString(_userKey, jsonEncode(user));
  }

  Future<String?> loadToken() async {
    if (_cachedToken != null && _cachedToken!.isNotEmpty) return _cachedToken;
    final prefs = await SharedPreferences.getInstance();
    _cachedToken = prefs.getString(_tokenKey);
    return _cachedToken;
  }

  Future<Map<String, dynamic>?> loadUser() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_userKey);
    if (raw == null || raw.isEmpty) return null;
    return Map<String, dynamic>.from(jsonDecode(raw) as Map);
  }

  Future<bool> hasSession() async {
    final t = await loadToken();
    return t != null && t.isNotEmpty;
  }

  Future<bool> isMockSession() async {
    final t = await loadToken();
    return t == mockToken;
  }

  Future<void> clear() async {
    _cachedToken = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
  }
}
