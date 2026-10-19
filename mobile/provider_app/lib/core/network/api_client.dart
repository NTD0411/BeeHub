import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

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

class ApiClient {
  ApiClient._() {
    _dio = Dio(
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

    _dio.interceptors.add(
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

  late final Dio _dio;

  void setAccessToken(String? token) {
    AuthTokenStorage.instance.setCachedToken(token);
  }

  Future<Map<String, dynamic>> get(String path) async {
    return _unwrap(await _dio.get<dynamic>(path));
  }

  Future<Map<String, dynamic>> post(String path, {Map<String, dynamic>? body}) async {
    return _unwrap(await _dio.post<dynamic>(path, data: body));
  }

  Future<Map<String, dynamic>> patch(String path, {Map<String, dynamic>? body}) async {
    return _unwrap(await _dio.patch<dynamic>(path, data: body));
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

  Future<T> guard<T>(Future<T> Function() fn) async {
    try {
      return await fn();
    } on ApiException {
      rethrow;
    } on DioException catch (e) {
      final body = e.response?.data;
      if (body is Map) {
        throw ApiException(
          body['message'] as String? ?? e.message ?? 'Lỗi mạng',
          statusCode: e.response?.statusCode,
          code: body['code'] as String?,
        );
      }
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.connectionError) {
        throw ApiException(
          'Không kết nối ${ApiConfig.displayUrl}. Chạy npm run dev:be; máy thật: useLanHost trong api_config.dart.',
        );
      }
      throw ApiException(e.message ?? 'Không kết nối được API. Chạy backend: npm run dev');
    }
  }

  static final ApiClient instance = ApiClient._();

  factory ApiClient() => instance;
}

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient.instance);
