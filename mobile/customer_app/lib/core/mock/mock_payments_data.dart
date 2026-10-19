import '../../features/payments/domain/payment_models.dart';
import 'mock_orders_data.dart';

abstract final class MockPaymentsData {
  static final List<CustomerPayment> payments = [
    CustomerPayment(
      id: 'pay-001',
      orderId: MockOrdersData.activeOrderId,
      orderNumber: 'UM-29304',
      amount: 135000,
      type: PaymentType.deposit,
      status: PaymentStatus.completed,
      method: 'PayOS',
      createdAt: DateTime(2023, 10, 15, 9, 30),
      description: 'Đặt cọc 30% đơn chuyển trọ',
    ),
    CustomerPayment(
      id: 'pay-002',
      orderId: MockOrdersData.completedOrderId,
      orderNumber: 'UM-28801',
      amount: 450000,
      type: PaymentType.fullPayment,
      status: PaymentStatus.completed,
      method: 'MoMo',
      createdAt: DateTime(2023, 10, 15, 14, 30),
      description: 'Thanh toán đơn chuyển trọ',
    ),
    CustomerPayment(
      id: 'pay-003',
      orderId: MockOrdersData.cancelledOrderId,
      orderNumber: 'UM-28112',
      amount: 215000,
      type: PaymentType.refund,
      status: PaymentStatus.refunded,
      method: 'PayOS',
      createdAt: DateTime(2023, 9, 2, 10, 15),
      description: 'Hoàn 100% — hủy trước khi tài xế nhận',
    ),
  ];

  static PaymentDetail detailFor(String paymentId) {
    final payment = payments.firstWhere((p) => p.id == paymentId, orElse: () => payments.first);
    return switch (paymentId) {
      'pay-001' => PaymentDetail(
          payment: payment,
          paymentCode: 'PAY-20231015-0001',
          transactionId: '1e5c983660d547498884cccc5cad7281',
          serviceLabel: 'Chuyển trọ · Gói Tiêu chuẩn',
          serviceCategory: 'Chuyển trọ',
          paidAt: DateTime(2023, 10, 15, 9, 30),
          escrowStatus: 'held',
          maskedAccount: 'PayOS · QR',
          breakdown: const [
            PaymentBreakdownLine(label: 'PayOS', amount: '135.000đ'),
          ],
        ),
      'pay-002' => PaymentDetail(
          payment: payment,
          paymentCode: 'PAY-20231015-0002',
          transactionId: '1e5c983660d547498884cccc5cad7282',
          serviceLabel: 'Chuyển trọ · Gói Tiêu chuẩn',
          serviceCategory: 'Chuyển trọ',
          paidAt: DateTime(2023, 10, 15, 14, 30),
          escrowStatus: 'released',
          maskedAccount: 'MoMo ·••• 4321',
          breakdown: const [
            PaymentBreakdownLine(label: 'MoMo', amount: '450.000đ'),
          ],
          reviewRating: 5,
          reviewComment: 'Tuyệt vời',
        ),
      'pay-003' => PaymentDetail(
          payment: payment,
          paymentCode: 'PAY-20230902-0003',
          transactionId: '1e5c983660d547498884cccc5cad7283',
          serviceLabel: 'Chuyển trọ · Gói Tiết kiệm',
          serviceCategory: 'Chuyển trọ',
          paidAt: DateTime(2023, 9, 2, 10, 15),
          escrowStatus: 'refunded',
          maskedAccount: 'PayOS · QR',
          breakdown: const [
            PaymentBreakdownLine(label: 'PayOS', amount: '215.000đ'),
          ],
        ),
      _ => PaymentDetail(
          payment: payment,
          paymentCode: 'PAY-${payment.id}',
          transactionId: payment.id,
          serviceLabel: 'Chuyển trọ',
          serviceCategory: 'Chuyển trọ',
          paidAt: payment.createdAt,
        ),
    };
  }
}
