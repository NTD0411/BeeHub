import 'package:flutter/material.dart';

import '../../features/payments/domain/payment_method_models.dart';

abstract final class MockPaymentMethodsData {
  static const addOptions = [
    AddPaymentMethodOption(
      id: 'card',
      label: 'Thẻ',
      kind: PaymentMethodKind.card,
      brandColor: Color(0xFF0D9488),
      icon: Icons.credit_card,
    ),
    AddPaymentMethodOption(
      id: 'momo',
      label: 'MoMo',
      kind: PaymentMethodKind.momo,
      brandColor: Color(0xFFA50064),
    ),
    AddPaymentMethodOption(
      id: 'payos',
      label: 'PayOS',
      kind: PaymentMethodKind.payos,
      brandColor: Color(0xFF2563EB),
      icon: Icons.qr_code_2,
    ),
  ];

  static const List<SavedPaymentMethod> methods = [
    SavedPaymentMethod(
      id: 'payos',
      name: 'PayOS',
      subtitle: 'QR ngân hàng · Thẻ nội địa',
      kind: PaymentMethodKind.payos,
      isDefault: true,
    ),
    SavedPaymentMethod(
      id: 'momo',
      name: 'MoMo',
      subtitle: 'Đã liên kết ·••• 4321',
      kind: PaymentMethodKind.momo,
    ),
  ];
}
