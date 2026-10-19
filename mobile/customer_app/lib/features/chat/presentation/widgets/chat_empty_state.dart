import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/smooth_cta_button.dart';

/// Empty state tab Chat — khi chưa có đơn / chưa có tài xế (Grab-style).
class ChatEmptyState extends StatelessWidget {
  const ChatEmptyState({
    super.key,
    required this.variant,
  });

  final ChatEmptyVariant variant;

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    final (icon, title, subtitle, cta) = switch (variant) {
      ChatEmptyVariant.noActiveOrder => (
          Icons.chat_bubble_outline_rounded,
          'Chưa có cuộc trò chuyện',
          'Chat mở khi nhà xe xác nhận lịch chuyển trọ. Vào Tiến trình báo giá để nhắn tin.',
          ('Đặt dịch vụ ngay', '/booking/location'),
        ),
      ChatEmptyVariant.waitingDriver => (
          Icons.hourglass_empty_rounded,
          'Đang chờ tài xế',
          'Đơn của bạn đang được ghép tài xế. Bạn sẽ nhắn tin được khi tài xế nhận đơn.',
          ('Xem đơn hàng', null),
        ),
    };

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: 32.w),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 88.w,
              height: 88.w,
              decoration: BoxDecoration(
                color: c.surfaceTint,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 40.sp, color: c.onSurfaceMuted),
            ),
            SizedBox(height: 24.h),
            Text(
              title,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 20.sp,
                fontWeight: FontWeight.w700,
                color: c.onSurface,
              ),
            ),
            SizedBox(height: 10.h),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14.sp,
                height: 1.45,
                color: c.onSurfaceMuted,
              ),
            ),
            if (cta.$2 != null) ...[
              SizedBox(height: 28.h),
              SmoothCtaButton(
                label: cta.$1,
                showArrow: false,
                onPressed: () => context.push(cta.$2!),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

enum ChatEmptyVariant { noActiveOrder, waitingDriver }
