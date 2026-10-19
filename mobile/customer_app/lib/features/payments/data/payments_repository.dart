import '../../../core/auth/auth_token_storage.dart';
import '../../../core/config/dev_config.dart';
import '../../../core/mock/mock_auth_session.dart';
import '../../../core/mock/mock_payments_data.dart';
import '../../../core/mock/mock_payment_methods_data.dart';
import '../../../core/network/api_client.dart';
import '../domain/payment_method_models.dart';
import '../domain/payment_models.dart';
import 'payments_api_mapper.dart';

class PaymentsRepository {
  PaymentsRepository({ApiClient? api}) : _api = api ?? ApiClient.instance;

  final ApiClient _api;

  Future<bool> _useMockData() async {
    if (DevConfig.useMockAuth && await MockAuthSession.isSignedIn()) return true;
    return !(await AuthTokenStorage.instance.hasSession());
  }

  Future<List<SavedPaymentMethod>> fetchSavedPaymentMethods() async {
    if (await _useMockData()) {
      await Future<void>.delayed(const Duration(milliseconds: 60));
      return MockPaymentMethodsData.methods;
    }

    try {
      final envelope = await _api.guard(() => _api.get('/payments/me/payment-methods'));
      final raw = envelope['data'];
      if (raw is! List) return [];
      return raw
          .map((e) => PaymentsApiMapper.savedMethodFromJson(Map<String, dynamic>.from(e as Map)))
          .where((m) => m.kind != PaymentMethodKind.wallet)
          .toList();
    } catch (_) {
      return [];
    }
  }

  Future<List<AddPaymentMethodOption>> fetchAddPaymentOptions() async {
    await Future<void>.delayed(const Duration(milliseconds: 40));
    return MockPaymentMethodsData.addOptions
        .where((o) => o.kind != PaymentMethodKind.wallet)
        .toList();
  }

  Future<List<CustomerPayment>> fetchRecentPayments({int limit = 10}) async {
    if (await _useMockData()) {
      await Future<void>.delayed(const Duration(milliseconds: 100));
      return MockPaymentsData.payments.take(limit).toList();
    }

    try {
      final envelope = await _api.guard(() => _api.get('/payments/me'));
      final raw = envelope['data'];
      if (raw is! List) return [];
      return raw
          .map((e) => PaymentsApiMapper.paymentFromJson(Map<String, dynamic>.from(e as Map)))
          .take(limit)
          .toList();
    } catch (_) {
      return [];
    }
  }

  Future<PaymentDetail?> fetchDetail(String paymentId) async {
    if (await _useMockData()) {
      await Future<void>.delayed(const Duration(milliseconds: 80));
      try {
        return MockPaymentsData.detailFor(paymentId);
      } catch (_) {
        return null;
      }
    }

    try {
      final envelope = await _api.guard(() => _api.get('/payments/me/$paymentId'));
      final data = envelope['data'];
      if (data is! Map) return null;
      return PaymentsApiMapper.detailFromJson(Map<String, dynamic>.from(data));
    } catch (_) {
      return null;
    }
  }

  Future<SavedPaymentMethod> addPaymentMethod({
    required PaymentMethodKind kind,
    required String label,
    required String tokenRef,
    Map<String, dynamic>? metadata,
  }) async {
    final envelope = await _api.guard(
      () => _api.post('/payments/me/payment-methods', body: {
        'kind': PaymentsApiMapper.kindToApi(kind),
        'label': label,
        'token_ref': tokenRef,
        if (metadata != null) 'metadata': metadata,
      }),
    );
    final data = envelope['data'];
    if (data is! Map) {
      throw ApiException('Không thêm được phương thức thanh toán');
    }
    return PaymentsApiMapper.savedMethodFromJson(Map<String, dynamic>.from(data));
  }

  Future<void> setDefaultPaymentMethod(String id) async {
    await _api.guard(
      () => _api.patch('/payments/me/payment-methods/$id', body: {'is_default': true}),
    );
  }

  Future<void> deletePaymentMethod(String id) async {
    await _api.guard(() => _api.delete('/payments/me/payment-methods/$id'));
  }
}
