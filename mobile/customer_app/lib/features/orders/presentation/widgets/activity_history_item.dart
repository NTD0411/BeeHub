import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/pressable_scale.dart';
import '../../domain/order_models.dart';

/// Một dòng lịch sử hoạt động — layout Grab (icon · tuyến · giá · Đặt lại).
class ActivityHistoryItem extends StatelessWidget {
  const ActivityHistoryItem({
    super.key,
    required this.order,
    required this.index,
    this.onTap,
    this.onReorder,
  });

  final CustomerOrder order;
  final int index;
  final VoidCallback? onTap;
  final VoidCallback? onReorder;

  static String formatTime(DateTime dt) {
    final h = dt.hour.toString().padLeft(2, '0');
    final m = dt.minute.toString().padLeft(2, '0');
    return '$h:$m, ${dt.day} thg ${dt.month} ${dt.year}';
  }

  String get _actionLabel => switch (order.status) {
        OrderStatus.pending ||
        OrderStatus.accepted ||
        OrderStatus.pickingUp ||
        OrderStatus.inProgress =>
          'Theo dõi',
        OrderStatus.completed when !order.hasReview => 'Đánh giá',
        OrderStatus.completed => 'Đặt lại',
        OrderStatus.cancelled => 'Chi tiết',
        _ => 'Xem',
      };

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);
    final time = order.completedAt ?? order.createdAt;
    final showReorder = order.status == OrderStatus.completed;

    return PressableScale(
      onTap: onTap,
      child: Padding(
        padding: EdgeInsets.symmetric(vertical: 14.h),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: EdgeInsets.only(top: 2.h),
              child: Icon(
                Icons.local_shipping_rounded,
                size: 22.sp,
                color: c.success,
              ),
            ),
            SizedBox(width: 12.w),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          order.activityRouteTitle,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 15.sp,
                            fontWeight: FontWeight.w700,
                            height: 1.3,
                            color: c.onSurface,
                            decoration: TextDecoration.none,
                          ),
                        ),
                      ),
                      SizedBox(width: 8.w),
                      Text(
                        order.formattedPrice,
                        style: TextStyle(
                          fontSize: 15.sp,
                          fontWeight: FontWeight.w700,
                          color: c.onSurface,
                          decoration: TextDecoration.none,
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 4.h),
                  Text(
                    '${order.activityMetaLine} · ${formatTime(time)}',
                    style: TextStyle(
                      fontSize: 13.sp,
                      color: c.onSurfaceMuted,
                      decoration: TextDecoration.none,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  SizedBox(height: 6.h),
                  GestureDetector(
                    onTap: showReorder ? onReorder : onTap,
                    behavior: HitTestBehavior.opaque,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          _actionLabel,
                          style: TextStyle(
                            fontSize: 14.sp,
                            fontWeight: FontWeight.w600,
                            color: c.primary,
                            decoration: TextDecoration.none,
                          ),
                        ),
                        Icon(Icons.arrow_forward, size: 16.sp, color: c.primary),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    )
        .animate()
        .fadeIn(duration: 260.ms, delay: (35 * index).ms, curve: Curves.easeOut)
        .slideX(begin: 0.02, end: 0, duration: 280.ms, delay: (35 * index).ms, curve: Curves.easeOutCubic);
  }
}
