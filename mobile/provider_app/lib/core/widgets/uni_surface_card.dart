import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../theme/uni_move_colors.dart';

/// Card nền theo theme — dùng thay Container lặp lại.
class UniSurfaceCard extends StatelessWidget {
  const UniSurfaceCard({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.onTap,
  });

  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final card = Container(
      margin: margin,
      padding: padding ?? EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(16.r),
        border: Border.all(color: c.border),
        boxShadow: isDark
            ? null
            : [
                BoxShadow(
                  color: c.navBarShadow,
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
      ),
      child: child,
    );

    if (onTap == null) return card;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16.r),
        child: card,
      ),
    );
  }
}
