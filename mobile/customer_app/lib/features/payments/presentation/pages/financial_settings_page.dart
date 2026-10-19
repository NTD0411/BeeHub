import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/uni_move_colors.dart';
import '../widgets/financial_settings_tile.dart';
import 'payment_methods_page.dart';

/// Cài đặt tài chính — kiểu Grab, dữ liệu thanh toán UniMove.
class FinancialSettingsPage extends StatelessWidget {
  const FinancialSettingsPage({super.key});

  void _openPaymentMethods(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const PaymentMethodsPage()),
    );
  }

  void _openPinInfo(BuildContext context) {
    final c = UniMoveColors.of(context);
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: c.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20.r)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(24.w, 20.h, 24.w, 32.h),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Mã PIN UniMove',
              style: TextStyle(fontSize: 18.sp, fontWeight: FontWeight.w800, color: c.onSurface),
            ),
            SizedBox(height: 12.h),
            Text(
              'Mã PIN bảo vệ xác nhận giao dịch. Tính năng đặt PIN sẽ được bật khi tích hợp bảo mật đầy đủ.',
              style: TextStyle(fontSize: 14.sp, height: 1.45, color: c.onSurfaceMuted),
            ),
            SizedBox(height: 20.h),
            FilledButton(
              onPressed: () => Navigator.pop(ctx),
              style: FilledButton.styleFrom(
                backgroundColor: c.primary,
                minimumSize: Size(double.infinity, 48.h),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12.r)),
              ),
              child: const Text('Đã hiểu'),
            ),
          ],
        ),
      ),
    );
  }


  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    return Scaffold(
      backgroundColor: c.background,
      appBar: AppBar(
        backgroundColor: c.background,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new, color: c.onSurface, size: 20),
          onPressed: () => Navigator.of(context).maybePop(),
        ),
        title: Text(
          'Cài đặt tài chính',
          style: TextStyle(fontSize: 17.sp, fontWeight: FontWeight.w700, color: c.onSurface),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: EdgeInsets.fromLTRB(20.w, 8.h, 20.w, 24.h),
              children: [
                Text(
                  'Thanh toán',
                  style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w800, color: c.onSurface),
                ),
                FinancialSettingsTile(
                  icon: Icons.qr_code_2,
                  iconColor: c.primary,
                  iconBgColor: c.primaryContainer.withValues(alpha: 0.6),
                  title: 'Tất cả các phương thức thanh toán',
                  subtitle: 'PayOS · MoMo · Thẻ ngân hàng',
                  onTap: () => _openPaymentMethods(context),
                ),
                SizedBox(height: 28.h),
                Text(
                  'Bảo mật',
                  style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w800, color: c.onSurface),
                ),
                FinancialSettingsTile(
                  icon: Icons.lock_outline_rounded,
                  iconColor: c.success,
                  iconBgColor: c.accentGreen.withValues(alpha: 0.15),
                  title: 'Mã PIN UniMove',
                  subtitle: 'Tạo hoặc đặt lại mã PIN của bạn',
                  onTap: () => _openPinInfo(context),
                ),
              ],
            ),
          ),
          SafeArea(
            child: Padding(
              padding: EdgeInsets.only(bottom: 16.h),
              child: TextButton(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Liên hệ hỗ trợ: support@unimove.vn')),
                  );
                },
                child: Text(
                  'Cần hỗ trợ',
                  style: TextStyle(
                    fontSize: 15.sp,
                    fontWeight: FontWeight.w600,
                    color: AppColors.primary,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
