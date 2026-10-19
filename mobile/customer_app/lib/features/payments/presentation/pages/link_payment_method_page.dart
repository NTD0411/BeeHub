import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../../core/network/api_client.dart';
import '../../../../core/theme/uni_move_colors.dart';
import '../../data/payments_repository.dart';
import '../../domain/payment_method_models.dart';

/// Liên kết MoMo hoặc PayOS.
class LinkPaymentMethodPage extends StatefulWidget {
  const LinkPaymentMethodPage({super.key, required this.kind});

  final PaymentMethodKind kind;

  @override
  State<LinkPaymentMethodPage> createState() => _LinkPaymentMethodPageState();
}

class _LinkPaymentMethodPageState extends State<LinkPaymentMethodPage> {
  final _repo = PaymentsRepository();
  bool _linking = false;

  String get _name => switch (widget.kind) {
        PaymentMethodKind.momo => 'MoMo',
        PaymentMethodKind.payos => 'PayOS',
        _ => 'Ví',
      };

  Color get _brandColor => switch (widget.kind) {
        PaymentMethodKind.momo => const Color(0xFFA50064),
        PaymentMethodKind.payos => const Color(0xFF2563EB),
        _ => const Color(0xFF0D9488),
      };

  IconData get _icon => switch (widget.kind) {
        PaymentMethodKind.momo => Icons.account_balance_wallet_outlined,
        PaymentMethodKind.payos => Icons.qr_code_2,
        _ => Icons.savings_outlined,
      };

  String get _description => switch (widget.kind) {
        PaymentMethodKind.momo =>
          'Liên kết ví MoMo để thanh toán nhanh đơn chuyển trọ. UniMove không lưu mật khẩu MoMo của bạn.',
        PaymentMethodKind.payos =>
          'Liên kết PayOS để thanh toán bằng QR ngân hàng hoặc thẻ nội địa khi đặt cọc và thanh toán đơn.',
        _ => '',
      };

  Future<void> _link() async {
    setState(() => _linking = true);
    try {
      await _repo.addPaymentMethod(
        kind: widget.kind,
        label: '$_name · đã liên kết',
        tokenRef: '${widget.kind.name}_${DateTime.now().millisecondsSinceEpoch}',
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Đã liên kết $_name')),
      );
      Navigator.of(context).pop();
      Navigator.of(context).pop();
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message), backgroundColor: Colors.red.shade700),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Không liên kết được. Kiểm tra đăng nhập và backend.')),
      );
    } finally {
      if (mounted) setState(() => _linking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    return Scaffold(
      backgroundColor: c.background,
      appBar: AppBar(
        backgroundColor: c.background,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new, color: c.onSurface, size: 20),
          onPressed: () => Navigator.of(context).maybePop(),
        ),
        title: Text(
          'Liên kết $_name',
          style: TextStyle(fontSize: 17.sp, fontWeight: FontWeight.w700, color: c.onSurface),
        ),
      ),
      body: Padding(
        padding: EdgeInsets.all(24.w),
        child: Column(
          children: [
            Container(
              width: 72.w,
              height: 72.w,
              decoration: BoxDecoration(
                color: _brandColor.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(_icon, size: 36.sp, color: _brandColor),
            ),
            SizedBox(height: 20.h),
            Text(
              _description,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 15.sp, height: 1.5, color: c.onSurfaceMuted),
            ),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              height: 48.h,
              child: FilledButton(
                onPressed: _linking ? null : _link,
                style: FilledButton.styleFrom(
                  backgroundColor: c.primary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12.r)),
                ),
                child: _linking
                    ? SizedBox(
                        width: 22.w,
                        height: 22.w,
                        child: const CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : Text('Liên kết $_name', style: TextStyle(fontWeight: FontWeight.w600)),
              ),
            ),
            SizedBox(height: 16.h),
          ],
        ),
      ),
    );
  }
}
