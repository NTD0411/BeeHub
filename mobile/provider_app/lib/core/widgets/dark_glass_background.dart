import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// Nền gradient mesh — không dùng [ImageFilter.blur] (rất nặng khi scroll).
class DarkGlassBackground extends StatefulWidget {
  const DarkGlassBackground({
    super.key,
    this.variant = DarkGlassVariant.standard,
    /// `false` cho Home / shell — nền tĩnh, scroll mượt.
    this.animated = true,
  });

  final DarkGlassVariant variant;
  final bool animated;

  @override
  State<DarkGlassBackground> createState() => _DarkGlassBackgroundState();
}

enum DarkGlassVariant { standard, splash, subtle }

class _DarkGlassBackgroundState extends State<DarkGlassBackground>
    with SingleTickerProviderStateMixin {
  AnimationController? _controller;

  @override
  void initState() {
    super.initState();
    if (widget.animated) {
      _controller = AnimationController(
        vsync: this,
        duration: const Duration(seconds: 12),
      )..repeat();
    }
  }

  @override
  void didUpdateWidget(DarkGlassBackground oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.animated != widget.animated) {
      _controller?.dispose();
      _controller = null;
      if (widget.animated) {
        _controller = AnimationController(
          vsync: this,
          duration: const Duration(seconds: 12),
        )..repeat();
      }
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final gradient = switch (widget.variant) {
      DarkGlassVariant.splash => isDark
          ? AppColors.gradientSplash
          : const [
              Color(0xFFE8EFFF),
              Color(0xFFF5F8FF),
              Color(0xFFFFFFFF),
              Color(0xFFE0EAFF),
            ],
      DarkGlassVariant.standard => isDark
          ? const [
              Color(0xFF070B14),
              Color(0xFF0A1628),
              Color(0xFF0F172A),
            ]
          : const [
              Color(0xFFE8EFFF),
              Color(0xFFF0F4FF),
              Color(0xFFFFFFFF),
            ],
      DarkGlassVariant.subtle => isDark
          ? const [
              AppColors.background,
              Color(0xFF0A1628),
              AppColors.background,
            ]
          : const [
              Color(0xFFF0F4FF),
              Color(0xFFE8EFFF),
              Color(0xFFF0F4FF),
            ],
    };

    Widget content;
    if (_controller != null) {
      content = AnimatedBuilder(
        animation: _controller!,
        builder: (context, _) => _buildLayers(gradient, _controller!.value * 2 * math.pi),
      );
    } else {
      content = _buildLayers(gradient, 0);
    }

    return RepaintBoundary(child: content);
  }

  Widget _buildLayers(List<Color> gradient, double t) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final orbAlpha = isDark ? 1.0 : 0.55;

    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: gradient,
          stops: widget.variant == DarkGlassVariant.splash
              ? const [0.0, 0.45, 0.75, 1.0]
              : const [0.0, 0.5, 1.0],
        ),
      ),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          _softOrb(
            size: 280,
            top: -90 + (widget.animated ? 12 * math.sin(t) : 0),
            left: -70,
            inner: AppColors.primary.withValues(alpha: 0.22 * orbAlpha),
            outer: AppColors.primary.withValues(alpha: 0),
          ),
          _softOrb(
            size: 220,
            top: 120 + (widget.animated ? 10 * math.cos(t * 1.1) : 0),
            right: -50,
            inner: AppColors.primaryLight.withValues(alpha: 0.18 * orbAlpha),
            outer: AppColors.primaryLight.withValues(alpha: 0),
          ),
          _softOrb(
            size: 180,
            bottom: 60,
            left: 30,
            inner: AppColors.accent.withValues(alpha: 0.12 * orbAlpha),
            outer: AppColors.accent.withValues(alpha: 0),
          ),
        ],
      ),
    );
  }

  Widget _softOrb({
    required double size,
    double? top,
    double? left,
    double? right,
    double? bottom,
    required Color inner,
    required Color outer,
  }) {
    return Positioned(
      top: top,
      left: left,
      right: right,
      bottom: bottom,
      child: IgnorePointer(
        child: Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: RadialGradient(
              colors: [inner, outer],
              stops: const [0.0, 1.0],
            ),
          ),
        ),
      ),
    );
  }
}
