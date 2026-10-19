import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../../core/theme/uni_move_colors.dart';

/// Chip lọc ngang — kiểu Grab / Lịch sử hoạt động.
class ActivityHistoryFilterBar extends StatelessWidget {
  const ActivityHistoryFilterBar({
    super.key,
    required this.labels,
    required this.selectedIndex,
    required this.onSelected,
  });

  final List<String> labels;
  final int selectedIndex;
  final ValueChanged<int> onSelected;

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    return SizedBox(
      height: 40.h,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: EdgeInsets.symmetric(horizontal: 20.w),
        itemCount: labels.length,
        separatorBuilder: (_, __) => SizedBox(width: 8.w),
        itemBuilder: (context, i) {
          final selected = i == selectedIndex;
          return GestureDetector(
            onTap: () => onSelected(i),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              curve: Curves.easeOutCubic,
              padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 8.h),
              decoration: BoxDecoration(
                color: selected ? const Color(0xFF0F5132) : c.chipBg,
                borderRadius: BorderRadius.circular(20.r),
                border: Border.all(
                  color: selected ? const Color(0xFF0F5132) : c.border.withValues(alpha: 0.5),
                ),
              ),
              child: Text(
                labels[i],
                style: TextStyle(
                  fontSize: 14.sp,
                  fontWeight: FontWeight.w600,
                  color: selected ? Colors.white : c.onSurface,
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
