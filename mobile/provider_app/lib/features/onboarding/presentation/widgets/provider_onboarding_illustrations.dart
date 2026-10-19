import 'package:flutter/material.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/theme/app_colors.dart';

/// Slide 1 — hộp thư đơn chờ nhận.
class ProviderOnboardingInboxCard extends StatelessWidget {
  const ProviderOnboardingInboxCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 24),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surfaceCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.12),
            blurRadius: 24,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  'CHỜ NHẬN',
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.primaryLight),
                ),
              ),
              const Spacer(),
              const Text('1.250.000đ', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
            ],
          ),
          const SizedBox(height: 14),
          const Row(
            children: [
              Icon(LucideIcons.mapPin, size: 18, color: AppColors.primaryLight),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'KTX Đại học FPT → Chung cư Sunrise',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () {},
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.onSurfaceVariant,
                    side: const BorderSide(color: AppColors.border),
                  ),
                  child: const Text('Từ chối'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: AppColors.gradientPrimary),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: ElevatedButton(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.transparent,
                      shadowColor: Colors.transparent,
                      foregroundColor: AppColors.onPrimary,
                    ),
                    child: const Text('Nhận đơn'),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Slide 2 — thu nhập tháng.
class ProviderOnboardingEarningsCard extends StatelessWidget {
  const ProviderOnboardingEarningsCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 28),
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: AppColors.gradientPrimary,
        ),
        borderRadius: BorderRadius.circular(22),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.45),
            blurRadius: 28,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(LucideIcons.wallet, color: AppColors.onPrimary, size: 22),
              SizedBox(width: 8),
              Text('Thu nhập tháng này', style: TextStyle(color: AppColors.onPrimary, fontSize: 13)),
            ],
          ),
          const SizedBox(height: 12),
          const Text(
            '18.450.000đ',
            style: TextStyle(
              color: AppColors.onPrimary,
              fontSize: 32,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              const _miniStat('12', 'Đơn xong'),
              const SizedBox(width: 16),
              const _miniStat('3', 'Đang chạy'),
              const SizedBox(width: 16),
              const _miniStat('4.9', 'Rating'),
            ],
          ),
        ],
      ),
    );
  }
}

class _miniStat extends StatelessWidget {
  const _miniStat(this.value, this.label);
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(value, style: const TextStyle(color: AppColors.onPrimary, fontWeight: FontWeight.w800, fontSize: 18)),
        Text(label, style: TextStyle(color: AppColors.onPrimary.withValues(alpha: 0.8), fontSize: 11)),
      ],
    );
  }
}

/// Slide 3 — xác thực giấy tờ.
class ProviderOnboardingVerifyCard extends StatelessWidget {
  const ProviderOnboardingVerifyCard({super.key});

  static const _docs = [
    (LucideIcons.idCard, 'GPLX'),
    (LucideIcons.car, 'Đăng ký xe'),
    (LucideIcons.shield, 'Bảo hiểm'),
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 24),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surfaceCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppColors.success.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(LucideIcons.badgeCheck, color: AppColors.success, size: 26),
              ),
              const SizedBox(width: 14),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Hồ sơ đối tác', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                    Text(
                      'Upload giấy tờ — admin duyệt trong 24h',
                      style: TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ..._docs.map(
            (d) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  Icon(d.$1, size: 18, color: AppColors.primaryLight),
                  const SizedBox(width: 10),
                  Text(d.$2, style: const TextStyle(fontWeight: FontWeight.w600)),
                  const Spacer(),
                  const Icon(LucideIcons.circleCheck, size: 18, color: AppColors.success),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
