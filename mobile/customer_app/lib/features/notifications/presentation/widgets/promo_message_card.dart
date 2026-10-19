import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../../core/router/app_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/uni_move_colors.dart';
import '../../domain/notification_models.dart';

/// Thẻ ưu đãi trong kênh — layout Grab (banner → tiêu đề → mô tả ngắn → CTA xanh).
class PromoMessageCard extends StatelessWidget {
  const PromoMessageCard({
    super.key,
    required this.notification,
    this.onCtaPressed,
  });

  final AppNotification notification;
  final VoidCallback? onCtaPressed;

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);
    final n = notification;
    final isLight = c.isLight(context);

    return Padding(
      padding: EdgeInsets.only(bottom: 4.h),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Material(
            color: c.surface,
            elevation: isLight ? 1 : 0,
            shadowColor: c.navBarShadow,
            borderRadius: BorderRadius.circular(14.r),
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14.r),
                border: isLight ? null : Border.all(color: c.border),
              ),
              clipBehavior: Clip.antiAlias,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                mainAxisSize: MainAxisSize.min,
                children: [
                  _PromoHeroBanner(notificationId: n.id),
                  Padding(
                    padding: EdgeInsets.fromLTRB(14.w, 12.h, 14.w, 14.h),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          n.title,
                          style: TextStyle(
                            fontSize: 15.sp,
                            fontWeight: FontWeight.w700,
                            height: 1.35,
                            color: c.onSurface,
                          ),
                        ),
                        if (n.subtitle != null) ...[
                          SizedBox(height: 6.h),
                          Text(
                            n.subtitle!,
                            style: TextStyle(
                              fontSize: 14.sp,
                              height: 1.35,
                              color: c.onSurfaceMuted,
                            ),
                          ),
                        ],
                        SizedBox(height: 12.h),
                        SizedBox(
                          width: double.infinity,
                          height: 42.h,
                          child: FilledButton(
                            onPressed: onCtaPressed ??
                                () {
                                  if (n.actionRoute != null) {
                                    AppRouter.router.push(n.actionRoute!);
                                  }
                                },
                            style: FilledButton.styleFrom(
                              backgroundColor: c.success,
                              foregroundColor: Colors.white,
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8.r),
                              ),
                            ),
                            child: Text(
                              n.ctaLabel,
                              style: TextStyle(fontSize: 15.sp, fontWeight: FontWeight.w600),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          Padding(
            padding: EdgeInsets.only(top: 4.h, right: 4.w, bottom: 12.h),
            child: Align(
              alignment: Alignment.centerRight,
              child: Text(
                _formatTime(n.createdAt),
                style: TextStyle(fontSize: 11.sp, color: c.onSurfaceMuted),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final h = dt.hour > 12 ? dt.hour - 12 : (dt.hour == 0 ? 12 : dt.hour);
    final suffix = dt.hour >= 12 ? 'CH' : 'SA';
    return '$h:${dt.minute.toString().padLeft(2, '0')} $suffix';
  }
}

/// Banner trang trí — không chèn tiêu đề (tránh trùng & overflow).
class _PromoHeroBanner extends StatelessWidget {
  const _PromoHeroBanner({required this.notificationId});

  final String notificationId;

  @override
  Widget build(BuildContext context) {
    final variant = notificationId.hashCode.abs() % 3;
    final gradients = [
      [const Color(0xFFFF6B6B), const Color(0xFFFF8E53), AppColors.accent],
      [AppColors.primaryDark, AppColors.primary, AppColors.primaryLight],
      [const Color(0xFF0D9488), const Color(0xFF14B8A6), const Color(0xFF5EEAD4)],
    ];
    final colors = gradients[variant];

    return SizedBox(
      height: 110.h,
      child: Stack(
        fit: StackFit.expand,
        children: [
          DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
                colors: colors,
              ),
            ),
          ),
          Positioned(
            right: 12.w,
            bottom: 8.h,
            child: Icon(
              Icons.local_shipping_rounded,
              size: 56.sp,
              color: Colors.white.withValues(alpha: 0.35),
            ),
          ),
          Positioned(
            left: 14.w,
            bottom: 12.h,
            child: Container(
              padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 4.h),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.22),
                borderRadius: BorderRadius.circular(6.r),
              ),
              child: Text(
                'UniMove',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                  fontSize: 11.sp,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
