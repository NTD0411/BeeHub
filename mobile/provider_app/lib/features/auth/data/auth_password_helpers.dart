import '../../../core/network/api_client.dart';

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

String friendlyPasswordApiError(ApiException e) {
  switch (e.code) {
    case 'invalid_token':
      return 'Mã xác nhận không hợp lệ hoặc đã hết hạn.';
    case 'smtp_error':
    case 'db_schema_missing':
      return e.message;
    default:
      return e.message;
  }
}
