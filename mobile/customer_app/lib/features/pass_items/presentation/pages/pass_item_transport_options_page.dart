import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/booking_scaffold.dart';
import '../../../booking/domain/booking_models.dart';
import '../../../booking/presentation/cubit/booking_flow_cubit.dart';
import '../../../booking/presentation/cubit/booking_flow_state.dart';
import '../../data/pass_item_repository.dart';

/// Chọn địa chỉ nhận + loại đặt xe (combo / chuyến thường) cho tin pass đồ.
class PassItemTransportOptionsPage extends StatefulWidget {
  const PassItemTransportOptionsPage({super.key});

  @override
  State<PassItemTransportOptionsPage> createState() => _PassItemTransportOptionsPageState();
}

class _PassItemTransportOptionsPageState extends State<PassItemTransportOptionsPage> {
  final _destinationCtrl = TextEditingController();
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final cubit = context.read<BookingFlowCubit>();
      if (cubit.state.pickupLat == null && cubit.state.pickup.trim().isNotEmpty) {
        cubit.ensurePickupCoordinates();
      }
    });
  }

  @override
  void dispose() {
    _destinationCtrl.dispose();
    super.dispose();
  }

  Future<void> _continueAsCombo(BookingFlowCubit cubit) async {
    if (_submitting) return;
    setState(() => _submitting = true);
    try {
      final ok = await cubit.ensureDestinationCoordinates();
      if (!ok && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Chọn địa chỉ nhận từ gợi ý hoặc nhập đủ số nhà + đường')),
        );
        return;
      }
      final passItemId = cubit.state.passItemId;
      if (passItemId != null) {
        await PassItemRepository().markTransportBooked(passItemId);
      }
      cubit.selectPassItemComboMode();
      if (!mounted) return;
      context.push('/booking/packages');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _continueAsNormal(BookingFlowCubit cubit) async {
    if (_submitting) return;
    setState(() => _submitting = true);
    try {
      final ok = await cubit.ensureDestinationCoordinates();
      if (!ok && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Chọn địa chỉ nhận từ gợi ý hoặc nhập đủ số nhà + đường')),
        );
        return;
      }
      final passItemId = cubit.state.passItemId;
      if (passItemId != null) {
        await PassItemRepository().markTransportBooked(passItemId);
      }
      cubit.selectPassItemNormalMode();
      if (!mounted) return;
      context.push('/booking/partners');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    return BlocListener<BookingFlowCubit, BookingFlowState>(
      listenWhen: (prev, curr) => prev.destination != curr.destination,
      listener: (context, state) {
        if (_destinationCtrl.text != state.destination) {
          _destinationCtrl.text = state.destination;
          _destinationCtrl.selection = TextSelection.collapsed(offset: _destinationCtrl.text.length);
        }
      },
      child: BlocBuilder<BookingFlowCubit, BookingFlowState>(
        builder: (context, state) {
          if (!state.passItemDelivery) {
            return BookingScaffold(
              title: 'Đặt chuyển đồ',
              body: Center(
                child: Text('Phiên đặt xe không hợp lệ', style: TextStyle(color: c.onSurfaceMuted)),
              ),
            );
          }

          final km = state.routeDistanceKm;
          final canContinue = state.destination.trim().isNotEmpty && !_submitting;

          return BookingScaffold(
            title: 'Đặt chuyển đồ',
            body: ListView(
              padding: EdgeInsets.fromLTRB(20.w, 8.h, 20.w, 24.h),
              children: [
                Text(
                  'Chọn cách vận chuyển',
                  style: TextStyle(
                    fontSize: 22.sp,
                    fontWeight: FontWeight.w800,
                    color: c.onSurface,
                    height: 1.25,
                  ),
                ),
                SizedBox(height: 6.h),
                Text(
                  'Nhập địa chỉ nhận để xem khoảng cách, rồi chọn combo niêm yết hoặc chuyến báo giá.',
                  style: TextStyle(fontSize: 13.sp, color: c.onSurfaceMuted, height: 1.4),
                ),
                SizedBox(height: 16.h),
                _routeCard(context, state, c),
                SizedBox(height: 14.h),
                _distanceCard(c, state, km),
                if (state.placeSuggestions.isNotEmpty && km == null) ...[
                  SizedBox(height: 8.h),
                  Text(
                    'Chạm một gợi ý bên dưới hoặc nhập số nhà + tên đường để tính km.',
                    style: TextStyle(fontSize: 11.sp, color: c.onSurfaceMuted, height: 1.35),
                  ),
                ],
                SizedBox(height: 14.h),
                _optionCard(
                  c: c,
                  icon: Icons.savings_outlined,
                  title: 'Đặt combo',
                  subtitle: 'Giá xe + km niêm yết cố định · phù hợp đồ lẻ gần',
                  highlighted: state.passItemPrefersCombo,
                  badge: state.passItemPrefersCombo ? 'Gợi ý' : null,
                  onTap: canContinue ? () => _continueAsCombo(context.read<BookingFlowCubit>()) : null,
                ),
                SizedBox(height: 10.h),
                _optionCard(
                  c: c,
                  icon: Icons.route_outlined,
                  title: 'Đặt chuyến thường',
                  subtitle: 'Nhà xe báo giá linh hoạt theo km và khối lượng',
                  highlighted: km != null && !state.passItemPrefersCombo,
                  badge: km != null && km > 15 ? 'Gợi ý' : null,
                  onTap: canContinue ? () => _continueAsNormal(context.read<BookingFlowCubit>()) : null,
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _distanceCard(UniMoveColors c, BookingFlowState state, double? km) {
    final busy = state.resolvingDestination || state.loadingPlaceSuggestions;
    return Container(
      padding: EdgeInsets.all(14.w),
      decoration: BoxDecoration(
        color: c.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(16.r),
        border: Border.all(color: c.primary.withValues(alpha: 0.22)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.straighten, color: c.primary, size: 22.sp),
          SizedBox(width: 10.w),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  busy
                      ? 'Đang xác định địa chỉ...'
                      : km != null
                          ? 'Khoảng cách ước tính: ${km.toStringAsFixed(1)} km'
                          : 'Chưa tính được khoảng cách',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14.sp, color: c.onSurface),
                ),
                SizedBox(height: 4.h),
                Text(
                  busy
                      ? 'Hệ thống đang tra cứu tọa độ theo địa chỉ bạn nhập.'
                      : state.passItemTransportHint,
                  style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted, height: 1.35),
                ),
                if (busy) ...[
                  SizedBox(height: 8.h),
                  LinearProgressIndicator(
                    minHeight: 2.h,
                    borderRadius: BorderRadius.circular(2.r),
                    color: c.primary,
                    backgroundColor: c.surfaceTint,
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _optionCard({
    required UniMoveColors c,
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback? onTap,
    bool highlighted = false,
    String? badge,
  }) {
    final enabled = onTap != null;
    return Material(
      color: c.surface,
      borderRadius: BorderRadius.circular(18.r),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18.r),
        child: Container(
          padding: EdgeInsets.all(16.w),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18.r),
            border: Border.all(
              color: highlighted ? c.primary : c.border,
              width: highlighted ? 1.5 : 1,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 44.w,
                height: 44.w,
                decoration: BoxDecoration(
                  color: highlighted ? c.primaryContainer : c.surfaceTint,
                  borderRadius: BorderRadius.circular(12.r),
                ),
                child: Icon(icon, color: c.primary, size: 22.sp),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(title, style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15.sp, color: c.onSurface)),
                        if (badge != null) ...[
                          SizedBox(width: 8.w),
                          Container(
                            padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 2.h),
                            decoration: BoxDecoration(
                              color: c.primary,
                              borderRadius: BorderRadius.circular(99),
                            ),
                            child: Text(
                              badge,
                              style: TextStyle(fontSize: 10.sp, fontWeight: FontWeight.w700, color: Colors.white),
                            ),
                          ),
                        ],
                      ],
                    ),
                    SizedBox(height: 4.h),
                    Text(subtitle, style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted, height: 1.35)),
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right,
                color: enabled ? c.primary : c.onSurfaceMuted.withValues(alpha: 0.4),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _routeCard(BuildContext context, BookingFlowState state, UniMoveColors c) {
    return Container(
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(20.r),
        border: Border.all(color: c.border),
      ),
      child: Column(
        children: [
          _routeRow(
            Icons.storefront_outlined,
            c.primary,
            state.loadingPickup ? 'Đang xác định điểm lấy...' : (state.pickup.isEmpty ? 'Điểm lấy đồ' : state.pickup),
            muted: state.loadingPickup || state.pickup.isEmpty,
          ),
          Padding(
            padding: EdgeInsets.only(left: 11.w),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Container(width: 2, height: 24.h, color: c.border),
            ),
          ),
          TextField(
            controller: _destinationCtrl,
            textInputAction: TextInputAction.search,
            onChanged: (v) => context.read<BookingFlowCubit>().onDestinationChanged(v),
            onSubmitted: (_) => context.read<BookingFlowCubit>().resolveDestinationNow(),
            onEditingComplete: () => context.read<BookingFlowCubit>().resolveDestinationNow(),
            decoration: InputDecoration(
              hintText: 'VD: 20 Nguyễn Minh Châu, Đà Nẵng',
              prefixIcon: Icon(Icons.home_outlined, color: c.accentGreen, size: 22.sp),
              filled: true,
              fillColor: c.surfaceTint,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14.r),
                borderSide: BorderSide.none,
              ),
            ),
          ),
          if (state.loadingPlaceSuggestions) ...[
            SizedBox(height: 8.h),
            LinearProgressIndicator(
              minHeight: 2.h,
              borderRadius: BorderRadius.circular(2.r),
              color: c.primary,
              backgroundColor: c.surfaceTint,
            ),
          ] else if (state.placeSuggestions.isNotEmpty) ...[
            SizedBox(height: 8.h),
            ...state.placeSuggestions.map((s) => _suggestionTile(context, s, c)),
          ],
        ],
      ),
    );
  }

  Widget _suggestionTile(BuildContext context, PlaceSuggestion suggestion, UniMoveColors c) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          final typed = _destinationCtrl.text.trim();
          context.read<BookingFlowCubit>().selectPlaceSuggestion(suggestion, typedInput: typed);
        },
        borderRadius: BorderRadius.circular(10.r),
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: 8.h, horizontal: 4.w),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.place_outlined, size: 18.sp, color: c.onSurfaceMuted),
              SizedBox(width: 8.w),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      suggestion.mainText,
                      style: TextStyle(fontSize: 14.sp, fontWeight: FontWeight.w600, color: c.onSurface),
                    ),
                    if (suggestion.secondaryText.trim().isNotEmpty)
                      Text(
                        suggestion.secondaryText,
                        style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _routeRow(IconData icon, Color color, String text, {bool muted = false}) {
    final c = UniMoveColors.of(context);
    return Row(
      children: [
        Container(
          width: 24.w,
          height: 24.w,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          child: Icon(icon, size: 14.sp, color: Colors.white),
        ),
        SizedBox(width: 12.w),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              fontSize: 14.sp,
              fontWeight: FontWeight.w600,
              color: muted ? c.onSurfaceMuted : c.onSurface,
            ),
          ),
        ),
      ],
    );
  }
}
