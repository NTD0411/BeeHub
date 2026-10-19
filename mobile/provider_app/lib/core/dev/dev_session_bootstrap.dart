import '../../features/documents/data/provider_documents_repository.dart';
import '../auth/auth_token_storage.dart';
import '../config/dev_config.dart';
import '../network/api_client.dart';

/// Debug: chỉ khôi phục phiên demo khi token đã là mock — không ghi đè JWT thật.
abstract final class DevSessionBootstrap {
  static Future<void> apply() async {
    if (!DevConfig.useMockAuth) return;

    final storage = AuthTokenStorage.instance;
    if (!await storage.isMockSession()) {
      final token = await storage.loadToken();
      if (token != null && token.isNotEmpty) {
        ApiClient.instance.setAccessToken(token);
      }
      return;
    }

    ApiClient.instance.setAccessToken(AuthTokenStorage.mockToken);
    await ProviderDocumentsRepository().seedVerifiedDemoProvider();
  }
}
