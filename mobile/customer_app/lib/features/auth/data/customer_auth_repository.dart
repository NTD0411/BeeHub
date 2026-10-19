import '../../../core/auth/auth_token_storage.dart';
import '../../../core/auth/google_sign_in_service.dart';
import '../../../core/config/dev_config.dart';
import '../../../core/mock/mock_auth_session.dart';
import '../../../core/network/api_client.dart';
import 'auth_password_helpers.dart';

/// Auth customer — Node.js API (`/api/auth/*`, `/api/customers/me`).
class CustomerAuthRepository {
  CustomerAuthRepository({ApiClient? api}) : _api = api ?? ApiClient.instance;

  final ApiClient _api;
  final _storage = AuthTokenStorage.instance;

  Future<bool> get isSignedIn async {
    if (await _storage.hasSession()) return true;
    if (DevConfig.useMockAuth && await MockAuthSession.isSignedIn()) return true;
    return false;
  }

  static String normalizePhone(String input) {
    var digits = input.replaceAll(RegExp(r'\D'), '');
    if (digits.startsWith('84')) digits = digits.substring(2);
    if (digits.startsWith('0')) digits = digits.substring(1);
    if (digits.length < 9 || digits.length > 10) {
      throw const AuthException('Số điện thoại không hợp lệ.');
    }
    return '+84$digits';
  }

  Future<void> signIn({required String email, required String password}) async {
    if (DevConfig.useMockAuth &&
        MockAuthSession.isDemoCredential(email: email, password: password)) {
      await MockAuthSession.signIn();
      return;
    }

    final envelope = await _api.guard(
      () => _api.post('/auth/login', body: {
        'email': email.trim().toLowerCase(),
        'password': password,
      }),
    );

    await MockAuthSession.signOut();
    await _persistAuth(envelope);
    await _validateCustomerRole();
  }

  Future<void> signUp({
    required String email,
    required String password,
    required String fullName,
    required String phone,
  }) async {
    if (password.length < 8) {
      throw const AuthException('Mật khẩu cần ít nhất 8 ký tự.');
    }

    final envelope = await _api.guard(
      () => _api.post('/auth/register', body: {
        'email': email.trim().toLowerCase(),
        'password': password,
        'full_name': fullName.trim(),
        'phone': phone.trim(),
        'role': 'customer',
      }),
    );

    await MockAuthSession.signOut();
    await _persistAuth(envelope);
  }

  /// POST /auth/google — đăng nhập bằng Google (id_token → JWT Node).
  Future<void> signInWithGoogle() async {
    final idToken = await GoogleSignInService.instance.signInAndGetIdToken();

    final envelope = await _api.guard(
      () => _api.post('/auth/google', body: {'id_token': idToken}),
    );

    await MockAuthSession.signOut();
    await _persistAuth(envelope);
    await _validateCustomerRole();
  }

  Future<void> signOut() async {
    await MockAuthSession.signOut();
    await GoogleSignInService.instance.signOut();
    await _storage.clear();
    _api.setAccessToken(null);
  }

  /// PATCH /customers/me — chỉ gửi field có thay đổi.
  Future<CustomerProfile> updateProfile({
    String? fullName,
    String? phone,
    String? studentId,
    String? university,
    String? dateOfBirth,
    String? gender,
  }) async {
    final body = <String, dynamic>{};
    if (fullName != null) body['full_name'] = fullName;
    if (phone != null) body['phone'] = phone;
    if (studentId != null) body['student_id'] = studentId;
    if (university != null) body['university'] = university;
    if (dateOfBirth != null) body['date_of_birth'] = dateOfBirth;
    if (gender != null) body['gender'] = gender;
    if (body.isEmpty) throw const AuthException('Không có thông tin cập nhật.');

    final envelope = await _api.guard(() => _api.patch('/customers/me', body: body));
    final data = Map<String, dynamic>.from(envelope['data'] as Map);
    return CustomerProfile.fromJson(data);
  }

  /// POST /customers/me/avatar — upload ảnh đại diện (multipart) → trả URL mới.
  Future<String> uploadAvatar({required String filePath}) async {
    final envelope = await _api.guard(
      () => _api.uploadFile('/customers/me/avatar', filePath: filePath, field: 'avatar'),
    );
    final data = Map<String, dynamic>.from(envelope['data'] as Map);
    return data['avatar_url'] as String? ?? '';
  }

  Future<CustomerProfile> fetchMe() async {
    if (await _storage.hasSession()) {
      try {
        final envelope = await _api.guard(() => _api.get('/customers/me'));
        final user = Map<String, dynamic>.from(envelope['data'] as Map);
        return CustomerProfile.fromJson(user);
      } catch (_) {
        final envelope = await _api.guard(() => _api.get('/auth/me'));
        final user = Map<String, dynamic>.from(envelope['data'] as Map);
        return CustomerProfile.fromJson(user);
      }
    }

    if (await MockAuthSession.isSignedIn()) {
      return const CustomerProfile(
        id: 'mock',
        email: DevConfig.demoEmail,
        fullName: 'Demo User',
        phone: '+84901234567',
      );
    }

    throw const AuthException('Chưa đăng nhập.');
  }

