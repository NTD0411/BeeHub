import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

import '../theme/uni_move_colors.dart';

class BookingScaffold extends StatelessWidget {
  const BookingScaffold({
    super.key,
    required this.title,
    required this.body,
    this.bottom,
    this.onBack,
    this.trailing,
  });

  final String title;
  final Widget body;
  final Widget? bottom;
  final VoidCallback? onBack;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    return Scaffold(
      backgroundColor: c.background,
      appBar: AppBar(
        backgroundColor: c.background,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, size: 20.sp, color: c.onSurface),
          onPressed: onBack ?? () => context.pop(),
        ),
        title: Text(
          title,
          style: TextStyle(
            fontSize: 18.sp,
            fontWeight: FontWeight.w700,
            color: c.onSurface,
          ),
        ),
        centerTitle: true,
        actions: [
          if (trailing != null) trailing!,
          SizedBox(width: 8.w),
        ],
      ),
      body: RepaintBoundary(child: body),
      bottomNavigationBar: bottom,
    );
  }
}
