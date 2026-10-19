import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/auth/auth_token_storage.dart';
import '../../../../core/dev/dev_session_bootstrap.dart';
import '../../../../core/services/onboarding_prefs.dart';
import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/dark_glass_background.dart';
import '../../../../core/widgets/shad_screen_scope.dart';
import '../../../../core/widgets/unimove_logo.dart';

const _minSplashDuration = Duration(milliseconds: 1500);

class SplashPage extends StatefulWidget {
  const SplashPage({super.key});

  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage> {
  bool _navigated = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      unawaited(_navigateWhenReady());
    });
  }

  Future<void> _navigateWhenReady() async {
    await Future<void>.delayed(_minSplashDuration);
    if (!mounted || _navigated) return;
    _navigated = true;

    await DevSessionBootstrap.apply();

    final hasSession = await AuthTokenStorage.instance.hasSession();
    if (hasSession) {
      context.go('/home');
      return;
    }

    final onboardingDone = await isProviderOnboardingDone();
    if (!mounted) return;
    context.go(onboardingDone ? '/login' : '/onboarding');
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    return ShadScreenScope(
      builder: (_, theme) {
        return Scaffold(
          backgroundColor: Colors.transparent,
          body: Stack(
            fit: StackFit.expand,
            children: [
              const DarkGlassBackground(variant: DarkGlassVariant.splash),
              Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 72,
                      height: 72,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF3B82F6), Color(0xFF004AC6)],
                        ),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: c.primary.withValues(alpha: 0.45),
                            blurRadius: 24,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: const Icon(LucideIcons.truck, color: Colors.white, size: 36),
                    )
                        .animate()
                        .scale(duration: 600.ms, curve: Curves.easeOutBack),
                    const SizedBox(height: 20),
                    const UniMoveLogoAccent(fontSize: 32)
                        .animate()
                        .fadeIn(delay: 200.ms, duration: 500.ms),
                    const SizedBox(height: 8),
                    Text(
                      'Partner',
                      style: theme.textTheme.muted.copyWith(
                        color: c.onSurfaceMuted,
                        letterSpacing: 4,
                        fontWeight: FontWeight.w600,
                      ),
                    ).animate().fadeIn(delay: 350.ms),
                    const SizedBox(height: 32),
                    SizedBox(
                      width: 28,
                      height: 28,
                      child: CircularProgressIndicator(strokeWidth: 2.5, color: c.primary),
                    ).animate().fadeIn(delay: 500.ms),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
