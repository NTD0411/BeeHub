import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';

import '../../../../core/constants/app_images.dart';
import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/booking_scaffold.dart';
import '../../../../core/widgets/cached_hero_image.dart';
import '../../../../core/widgets/smooth_cta_button.dart';
import '../../../pass_items/data/pass_item_repository.dart';
import '../../domain/booking_models.dart';
import '../cubit/booking_flow_cubit.dart';
import '../cubit/booking_flow_state.dart';

class ChooseLocationPage extends StatefulWidget {
  const ChooseLocationPage({super.key});

  @override
  State<ChooseLocationPage> createState() => _ChooseLocationPageState();
}

class _ChooseLocationPageState extends State<ChooseLocationPage> {
  final _destinationCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    final cubit = context.read<BookingFlowCubit>();
    if (cubit.state.passItemDelivery) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) context.go('/booking/pass-item/transport');
      });
      return;
    }
    cubit.loadPlaces();
  }

  @override
  void dispose() {
    _destinationCtrl.dispose();
    super.dispose();
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
        final isLabor = state.isLaborOnly;

        return BookingScaffold(
          title: state.passItemDelivery
              ? 'Chở đồ về nhà'
              : (isLabor
                  ? 'Địa điểm làm việc'
                  : (state.isComboBooking ? 'Combo chuyển trọ · Địa điểm' : 'Trọ cũ → trọ mới')),
          trailing: CircleAvatar(
            radius: 18.r,
            backgroundColor: c.surfaceTint,
            child: Icon(Icons.person_outline, size: 20.sp, color: c.primary),
          ),
          body: ListView(
            padding: EdgeInsets.fromLTRB(20.w, 8.h, 20.w, 24.h),
            children: [
              if (state.passItemDelivery) ...[
                _passItemHint(c),
                SizedBox(height: 12.h),
              ],
              _routeCard(context, state, c),
              SizedBox(height: 16.h),
              if (!isLabor && !state.passItemDelivery && !state.isComboBooking) ...[
                _quoteFlowHint(c, state.quoteFlowHint ?? BookingFlowState.defaultQuoteFlowHint),
                SizedBox(height: 8.h),
              ],
              if (!isLabor && !state.passItemDelivery && state.isComboBooking) ...[
                _comboFlowHint(c, state.comboFlowHint ?? BookingFlowState.defaultComboFlowHint),
                SizedBox(height: 8.h),
              ],
              if (state.isComboBooking) ...[
                CachedHeroImage(
                  url: state.mapPreviewUrl ?? AppImages.mapPreview,
                  height: 160.h,
                ),
                SizedBox(height: 20.h),
              ],
              SizedBox(height: 4.h),
              _recentHeader(c),
              SizedBox(height: 12.h),
              if (state.loadingPlaces)
                ...List.generate(3, (_) => _placeShimmer(c))
              else
                ...state.recentPlaces.map((p) => _placeTile(context, p, c)),
            ],
          ),
          bottom: SafeArea(
            child: Padding(
              padding: EdgeInsets.fromLTRB(20.w, 8.h, 20.w, 16.h),
              child: SmoothCtaButton(
                label: isLabor || state.passItemDelivery ? 'Tiếp tục' : 'Mô tả trọ',
                onPressed: state.destination.trim().isEmpty
                    ? null
                    : () async {
                        if (state.passItemDelivery && state.passItemId != null) {
                          await PassItemRepository().markTransportBooked(state.passItemId!);
                        }
                        if (!context.mounted) return;
                        context.push(
                          isLabor
                              ? '/booking/labor/configure'
                              : state.passItemDelivery
                                  ? '/booking/partners'
                                  : '/booking/dorm-details',
                        );
                      },
              ),
            ),
          ),
        );
      },
      ),
    );
  }

  Widget _quoteFlowHint(UniMoveColors c, QuoteFlowHint hint) {
    return Container(
      padding: EdgeInsets.all(14.w),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(16.r),
        border: Border.all(color: c.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.description_outlined, color: c.primary, size: 20.sp),
              SizedBox(width: 8.w),
              Expanded(
                child: Text(
                  hint.title,
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 14.sp,
                    color: c.onSurface,
                    height: 1.3,
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: 8.h),
          Text(
            hint.subtitle,
            style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted, height: 1.35),
          ),
        ],
      ),
    );
  }

  Widget _comboFlowHint(UniMoveColors c, String text) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 12.h),
      decoration: BoxDecoration(
        color: c.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14.r),
        border: Border.all(color: c.primary.withValues(alpha: 0.25)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.savings_outlined, size: 20.sp, color: c.primary),
          SizedBox(width: 10.w),
          Expanded(
            child: Text(
              text,
              style: TextStyle(fontSize: 12.sp, color: c.onSurface, height: 1.4),
            ),
          ),
        ],
      ),
    );
  }

  Widget _passItemHint(UniMoveColors c) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 12.h),
      decoration: BoxDecoration(
        color: c.chipBg,
        borderRadius: BorderRadius.circular(14.r),
        border: Border.all(color: c.primary.withValues(alpha: 0.25)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.info_outline, size: 18.sp, color: c.primary),
          SizedBox(width: 10.w),
          Expanded(
            child: Text(
              'Người bán đã chốt đơn. Nhập địa chỉ nhận bên dưới — xe sẽ lấy đồ tại điểm đăng tin.',
              style: TextStyle(fontSize: 12.sp, color: c.onSurface, height: 1.35),
            ),
          ),
        ],
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
            Icons.trip_origin,
            c.primary,
            c.onSurface,
            state.loadingPickup
                ? 'Đang lấy vị trí...'
                : (state.pickup.isEmpty ? 'Chưa có điểm đi' : state.pickup),
            isPickup: true,
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
            onChanged: (v) => context.read<BookingFlowCubit>().onDestinationChanged(v),
            decoration: InputDecoration(
              hintText: 'Điểm đến (Địa chỉ mới...)',
              prefixIcon: Icon(Icons.location_on, color: c.accentGreen, size: 22.sp),
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
            ...state.placeSuggestions.map(
              (s) => _suggestionTile(context, s, c),
            ),
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
          context.read<BookingFlowCubit>().selectPlaceSuggestion(
                suggestion,
                typedInput: typed,
              );
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
                      style: TextStyle(
                        fontSize: 14.sp,
                        fontWeight: FontWeight.w600,
                        color: c.onSurface,
                      ),
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

  Widget _routeRow(
    IconData icon,
    Color color,
    Color textColor,
    String text, {
    bool isPickup = false,
    bool muted = false,
  }) {
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
              fontSize: 15.sp,
              fontWeight: isPickup ? FontWeight.w600 : FontWeight.w500,
              color: muted ? c.onSurfaceMuted : textColor,
            ),
          ),
        ),
      ],
    );
  }

  Widget _recentHeader(UniMoveColors c) {
    return Builder(
      builder: (context) => Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            'Địa điểm gần đây',
            style: TextStyle(fontSize: 18.sp, fontWeight: FontWeight.w700, color: c.onSurface),
          ),
          TextButton(
            onPressed: () => context.read<BookingFlowCubit>().clearRecentPlaces(),
            child: const Text('Xóa tất cả'),
          ),
        ],
      ),
    );
  }

  Widget _placeTile(BuildContext context, RecentPlace place, UniMoveColors c) {
    return Padding(
      padding: EdgeInsets.only(bottom: 10.h),
      child: Material(
        color: c.surface,
        borderRadius: BorderRadius.circular(16.r),
        child: InkWell(
          borderRadius: BorderRadius.circular(16.r),
          onTap: () {
            final address = place.subtitle.trim().isNotEmpty ? place.subtitle : place.title;
            _destinationCtrl.text = address;
            context.read<BookingFlowCubit>().selectPlace(place);
          },
          child: Padding(
            padding: EdgeInsets.all(14.w),
            child: Row(
              children: [
                Container(
                  width: 44.w,
                  height: 44.w,
                  decoration: BoxDecoration(
                    color: c.chipBg,
                    borderRadius: BorderRadius.circular(12.r),
                  ),
                  child: Icon(place.icon, color: c.primary),
                ),
                SizedBox(width: 12.w),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        place.title,
                        style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15.sp, color: c.onSurface),
                      ),
                      Text(place.subtitle, style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted)),
                    ],
                  ),
                ),
                Icon(Icons.chevron_right, color: c.onSurfaceMuted),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _placeShimmer(UniMoveColors c) {
    return Padding(
      padding: EdgeInsets.only(bottom: 10.h),
      child: Shimmer.fromColors(
        baseColor: c.surfaceTint,
        highlightColor: c.surface,
        child: Container(
          height: 72.h,
          decoration: BoxDecoration(
            color: c.surface,
            borderRadius: BorderRadius.circular(16.r),
          ),
        ),
      ),
    );
  }
}
