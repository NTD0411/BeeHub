import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/services/onboarding_prefs.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/dark_glass_background.dart';
import '../../../../core/widgets/shad_screen_scope.dart';
import '../../../../core/widgets/unimove_logo.dart';
import '../widgets/provider_onboarding_illustrations.dart';

class ProviderOnboardingPage extends StatefulWidget {
  const ProviderOnboardingPage({super.key});

  @override
  State<ProviderOnboardingPage> createState() => _ProviderOnboardingPageState();
}

class _ProviderOnboardingPageState extends State<ProviderOnboardingPage> {
  final _pageCtrl = PageController();
  int _index = 0;

  static const _slides = [
    (
      chipIcon: LucideIcons.inbox,
      chip: 'Nhận đơn trong vài giây',
      title: 'Hộp thư đơn ',
      highlight: 'thông minh',
      body: 'Xem đơn chờ, nhận hoặc từ chối ngay trên app — đồng bộ realtime với khách hàng.',
      visual: 0,
    ),
    (
      chipIcon: LucideIcons.wallet,
      chip: 'Thu nhập minh bạch',
      title: 'Theo dõi ',
      highlight: 'doanh thu',
      body: 'Tổng hợp đơn hoàn thành, phí nền tảng và rating — mọi thứ trong tab Thu nhập.',
      visual: 1,
    ),
    (
      chipIcon: LucideIcons.badgeCheck,
      chip: 'Uy tín đối tác',
      title: 'Xác thực ',
      highlight: 'nhanh chóng',
      body: 'Upload GPLX, đăng ký xe và bảo hiểm — badge xác thực giúp khách tin tưởng hơn.',
      visual: 2,
    ),
  ];

  Future<void> _finish() async {
    await setProviderOnboardingDone();
    if (mounted) context.go('/login');
  }

  void _next() {
    if (_index < _slides.length - 1) {
      _pageCtrl.nextPage(
        duration: const Duration(milliseconds: 450),
        curve: Curves.easeOutCubic,
      );
    } else {
      _finish();
    }
  }

  @override
  void dispose() {
    _pageCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final slide = _slides[_index];
    final isLast = _index == _slides.length - 1;

    return ShadScreenScope(
      builder: (_, theme) {
        return Scaffold(
          backgroundColor: Colors.transparent,
          body: Stack(
            fit: StackFit.expand,
            children: [
              const DarkGlassBackground(variant: DarkGlassVariant.subtle),
              Positioned.fill(
                child: SafeArea(
                  child: Column(
                    children: [
                      Padding(
                        padding: const EdgeInsets.fromLTRB(20, 8, 12, 0),
                        child: Row(
                          children: [
                            const UniMoveLogoAccent(fontSize: 22),
                            const Spacer(),
                            ShadButton.ghost(
                              onPressed: _finish,
                              child: Text(
                                'Bỏ qua',
                                style: theme.textTheme.small.copyWith(
                                  fontWeight: FontWeight.w600,
                                  color: theme.colorScheme.mutedForeground,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      Expanded(
                        child: PageView.builder(
                          controller: _pageCtrl,
                          onPageChanged: (i) => setState(() => _index = i),
                          itemCount: _slides.length,
                          itemBuilder: (_, i) {
                            final s = _slides[i];
                            return Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 8),
                              child: Column(
                                children: [
                                  const SizedBox(height: 16),
                                  if (s.visual == 0)
                                    const ProviderOnboardingInboxCard()
                                        .animate()
                                        .fadeIn(duration: 400.ms)
                                        .slideY(begin: 0.04, end: 0)
                                  else if (s.visual == 1)
                                    const ProviderOnboardingEarningsCard()
                                        .animate()
                                        .fadeIn(duration: 400.ms)
                                        .scale(begin: const Offset(0.96, 0.96), end: const Offset(1, 1))
                                  else
                                    const ProviderOnboardingVerifyCard()
                                        .animate()
                                        .fadeIn(duration: 400.ms)
                                        .slideX(begin: 0.03, end: 0),
                                  const Spacer(),
                                ],
                              ),
                            );
                          },
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(24, 0, 24, 28),
                        child: AnimatedSwitcher(
                          duration: const Duration(milliseconds: 400),
                          switchInCurve: Curves.easeOutCubic,
                          switchOutCurve: Curves.easeInCubic,
                          child: Column(
                            key: ValueKey(_index),
                            children: [
                              ShadBadge.secondary(
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(slide.chipIcon, size: 14, color: theme.colorScheme.primary),
                                    const SizedBox(width: 6),
                                    Text(
                                      slide.chip,
                                      style: theme.textTheme.small.copyWith(
                                        fontWeight: FontWeight.w600,
                                        color: theme.colorScheme.primary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 20),
                              RichText(
                                textAlign: TextAlign.center,
                                text: TextSpan(
                                  style: theme.textTheme.h3.copyWith(
                                    fontWeight: FontWeight.w800,
                                    height: 1.25,
                                  ),
                                  children: [
                                    TextSpan(text: slide.title),
                                    TextSpan(
                                      text: slide.highlight,
                                      style: TextStyle(color: theme.colorScheme.primary),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 12),
                              Text(
                                slide.body,
                                textAlign: TextAlign.center,
                                style: theme.textTheme.muted.copyWith(height: 1.5),
                              ),
                              const SizedBox(height: 28),
                              _PageDots(count: _slides.length, index: _index, theme: theme),
                              const SizedBox(height: 24),
                              ShadButton(
                                size: ShadButtonSize.lg,
                                width: double.infinity,
                                onPressed: _next,
                                gradient: const LinearGradient(colors: AppColors.gradientPrimary),
                                shadows: [
                                  BoxShadow(
                                    color: AppColors.primary.withValues(alpha: 0.4),
                                    blurRadius: 20,
                                    offset: const Offset(0, 8),
                                  ),
                                ],
                                trailing: const Icon(
                                  LucideIcons.arrowRight,
                                  size: 20,
                                  color: AppColors.onPrimary,
                                ),
                                child: Text(
                                  isLast ? 'Đăng nhập / Đăng ký' : 'Tiếp tục',
                                  style: theme.textTheme.p.copyWith(
                                    color: AppColors.onPrimary,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _PageDots extends StatelessWidget {
  const _PageDots({required this.count, required this.index, required this.theme});

  final int count;
  final int index;
  final ShadThemeData theme;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(count, (i) {
        final active = i == index;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOutCubic,
          margin: const EdgeInsets.symmetric(horizontal: 4),
          width: active ? 28 : 8,
          height: 8,
          decoration: BoxDecoration(
            color: active ? theme.colorScheme.primary : theme.colorScheme.border,
            borderRadius: BorderRadius.circular(99),
          ),
        );
      }),
    );
  }
}
