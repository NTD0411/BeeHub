/// Kết quả checkout — đơn hàng + thông tin đặt cọc PayOS (nếu có).
class DepositPaymentInfo {
  const DepositPaymentInfo({
    required this.paymentId,
    required this.paymentCode,
    required this.amount,
    this.qrCode,
    this.checkoutUrl,
    this.bankAccountNumber,
    this.bankAccountName,
  });

  final String paymentId;
  final String paymentCode;
  final int amount;
  final String? qrCode;
  final String? checkoutUrl;
  final String? bankAccountNumber;
  final String? bankAccountName;

  bool get hasQrImage =>
      qrCode != null &&
      (qrCode!.startsWith('http://') || qrCode!.startsWith('https://') || qrCode!.startsWith('data:image'));

  /// PayOS trả chuỗi VietQR (EMVCo) — cần render bằng qr_flutter, không phải ảnh.
  bool get hasVietQrPayload =>
      qrCode != null &&
      qrCode!.isNotEmpty &&
      !hasQrImage;
}

class CheckoutResult {
  const CheckoutResult({required this.orderId, this.deposit});

  final String orderId;
  final DepositPaymentInfo? deposit;
}
