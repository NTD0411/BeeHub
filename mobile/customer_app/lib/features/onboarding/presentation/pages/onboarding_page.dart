import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/services/onboarding_prefs.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/dark_glass_background.dart';
import '../../../../core/widgets/shad_screen_scope.dart';
import '../../../../core/widgets/unimove_logo.dart';
import '../widgets/onboarding_illustrations.dart';

class OnboardingPage extends StatefulWidget {
  const OnboardingPage({super.key});

  @override
  State<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends State<OnboardingPage> {
  final _pageCtrl = PageController();
  int _index = 0;

  static const _slides = [
    (
      chipIcon: LucideIcons.route,
      chip: 'Đặt dịch vụ trong 3 phút',
      title: 'Nhập điểm đi - điểm đến, ',
      highlight: 'xe có ngay',
      body:
          'Chọn ngày giờ, loại đồ — hệ thống gợi ý ngay nhà cung cấp gần bạn nhất kèm báo giá minh bạch.',
      visual: 0,
    ),
    (
      chipIcon: LucideIcons.sparkles,
      chip: 'Gộp đơn thông minh',
      title: 'Tiết kiệm tới ',
      highlight: '40%',
      body:
          'AI tự động ghép bạn với sinh viên cùng tuyến đường. Chia sẻ chuyến — chia sẻ chi phí.',
      visual: 1,
    ),
    (
      chipIcon: LucideIcons.package,
      chip: 'Tracking realtime',
      title: 'Theo dõi mọi món đồ ',
      highlight: 'đến tận phòng',
      body:
          'Bản đồ live, chat trực tiếp với tài xế, ảnh xác nhận trước & sau khi chuyển.',
      visual: 2,
    ),
  ];

  Future<void> _finish() async {
    await setOnboardingDone();
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
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const UniMoveLogoAccent(fontSize: 22),
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
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Column(
                              children: [
                                const SizedBox(height: 12),
                                if (s.visual == 0)
                                  const OnboardingMapCard()
                                else if (s.visual == 1)
                                  const OnboardingPriceCards()
                                else
                                  const OnboardingTrackingCard(),
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
                              trailing: const Icon(
                                LucideIcons.arrowRight,
                                size: 20,
                                color: AppColors.onPrimary,
                              ),
                              child: Text(
                                isLast ? 'Bắt đầu ngay' : 'Tiếp tục',
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
