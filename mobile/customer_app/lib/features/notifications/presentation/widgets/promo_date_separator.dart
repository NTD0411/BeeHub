import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../../core/theme/uni_move_colors.dart';

/// Nhãn ngày giữa các thẻ — kiểu kênh Grab.
class PromoDateSeparator extends StatelessWidget {
  const PromoDateSeparator({super.key, required this.date});

  final DateTime date;

  static String labelFor(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final d = DateTime(date.year, date.month, date.day);
    const weekdays = ['', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    final wd = weekdays[date.weekday];
    if (d == today) return 'Hôm nay';
    return '$wd, ${date.day} thg ${date.month}';
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 14.h),
      child: Center(
        child: Text(
          labelFor(date),
          style: TextStyle(fontSize: 13.sp, color: c.onSurfaceMuted, fontWeight: FontWeight.w500),
        ),
      ),
    );
  }
}
