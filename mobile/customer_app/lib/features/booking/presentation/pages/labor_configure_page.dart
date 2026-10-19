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

/// Cấu hình + chọn báo giá từ nhiều đối tác khuân vác.
class LaborConfigurePage extends StatefulWidget {
  const LaborConfigurePage({super.key});

  @override
  State<LaborConfigurePage> createState() => _LaborConfigurePageState();
}

class _LaborConfigurePageState extends State<LaborConfigurePage> {
  late final TextEditingController _noteCtrl;

  @override
  void initState() {
    super.initState();
    final cubit = context.read<BookingFlowCubit>();
    _noteCtrl = TextEditingController(text: cubit.state.laborNote);
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadQuotesIfReady(cubit));
  }

  void _loadQuotesIfReady(BookingFlowCubit cubit) {
    final s = cubit.state;
    if (!s.isLaborService) return;
    final workAddress = s.destination.isNotEmpty ? s.destination : s.pickup;
    if (s.isLaborAddon || workAddress.isNotEmpty) {
      cubit.loadLaborQuotes();
    }
  }

  @override
  void dispose() {
    _noteCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    return BlocBuilder<BookingFlowCubit, BookingFlowState>(
      builder: (context, state) {
        final cubit = context.read<BookingFlowCubit>();
        final workAddress = state.destination.isNotEmpty ? state.destination : state.pickup;
        final canLoadQuotes = state.isLaborAddon || workAddress.isNotEmpty;
        final selected = state.selectedLaborProvider;

        return BookingScaffold(
          title: 'Cấu hình khuân vác',
          body: ListView(
            padding: EdgeInsets.fromLTRB(20.w, 8.h, 20.w, 120.h),
            children: [
              if (state.isLaborAddon) ...[
                _linkedOrderBanner(c, state),
                SizedBox(height: 12.h),
              ],
              _addressCard(c, workAddress.isEmpty ? 'Chưa chọn địa điểm' : workAddress),
              SizedBox(height: 20.h),
              Text(
                'Số người hỗ trợ',
                style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w700, color: c.onSurface),
              ),
              SizedBox(height: 10.h),
              _counterRow(
                c,
                value: state.helperCount < 1 ? 1 : state.helperCount,
                label: 'người',
                onMinus: () => cubit.setHelperCount(state.helperCount - 1),
                onPlus: () => cubit.setHelperCount(state.helperCount + 1),
              ),
              SizedBox(height: 20.h),
              Text(
                'Thời gian làm việc',
                style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w700, color: c.onSurface),
              ),
              SizedBox(height: 10.h),
              Wrap(
                spacing: 8.w,
                children: LaborPricing.hourOptions.map((h) {
                  final selectedHour = state.laborHours == h;
                  return ChoiceChip(
                    label: Text('$h giờ'),
                    selected: selectedHour,
                    onSelected: (_) => cubit.setLaborHours(h),
                    selectedColor: c.primary,
                    labelStyle: TextStyle(
                      color: selectedHour ? Colors.white : c.onSurface,
                      fontWeight: FontWeight.w600,
                    ),
                  );
                }).toList(),
              ),
              SizedBox(height: 20.h),
              Text(
                'Tầng / thang máy',
                style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w700, color: c.onSurface),
              ),
              SizedBox(height: 10.h),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: Text('Có thang máy', style: TextStyle(color: c.onSurface)),
                value: state.hasElevator,
                activeThumbColor: c.primary,
                onChanged: cubit.setHasElevator,
              ),
              if (!state.hasElevator) ...[
                _counterRow(
                  c,
                  value: state.floorCount,
                  label: 'tầng (không thang máy)',
                  onMinus: () => cubit.setFloorCount(state.floorCount - 1),
                  onPlus: () => cubit.setFloorCount(state.floorCount + 1),
                ),
              ],
              SizedBox(height: 16.h),
              TextField(
                controller: _noteCtrl,
                maxLines: 2,
                onChanged: cubit.setLaborNote,
                decoration: InputDecoration(
                  labelText: 'Ghi chú (đồ dễ vỡ, cửa hẹp...)',
                  filled: true,
                  fillColor: c.surfaceHigh,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12.r)),
                ),
              ),
              SizedBox(height: 24.h),
              if (state.isLaborAddon) ...[
                Text(
                  'Báo giá khuân vác',
                  style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w800, color: c.onSurface),
                ),
                SizedBox(height: 4.h),
                Text(
                  'Chỉ đội khuân vác của nhà xe bạn đã đặt — không dùng đối tác khác.',
                  style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted, height: 1.35),
                ),
                SizedBox(height: 12.h),
                if (state.loadingLaborQuotes)
                  Center(child: Padding(padding: EdgeInsets.all(16.h), child: CircularProgressIndicator(color: c.primary)))
                else if (selected != null)
                  _transportLaborCard(c, selected)
                else
                  _needAddressHint(c),
              ] else ...[
                Text(
                  'Chọn báo giá từ đối tác',
                  style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w800, color: c.onSurface),
                ),
                SizedBox(height: 4.h),
                Text(
                  canLoadQuotes
                      ? 'So sánh giá nhiều bên — bấm một dòng để chọn'
                      : 'Chọn địa điểm trước để nhận báo giá',
                  style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted),
                ),
                SizedBox(height: 12.h),
                if (canLoadQuotes)
                  LaborQuotesSection(
                    state: state,
                    onSelect: cubit.selectLaborProvider,
                  )
                else
                  _needAddressHint(c),
              ],
            ],
          ),
          bottom: SafeArea(
            child: Padding(
              padding: EdgeInsets.fromLTRB(20.w, 8.h, 20.w, 16.h),
              child: SmoothCtaButton(
                label: state.loadingLaborQuotes
                    ? 'Đang lấy báo giá...'
                    : selected == null
                        ? (state.isLaborAddon ? 'Chưa có báo giá nhà xe' : 'Chọn một đội khuân vác ở trên')
                        : 'Tiếp tục · ${LaborQuotesSection.formatPrice(selected.price)}',
                showArrow: false,
                onPressed: !canLoadQuotes || state.loadingLaborQuotes || selected == null
                    ? null
                    : () => context.push('/booking/payment'),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _transportLaborCard(UniMoveColors c, LaborProviderQuote quote) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(14.w),
      decoration: BoxDecoration(
        color: c.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14.r),
        border: Border.all(color: c.primary.withValues(alpha: 0.35)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.local_shipping_outlined, color: c.primary, size: 20.sp),
              SizedBox(width: 8.w),
              Expanded(
                child: Text(
                  quote.name,
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15.sp, color: c.onSurface),
                ),
              ),
              Text(
                LaborQuotesSection.formatPrice(quote.price),
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16.sp, color: c.primary),
              ),
            ],
          ),
          SizedBox(height: 6.h),
          Text(
            quote.teamLabel,
            style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted, height: 1.35),
          ),
          if (quote.badge != null) ...[
            SizedBox(height: 8.h),
            Container(
              padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 4.h),
              decoration: BoxDecoration(
                color: c.primary.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(6.r),
              ),
              child: Text(
                quote.badge!,
                style: TextStyle(fontSize: 10.sp, fontWeight: FontWeight.w700, color: c.primary),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _needAddressHint(UniMoveColors c) {
    return Container(
      padding: EdgeInsets.all(14.w),
      decoration: BoxDecoration(
        color: c.chipBg,
        borderRadius: BorderRadius.circular(12.r),
      ),
      child: Text(
        'Quay lại bước trước để chọn địa điểm làm việc, sau đó app sẽ hiển thị danh sách báo giá.',
        style: TextStyle(fontSize: 13.sp, color: c.onSurfaceMuted, height: 1.35),
      ),
    );
  }

  Widget _linkedOrderBanner(UniMoveColors c, BookingFlowState state) {
    return Container(
      padding: EdgeInsets.all(14.w),
      decoration: BoxDecoration(
        color: c.primaryContainer.withValues(alpha: 0.4),
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: c.primary.withValues(alpha: 0.35)),
      ),
      child: Row(
        children: [
          Icon(Icons.link_rounded, color: c.primary, size: 22.sp),
          SizedBox(width: 10.w),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Thêm vào đơn #${state.linkedOrderNumber}',
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14.sp, color: c.onSurface),
                ),
                Text(
                  state.linkedProviderName != null
                      ? 'Khuân vác do ${state.linkedProviderName} cung cấp'
                      : 'Khuân vác do nhà xe vận chuyển cung cấp',
                  style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted, height: 1.3),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _addressCard(UniMoveColors c, String address) {
    return Container(
      padding: EdgeInsets.all(14.w),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: c.border),
      ),
      child: Row(
        children: [
          Icon(Icons.location_on_outlined, color: c.primary),
          SizedBox(width: 10.w),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Địa điểm làm việc', style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted)),
                Text(address, style: TextStyle(fontSize: 14.sp, fontWeight: FontWeight.w600, color: c.onSurface)),
              ],
            ),
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
}
