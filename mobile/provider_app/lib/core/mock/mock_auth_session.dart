import '../../features/documents/data/provider_documents_repository.dart';
import '../auth/auth_token_storage.dart';
import '../network/api_client.dart';
import 'mock_provider_data.dart';

/// Phiên demo provider — không gọi API khi token mock.
abstract final class MockAuthSession {
  static Future<bool> isActive() => AuthTokenStorage.instance.isMockSession();

  static Future<void> signIn() async {
    await AuthTokenStorage.instance.save(
      accessToken: AuthTokenStorage.mockToken,
      user: MockProviderData.verifiedProviderUserJson,
    );
    await ProviderDocumentsRepository().seedVerifiedDemoProvider();
    ApiClient.instance.setAccessToken(AuthTokenStorage.mockToken);
  }
}
