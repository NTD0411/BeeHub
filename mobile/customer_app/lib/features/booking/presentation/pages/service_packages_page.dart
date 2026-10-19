import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/constants/app_images.dart';
import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/booking_scaffold.dart';
import '../../../../core/widgets/cached_hero_image.dart';
import '../../../../core/widgets/smooth_cta_button.dart';
import '../../domain/booking_models.dart';
import '../cubit/booking_flow_cubit.dart';
import '../cubit/booking_flow_state.dart';

class ServicePackagesPage extends StatefulWidget {
  const ServicePackagesPage({super.key});

  @override
  State<ServicePackagesPage> createState() => _ServicePackagesPageState();
}

class _ServicePackagesPageState extends State<ServicePackagesPage> {
  @override
  void initState() {
    super.initState();
    final cubit = context.read<BookingFlowCubit>();
    if (!cubit.state.isComboBooking) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        final dest = cubit.state.destination.trim();
        context.go(dest.isEmpty ? '/booking/location' : '/booking/partners');
      });
      return;
    }
    cubit.loadPackages();
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    return BlocBuilder<BookingFlowCubit, BookingFlowState>(
      builder: (context, state) {
        final selected = state.selectedPackage;
        final estimateTotal = state.subtotal;

        return BookingScaffold(
          title: state.passItemDelivery ? 'Combo chuyển đồ' : 'Combo chuyển trọ',
          body: ListView(
            padding: EdgeInsets.fromLTRB(20.w, 8.h, 20.w, 168.h),
            children: [
              Text(
                'Chọn combo\nxe + khuân vác',
                style: TextStyle(
                  fontSize: 26.sp,
                  fontWeight: FontWeight.w800,
                  height: 1.2,
                  color: c.onSurface,
                ),
              ),
              SizedBox(height: 8.h),
              Text(
                state.isComboBooking
                    ? 'Giá xe + km niêm yết cố định trên app. Nhà xe combo chỉ được đặt giá khuân vác — rẻ hơn đặt chuyến thường.'
                    : 'Combo gộp xe và đội khuân vác. Thêm người trong combo rẻ hơn thuê khuân vác riêng.',
                style: TextStyle(fontSize: 14.sp, color: c.onSurfaceMuted, height: 1.45),
              ),
              if (state.isComboBooking && state.destination.trim().isEmpty) ...[
                SizedBox(height: 14.h),
                _needLocationHint(c),
              ],
              if ((state.isComboBooking || state.quickCompareEntry) &&
                  state.destination.trim().isNotEmpty) ...[
                SizedBox(height: 16.h),
                _QuickRouteCard(
                  pickup: state.pickup,
                  destination: state.destination,
                  colors: c,
                  onEdit: () {
                    context.read<BookingFlowCubit>().clearQuickCompareEntry();
                    context.push('/booking/location');
                  },
                ),
              ],
              if (state.packages.isNotEmpty) ...[
                SizedBox(height: 16.h),
                _ComboPricingTable(packages: state.packages, colors: c),
              ],
              SizedBox(height: 20.h),
              ...state.packages.map((p) => _packageCard(context, state, p, c)),
              SizedBox(height: 20.h),
              Text(
                'Tại sao chọn combo?',
                style: TextStyle(fontSize: 18.sp, fontWeight: FontWeight.w700, color: c.onSurface),
              ),
              SizedBox(height: 12.h),
              _benefitRow(Icons.savings_outlined, 'Tiết kiệm nhất cho chuyến chuẩn trong gói km', c),
              _benefitRow(Icons.inventory_2_outlined, 'Giá biết trước — xe+km niêm yết cố định', c),
              _benefitRow(Icons.groups_outlined, 'Khuân vác ưu đãi — rẻ hơn thuê riêng', c),
              _benefitRow(Icons.account_balance_wallet_outlined, 'Cọc giữ an toàn qua UniMove', c),
              SizedBox(height: 14.h),
              _customTripLink(context, c),
              SizedBox(height: 16.h),
              CachedHeroImage(url: AppImages.moversPhoto, height: 160.h),
            ],
          ),
          bottom: SafeArea(
            child: Container(
              padding: EdgeInsets.fromLTRB(20.w, 12.h, 20.w, 16.h),
              decoration: BoxDecoration(
                color: c.surface,
                border: Border(top: BorderSide(color: c.border)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'COMBO',
                    style: TextStyle(
                      fontSize: 10.sp,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.6,
                      color: c.onSurfaceMuted,
                    ),
                  ),
                  SizedBox(height: 2.h),
                  Text(
                    selected?.label ?? 'Chưa chọn combo',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 15.sp,
                      fontWeight: FontWeight.w600,
                      color: c.onSurface,
                    ),
                  ),
                  if (selected != null)
                    Padding(
                      padding: EdgeInsets.only(top: 2.h),
                      child: Text(
                        '${selected.includedKm} km · ${state.effectiveComboLaborCount} người khuân vác (giá combo)',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 11.sp, color: c.onSurfaceMuted),
                      ),
                    ),
                  SizedBox(height: 6.h),
                  if (selected != null) ...[
                    Text(
                      'Xe+km: ${_formatPrice(state.movePackagePrice)} · Khuân vác mặc định: ${_formatPrice(state.effectiveComboLaborCount * selected.extraLaborComboPrice)}',
                      style: TextStyle(fontSize: 10.sp, color: c.onSurfaceMuted),
                    ),
                    SizedBox(height: 4.h),
                  ],
                  Align(
                    alignment: Alignment.centerRight,
                    child: Text(
                      state.isComboBooking
                          ? _formatPrice(estimateTotal)
                          : 'từ ${_formatPrice(estimateTotal)}',
                      style: TextStyle(fontSize: 22.sp, fontWeight: FontWeight.w800, color: c.primary),
                    ),
                  ),
                  if (state.isComboBooking)
                    Align(
                      alignment: Alignment.centerRight,
                      child: Text(
                        'Niêm yết · nhà xe chỉ khác phần khuân vác',
                        style: TextStyle(fontSize: 10.sp, color: c.onSurfaceMuted),
                      ),
                    ),
                  SizedBox(height: 12.h),
                  SmoothCtaButton(
                    label: 'Chọn nhà xe combo',
                    onPressed: selected == null ||
                            (state.isComboBooking && state.destination.trim().isEmpty)
                        ? null
                        : () => context.push('/booking/partners'),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _packageCard(BuildContext context, BookingFlowState state, ServicePackage pkg, UniMoveColors c) {
    final selected = state.selectedTier == pkg.tier;
    final laborCount = selected ? state.effectiveComboLaborCount : pkg.laborSuggested;
    final estimatePrice = pkg.priceAtLabor(laborCount);

    return Padding(
      padding: EdgeInsets.only(bottom: 14.h),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOutCubic,
        padding: EdgeInsets.all(16.w),
        decoration: BoxDecoration(
          color: c.surface,
          borderRadius: BorderRadius.circular(20.r),
          border: Border.all(
            color: selected ? c.primary : c.border,
            width: selected ? 2 : 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (pkg.popular)
              Padding(
                padding: EdgeInsets.only(bottom: 10.h),
                child: Container(
                  width: double.infinity,
                  alignment: Alignment.center,
                  padding: EdgeInsets.symmetric(vertical: 6.h),
                  decoration: BoxDecoration(
                    color: c.primary,
                    borderRadius: BorderRadius.circular(8.r),
                  ),
                  child: Text(
                    'PHỔ BIẾN',
                    style: TextStyle(color: Colors.white, fontSize: 11.sp, fontWeight: FontWeight.w800, letterSpacing: 0.4),
                  ),
                ),
              ),
            Wrap(
              spacing: 8.w,
              runSpacing: 6.h,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                _badge(pkg.badge, pkg.tier, c),
                if (pkg.subtitle.isNotEmpty)
                  Text(
                    pkg.subtitle,
                    style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted),
                  ),
              ],
            ),
            SizedBox(height: 8.h),
            Text(
              pkg.label,
              style: TextStyle(fontSize: 20.sp, fontWeight: FontWeight.w700, color: c.onSurface),
            ),
            SizedBox(height: 6.h),
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                selected
                    ? _formatPrice(estimatePrice)
                    : 'từ ${_formatPrice(pkg.referencePrice)}',
                style: TextStyle(fontSize: 22.sp, fontWeight: FontWeight.w800, color: c.primary),
              ),
            ),
            Text(
              state.isComboBooking
                  ? '/chuyến · niêm yết (xe+km cố định)'
                  : '/chuyến · tham chiếu',
              style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted),
            ),
            SizedBox(height: 10.h),
            Text(
              'Mức giá này đã bao gồm',
              style: TextStyle(fontSize: 12.sp, fontWeight: FontWeight.w700, color: c.onSurface),
            ),
            SizedBox(height: 8.h),
            Wrap(
              spacing: 8.w,
              runSpacing: 8.h,
              children: [
                _includeChip(c, Icons.route_outlined, '${pkg.includedKm} km di chuyển'),
                _includeChip(c, Icons.groups_outlined, 'Gợi ý ${pkg.laborSuggested} người'),
              ],
            ),
            SizedBox(height: 6.h),
            Text(
              'Vượt ${pkg.includedKm} km: +${_formatPrice(pkg.extraKmPrice)}/km (niêm yết) · Khuân vác: ${_formatPrice(pkg.extraLaborComboPrice)}/người (nhà xe đặt)',
              style: TextStyle(fontSize: 11.sp, color: c.onSurfaceMuted, height: 1.35),
            ),
            SizedBox(height: 12.h),
            ...pkg.features.map(
              (f) => Padding(
                padding: EdgeInsets.only(bottom: 6.h),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      f.included ? Icons.check_circle : Icons.cancel_outlined,
                      size: 18.sp,
                      color: f.included ? c.success : c.onSurfaceMuted,
                    ),
                    SizedBox(width: 8.w),
                    Expanded(
                      child: Text(
                        f.text,
                        style: TextStyle(fontSize: 13.sp, color: c.onSurface, height: 1.35),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            if (selected) ...[
              SizedBox(height: 12.h),
              Text(
                'Số người khuân vác (giá combo)',
                style: TextStyle(fontSize: 13.sp, fontWeight: FontWeight.w600, color: c.onSurface),
              ),
              SizedBox(height: 8.h),
              Wrap(
                spacing: 8.w,
                runSpacing: 8.h,
                children: List.generate(pkg.maxLaborCount, (i) {
                  final count = i + 1;
                  final active = laborCount == count;
                  return _laborCountChip(
                    c,
                    count: count,
                    unitPrice: pkg.extraLaborComboPrice,
                    selected: active,
                    onTap: () => context.read<BookingFlowCubit>().setComboLaborCount(count),
                  );
                }),
              ),
              SizedBox(height: 8.h),
              Container(
                width: double.infinity,
                padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 8.h),
                decoration: BoxDecoration(
                  color: c.success.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8.r),
                  border: Border.all(color: c.success.withValues(alpha: 0.35)),
                ),
                child: Text(
                  'Khuân vác combo: từ ${_formatPrice(pkg.extraLaborComboPrice)}/người (nhà xe đặt) · Thuê riêng: ~${_formatPrice(pkg.extraLaborRetailPrice)}/người',
                  style: TextStyle(fontSize: 11.sp, color: c.success, fontWeight: FontWeight.w600, height: 1.35),
                ),
              ),
            ],
            SizedBox(height: 14.h),
            SmoothCtaButton(
              label: selected ? 'Đã chọn combo' : 'Chọn combo này',
              showArrow: false,
              outlined: !selected,
              onPressed: () => context.read<BookingFlowCubit>().selectTier(pkg.tier),
            ),
          ],
        ),
      ),
    );
  }

  Widget _includeChip(UniMoveColors c, IconData icon, String text) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 6.h),
      decoration: BoxDecoration(
        color: c.success.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8.r),
        border: Border.all(color: c.success.withValues(alpha: 0.35)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16.sp, color: c.success),
          SizedBox(width: 6.w),
          Text(
            text,
            style: TextStyle(fontSize: 12.sp, fontWeight: FontWeight.w600, color: c.success),
          ),
        ],
      ),
    );
  }

  Widget _laborCountChip(
    UniMoveColors c, {
    required int count,
    required int unitPrice,
    required bool selected,
    required VoidCallback onTap,
  }) {
    return Material(
      color: selected ? c.primary.withValues(alpha: 0.12) : c.surfaceTint,
      borderRadius: BorderRadius.circular(12.r),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12.r),
        child: Container(
          padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 10.h),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12.r),
            border: Border.all(color: selected ? c.primary : c.border, width: selected ? 1.5 : 1),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '$count người',
                style: TextStyle(
                  fontSize: 13.sp,
                  fontWeight: FontWeight.w700,
                  color: selected ? c.primary : c.onSurface,
                ),
              ),
              SizedBox(height: 2.h),
              Text(
                _formatPrice(unitPrice * count),
                style: TextStyle(
                  fontSize: 11.sp,
                  fontWeight: FontWeight.w600,
                  color: selected ? c.primary : c.onSurfaceMuted,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _badge(String text, ServiceTier tier, UniMoveColors c) {
    final color = switch (tier) {
      ServiceTier.economy => c.chipBg,
      ServiceTier.standard => c.primary.withValues(alpha: 0.12),
      ServiceTier.premium => c.success.withValues(alpha: 0.15),
    };
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 4.h),
      decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(99.r)),
      child: Text(
        text,
        style: TextStyle(fontSize: 11.sp, fontWeight: FontWeight.w700, color: c.primary),
      ),
    );
  }

  Widget _benefitRow(IconData icon, String text, UniMoveColors c) {
    return Padding(
      padding: EdgeInsets.only(bottom: 8.h),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: c.primary, size: 20.sp),
          SizedBox(width: 10.w),
          Expanded(
            child: Text(
              text,
              style: TextStyle(fontSize: 14.sp, fontWeight: FontWeight.w500, color: c.onSurface),
            ),
          ),
        ],
      ),
    );
  }

  String _formatPrice(int v) {
    final s = v.toString();
    final buf = StringBuffer();
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buf.write('.');
      buf.write(s[i]);
    }
    return '${buf}đ';
  }

  Widget _customTripLink(BuildContext context, UniMoveColors c) {
    return Material(
      color: c.surface,
      borderRadius: BorderRadius.circular(14.r),
      child: InkWell(
        onTap: () {
          final cubit = context.read<BookingFlowCubit>();
          final dest = cubit.state.destination;
          cubit.switchToCustomTrip();
          context.push(dest.trim().isEmpty ? '/booking/location' : '/booking/partners');
        },
        borderRadius: BorderRadius.circular(14.r),
        child: Container(
          padding: EdgeInsets.all(14.w),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14.r),
            border: Border.all(color: c.border),
          ),
          child: Row(
            children: [
              Icon(Icons.tune_rounded, color: c.primary, size: 22.sp),
              SizedBox(width: 10.w),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Chuyến xa / nhiều điểm / đặc biệt?',
                      style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.sp, color: c.onSurface),
                    ),
                    SizedBox(height: 2.h),
                    Text(
                      'Dùng Đặt chuyến linh hoạt — so sánh báo giá nhà xe',
                      style: TextStyle(fontSize: 11.sp, color: c.onSurfaceMuted),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right_rounded, color: c.onSurfaceMuted),
            ],
          ),
        ),
      ),
    );
  }

  Widget _needLocationHint(UniMoveColors c) {
    return Material(
      color: c.chipBg,
      borderRadius: BorderRadius.circular(12.r),
      child: InkWell(
        onTap: () => context.push('/booking/location'),
        borderRadius: BorderRadius.circular(12.r),
        child: Padding(
          padding: EdgeInsets.all(14.w),
          child: Row(
            children: [
              Icon(Icons.location_on_outlined, color: c.primary, size: 22.sp),
              SizedBox(width: 10.w),
              Expanded(
                child: Text(
                  'Chọn điểm đón & đến trước — giống đặt chuyến bình thường',
                  style: TextStyle(fontSize: 13.sp, fontWeight: FontWeight.w600, color: c.onSurface),
                ),
              ),
              Icon(Icons.chevron_right_rounded, color: c.onSurfaceMuted),
            ],
          ),
        ),
      ),
    );
  }
}