  /// POST /auth/forgot-password — gửi OTP qua email (SMTP).
  Future<String> forgotPassword({required String email}) async {
    final envelope = await _api.guard(
      () => _api.post('/auth/forgot-password', body: {
        'email': email.trim().toLowerCase(),
      }),
    );
    return messageFromAuthEnvelope(
      envelope,
      fallback: 'Nếu email đã đăng ký, mã xác nhận đã được gửi.',
    );
  }

  /// POST /auth/reset-password — email + OTP + mật khẩu mới.
  Future<String> resetPassword({
    required String email,
    required String otp,
    required String newPassword,
  }) async {
    if (newPassword.length < 8) {
      throw const AuthException('Mật khẩu mới cần ít nhất 8 ký tự.');
    }

    final code = otp.trim();
    final envelope = await _api.guard(
      () => _api.post('/auth/reset-password', body: {
        'email': email.trim().toLowerCase(),
        'otp': code,
        'token': code,
        'new_password': newPassword,
      }),
    );
    return messageFromAuthEnvelope(
      envelope,
      fallback: 'Đặt lại mật khẩu thành công.',
    );
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    if (newPassword.length < 8) {
      throw const AuthException('Mật khẩu mới cần ít nhất 8 ký tự.');
    }

    await _api.guard(
      () => _api.post('/auth/change-password', body: {
        'old_password': currentPassword,
        'new_password': newPassword,
      }),
    );
  }

  Future<void> _persistAuth(Map<String, dynamic> envelope) async {
    final data = Map<String, dynamic>.from(envelope['data'] as Map);
    final token = data['accessToken'] as String?;
    final user = data['user'] as Map?;
    if (token == null || user == null) {
      throw const AuthException('Phản hồi đăng nhập không hợp lệ.');
    }
    final userMap = Map<String, dynamic>.from(user);
    await _storage.save(accessToken: token, user: userMap);
    _api.setAccessToken(token);
  }

  Future<void> _validateCustomerRole() async {
    final user = await _storage.loadUser();
    final role = user?['role'] as String?;
    if (role != null && role != 'customer') {
      await signOut();
      throw const AuthException('Tài khoản này không phải sinh viên (customer).');
    }
  }
}

/// Hồ sơ khách hàng — khớp `GET /api/customers/me`
/// (`profiles` + `customer_profiles`).
class CustomerProfile {
  const CustomerProfile({
    required this.id,
    required this.email,
    required this.fullName,
    this.phone,
    this.avatarUrl,
    this.role,
    this.status,
    this.dateOfBirth,
    this.gender,
    this.referralCode,
    this.lastSeenAt,
    this.createdAt,
    this.studentId,
    this.university,
    this.totalOrders,
    this.totalSpent,
    this.loyaltyPoints,
    this.preferredPaymentMethod,
  });

  factory CustomerProfile.fromJson(Map<String, dynamic> json) {
    return CustomerProfile(
      id: json['id'] as String? ?? '',
      email: json['email'] as String? ?? '',
      fullName: json['full_name'] as String? ?? '',
      phone: json['phone'] as String?,
      avatarUrl: json['avatar_url'] as String?,
      role: json['role'] as String?,
      status: json['status'] as String?,
      dateOfBirth: json['date_of_birth'] as String?,
      gender: json['gender'] as String?,
      referralCode: json['referral_code'] as String?,
      lastSeenAt: json['last_seen_at'] as String?,
      createdAt: json['created_at'] as String?,
      studentId: json['student_id'] as String?,
      university: json['university'] as String?,
      totalOrders: (json['total_orders'] as num?)?.toInt(),
      totalSpent: (json['total_spent'] as num?)?.toDouble(),
      loyaltyPoints: (json['loyalty_points'] as num?)?.toInt(),
      preferredPaymentMethod: json['preferred_payment_method'] as String?,
    );
  }

  final String id;
  final String email;
  final String fullName;
  final String? phone;
  final String? avatarUrl;
  final String? role;
  final String? status;
  final String? dateOfBirth;
  final String? gender;
  final String? referralCode;
  final String? lastSeenAt;
  final String? createdAt;
  final String? studentId;
  final String? university;
  final int? totalOrders;
  final double? totalSpent;
  final int? loyaltyPoints;
  final String? preferredPaymentMethod;

  CustomerProfile copyWith({
    String? fullName,
    String? phone,
    String? avatarUrl,
    String? dateOfBirth,
    String? gender,
    String? studentId,
    String? university,
    int? totalOrders,
    double? totalSpent,
    int? loyaltyPoints,
    String? preferredPaymentMethod,
  }) {
    return CustomerProfile(
      id: id,
      email: email,
      fullName: fullName ?? this.fullName,
      phone: phone ?? this.phone,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      role: role,
      status: status,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      gender: gender ?? this.gender,
      referralCode: referralCode,
      lastSeenAt: lastSeenAt,
      createdAt: createdAt,
      studentId: studentId ?? this.studentId,
      university: university ?? this.university,
      totalOrders: totalOrders ?? this.totalOrders,
      totalSpent: totalSpent ?? this.totalSpent,
      loyaltyPoints: loyaltyPoints ?? this.loyaltyPoints,
      preferredPaymentMethod: preferredPaymentMethod ?? this.preferredPaymentMethod,
    );
  }
}

class AuthException implements Exception {
  const AuthException(this.message);
  final String message;

  @override
  String toString() => message;
}
