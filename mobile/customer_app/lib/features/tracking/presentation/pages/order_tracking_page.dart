import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/constants/app_images.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/smooth_cta_button.dart';
import '../../../orders/data/customer_orders_repository.dart';
import '../../../orders/domain/order_models.dart';

class OrderTrackingPage extends StatefulWidget {
  const OrderTrackingPage({super.key, required this.orderId});

  final String orderId;

  @override
  State<OrderTrackingPage> createState() => _OrderTrackingPageState();
}

class _OrderTrackingPageState extends State<OrderTrackingPage> {
  final _repo = CustomerOrdersRepository();
  TrackingSnapshot? _tracking;
  bool _loading = true;
  Timer? _poll;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }

  Future<void> _load({bool silent = false}) async {
    if (!silent) setState(() => _loading = true);
    try {
      final t = await _repo.fetchTracking(widget.orderId);
      if (!mounted) return;
      setState(() {
        _tracking = t;
        _loading = false;
      });
      _syncPoll(t.order);
    } catch (_) {
      if (mounted && !silent) setState(() => _loading = false);
    }
  }

  void _syncPoll(CustomerOrder order) {
    _poll?.cancel();
    if (order.awaitingProviderAccept || order.status == OrderStatus.matched) {
      _poll = Timer.periodic(const Duration(seconds: 3), (_) => _load(silent: true));
    }
  }

  void _goBack(BuildContext context) {
    if (context.canPop()) {
      context.pop();
    } else {
      context.go('/home?tab=activity');
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    if (_loading) {
      return Scaffold(
        backgroundColor: c.background,
        body: Center(child: CircularProgressIndicator(color: c.primary)),
      );
    }

    final t = _tracking!;
    final order = t.order;

    return Scaffold(
      backgroundColor: c.background,
      appBar: AppBar(
        backgroundColor: c.background,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: c.onSurface, size: 20.sp),
          onPressed: () => _goBack(context),
        ),
        title: Text(
          'Theo dõi chuyến',
          style: TextStyle(color: c.onSurface, fontWeight: FontWeight.w700, fontSize: 17.sp),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: Icon(Icons.refresh_rounded, color: c.onSurfaceMuted, size: 22.sp),
            onPressed: () => _load(),
          ),
        ],
      ),
      body: Column(
        children: [
          if (t.showLiveTracking) _LiveMapStrip(snapshot: t, colors: c),
          Expanded(
            child: ListView(
              padding: EdgeInsets.fromLTRB(20.w, 8.h, 20.w, 16.h),
              children: [
                _StatusHeroCard(snapshot: t, colors: c),
                SizedBox(height: 16.h),
                _OrderInfoCard(order: order, colors: c),
                SizedBox(height: 16.h),
                _TrackingTimeline(steps: t.steps, colors: c),
                SizedBox(height: 16.h),
                _DriverCard(order: order, colors: c),
                SizedBox(height: 20.h),
                Row(
                  children: [
                    Expanded(
                      child: SmoothCtaButton(
                        label: 'Gọi điện',
                        showArrow: false,
                        onPressed: () {},
                      ),
                    ),
                    SizedBox(width: 12.w),
                    Expanded(
                      child: SmoothCtaButton(
                        label: 'Nhắn tin',
                        showArrow: false,
                        outlined: true,
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Chat đơn hàng sẽ có sau khi backend hỗ trợ'),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: EdgeInsets.fromLTRB(20.w, 0, 20.w, 12.h),
          child: Row(
            children: [
              Expanded(
                child: TextButton.icon(
                  onPressed: () => context.go('/home'),
                  icon: Icon(Icons.home_outlined, size: 18.sp, color: c.onSurfaceMuted),
                  label: Text(
                    'Về trang chủ',
                    style: TextStyle(color: c.onSurfaceMuted, fontWeight: FontWeight.w600),
                  ),
                ),
              ),
              Container(width: 1, height: 20.h, color: c.border),
              Expanded(
                child: TextButton.icon(
                  onPressed: () => context.go('/home?tab=activity'),
                  icon: Icon(Icons.assignment_outlined, size: 18.sp, color: c.primary),
                  label: Text(
                    'Hoạt động',
                    style: TextStyle(color: c.primary, fontWeight: FontWeight.w600),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusHeroCard extends StatelessWidget {
  const _StatusHeroCard({required this.snapshot, required this.colors});

  final TrackingSnapshot snapshot;
  final UniMoveColors colors;

  @override
  Widget build(BuildContext context) {
    final c = colors;
    final order = snapshot.order;
    final awaiting = snapshot.isAwaitingScheduledPickup;

    final (icon, subtitle) = switch (true) {
      _ when order.awaitingProviderAccept =>
        (Icons.hourglass_top_rounded, 'Nhà xe sẽ nhận đơn trên app — trang tự cập nhật'),
      _ when order.providerTripConfirmed =>
        (Icons.check_circle_rounded, 'Nhà xe đã nhận đơn · chuẩn bị đúng giờ hẹn'),
      _ when snapshot.showLiveTracking && order.status == OrderStatus.inProgress =>
        (Icons.local_shipping_rounded, 'Xe đang trên đường đến điểm giao'),
      _ when snapshot.showLiveTracking =>
        (Icons.near_me_rounded, 'Tài xế đang di chuyển đến điểm lấy đồ'),
      _ when awaiting =>
        (Icons.schedule_rounded, 'Vận chuyển bắt đầu đúng khung giờ bạn đã đặt'),
      _ => (Icons.event_available_rounded, 'Đơn đang được xử lý theo lịch'),
    };

    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(18.w),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [c.primary, c.primaryLight],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20.r),
        boxShadow: [
          BoxShadow(
            color: c.primary.withValues(alpha: 0.25),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 48.w,
            height: 48.w,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(14.r),
            ),
            child: Icon(icon, color: Colors.white, size: 26.sp),
          ),
          SizedBox(width: 14.w),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  snapshot.statusLabel,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18.sp,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                if (order.scheduledPickupAt != null) ...[
                  SizedBox(height: 4.h),
                  Text(
                    order.scheduledPickupLabel,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.95),
                      fontSize: 15.sp,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
                SizedBox(height: 6.h),
                Text(
                  subtitle,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.85),
                    fontSize: 12.sp,
                    height: 1.35,
                  ),
                ),
                if (awaiting && order.minutesUntilPickup != null) ...[
                  SizedBox(height: 10.h),
                  Container(
                    padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 6.h),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8.r),
                    ),
                    child: Text(
                      'Còn ~${order.minutesUntilPickup} phút đến giờ lấy đồ',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 11.sp,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _OrderInfoCard extends StatelessWidget {
  const _OrderInfoCard({required this.order, required this.colors});

  final CustomerOrder order;
  final UniMoveColors colors;

  @override
  Widget build(BuildContext context) {
    final c = colors;
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
          Text(
            order.activityRouteTitle,
            style: TextStyle(fontSize: 14.sp, fontWeight: FontWeight.w700, color: c.onSurface),
          ),
          SizedBox(height: 4.h),
          Text(
            'Mã đơn: ${order.orderNumber}',
            style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted),
          ),
          if (order.pickupAddress.isNotEmpty || order.deliveryAddress.isNotEmpty) ...[
            SizedBox(height: 10.h),
            _routeLine(Icons.trip_origin, order.pickupAddress, c.primary, c),
            SizedBox(height: 6.h),
            _routeLine(Icons.location_on_outlined, order.deliveryAddress, Colors.red.shade400, c),
          ],
        ],
      ),
    );
  }

  Widget _routeLine(IconData icon, String text, Color iconColor, UniMoveColors c) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16.sp, color: iconColor),
        SizedBox(width: 8.w),
        Expanded(
          child: Text(
            text,
            style: TextStyle(fontSize: 12.sp, color: c.onSurface, height: 1.3),
          ),
        ),
      ],
    );
  }
}

class _DriverCard extends StatelessWidget {
  const _DriverCard({required this.order, required this.colors});

  final CustomerOrder order;
  final UniMoveColors colors;

  @override
  Widget build(BuildContext context) {
    final c = colors;
    final name = order.providerName ?? 'Tài xế';

    return Container(
      padding: EdgeInsets.all(14.w),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(16.r),
        border: Border.all(color: c.border),
      ),
      child: Row(
        children: [
          Stack(
            children: [
              CircleAvatar(
                radius: 26.r,
                backgroundColor: c.chipBg,
                backgroundImage:
                    order.providerAvatarUrl != null ? NetworkImage(order.providerAvatarUrl!) : null,
                child: order.providerAvatarUrl == null
                    ? Icon(Icons.person_outline, color: c.primary, size: 24.sp)
                    : null,
              ),
              Positioned(
                right: 0,
                bottom: 0,
                child: Container(
                  width: 14.w,
                  height: 14.w,
                  decoration: BoxDecoration(
                    color: c.accentGreen,
                    shape: BoxShape.circle,
                    border: Border.all(color: c.surface, width: 2),
                  ),
                ),
              ),
            ],
          ),
          SizedBox(width: 12.w),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15.sp)),
                SizedBox(height: 2.h),
                Row(
                  children: [
                    Icon(Icons.star_rounded, color: Colors.amber.shade700, size: 14.sp),
                    Text(
                      ' ${order.providerRating ?? 4.9}',
                      style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12.sp),
                    ),
                    Text(
                      ' · ${order.vehicleLabel}',
                      style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted),
                    ),
                  ],
                ),
                if (order.providerPlate != null && order.providerPlate!.isNotEmpty)
                  Text(
                    'Biển số: ${order.providerPlate}',
                    style: TextStyle(fontSize: 11.sp, color: c.onSurfaceMuted),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _LiveMapStrip extends StatelessWidget {
  const _LiveMapStrip({required this.snapshot, required this.colors});

  final TrackingSnapshot snapshot;
  final UniMoveColors colors;

  @override
  Widget build(BuildContext context) {
    final c = colors;
    return SizedBox(
      height: 200.h,
      width: double.infinity,
      child: Stack(
        fit: StackFit.expand,
        children: [
          CachedNetworkImage(
            imageUrl: AppImages.mapPreview,
            fit: BoxFit.cover,
            memCacheWidth: 900,
          ),
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.transparent,
                  c.background.withValues(alpha: 0.9),
                ],
              ),
            ),
          ),
          Positioned(
            top: 12.h,
            left: 16.w,
            right: 16.w,
            child: Container(
              padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 10.h),
              decoration: BoxDecoration(
                color: c.surface.withValues(alpha: 0.95),
                borderRadius: BorderRadius.circular(12.r),
                boxShadow: [
                  BoxShadow(color: c.navBarShadow, blurRadius: 8, offset: const Offset(0, 2)),
                ],
              ),
              child: Row(
                children: [
                  Icon(Icons.schedule, color: c.primary, size: 18.sp),
                  SizedBox(width: 8.w),
                  Expanded(
                    child: Text(
                      'Dự kiến ${snapshot.etaMinutes} phút · ${snapshot.distanceKm} km',
                      style: TextStyle(fontSize: 12.sp, fontWeight: FontWeight.w600, color: c.onSurface),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TrackingTimeline extends StatelessWidget {
  const _TrackingTimeline({required this.steps, required this.colors});

  final List<TrackingStep> steps;
  final UniMoveColors colors;

  @override
  Widget build(BuildContext context) {
    final c = colors;
    return Container(
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(16.r),
        border: Border.all(color: c.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Tiến trình',
            style: TextStyle(fontSize: 15.sp, fontWeight: FontWeight.w800, color: c.onSurface),
          ),
          SizedBox(height: 14.h),
          ...steps.asMap().entries.map((e) {
            final i = e.key;
            final step = e.value;
            final isLast = i == steps.length - 1;
            final reached = step.done || step.active;
            return _TimelineRow(
              step: step,
              reached: reached,
              isLast: isLast,
              colors: c,
            );
          }),
        ],
      ),
    );
  }
}

class _TimelineRow extends StatelessWidget {
  const _TimelineRow({
    required this.step,
    required this.reached,
    required this.isLast,
    required this.colors,
  });

  final TrackingStep step;
  final bool reached;
  final bool isLast;
  final UniMoveColors colors;

  @override
  Widget build(BuildContext context) {
    final c = colors;
    final icon = switch (step.key) {
      'picking_up' => Icons.inventory_2_outlined,
      'in_progress' => Icons.local_shipping_outlined,
      'accepted' => Icons.handshake_outlined,
      'completed' => Icons.check_circle_outline,
      _ => Icons.event_available_outlined,
    };

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 32.w,
            child: Column(
              children: [
                Container(
                  width: 28.w,
                  height: 28.w,
                  decoration: BoxDecoration(
                    color: reached ? c.primary : c.surfaceTint,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    step.done ? Icons.check : icon,
                    size: 14.sp,
                    color: reached ? AppColors.onPrimary : c.onSurfaceMuted,
                  ),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      margin: EdgeInsets.symmetric(vertical: 4.h),
                      color: step.done ? c.primary.withValues(alpha: 0.5) : c.border,
                    ),
                  ),
              ],
            ),
          ),
          SizedBox(width: 12.w),
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 16.h),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    step.label,
                    style: TextStyle(
                      fontSize: 13.sp,
                      fontWeight: step.active ? FontWeight.w700 : FontWeight.w600,
                      color: step.active ? c.primary : (reached ? c.onSurface : c.onSurfaceMuted),
                    ),
                  ),
                  if (step.active)
                    Padding(
                      padding: EdgeInsets.only(top: 2.h),
                      child: Text(
                        'Đang thực hiện',
                        style: TextStyle(fontSize: 11.sp, color: c.primary),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
