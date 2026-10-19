import 'package:dio/dio.dart';

import '../auth/auth_token_storage.dart';
import '../config/api_config.dart';

class ApiException implements Exception {
  ApiException(this.message, {this.statusCode, this.code});

  final String message;
  final int? statusCode;
  final String? code;

  @override
  String toString() => message;
}

/// HTTP client → Node.js API — Bearer JWT Node.
class ApiClient {
  ApiClient._() {
    dio = Dio(
      BaseOptions(
        baseUrl: '${ApiConfig.baseUrl}${ApiConfig.apiPrefix}',
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          final token = AuthTokenStorage.instance.cachedToken;
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
      ),
    );
  }

  static final ApiClient instance = ApiClient._();

  late final Dio dio;

  void setAccessToken(String? token) {
    AuthTokenStorage.instance.setCachedToken(token);
  }

  Future<Map<String, dynamic>> post(String path, {Map<String, dynamic>? body}) async {
    return _unwrap(await dio.post<dynamic>(path, data: body));
  }

  Future<Map<String, dynamic>> get(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) async {
    return _unwrap(await dio.get<dynamic>(path, queryParameters: queryParameters));
  }

  Future<Map<String, dynamic>> patch(String path, {Map<String, dynamic>? body}) async {
    return _unwrap(await dio.patch<dynamic>(path, data: body));
  }

  Future<Map<String, dynamic>> delete(String path) async {
    return _unwrap(await dio.delete<dynamic>(path));
  }

  /// Upload 1 file qua multipart/form-data (vd: avatar).
  Future<Map<String, dynamic>> uploadFile(
    String path, {
    required String filePath,
    String field = 'file',
  }) async {
    final formData = FormData.fromMap({
      field: await MultipartFile.fromFile(filePath),
    });
    return _unwrap(
      await dio.post<dynamic>(
        path,
        data: formData,
        options: Options(headers: {'Content-Type': 'multipart/form-data'}),
      ),
    );
  }

  Map<String, dynamic> _unwrap(Response<dynamic> response) {
    final raw = response.data;
    if (raw is! Map) {
      throw ApiException('Phản hồi API không hợp lệ', statusCode: response.statusCode);
    }
    final data = Map<String, dynamic>.from(raw);
    if (data['success'] == false) {
      throw ApiException(
        data['message'] as String? ?? 'Yêu cầu thất bại',
        statusCode: response.statusCode,
        code: data['code'] as String?,
      );
    }
    return data;
  }

  Never _rethrow(DioException e) {
    final body = e.response?.data;
    if (body is Map) {
      final map = Map<String, dynamic>.from(body);
      throw ApiException(
        map['message'] as String? ?? e.message ?? 'Lỗi mạng',
        statusCode: e.response?.statusCode,
        code: map['code'] as String?,
      );
    }

    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout ||
        e.type == DioExceptionType.sendTimeout) {
      throw ApiException(
        'Không nhận phản hồi từ API (${ApiConfig.displayUrl}) trong 15 giây. '
        'Kiểm tra backend: npm run dev:be. Emulator: 10.0.2.2 — máy thật: bật useLanHost trong api_config.dart.',
      );
    }

    if (e.type == DioExceptionType.connectionError) {
      final hint = ApiConfig.useAdbReverse
          ? 'Chạy: adb reverse tcp:3000 tcp:3000 (bật USB debugging).'
          : 'Điện thoại và PC phải cùng Wi-Fi. Sửa lanHost trong api_config.dart = IP PC (ipconfig).';
      throw ApiException(
        'Không kết nối được ${ApiConfig.displayUrl}. '
        'Backend có đang chạy không? (npm run dev:customer). $hint',
      );
    }

    throw ApiException(
      e.message ?? 'Không kết nối được API. Chạy: npm run dev:be',
    );
  }

  Future<T> guard<T>(Future<T> Function() fn) async {
    try {
      return await fn();
    } on ApiException {
      rethrow;
    } on DioException catch (e) {
      _rethrow(e);
    }
  }
}