/// Bảng so sánh nhanh 3 combo (tránh nhồi giá vào một Row trong thẻ).
class _ComboPricingTable extends StatelessWidget {
  const _ComboPricingTable({required this.packages, required this.colors});

  final List<ServicePackage> packages;
  final UniMoveColors colors;

  @override
  Widget build(BuildContext context) {
    final c = colors;
    return Container(
      padding: EdgeInsets.all(12.w),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(14.r),
        border: Border.all(color: c.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'So sánh combo',
            style: TextStyle(fontSize: 13.sp, fontWeight: FontWeight.w700, color: c.onSurface),
          ),
          SizedBox(height: 10.h),
          Row(
            children: [
              Expanded(flex: 5, child: _th('Combo', c)),
              Expanded(flex: 3, child: _th('Từ', c, center: true)),
              Expanded(flex: 2, child: _th('Km', c, center: true)),
              Expanded(flex: 2, child: _th('Người', c, center: true)),
              Expanded(flex: 3, child: _th('Thêm/ng', c, right: true)),
            ],
          ),
          Divider(height: 12.h, color: c.border),
          ...packages.map((p) {
            return Padding(
              padding: EdgeInsets.only(bottom: 8.h),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(
                    flex: 5,
                    child: Text(
                      p.label,
                      style: TextStyle(fontSize: 11.sp, fontWeight: FontWeight.w600, color: c.onSurface),
                    ),
                  ),
                  Expanded(
                    flex: 3,
                    child: Text(
                      _shortPrice(p.referencePrice),
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 11.sp, color: c.primary, fontWeight: FontWeight.w700),
                    ),
                  ),
                  Expanded(
                    flex: 2,
                    child: Text(
                      '${p.includedKm}',
                      style: TextStyle(fontSize: 11.sp, color: c.onSurface),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  Expanded(
                    flex: 2,
                    child: Text(
                      '${p.laborSuggested}',
                      style: TextStyle(fontSize: 11.sp, color: c.onSurface),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  Expanded(
                    flex: 3,
                    child: Text(
                      _shortPrice(p.extraLaborComboPrice),
                      style: TextStyle(fontSize: 11.sp, color: c.onSurfaceMuted),
                      textAlign: TextAlign.right,
                    ),
                  ),
                ],
              ),
            );
          }),
          SizedBox(height: 2.h),
          Text(
            'Km & xe = niêm yết cố định · Người = gợi ý · Khuân vác = nhà xe đặt trong combo',
            style: TextStyle(fontSize: 10.sp, color: c.onSurfaceMuted, height: 1.3),
          ),
        ],
      ),
    );
  }

  Widget _th(String text, UniMoveColors c, {bool center = false, bool right = false}) {
    return Text(
      text,
      textAlign: right ? TextAlign.right : (center ? TextAlign.center : TextAlign.left),
      style: TextStyle(fontSize: 10.sp, fontWeight: FontWeight.w700, color: c.onSurfaceMuted),
    );
  }

  String _shortPrice(int v) {
    if (v >= 1000000) return '${(v / 1000000).toStringAsFixed(1)}tr';
    if (v >= 1000) return '${(v / 1000).round()}k';
    return '$v';
  }
}

