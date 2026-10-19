import '../../../core/network/api_client.dart';

/// Trích `data.message` từ envelope `{ success, data }` của backend auth.
String messageFromAuthEnvelope(
  Map<String, dynamic> envelope, {
  required String fallback,
}) {
  final data = envelope['data'];
  if (data is Map) {
    final msg = data['message'];
    if (msg is String && msg.trim().isNotEmpty) return msg.trim();
  }
  return fallback;
}

/// Map mã lỗi backend → thông báo tiếng Việt cho UI.
String friendlyPasswordApiError(ApiException e) {
  switch (e.code) {
    case 'invalid_token':
      return 'Mã xác nhận không hợp lệ hoặc đã hết hạn.';
    case 'smtp_error':
    case 'db_schema_missing':
      return e.message;
    case 'validation_error':
      return e.message;
    default:
      return e.message;
  }
}
