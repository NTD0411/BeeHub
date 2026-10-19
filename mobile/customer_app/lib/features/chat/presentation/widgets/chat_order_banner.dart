import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/uni_move_colors.dart';
import '../../domain/active_chat_context.dart';

/// Thanh ngữ cảnh đơn hàng phía trên khung chat (Grab-style).
class ChatOrderBanner extends StatelessWidget {
  const ChatOrderBanner({super.key, required this.activeChat});

  final ActiveChatContext activeChat;

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);
    final order = activeChat.order;

    return Material(
      color: c.surfaceTint,
      child: InkWell(
        onTap: () => context.push('/orders/${order.id}/tracking'),
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 10.h),
          child: Row(
            children: [
              Icon(Icons.local_shipping_outlined, color: c.primary, size: 20.sp),
              SizedBox(width: 10.w),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Đơn #${order.orderNumber}',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 13.sp,
                        color: c.onSurface,
                      ),
                    ),
                    Text(
                      activeChat.statusLabel,
                      style: TextStyle(fontSize: 12.sp, color: c.primary),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: c.onSurfaceMuted, size: 22.sp),
            ],
          ),
        ),
      ),
    );
  }
}
