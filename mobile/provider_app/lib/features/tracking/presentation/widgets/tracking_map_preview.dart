import 'package:flutter/material.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/constants/app_images.dart';
import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/shad_screen_scope.dart';

/// Bản đồ demo — ảnh nền + tuyến + marker xe (chưa Google Maps).
class TrackingMapPreview extends StatelessWidget {
  const TrackingMapPreview({
    super.key,
    required this.routeProgress,
    required this.etaMinutes,
    required this.distanceKm,
    required this.phaseTitle,
    required this.isSharing,
  });

  final double routeProgress;
  final int etaMinutes;
  final double distanceKm;
  final String phaseTitle;
  final bool isSharing;

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);
    final theme = ShadTheme.of(context);

    return LayoutBuilder(
      builder: (context, constraints) {
        final w = constraints.maxWidth;
        final h = constraints.maxHeight;
        final pickup = Offset(w * 0.18, h * 0.38);
        final delivery = Offset(w * 0.78, h * 0.72);
        final t = routeProgress.clamp(0.0, 1.0);
        final truck = Offset(
          pickup.dx + (delivery.dx - pickup.dx) * t,
          pickup.dy + (delivery.dy - pickup.dy) * t,
        );

        return Stack(
          fit: StackFit.expand,
          children: [
            Image.network(
              AppImages.mapPreview,
              fit: BoxFit.cover,
              width: w,
              height: h,
              errorBuilder: (_, __, ___) => ColoredBox(color: c.chipBg),
            ),
            DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withValues(alpha: 0.3),
                    Colors.transparent,
                    Colors.black.withValues(alpha: 0.15),
                  ],
                ),
              ),
            ),
            CustomPaint(
              size: Size(w, h),
              painter: _RoutePainter(
                progress: t,
                routeColor: c.primary,
                pickupColor: c.success,
                deliveryColor: c.primaryLight,
              ),
            ),
            Positioned(
              left: 16,
              right: 16,
              top: 12,
              child: GlassCard(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                radius: 14,
                child: Row(
                  children: [
                    Icon(
                      isSharing ? LucideIcons.radio : LucideIcons.mapPin,
                      size: 20,
                      color: isSharing ? c.success : c.primary,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            phaseTitle,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: theme.textTheme.p.copyWith(
                              fontWeight: FontWeight.w800,
                              color: c.onSurface,
                            ),
                          ),
                          Text(
                            isSharing
                                ? 'Khách thấy bạn trên bản đồ (demo)'
                                : 'Bật khi bắt đầu chuyến',
                            style: theme.textTheme.small.copyWith(
                              color: c.onSurfaceMuted,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          '$etaMinutes phút',
                          style: theme.textTheme.p.copyWith(
                            fontWeight: FontWeight.w800,
                            color: c.primary,
                          ),
                        ),
                        Text(
                          '${distanceKm.toStringAsFixed(1)} km',
                          style: theme.textTheme.small.copyWith(
                            color: c.onSurfaceMuted,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            Positioned(
              left: truck.dx - 22,
              top: truck.dy - 22,
              child: _VehicleMarker(isPulsing: isSharing),
            ),
          ],
        );
      },
    );
  }
}

class _VehicleMarker extends StatelessWidget {
  const _VehicleMarker({required this.isPulsing});

  final bool isPulsing;

  @override
  Widget build(BuildContext context) {
    final core = Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: const Icon(LucideIcons.truck, color: Color(0xFF2563EB), size: 24),
    );

    if (!isPulsing) return core;

    return SizedBox(
      width: 56,
      height: 56,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFF2563EB).withValues(alpha: 0.18),
            ),
          ),
          core,
        ],
      ),
    );
  }
}

class _RoutePainter extends CustomPainter {
  _RoutePainter({
    required this.progress,
    required this.routeColor,
    required this.pickupColor,
    required this.deliveryColor,
  });

  final double progress;
  final Color routeColor;
  final Color pickupColor;
  final Color deliveryColor;

  @override
  void paint(Canvas canvas, Size size) {
    final pickup = Offset(size.width * 0.18, size.height * 0.38);
    final delivery = Offset(size.width * 0.78, size.height * 0.72);
    final path = Path()
      ..moveTo(pickup.dx, pickup.dy)
      ..quadraticBezierTo(size.width * 0.45, size.height * 0.2, delivery.dx, delivery.dy);

    final bgPaint = Paint()
      ..color = routeColor.withValues(alpha: 0.25)
      ..strokeWidth = 6
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    canvas.drawPath(path, bgPaint);

    final metrics = path.computeMetrics().first;
    final active = metrics.extractPath(0, metrics.length * progress.clamp(0.02, 1.0));
    final activePaint = Paint()
      ..color = routeColor
      ..strokeWidth = 6
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    canvas.drawPath(active, activePaint);

    _drawPin(canvas, pickup, pickupColor);
    _drawPin(canvas, delivery, deliveryColor);
  }

  void _drawPin(Canvas canvas, Offset c, Color color) {
    canvas.drawCircle(c, 10, Paint()..color = Colors.white);
    canvas.drawCircle(c, 7, Paint()..color = color);
  }

  @override
  bool shouldRepaint(covariant _RoutePainter old) => old.progress != progress;
}
