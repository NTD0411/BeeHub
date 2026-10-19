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

class InsuranceSelectionPage extends StatefulWidget {
  const InsuranceSelectionPage({super.key});

  @override
  State<InsuranceSelectionPage> createState() => _InsuranceSelectionPageState();
}

class _InsuranceSelectionPageState extends State<InsuranceSelectionPage> {
  @override
  void initState() {
    super.initState();
    context.read<BookingFlowCubit>().loadInsurancePlans();
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    return BlocBuilder<BookingFlowCubit, BookingFlowState>(
      builder: (context, state) {
        final selected = state.selectedInsurancePlan;

        return BookingScaffold(
          title: 'Bảo hiểm đồ đạc',
          body: state.loadingInsurancePlans
              ? Center(child: CircularProgressIndicator(color: c.primary))
              : ListView(
                  padding: EdgeInsets.fromLTRB(20.w, 8.h, 20.w, 140.h),
                  children: [
                    Text(
                      'Chọn gói bảo hiểm',
                      style: TextStyle(
                        fontSize: 24.sp,
                        fontWeight: FontWeight.w800,
                        color: c.onSurface,
                        height: 1.2,
                      ),
                    ),
                    SizedBox(height: 8.h),
                    Text(
                      'Bảo vệ đồ đạc trong chuyến chuyển trọ. Có thể đổi gói trước khi thanh toán.',
                      style: TextStyle(fontSize: 14.sp, color: c.onSurfaceMuted, height: 1.45),
                    ),
                    SizedBox(height: 16.h),
                    _infoBanner(c),
                    SizedBox(height: 16.h),
                    ...state.insurancePlans.map(
                      (plan) => _planCard(
                        context,
                        plan,
                        c,
                        selectedId: state.selectedInsurancePlanId,
                      ),
                    ),
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
                  if (selected != null) ...[
                    Text(
                      selected.isNoCoverage ? 'Không mua bảo hiểm' : selected.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontSize: 14.sp, fontWeight: FontWeight.w600, color: c.onSurface),
                    ),
                    if (!selected.isNoCoverage)
                      Text(
                        'Bồi thường tối đa ${_formatCoverage(selected.coverageAmount)} · ${_formatPrice(selected.price)}',
                        style: TextStyle(fontSize: 11.sp, color: c.onSurfaceMuted),
                      ),
                    SizedBox(height: 10.h),
                  ],
                  SmoothCtaButton(
                    label: 'Tiếp tục',
                    onPressed: state.selectedInsurancePlanId == null
                        ? null
                        : () => context.push('/booking/payment'),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _infoBanner(UniMoveColors c) {
    return Container(
      padding: EdgeInsets.all(12.w),
      decoration: BoxDecoration(
        color: c.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: c.primary.withValues(alpha: 0.2)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.shield_outlined, color: c.primary, size: 22.sp),
          SizedBox(width: 10.w),
          Expanded(
            child: Text(
              'Bảo hiểm do đối tác bảo hiểm UniMove liên kết. Khiếu nại qua app trong thời hạn gói.',
              style: TextStyle(fontSize: 12.sp, color: c.onSurface, height: 1.4),
            ),
          ),
        ],
      ),
    );
  }

  Widget _planCard(
    BuildContext context,
    CargoInsurancePlan plan,
    UniMoveColors c, {
    required String? selectedId,
  }) {
    final selected = selectedId == plan.id;

    return Padding(
      padding: EdgeInsets.only(bottom: 12.h),
      child: Material(
        color: c.surface,
        borderRadius: BorderRadius.circular(16.r),
        child: InkWell(
          onTap: () => context.read<BookingFlowCubit>().selectInsurancePlan(plan.id),
          borderRadius: BorderRadius.circular(16.r),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            padding: EdgeInsets.all(16.w),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16.r),
              border: Border.all(
                color: selected ? c.primary : c.border,
                width: selected ? 2 : 1,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (plan.recommended)
                  Padding(
                    padding: EdgeInsets.only(bottom: 8.h),
                    child: Container(
                      width: double.infinity,
                      alignment: Alignment.center,
                      padding: EdgeInsets.symmetric(vertical: 4.h),
                      decoration: BoxDecoration(
                        color: c.primary,
                        borderRadius: BorderRadius.circular(6.r),
                      ),
                      child: Text(
                        'KHUYÊN DÙNG',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 10.sp,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      plan.isNoCoverage ? Icons.block_outlined : Icons.verified_user_outlined,
                      color: plan.isNoCoverage ? c.onSurfaceMuted : c.primary,
                      size: 24.sp,
                    ),
                    SizedBox(width: 10.w),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            plan.name,
                            style: TextStyle(
                              fontSize: 16.sp,
                              fontWeight: FontWeight.w700,
                              color: c.onSurface,
                            ),
                          ),
                          SizedBox(height: 2.h),
                          Text(
                            plan.tagline,
                            style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted),
                          ),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          plan.isNoCoverage ? '0đ' : _formatPrice(plan.price),
                          style: TextStyle(
                            fontSize: 17.sp,
                            fontWeight: FontWeight.w800,
                            color: plan.isNoCoverage ? c.onSurfaceMuted : c.primary,
                          ),
                        ),
                        if (!plan.isNoCoverage)
                          Text(
                            _formatCoverage(plan.coverageAmount),
                            style: TextStyle(fontSize: 10.sp, color: c.onSurfaceMuted),
                          ),
                      ],
                    ),
                  ],
                ),
                if (plan.benefits.isNotEmpty) ...[
                  SizedBox(height: 10.h),
                  ...plan.benefits.map(
                    (b) => Padding(
                      padding: EdgeInsets.only(bottom: 4.h),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(Icons.check, size: 14.sp, color: c.success),
                          SizedBox(width: 6.w),
                          Expanded(
                            child: Text(
                              b,
                              style: TextStyle(fontSize: 12.sp, color: c.onSurface, height: 1.3),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
                if (selected)
                  Padding(
                    padding: EdgeInsets.only(top: 8.h),
                    child: Align(
                      alignment: Alignment.centerRight,
                      child: Icon(Icons.check_circle, color: c.primary, size: 20.sp),
                    ),
                  ),
              ],
            ),
          ),
        ),
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

  String _formatCoverage(int v) {
    if (v >= 1000000) return 'Bảo hiểm ${(v / 1000000).round()} triệu';
    if (v >= 1000) return 'Bảo hiểm ${(v / 1000).round()}k';
    return 'Không bảo hiểm';
  }
}