class _QuickRouteCard extends StatelessWidget {
  const _QuickRouteCard({
    required this.pickup,
    required this.destination,
    required this.colors,
    required this.onEdit,
  });

  final String pickup;
  final String destination;
  final UniMoveColors colors;
  final VoidCallback onEdit;

  @override
  Widget build(BuildContext context) {
    final c = colors;
    return Material(
      color: c.primaryContainer.withValues(alpha: 0.35),
      borderRadius: BorderRadius.circular(14.r),
      child: InkWell(
        onTap: onEdit,
        borderRadius: BorderRadius.circular(14.r),
        child: Padding(
          padding: EdgeInsets.all(14.w),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.alt_route, color: c.primary, size: 22.sp),
              SizedBox(width: 10.w),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Tuyến mẫu',
                      style: TextStyle(
                        fontSize: 12.sp,
                        fontWeight: FontWeight.w700,
                        color: c.primary,
                      ),
                    ),
                    SizedBox(height: 6.h),
                    Text(
                      pickup,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontSize: 13.sp, color: c.onSurface),
                    ),
                    SizedBox(height: 4.h),
                    Text(
                      destination,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontSize: 13.sp, color: c.onSurfaceMuted),
                    ),
                  ],
                ),
              ),
              TextButton(
                onPressed: onEdit,
                child: const Text('Sửa'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
