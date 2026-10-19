import 'package:flutter/material.dart';

/// Phương thức thanh toán đã liên kết — khớp PayOS / MoMo / ví trong dự án.
enum PaymentMethodKind { wallet, payos, momo, card }

class SavedPaymentMethod {
  const SavedPaymentMethod({
    required this.id,
    required this.name,
    required this.subtitle,
    required this.kind,
    this.isDefault = false,
    this.isLinked = true,
  });

  final String id;
  final String name;
  final String subtitle;
  final PaymentMethodKind kind;
  final bool isDefault;
  final bool isLinked;
}

/// Tuỳ chọn khi thêm phương thức mới.
class AddPaymentMethodOption {
  const AddPaymentMethodOption({
    required this.id,
    required this.label,
    required this.kind,
    required this.brandColor,
    this.icon,
  });

  final String id;
  final String label;
  final PaymentMethodKind kind;
  final Color brandColor;
  final IconData? icon;
}
