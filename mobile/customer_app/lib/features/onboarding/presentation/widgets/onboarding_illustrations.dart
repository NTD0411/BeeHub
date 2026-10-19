import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';

class OnboardingMapCard extends StatelessWidget {
  const OnboardingMapCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 220,
      margin: const EdgeInsets.symmetric(horizontal: 28),
      decoration: BoxDecoration(
        color: AppColors.surfaceCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Stack(
        children: [
          CustomPaint(size: Size.infinite, painter: _MapGridPainter()),
          const Positioned(left: 28, top: 48, child: _MapPin(color: AppColors.primary, label: 'KTX A')),
          const Positioned(right: 36, bottom: 52, child: _MapPin(color: AppColors.accent, label: 'Trọ mới')),
          Positioned.fill(
            child: CustomPaint(painter: _RouteLinePainter()),
          ),
        ],
      ),
    );
  }
}

class OnboardingPriceCards extends StatelessWidget {
  const OnboardingPriceCards({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 200,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Positioned(
            top: 0,
            left: 40,
            right: 40,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surfaceCard,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                children: [
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('ĐI 1 MÌNH', style: TextStyle(fontSize: 11, color: AppColors.onSurfaceMuted)),
                        SizedBox(height: 4),
                        Text('450.000đ', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceMuted,
                      borderRadius: BorderRadius.circular(99),
                    ),
                    child: const Text('Solo', style: TextStyle(fontSize: 11)),
                  ),
                ],
              ),
            ),
          ),
          Positioned(
            bottom: 0,
            left: 24,
            right: 24,
            child: Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: AppColors.gradientPrimary),
                borderRadius: BorderRadius.circular(18),
                boxShadow: [
                  BoxShadow(color: AppColors.primary.withValues(alpha: 0.4), blurRadius: 24, offset: const Offset(0, 8)),
                ],
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.auto_awesome, color: AppColors.accent, size: 16),
                            SizedBox(width: 6),
                            Text('GỘP ĐƠN', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.onPrimary)),
                          ],
                        ),
                        SizedBox(height: 6),
                        Text('270.000đ', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: AppColors.onPrimary)),
                        Text('cho mỗi sinh viên', style: TextStyle(fontSize: 12, color: AppColors.onPrimary.withValues(alpha: 0.85))),
                        SizedBox(height: 10),
                        Row(
                          children: [
                            const _AvatarChip('L', AppColors.accentOrange),
                            const _AvatarChip('M', AppColors.success),
                            _AvatarChip('T', Color(0xFFEC4899)),
                            const _AvatarChip('+2', AppColors.outline),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Container(
                    width: 64,
                    height: 64,
                    decoration: const BoxDecoration(color: AppColors.accent, shape: BoxShape.circle),
                    alignment: Alignment.center,
                    child: const Text(
                      '-40%\nTIẾT\nKIỆM',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: Color(0xFF1E293B), height: 1.1),
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

class _AvatarChip extends StatelessWidget {
  const _AvatarChip(this.label, this.color);
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 28,
      height: 28,
      margin: const EdgeInsets.only(right: 4),
      alignment: Alignment.center,
      decoration: BoxDecoration(color: color, shape: BoxShape.circle, border: Border.all(color: AppColors.surface, width: 2)),
      child: Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Colors.white)),
    );
  }
}

class OnboardingTrackingCard extends StatelessWidget {
  const OnboardingTrackingCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 24),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceCard,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.inventory_2_outlined, color: AppColors.primary, size: 20),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Đơn #UM-2841', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                    Text('Tài xế Anh Tuấn · 4.9 ★', style: TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant)),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text('ETA 12\'', style: TextStyle(fontSize: 11, color: AppColors.primaryLight, fontWeight: FontWeight.w600)),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const _TimelineStep('Đã nhận đơn', '09:02', done: true),
          const _TimelineStep('Đang lấy đồ tại KTX A', '09:24', done: true),
          const _TimelineStep('Đang di chuyển', 'now', active: true),
          const _TimelineStep('Giao đến trọ mới', '--', pending: true),
        ],
      ),
    );
  }
}

class _TimelineStep extends StatelessWidget {
  const _TimelineStep(this.title, this.time, {this.done = false, this.active = false, this.pending = false});

  final String title;
  final String time;
  final bool done;
  final bool active;
  final bool pending;

  @override
  Widget build(BuildContext context) {
    final dotColor = active
        ? AppColors.primaryLight
        : done
            ? AppColors.primary
            : AppColors.outlineVariant;

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(
              color: dotColor,
              shape: BoxShape.circle,
              boxShadow: active
                  ? [BoxShadow(color: AppColors.primaryLight.withValues(alpha: 0.6), blurRadius: 8, spreadRadius: 2)]
                  : null,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(child: Text(title, style: TextStyle(fontSize: 13, color: pending ? AppColors.onSurfaceMuted : AppColors.onSurface))),
          Text(time, style: TextStyle(fontSize: 12, color: pending ? AppColors.onSurfaceMuted : AppColors.onSurfaceVariant)),
        ],
      ),
    );
  }
}

class _MapPin extends StatelessWidget {
  const _MapPin({required this.color, required this.label});
  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(Icons.location_on, color: color, size: 28),
        Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
      ],
    );
  }
}

class _MapGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.outline.withValues(alpha: 0.35)
      ..strokeWidth = 1;
    for (var i = 1; i < 5; i++) {
      final x = size.width * i / 5;
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
      final y = size.height * i / 5;
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _RouteLinePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.primary
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;
    final path = Path()
      ..moveTo(size.width * 0.2, size.height * 0.35)
      ..quadraticBezierTo(size.width * 0.5, size.height * 0.2, size.width * 0.75, size.height * 0.65);
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class OnboardingFeatureChip extends StatelessWidget {
  const OnboardingFeatureChip({super.key, required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.surfaceMuted,
        borderRadius: BorderRadius.circular(99),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: AppColors.primaryLight),
          const SizedBox(width: 6),
          Text(label, style: const TextStyle(fontSize: 12, color: AppColors.primaryLight, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
