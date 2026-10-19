import 'package:flutter/material.dart';

import 'app_colors.dart';
import 'shad_unimove_theme.dart';

/// Màu semantic theo sáng/tối — dùng thay màu dark cố định.
@immutable
class UniMoveColors extends ThemeExtension<UniMoveColors> {
  const UniMoveColors({
    required this.background,
    required this.surface,
    required this.surfaceHigh,
    required this.surfaceTint,
    required this.onSurface,
    required this.onSurfaceMuted,
    required this.primary,
    required this.primaryLight,
    required this.primaryContainer,
    required this.onPrimaryContainer,
    required this.border,
    required this.chipBg,
    required this.glassCard,
    required this.glassCardElevated,
    required this.glassBorder,
    required this.glassBorderStrong,
    required this.accentGreen,
    required this.success,
    required this.iconBgSecondary,
    required this.iconBgTertiary,
    required this.navBarShadow,
  });

  final Color background;
  final Color surface;
  final Color surfaceHigh;
  final Color surfaceTint;
  final Color onSurface;
  final Color onSurfaceMuted;
  final Color primary;
  final Color primaryLight;
  final Color primaryContainer;
  final Color onPrimaryContainer;
  final Color border;
  final Color chipBg;
  final Color glassCard;
  final Color glassCardElevated;
  final Color glassBorder;
  final Color glassBorderStrong;
  final Color accentGreen;
  final Color success;
  final Color iconBgSecondary;
  final Color iconBgTertiary;
  final Color navBarShadow;

  static const dark = UniMoveColors(
    background: AppColors.background,
    surface: AppColors.surfaceCard,
    surfaceHigh: AppColors.surfaceCard,
    surfaceTint: AppColors.surfaceMuted,
    onSurface: AppColors.onSurface,
    onSurfaceMuted: AppColors.onSurfaceVariant,
    primary: AppColors.primary,
    primaryLight: AppColors.primaryLight,
    primaryContainer: AppColors.primaryContainer,
    onPrimaryContainer: AppColors.onPrimaryContainer,
    border: AppColors.border,
    chipBg: Color(0xFF1E3A5F),
    glassCard: UniMoveShadTheme.glassCard,
    glassCardElevated: UniMoveShadTheme.glassCardElevated,
    glassBorder: UniMoveShadTheme.glassBorder,
    glassBorderStrong: UniMoveShadTheme.glassBorderStrong,
    accentGreen: Color(0xFF22C55E),
    success: AppColors.success,
    iconBgSecondary: AppColors.secondaryContainer,
    iconBgTertiary: AppColors.tertiaryContainer,
    navBarShadow: Color(0x40000000),
  );

  static const light = UniMoveColors(
    background: Color(0xFFF0F4FF),
    surface: Color(0xFFFFFFFF),
    surfaceHigh: Color(0xFFF8FAFC),
    surfaceTint: Color(0xFFEEF2FF),
    onSurface: Color(0xFF0F172A),
    onSurfaceMuted: Color(0xFF64748B),
    primary: Color(0xFF004AC6),
    primaryLight: Color(0xFF2563EB),
    primaryContainer: Color(0xFFDBEAFE),
    onPrimaryContainer: Color(0xFF1E40AF),
    border: Color(0xFFE2E8F0),
    chipBg: Color(0xFFEFF6FF),
    glassCard: Color(0xF8FFFFFF),
    glassCardElevated: Color(0xFFFFFFFF),
    glassBorder: Color(0xFFE2E8F0),
    glassBorderStrong: Color(0xFFCBD5E1),
    accentGreen: Color(0xFF10B981),
    success: Color(0xFF16A34A),
    iconBgSecondary: Color(0xFFDBEAFE),
    iconBgTertiary: Color(0xFFD1FAE5),
    navBarShadow: Color(0x14000000),
  );

  static UniMoveColors of(BuildContext context) {
    return Theme.of(context).extension<UniMoveColors>() ?? dark;
  }

  bool isLight(BuildContext context) =>
      Theme.of(context).brightness == Brightness.light;

  @override
  UniMoveColors copyWith({
    Color? background,
    Color? surface,
    Color? surfaceHigh,
    Color? surfaceTint,
    Color? onSurface,
    Color? onSurfaceMuted,
    Color? primary,
    Color? primaryLight,
    Color? primaryContainer,
    Color? onPrimaryContainer,
    Color? border,
    Color? chipBg,
    Color? glassCard,
    Color? glassCardElevated,
    Color? glassBorder,
    Color? glassBorderStrong,
    Color? accentGreen,
    Color? success,
    Color? iconBgSecondary,
    Color? iconBgTertiary,
    Color? navBarShadow,
  }) {
    return UniMoveColors(
      background: background ?? this.background,
      surface: surface ?? this.surface,
      surfaceHigh: surfaceHigh ?? this.surfaceHigh,
      surfaceTint: surfaceTint ?? this.surfaceTint,
      onSurface: onSurface ?? this.onSurface,
      onSurfaceMuted: onSurfaceMuted ?? this.onSurfaceMuted,
      primary: primary ?? this.primary,
      primaryLight: primaryLight ?? this.primaryLight,
      primaryContainer: primaryContainer ?? this.primaryContainer,
      onPrimaryContainer: onPrimaryContainer ?? this.onPrimaryContainer,
      border: border ?? this.border,
      chipBg: chipBg ?? this.chipBg,
      glassCard: glassCard ?? this.glassCard,
      glassCardElevated: glassCardElevated ?? this.glassCardElevated,
      glassBorder: glassBorder ?? this.glassBorder,
      glassBorderStrong: glassBorderStrong ?? this.glassBorderStrong,
      accentGreen: accentGreen ?? this.accentGreen,
      success: success ?? this.success,
      iconBgSecondary: iconBgSecondary ?? this.iconBgSecondary,
      iconBgTertiary: iconBgTertiary ?? this.iconBgTertiary,
      navBarShadow: navBarShadow ?? this.navBarShadow,
    );
  }

  @override
  UniMoveColors lerp(ThemeExtension<UniMoveColors>? other, double t) {
    if (other is! UniMoveColors) return this;
    return t < 0.5 ? this : other;
  }
}
