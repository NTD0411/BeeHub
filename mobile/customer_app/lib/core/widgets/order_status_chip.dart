import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../features/orders/domain/order_models.dart';

class OrderStatusChip extends StatelessWidget {
  const OrderStatusChip({super.key, required this.status});

  final OrderStatus status;

  @override
  Widget build(BuildContext context) {
    final (label, fg, bg, icon) = switch (status) {
      OrderStatus.completed => (
          'Đã hoàn thành',
          const Color(0xFF16A34A),
          const Color(0xFFD1FAE5),
          Icons.check_circle_outline,
        ),
      OrderStatus.cancelled => (
          'Đã hủy',
          const Color(0xFFDC2626),
          const Color(0xFFFEE2E2),
          Icons.cancel_outlined,
        ),
      OrderStatus.matched => (
          'Chờ nhà xe',
          const Color(0xFFF59E0B),
          const Color(0xFFFEF3C7),
          Icons.hourglass_top_rounded,
        ),
      OrderStatus.pickingUp || OrderStatus.inProgress || OrderStatus.accepted => (
          'Đang đến',
          const Color(0xFF004AC6),
          const Color(0xFFDBEAFE),
          Icons.local_shipping_outlined,
        ),
      _ => (
          'Chờ xử lý',
          const Color(0xFF64748B),
          const Color(0xFFF1F5F9),
          Icons.schedule,
        ),
    };

    return Container(
      padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 5.h),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(99.r),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14.sp, color: fg),
          SizedBox(width: 4.w),
          Text(
            label,
            style: TextStyle(fontSize: 11.sp, fontWeight: FontWeight.w700, color: fg),
          ),
        ],
      ),
    );
  }
}
