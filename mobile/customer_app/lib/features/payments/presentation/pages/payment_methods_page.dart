import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/pressable_scale.dart';
import '../../../../core/widgets/uni_surface_card.dart';
import '../../data/payments_repository.dart';
import '../../domain/payment_method_models.dart';
import 'add_payment_method_page.dart';

/// Danh sách phương thức thanh toán — PayOS, MoMo, thẻ.
class PaymentMethodsPage extends StatefulWidget {
  const PaymentMethodsPage({super.key});

  @override
  State<PaymentMethodsPage> createState() => _PaymentMethodsPageState();
}

class _PaymentMethodsPageState extends State<PaymentMethodsPage> {
  final _repo = PaymentsRepository();
  List<SavedPaymentMethod> _methods = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final methods = await _repo.fetchSavedPaymentMethods();
    if (mounted) {
      setState(() {
        _methods = methods.where((m) => m.kind != PaymentMethodKind.wallet).toList();
        _loading = false;
      });
    }
  }

  IconData _iconFor(PaymentMethodKind kind) => switch (kind) {
        PaymentMethodKind.wallet => Icons.savings_outlined,
        PaymentMethodKind.payos => Icons.qr_code_2,
        PaymentMethodKind.momo => Icons.account_balance_wallet_outlined,
        PaymentMethodKind.card => Icons.credit_card,
      };

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
          'Phương thức thanh toán',
          style: TextStyle(fontSize: 17.sp, fontWeight: FontWeight.w700, color: c.onSurface),
        ),
      ),
      body: _loading
          ? Center(child: CircularProgressIndicator(color: c.primary))
          : ListView(
              padding: EdgeInsets.fromLTRB(20.w, 8.h, 20.w, 24.h),
              children: [
                Text(
                  'Đã liên kết',
                  style: TextStyle(fontSize: 14.sp, fontWeight: FontWeight.w600, color: c.onSurfaceMuted),
                ),
                SizedBox(height: 12.h),
                ..._methods.map((m) => Padding(
                      padding: EdgeInsets.only(bottom: 10.h),
                      child: _MethodCard(
                        method: m,
                        icon: _iconFor(m.kind),
                        onTap: () {},
                      ),
                    )),
                SizedBox(height: 16.h),
                OutlinedButton.icon(
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute<void>(builder: (_) => const AddPaymentMethodPage()),
                    );
                  },
                  icon: Icon(Icons.add, color: c.primary, size: 20.sp),
                  label: Text(
                    'Thêm phương thức',
                    style: TextStyle(color: c.primary, fontWeight: FontWeight.w600),
                  ),
                  style: OutlinedButton.styleFrom(
                    minimumSize: Size(double.infinity, 48.h),
                    side: BorderSide(color: c.border),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12.r)),
                  ),
                ),
              ],
            ),
    );
  }
}

class _MethodCard extends StatelessWidget {
  const _MethodCard({
    required this.method,
    required this.icon,
    required this.onTap,
  });

  final SavedPaymentMethod method;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    return PressableScale(
      onTap: onTap,
      child: UniSurfaceCard(
        padding: EdgeInsets.all(14.w),
        child: Row(
          children: [
            Container(
              width: 44.w,
              height: 44.w,
              decoration: BoxDecoration(
                color: c.primaryContainer.withValues(alpha: 0.5),
                borderRadius: BorderRadius.circular(12.r),
              ),
              child: Icon(icon, color: c.primary),
            ),
            SizedBox(width: 14.w),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        method.name,
                        style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15.sp, color: c.onSurface),
                      ),
                      if (method.isDefault) ...[
                        SizedBox(width: 8.w),
                        Container(
                          padding: EdgeInsets.symmetric(horizontal: 6.w, vertical: 2.h),
                          decoration: BoxDecoration(
                            color: c.chipBg,
                            borderRadius: BorderRadius.circular(4.r),
                          ),
                          child: Text(
                            'Mặc định',
                            style: TextStyle(fontSize: 10.sp, fontWeight: FontWeight.w600, color: c.primary),
                          ),
                        ),
                      ],
                    ],
                  ),
                  SizedBox(height: 4.h),
                  Text(method.subtitle, style: TextStyle(fontSize: 13.sp, color: c.onSurfaceMuted)),
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
