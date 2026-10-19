import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/uni_move_colors.dart';
import '../../data/payments_repository.dart';
import '../../domain/payment_models.dart';

/// Chi tiết giao dịch — layout Grab, dữ liệu `payments` + `orders` + `reviews`.
class PaymentDetailPage extends StatefulWidget {
  const PaymentDetailPage({super.key, required this.paymentId});

  final String paymentId;

  @override
  State<PaymentDetailPage> createState() => _PaymentDetailPageState();
}

class _PaymentDetailPageState extends State<PaymentDetailPage> {
  final _repo = PaymentsRepository();
  PaymentDetail? _detail;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final detail = await _repo.fetchDetail(widget.paymentId);
    if (mounted) {
      setState(() {
        _detail = detail;
        _loading = false;
      });
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
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new, color: c.onSurface, size: 20),
          onPressed: () => Navigator.of(context).maybePop(),
        ),
        title: Text(
          'Chi tiết giao dịch',
          style: TextStyle(fontSize: 18.sp, fontWeight: FontWeight.w800, color: c.onSurface),
        ),
      ),
      body: _loading
          ? Center(child: CircularProgressIndicator(color: c.primary))
          : _detail == null
              ? Center(child: Text('Không tìm thấy giao dịch', style: TextStyle(color: c.onSurfaceMuted)))
              : _buildBody(_detail!, c),
    );
  }

  Widget _buildBody(PaymentDetail d, UniMoveColors c) {
    final p = d.payment;

    return ListView(
      padding: EdgeInsets.fromLTRB(20.w, 0, 20.w, 32.h),
      children: [
        Text(d.serviceCategory, style: TextStyle(fontSize: 14.sp, color: c.onSurfaceMuted)),
        SizedBox(height: 20.h),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Text(
                d.paidStatusLabel,
                style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w600, color: c.onSurface),
              ),
            ),
            Text(
              p.formattedAmount,
              style: TextStyle(fontSize: 28.sp, fontWeight: FontWeight.w800, color: c.onSurface),
            ),
          ],
        ),
        if (d.breakdown.isNotEmpty) ...[
          SizedBox(height: 16.h),
          Divider(color: c.border, height: 1),
          SizedBox(height: 12.h),
          ...d.breakdown.map(
            (line) => Padding(
              padding: EdgeInsets.only(bottom: 8.h),
              child: Row(
                children: [
                  Expanded(
                    child: Text(line.label, style: TextStyle(fontSize: 14.sp, color: c.onSurfaceMuted)),
                  ),
                  Text(line.amount, style: TextStyle(fontSize: 14.sp, fontWeight: FontWeight.w600, color: c.onSurface)),
                ],
              ),
            ),
          ),
        ],
        SizedBox(height: 20.h),
        _grabCard(
          c,
          children: [
            if (d.breakdown.length > 1)
              ..._paymentMethodRows(d, c)
            else ...[
              _grabRow(
                c,
                'Phương thức thanh toán',
                d.maskedAccount ?? p.method,
                trailing: _methodBadge(d.maskedAccount ?? p.method),
              ),
            ],
            Divider(height: 1, color: c.border),
            _grabRow(c, 'Ngày giờ', d.formattedPaidAt),
            if (d.escrowStatus != null) ...[
              Divider(height: 1, color: c.border),
              _grabRow(c, 'Escrow', _escrowLabel(d.escrowStatus!)),
            ],
          ],
        ),
        SizedBox(height: 12.h),
        _grabCard(
          c,
          children: [
            _grabStacked(c, 'Mã đặt dịch vụ', '#${p.orderNumber}'),
            SizedBox(height: 14.h),
            _grabStacked(c, 'Mã chi tiết giao dịch', d.transactionId, mono: true),
            SizedBox(height: 14.h),
            _grabStacked(c, 'Mã thanh toán', d.paymentCode, mono: true),
          ],
        ),
        if (d.reviewRating != null) ...[
          SizedBox(height: 12.h),
          _grabCard(
            c,
            padding: EdgeInsets.all(16.w),
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Bạn đã đánh giá',
                          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15.sp, color: c.onSurface),
                        ),
                        if (d.reviewComment != null)
                          Text(
                            d.reviewComment!,
                            style: TextStyle(fontSize: 14.sp, color: c.onSurfaceMuted),
                          ),
                      ],
                    ),
                  ),
                  Row(
                    children: List.generate(
                      5,
                      (i) => Icon(
                        i < d.reviewRating! ? Icons.star_rounded : Icons.star_outline_rounded,
                        color: const Color(0xFFFFB800),
                        size: 22.sp,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
        SizedBox(height: 20.h),
        Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () {},
            borderRadius: BorderRadius.circular(12.r),
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: 14.h),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      'Báo cáo sự cố',
                      style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15.sp, color: c.onSurface),
                    ),
                  ),
                  Icon(Icons.chevron_right, color: c.onSurfaceMuted),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _grabCard(UniMoveColors c, {required List<Widget> children, EdgeInsetsGeometry? padding}) {
    return Container(
      padding: padding ?? EdgeInsets.symmetric(horizontal: 16.w, vertical: 4.h),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(14.r),
        border: Border.all(color: c.border),
      ),
      child: Column(children: children),
    );
  }

  List<Widget> _paymentMethodRows(PaymentDetail d, UniMoveColors c) {
    final rows = <Widget>[];
    for (var i = 0; i < d.breakdown.length; i++) {
      if (i > 0) rows.add(Divider(height: 1, color: c.border));
      rows.add(
        _grabRow(
          c,
          'Phương thức thanh toán',
          d.breakdown[i].label,
          trailing: _methodBadge(d.breakdown[i].label),
        ),
      );
    }
    return rows;
  }

  Widget _grabRow(UniMoveColors c, String label, String value, {Widget? trailing}) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 14.h),
      child: Row(
        children: [
          Expanded(
            child: Text(label, style: TextStyle(fontSize: 14.sp, color: c.onSurfaceMuted)),
          ),
          trailing ??
              Flexible(
                child: Text(
                  value,
                  textAlign: TextAlign.right,
                  style: TextStyle(fontSize: 14.sp, fontWeight: FontWeight.w600, color: c.onSurface),
                ),
              ),
        ],
      ),
    );
  }

  Widget _grabStacked(UniMoveColors c, String label, String value, {bool mono = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(fontSize: 13.sp, color: c.onSurfaceMuted)),
        SizedBox(height: 4.h),
        Text(
          value,
          style: TextStyle(
            fontSize: 15.sp,
            fontWeight: FontWeight.w600,
            color: c.onSurface,
            fontFamily: mono ? 'monospace' : null,
          ),
        ),
      ],
    );
  }

  Widget _methodBadge(String method) {
    final lower = method.toLowerCase();
    final isMomo = lower.contains('momo');
    final icon = isMomo ? Icons.account_balance_wallet_outlined : Icons.qr_code_2;
    final iconColor = AppColors.primary;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          method,
          style: TextStyle(fontSize: 14.sp, fontWeight: FontWeight.w600, color: UniMoveColors.of(context).onSurface),
        ),
        SizedBox(width: 6.w),
        Icon(icon, size: 18.sp, color: iconColor),
      ],
    );
  }

  String _escrowLabel(String status) => switch (status) {
        'held' => 'Đang giữ (deposit)',
        'released' => 'Đã giải phóng',
        'refunded' => 'Đã hoàn về ví',
        'pending' => 'Chờ xử lý',
        _ => status,
      };
}
