import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/uni_move_colors.dart';
import '../../data/payments_repository.dart';
import '../../domain/payment_method_models.dart';
import '../widgets/add_payment_option_tile.dart';
import 'add_card_page.dart';
import 'link_payment_method_page.dart';

/// Thêm phương thức khác — Thẻ, MoMo, PayOS (UniMove).
class AddPaymentMethodPage extends StatefulWidget {
  const AddPaymentMethodPage({super.key});

  @override
  State<AddPaymentMethodPage> createState() => _AddPaymentMethodPageState();
}

class _AddPaymentMethodPageState extends State<AddPaymentMethodPage> {
  final _repo = PaymentsRepository();
  List<AddPaymentMethodOption> _options = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final options = await _repo.fetchAddPaymentOptions();
    if (mounted) {
      setState(() {
        _options = options.where((o) => o.kind != PaymentMethodKind.wallet).toList();
        _loading = false;
      });
    }
  }

  void _onOptionTap(AddPaymentMethodOption option) {
    switch (option.kind) {
      case PaymentMethodKind.card:
        Navigator.of(context).push(
          MaterialPageRoute<void>(builder: (_) => const AddCardPage()),
        );
      case PaymentMethodKind.momo:
      case PaymentMethodKind.payos:
        Navigator.of(context).push(
          MaterialPageRoute<void>(
            builder: (_) => LinkPaymentMethodPage(kind: option.kind),
          ),
        );
      case PaymentMethodKind.wallet:
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    return Scaffold(
      backgroundColor: c.isLight(context) ? Colors.white : c.background,
      appBar: AppBar(
        backgroundColor: c.isLight(context) ? Colors.white : c.background,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new, color: c.onSurface, size: 20),
          onPressed: () => Navigator.of(context).maybePop(),
        ),
        title: Text(
          'Tất cả các phương thức thanh toán',
          style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w700, color: c.onSurface),
        ),
        actions: [
          Padding(
            padding: EdgeInsets.only(right: 12.w),
            child: Center(
              child: Text.rich(
                TextSpan(
                  style: TextStyle(fontSize: 10.sp, color: c.onSurfaceMuted),
                  children: [
                    const TextSpan(text: 'Powered by '),
                    TextSpan(
                      text: 'PayOS',
                      style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.primary),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
      body: _loading
          ? Center(child: CircularProgressIndicator(color: c.primary))
          : ListView(
              padding: EdgeInsets.fromLTRB(20.w, 12.h, 20.w, 24.h),
              children: [
                Text(
                  'Thêm phương thức khác',
                  style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w800, color: c.onSurface),
                ),
                SizedBox(height: 8.h),
                ..._options.map(
                  (o) => AddPaymentOptionTile(
                    option: o,
                    onTap: () => _onOptionTap(o),
                  ),
                ),
              ],
            ),
    );
  }
}
