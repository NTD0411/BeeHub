import 'dart:async';

import 'package:flutter/material.dart';
import 'package:shadcn_ui/shadcn_ui.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/auth/auth_token_storage.dart';
import '../../../../core/mock/mock_auth_session.dart';
import '../../../../core/services/onboarding_prefs.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/shad_unimove_theme.dart';
import '../../../../core/widgets/dark_glass_background.dart';
import '../../../../core/widgets/shad_screen_scope.dart';
import '../../../../core/widgets/unimove_logo.dart';

const _minSplashDuration = Duration(seconds: 4);

class SplashPage extends StatefulWidget {
  const SplashPage({super.key});

  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage> with TickerProviderStateMixin {
  late final AnimationController _pulseCtrl;
  late final AnimationController _fadeCtrl;
  late final Animation<double> _fadeIn;
  bool _navigated = false;

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 2000))
      ..repeat(reverse: true);
    _fadeCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 900));
    _fadeIn = CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeOutCubic);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fadeCtrl.forward(from: 0);
      unawaited(_navigateWhenReady());
    });
  }

  /// Splash → Onboarding (lần đầu) → Login → Home.
  Future<String> _resolveInitialRoute() async {
    try {
      if (!await isOnboardingDone()) return '/onboarding';
      if (await MockAuthSession.isSignedIn()) return '/home';
      if (await AuthTokenStorage.instance.hasSession()) return '/home';
      return '/login';
    } catch (_) {
      if (!await isOnboardingDone()) return '/onboarding';
      return '/login';
    }
  }

  Future<void> _navigateWhenReady() async {
    final started = DateTime.now();
    await Future<void>.delayed(Duration.zero);
    await WidgetsBinding.instance.endOfFrame;

    final elapsed = DateTime.now().difference(started);
    if (elapsed < _minSplashDuration) {
      await Future<void>.delayed(_minSplashDuration - elapsed);
    }

    if (!mounted || _navigated) return;
    _navigated = true;

    final route = await _resolveInitialRoute();

    if (!mounted) return;
    context.go(route);
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    _fadeCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ShadScreenScope(
      withToaster: false,
      builder: (_, theme) {
        return Scaffold(
          backgroundColor: Colors.transparent,
          body: Stack(
            fit: StackFit.expand,
            children: [
              const DarkGlassBackground(variant: DarkGlassVariant.splash),
              Positioned.fill(
                child: FadeTransition(
                  opacity: _fadeIn,
                  child: SafeArea(
                  child: Center(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 32),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          AnimatedBuilder(
                            animation: _pulseCtrl,
                            builder: (context, child) {
                              final scale = 1 + _pulseCtrl.value * 0.04;
                              return Transform.scale(scale: scale, child: child);
                            },
                            child: Container(
                              width: 92,
                              height: 92,
                              decoration: BoxDecoration(
                                color: UniMoveShadTheme.glassCard,
                                borderRadius: BorderRadius.circular(22),
                                border: Border.all(color: UniMoveShadTheme.glassBorderStrong),
                                boxShadow: const [
                                  BoxShadow(
                                    color: Color(0x50000000),
                                    blurRadius: 28,
                                    offset: Offset(0, 12),
                                  ),
                                ],
                              ),
                              child: const Icon(
                                LucideIcons.bus,
                                size: 44,
                                color: AppColors.onPrimary,
                              ),
                            ),
                          )
                              .animate(onPlay: (c) => c.repeat(reverse: true))
                              .shimmer(
                                duration: 2400.ms,
                                color: AppColors.primaryLight.withValues(alpha: 0.2),
                              ),
                          const SizedBox(height: 28),
                          const UniMoveLogoAccent(fontSize: 40),
                          const SizedBox(height: 20),
                          Text(
                            'Chuyển trọ sinh viên — minh bạch giá, tracking realtime, tiết kiệm tới 40%.',
                            textAlign: TextAlign.center,
                            style: theme.textTheme.lead.copyWith(
                              color: AppColors.onSurfaceVariant,
                              height: 1.55,
                            ),
                          ),
                          const SizedBox(height: 40),
                          const _BounceDots(),
                          const SizedBox(height: 24),
                          ShadBadge.secondary(
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                SizedBox(
                                  width: 14,
                                  height: 14,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: theme.colorScheme.primary,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'Đang khởi động...',
                                  style: theme.textTheme.small.copyWith(
                                    color: theme.colorScheme.mutedForeground,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
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

class _BounceDots extends StatefulWidget {
  const _BounceDots();

  @override
  State<_BounceDots> createState() => _BounceDotsState();
}

class _BounceDotsState extends State<_BounceDots> with SingleTickerProviderStateMixin {
  late final AnimationController _c;

  @override
  void initState() {
    super.initState();
    _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))..repeat();
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(3, (i) {
        return AnimatedBuilder(
          animation: _c,
          builder: (context, _) {
            final phase = (_c.value + i * 0.2) % 1.0;
            final y = -6 * (phase < 0.5 ? phase * 2 : (1 - phase) * 2);
            final active = i == 1;
            return Transform.translate(
              offset: Offset(0, y),
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 4),
                width: active ? 8 : 6,
                height: active ? 8 : 6,
                decoration: BoxDecoration(
                  color: active ? AppColors.primaryLight : Colors.white.withValues(alpha: 0.35),
                  shape: BoxShape.circle,
                ),
              ),
            );
          },
        );
      }),
    );
  }
}
