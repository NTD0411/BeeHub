import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/booking_scaffold.dart';
import '../../../../core/widgets/smooth_cta_button.dart';
import '../../domain/booking_models.dart';
import '../cubit/booking_flow_cubit.dart';
import '../cubit/booking_flow_state.dart';
import '../widgets/labor_quotes_section.dart';

/// Tùy chọn thuê khuân vác riêng khi đặt chuyến — giá retail do đối tác báo (cao hơn combo).
class MoveRetailLaborPage extends StatefulWidget {
  const MoveRetailLaborPage({super.key});

  @override
  State<MoveRetailLaborPage> createState() => _MoveRetailLaborPageState();
}

class _MoveRetailLaborPageState extends State<MoveRetailLaborPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final cubit = context.read<BookingFlowCubit>();
      if (cubit.state.helperCount < 1) {
        cubit.setHelperCount(2);
      }
      cubit.loadRetailLaborQuotes();
    });
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    return BlocBuilder<BookingFlowCubit, BookingFlowState>(
      builder: (context, state) {
        final cubit = context.read<BookingFlowCubit>();
        final pkg = state.selectedPackage;
        final selected = state.selectedLaborProvider;

        return BookingScaffold(
          title: state.isComboBooking ? 'Thuê khuân vác riêng' : 'Thêm khuân vác (tùy chọn)',
          body: ListView(
            padding: EdgeInsets.fromLTRB(20.w, 8.h, 20.w, 120.h),
            children: [
              _infoBanner(c, pkg, state.isComboBooking),
              SizedBox(height: 16.h),
              Text(
                'Cấu hình',
                style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w700, color: c.onSurface),
              ),
              SizedBox(height: 10.h),
              _counterRow(
                c,
                value: state.helperCount < 1 ? 2 : state.helperCount,
                label: 'người',
                onMinus: () => cubit.setHelperCount(state.helperCount - 1),
                onPlus: () => cubit.setHelperCount(state.helperCount + 1),
              ),
              SizedBox(height: 14.h),
              _counterRow(
                c,
                value: state.laborHours,
                label: 'giờ',
                onMinus: () => cubit.setLaborHours(state.laborHours - 1),
                onPlus: () => cubit.setLaborHours(state.laborHours + 1),
              ),
              SizedBox(height: 20.h),
              Text(
                'Báo giá từ đối tác',
                style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w700, color: c.onSurface),
              ),
              SizedBox(height: 4.h),
              Text(
                'Giá do từng đội khuân vác đặt — cao hơn khi thuê trong combo.',
                style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted, height: 1.35),
              ),
              SizedBox(height: 12.h),
              LaborQuotesSection(
                state: state,
                onSelect: cubit.selectLaborProvider,
              ),
            ],
          ),
          bottom: SafeArea(
            child: Padding(
              padding: EdgeInsets.fromLTRB(20.w, 8.h, 20.w, 16.h),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextButton(
                    onPressed: () {
                      cubit.skipRetailLabor();
                      context.push('/booking/payment');
                    },
                    child: Text(
                      'Bỏ qua — không thuê thêm',
                      style: TextStyle(color: c.onSurfaceMuted, fontWeight: FontWeight.w600),
                    ),
                  ),
                  SizedBox(height: 4.h),
                  SmoothCtaButton(
                    label: state.loadingLaborQuotes
                        ? 'Đang lấy báo giá...'
                        : selected == null
                            ? 'Chọn một đội khuân vác'
                            : 'Thêm vào chuyến · ${LaborQuotesSection.formatPrice(selected.price)}',
                    showArrow: false,
                    onPressed: state.loadingLaborQuotes || selected == null
                        ? null
                        : () {
                            cubit.confirmRetailLabor();
                            context.push('/booking/payment');
                          },
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _infoBanner(UniMoveColors c, ServicePackage? pkg, bool isCombo) {
    final comboUnit = pkg?.extraLaborComboPrice;
    final retailRef = pkg?.extraLaborRetailPrice;
    return Container(
      padding: EdgeInsets.all(14.w),
      decoration: BoxDecoration(
        color: c.chipBg,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: c.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.info_outline, color: c.primary, size: 20.sp),
              SizedBox(width: 8.w),
              Expanded(
                child: Text(
                  isCombo ? 'Khuân vác riêng ngoài combo' : 'Khuân vác cho chuyến linh hoạt',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14.sp, color: c.onSurface),
                ),
              ),
            ],
          ),
          SizedBox(height: 8.h),
          Text(
            isCombo && comboUnit != null && retailRef != null
                ? 'Trong combo: ${_formatPrice(comboUnit)}/người · Thuê riêng: ~${_formatPrice(retailRef)}/người. Giá chốt do đối tác báo.'
                : 'Chọn số người & so sánh báo giá đội khuân vác — không bắt buộc, có thể bỏ qua.',
            style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted, height: 1.4),
          ),
        ],
      ),
    );
  }

  Widget _counterRow(
    UniMoveColors c, {
    required int value,
    required String label,
    required VoidCallback onMinus,
    required VoidCallback onPlus,
  }) {
    return Row(
      children: [
        _circleBtn(c, Icons.remove, onMinus),
        SizedBox(width: 16.w),
        Text(
          '$value $label',
          style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w700, color: c.onSurface),
        ),
        const Spacer(),
        _circleBtn(c, Icons.add, onPlus),
      ],
    );
  }

  Widget _circleBtn(UniMoveColors c, IconData icon, VoidCallback onTap) {
    return Material(
      color: c.chipBg,
      shape: const CircleBorder(),
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: Padding(
          padding: EdgeInsets.all(10.w),
          child: Icon(icon, color: c.primary),
        ),
      ),
    );
  }

  String _formatPrice(int v) {
    if (v >= 1000000) return '${(v / 1000000).toStringAsFixed(1)}tr';
    return '${(v / 1000).round()}k';
  }
}
