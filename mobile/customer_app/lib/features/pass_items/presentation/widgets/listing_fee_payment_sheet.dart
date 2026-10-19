import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Mở trang thanh toán phí đăng tin (QR PayOS).
class ListingFeePaymentSheet {
  static Future<bool> show(
    BuildContext context, {
    required String listingId,
    required int fee,
  }) {
    return context.push<bool>(
      '/pass-items/$listingId/pay-fee?fee=$fee',
    ).then((v) => v == true);
  }
}
