/// Khớp bảng `payments` + `refunds` trong Supabase.
enum PaymentType { deposit, fullPayment, refund }

enum PaymentStatus { pending, completed, failed, refunded }

class CustomerPayment {
  const CustomerPayment({
    required this.id,
    required this.orderId,
    required this.orderNumber,
    required this.amount,
    required this.type,
    required this.status,
    required this.method,
    required this.createdAt,
    this.description,
  });

  final String id;
  final String orderId;
  final String orderNumber;
  final int amount;
  final PaymentType type;
  final PaymentStatus status;
  final String method;
  final DateTime createdAt;
  final String? description;

  String get formattedAmount {
    final s = amount.toString();
    final buf = StringBuffer();
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buf.write('.');
      buf.write(s[i]);
    }
    return '${buf}đ';
  }

  String get title => switch (type) {
        PaymentType.deposit => 'Đặt cọc — #$orderNumber',
        PaymentType.fullPayment => 'Thanh toán — #$orderNumber',
        PaymentType.refund => 'Hoàn tiền — #$orderNumber',
      };

  String get statusLabel => switch (status) {
        PaymentStatus.pending => 'Đang xử lý',
        PaymentStatus.completed => 'Thành công',
        PaymentStatus.failed => 'Thất bại',
        PaymentStatus.refunded => 'Đã hoàn tiền',
      };
}

/// Chi tiết giao dịch — JOIN payments + orders + reviews.
class PaymentBreakdownLine {
  const PaymentBreakdownLine({required this.label, required this.amount});
  final String label;
  final String amount;
}

class PaymentDetail {
  const PaymentDetail({
    required this.payment,
    required this.paymentCode,
    required this.transactionId,
    required this.serviceLabel,
    required this.serviceCategory,
    required this.paidAt,
    this.escrowStatus,
    this.maskedAccount,
    this.reviewRating,
    this.reviewComment,
    this.breakdown = const [],
  });

  final CustomerPayment payment;
  final String paymentCode;
  final String transactionId;
  final String serviceLabel;
  final String serviceCategory;
  final DateTime paidAt;
  final String? escrowStatus;
  final String? maskedAccount;
  final int? reviewRating;
  final String? reviewComment;
  final List<PaymentBreakdownLine> breakdown;

  String get paidStatusLabel => switch (payment.status) {
        PaymentStatus.refunded => 'Bạn đã được hoàn tiền',
        PaymentStatus.completed => 'Bạn đã thanh toán',
        PaymentStatus.pending => 'Đang chờ thanh toán',
        _ => payment.statusLabel,
      };

  String get formattedPaidAt {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    final h = paidAt.hour > 12 ? paidAt.hour - 12 : (paidAt.hour == 0 ? 12 : paidAt.hour);
    final suffix = paidAt.hour >= 12 ? 'PM' : 'AM';
    return '${paidAt.day.toString().padLeft(2, '0')} ${months[paidAt.month - 1]} ${paidAt.year}, $h:${paidAt.minute.toString().padLeft(2, '0')} $suffix';
  }
}
