import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../theme/uni_move_colors.dart';

/// Nút CTA — scale nhẹ khi nhấn, không dùng ripple nặng.
class SmoothCtaButton extends StatefulWidget {
  const SmoothCtaButton({
    super.key,
    required this.label,
    this.onPressed,
    this.showArrow = true,
    this.isLoading = false,
    this.outlined = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool showArrow;
  final bool isLoading;
  final bool outlined;

  @override
  State<SmoothCtaButton> createState() => _SmoothCtaButtonState();
}

class _SmoothCtaButtonState extends State<SmoothCtaButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);
    final enabled = widget.onPressed != null && !widget.isLoading;

    return SizedBox(
      width: double.infinity,
      child: GestureDetector(
        onTapDown: enabled ? (_) => setState(() => _pressed = true) : null,
        onTapUp: enabled
            ? (_) {
                setState(() => _pressed = false);
                widget.onPressed?.call();
              }
            : null,
        onTapCancel: enabled ? () => setState(() => _pressed = false) : null,
        child: AnimatedScale(
          scale: _pressed ? 0.97 : 1,
          duration: const Duration(milliseconds: 100),
          curve: Curves.easeOutCubic,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            height: 48.h,
            alignment: Alignment.center,
            padding: EdgeInsets.symmetric(horizontal: 12.w),
            decoration: BoxDecoration(
              gradient: widget.outlined
                  ? null
                  : LinearGradient(colors: [c.primary, c.primaryLight]),
              color: widget.outlined ? Colors.transparent : null,
              borderRadius: BorderRadius.circular(24.r),
              border: widget.outlined
                  ? Border.all(color: c.primary, width: 1.5)
                  : null,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (widget.isLoading)
                  SizedBox(
                    width: 20.w,
                    height: 20.w,
                    child: const CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                else
                  Flexible(
                    child: Text(
                      widget.label,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: widget.outlined ? c.primary : Colors.white,
                        fontSize: 15.sp,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                if (widget.showArrow && !widget.isLoading) ...[
                  SizedBox(width: 6.w),
                  Icon(
                    Icons.arrow_forward_rounded,
                    color: widget.outlined ? c.primary : Colors.white,
                    size: 18.sp,
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    ).animate().fadeIn(duration: 280.ms, curve: Curves.easeOut);
  }
}
