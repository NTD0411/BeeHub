import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:shadcn_ui/shadcn_ui.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/pressable_scale.dart';
import '../../../../core/widgets/uni_surface_card.dart';
import '../../data/payments_repository.dart';
import '../../domain/payment_models.dart';
import 'financial_settings_page.dart';
import 'payment_detail_page.dart';
import 'payment_methods_page.dart';

/// Tab Thanh toán — giao dịch gần đây (PayOS, MoMo, QR).
class PaymentsTabPage extends StatefulWidget {
  const PaymentsTabPage({super.key});

  @override
  State<PaymentsTabPage> createState() => _PaymentsTabPageState();
}

class _PaymentsTabPageState extends State<PaymentsTabPage> {
  final _repo = PaymentsRepository();
  List<CustomerPayment> _payments = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final payments = await _repo.fetchRecentPayments();
    if (mounted) {
      setState(() {
        _payments = payments;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);
    final theme = ShadTheme.of(context);

    if (_loading) {
      return Center(child: CircularProgressIndicator(color: c.primary));
    }

    return CustomScrollView(
      physics: const BouncingScrollPhysics(),
      slivers: [
        SliverToBoxAdapter(
          child: _PaymentHero(
            onSettings: () {
              Navigator.of(context, rootNavigator: true).push<void>(
                MaterialPageRoute(builder: (_) => const FinancialSettingsPage()),
              );
            },
          ),
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: EdgeInsets.fromLTRB(20.w, 20.h, 20.w, 12.h),
            child: PressableScale(
              onTap: () {
                Navigator.of(context, rootNavigator: true).push<void>(
                  MaterialPageRoute(builder: (_) => const PaymentMethodsPage()),
                );
              },
              child: UniSurfaceCard(
                padding: EdgeInsets.all(16.w),
                child: Row(
                  children: [
                    Container(
                      width: 44.w,
                      height: 44.w,
                      decoration: BoxDecoration(
                        color: c.primaryContainer,
                        borderRadius: BorderRadius.circular(12.r),
                      ),
                      child: Icon(Icons.qr_code_2, color: c.primary),
                    ),
                    SizedBox(width: 14.w),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Thanh toán không tiền mặt',
                            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14.sp, color: c.onSurface),
                          ),
                          SizedBox(height: 4.h),
                          Text(
                            'PayOS · MoMo · QR · Thẻ',
                            style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted),
                          ),
                        ],
                      ),
                    ),
                    Icon(Icons.chevron_right, color: c.onSurfaceMuted),
                  ],
                ),
              ),
            ),
          ),
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: 20.w),
            child: OutlinedButton.icon(
              onPressed: () {
                Navigator.of(context, rootNavigator: true).push<void>(
                  MaterialPageRoute(builder: (_) => const PaymentMethodsPage()),
                );
              },
              icon: Icon(Icons.add_card_outlined, color: c.primary, size: 20.sp),
              label: Text('Thêm phương thức', style: TextStyle(color: c.primary, fontWeight: FontWeight.w600)),
              style: OutlinedButton.styleFrom(
                minimumSize: Size(double.infinity, 48.h),
                side: BorderSide(color: c.glassBorderStrong),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14.r)),
              ),
            ),
          ),
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: EdgeInsets.fromLTRB(20.w, 28.h, 20.w, 12.h),
            child: Row(
              children: [
                Text(
                  'Giao dịch gần đây',
                  style: theme.textTheme.h4.copyWith(fontWeight: FontWeight.w800),
                ),
                const Spacer(),
                Icon(Icons.chevron_right, color: c.onSurfaceMuted, size: 22.sp),
              ],
            ),
          ),
        ),
        SliverList.separated(
          itemCount: _payments.length,
          separatorBuilder: (_, __) => SizedBox(height: 10.h),
          itemBuilder: (context, i) {
            final p = _payments[i];
            return Padding(
              padding: EdgeInsets.symmetric(horizontal: 20.w),
              child: _PaymentRow(
                payment: p,
                onTap: () {
                  Navigator.of(context, rootNavigator: true).push<void>(
                    MaterialPageRoute(
                      builder: (_) => PaymentDetailPage(paymentId: p.id),
                    ),
                  );
                },
              ),
            );
          },
        ),
        SliverToBoxAdapter(child: SizedBox(height: 120.h)),
      ],
    );
  }
}

class _PaymentHero extends StatelessWidget {
  const _PaymentHero({required this.onSettings});

  final VoidCallback onSettings;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.fromLTRB(20.w, MediaQuery.paddingOf(context).top + 16.h, 20.w, 28.h),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.primary, Color(0xFF003A9E)],
        ),
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(28)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Thanh toán',
                  style: TextStyle(
                    fontSize: 28.sp,
                    fontWeight: FontWeight.w800,
                    color: AppColors.onPrimary,
                  ),
                ),
              ),
              IconButton(
                onPressed: onSettings,
                icon: const Icon(Icons.settings_outlined, color: AppColors.onPrimary),
              ),
            ],
          ),
          SizedBox(height: 8.h),
          Text(
            'Escrow minh bạch · PayOS · MoMo · QR',
            style: TextStyle(fontSize: 14.sp, color: AppColors.onPrimary.withValues(alpha: 0.9), height: 1.4),
          ),
        ],
      ),
    );
  }
}

class _PaymentRow extends StatelessWidget {
  const _PaymentRow({required this.payment, required this.onTap});

  final CustomerPayment payment;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);
    final refunded = payment.status == PaymentStatus.refunded;

    return PressableScale(
      onTap: onTap,
      child: UniSurfaceCard(
        padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 14.h),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    payment.title,
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14.sp, color: c.onSurface),
                  ),
                  SizedBox(height: 4.h),
                  Text(
                    payment.description ?? payment.method,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted),
                  ),
                  if (refunded) ...[
                    SizedBox(height: 6.h),
                    Container(
                      padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 3.h),
                      decoration: BoxDecoration(
                        color: c.primaryContainer.withValues(alpha: 0.5),
                        borderRadius: BorderRadius.circular(6.r),
                      ),
                      child: Text(
                        payment.statusLabel,
                        style: TextStyle(fontSize: 11.sp, fontWeight: FontWeight.w600, color: c.primary),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            Text(
              payment.formattedAmount,
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15.sp, color: c.onSurface),
            ),
            SizedBox(width: 4.w),
            Icon(Icons.chevron_right, size: 20.sp, color: c.onSurfaceMuted),
          ],
        ),
      ),
    );
  }
}
