import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/pressable_scale.dart';
import '../../domain/payment_method_models.dart';

/// Một dòng chọn phương thức — icon tròn + tên + chevron.
class AddPaymentOptionTile extends StatelessWidget {
  const AddPaymentOptionTile({
    super.key,
    required this.option,
    required this.onTap,
  });

  final AddPaymentMethodOption option;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);
    final icon = option.icon ?? Icons.account_balance_wallet_outlined;

    return PressableScale(
      onTap: onTap,
      child: Padding(
        padding: EdgeInsets.symmetric(vertical: 14.h),
        child: Row(
          children: [
            Container(
              width: 40.w,
              height: 40.w,
              decoration: BoxDecoration(
                color: option.brandColor.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: option.brandColor, size: 22.sp),
            ),
            SizedBox(width: 14.w),
            Expanded(
              child: Text(
                option.label,
                style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w500, color: c.onSurface),
              ),
            ),
            Icon(Icons.chevron_right, color: c.onSurfaceMuted, size: 22.sp),
          ],
        ),
      ),
    );
  }
}
