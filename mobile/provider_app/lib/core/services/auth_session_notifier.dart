import 'package:flutter/foundation.dart';

/// Báo GoRouter refresh khi đăng nhập / đăng xuất (thay Supabase auth stream).
class AuthSessionNotifier extends ChangeNotifier {
  void notifyAuthChanged() => notifyListeners();
}

final authSessionNotifier = AuthSessionNotifier();
