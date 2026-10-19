import '../../../core/network/api_client.dart';

/// Upload ảnh mô tả trọ — dùng storage Supabase (API-073) cho đến khi có endpoint riêng.
class BookingMediaRepository {
  final ApiClient _api = ApiClient.instance;

  Future<String> uploadDormPhoto({required String filePath}) async {
    final envelope = await _api.guard(
      () => _api.uploadFile('/marketplace/listings/images', filePath: filePath, field: 'image'),
    );
    final url = envelope['data']?['url'] as String?;
    if (url == null || url.isEmpty) {
      throw Exception('Không nhận được URL ảnh từ server');
    }
    return url;
  }
}
