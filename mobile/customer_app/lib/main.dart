import 'package:flutter/material.dart';

import 'app.dart';
import 'core/auth/auth_token_storage.dart';
import 'core/network/api_client.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final token = await AuthTokenStorage.instance.loadToken();
  if (token != null && token.isNotEmpty) {
    ApiClient.instance.setAccessToken(token);
  }

  runApp(const UniMoveApp());
}
