import '../domain/payment_method_models.dart';
import '../domain/payment_models.dart';

abstract final class PaymentsApiMapper {
  static CustomerPayment paymentFromJson(Map<String, dynamic> j) {
    final orderId = j['order_id'] as String? ?? '';
    final statusRaw = j['status'] as String? ?? 'pending';
    final purpose = j['payment_purpose'] as String? ?? 'deposit';

    return CustomerPayment(
      id: j['id'] as String,
      orderId: orderId,
      orderNumber: _orderLabel(orderId, j['payment_code'] as String?),
      amount: (j['amount'] as num?)?.round() ?? 0,
      type: _paymentType(purpose),
      status: _paymentStatus(statusRaw),
      method: _methodLabel(j['payment_method'] as String?),
      createdAt: DateTime.parse(j['created_at'] as String).toLocal(),
      description: j['description'] as String?,
    );
  }

  static PaymentDetail detailFromJson(Map<String, dynamic> j) {
    final payment = paymentFromJson(j);
    final paidAtRaw = j['paid_at'] as String? ?? j['created_at'] as String;

    return PaymentDetail(
      payment: payment,
      paymentCode: j['payment_code'] as String? ?? payment.id,
      transactionId: j['payos_order_id'] as String? ?? j['id'] as String,
      serviceLabel: j['description'] as String? ?? 'Thanh toán UniMove',
      serviceCategory: 'Thanh toán',
      paidAt: DateTime.parse(paidAtRaw).toLocal(),
      escrowStatus: j['escrow_status'] as String?,
      maskedAccount: _methodLabel(j['payment_method'] as String?),
      breakdown: [
        PaymentBreakdownLine(
          label: _methodLabel(j['payment_method'] as String?),
          amount: payment.formattedAmount,
        ),
      ],
    );
  }

  static SavedPaymentMethod savedMethodFromJson(Map<String, dynamic> j) {
    final kindRaw = j['kind'] as String? ?? 'payos';
    return SavedPaymentMethod(
      id: j['id'] as String,
      name: _kindName(kindRaw),
      subtitle: j['label'] as String? ?? '',
      kind: _methodKind(kindRaw),
      isDefault: j['is_default'] as bool? ?? false,
      isLinked: j['is_active'] as bool? ?? true,
    );
  }

  static String kindToApi(PaymentMethodKind kind) => switch (kind) {
        PaymentMethodKind.payos => 'payos',
        PaymentMethodKind.momo => 'momo',
        PaymentMethodKind.card => 'credit_card',
        PaymentMethodKind.wallet => 'bank_transfer',
      };

  static String _orderLabel(String orderId, String? paymentCode) {
    if (paymentCode != null && paymentCode.isNotEmpty) return paymentCode;
    if (orderId.length >= 8) return orderId.substring(0, 8).toUpperCase();
    return orderId.isEmpty ? '—' : orderId;
  }

  static PaymentType _paymentType(String purpose) => switch (purpose) {
        'full_payment' => PaymentType.fullPayment,
        'refund' => PaymentType.refund,
        _ => PaymentType.deposit,
      };

  static PaymentStatus _paymentStatus(String status) => switch (status) {
        'completed' => PaymentStatus.completed,
        'refunded' => PaymentStatus.refunded,
        'failed' || 'cancelled' => PaymentStatus.failed,
        _ => PaymentStatus.pending,
      };

  static PaymentMethodKind _methodKind(String kind) => switch (kind) {
        'momo' => PaymentMethodKind.momo,
        'credit_card' || 'debit_card' => PaymentMethodKind.card,
        'bank_transfer' => PaymentMethodKind.wallet,
        _ => PaymentMethodKind.payos,
      };

  static String _kindName(String kind) => switch (kind) {
        'momo' => 'MoMo',
        'credit_card' || 'debit_card' => 'Thẻ',
        'bank_transfer' => 'Chuyển khoản',
        _ => 'PayOS',
      };

  static String _methodLabel(String? method) {
    if (method == null || method == 'payos') return 'PayOS';
    return switch (method) {
      'momo' => 'MoMo',
      'credit_card' || 'debit_card' => 'Thẻ',
      'bank_transfer' => 'Chuyển khoản',
      _ => method,
    };
  }
}
