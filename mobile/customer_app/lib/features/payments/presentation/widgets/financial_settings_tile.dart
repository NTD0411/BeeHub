import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/pressable_scale.dart';

/// Một dòng cài đặt — layout Grab (icon tròn + tiêu đề + mô tả + chevron).
class FinancialSettingsTile extends StatelessWidget {
  const FinancialSettingsTile({
    super.key,
    required this.icon,
    required this.iconColor,
    required this.iconBgColor,
    required this.title,
    required this.subtitle,
    this.onTap,
  });

  final IconData icon;
  final Color iconColor;
  final Color iconBgColor;
  final String title;
  final String subtitle;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    return PressableScale(
      onTap: onTap,
      child: Padding(
        padding: EdgeInsets.symmetric(vertical: 14.h),
        child: Row(
          children: [
            Container(
              width: 44.w,
              height: 44.w,
              decoration: BoxDecoration(color: iconBgColor, shape: BoxShape.circle),
              child: Icon(icon, color: iconColor, size: 22.sp),
            ),
            SizedBox(width: 14.w),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 15.sp,
                      fontWeight: FontWeight.w700,
                      color: c.onSurface,
                    ),
                  ),
                  SizedBox(height: 4.h),
                  Text(
                    subtitle,
                    style: TextStyle(fontSize: 13.sp, height: 1.35, color: c.onSurfaceMuted),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: c.onSurfaceMuted, size: 22.sp),
          ],
        ),
      ),
    );
  }
}
