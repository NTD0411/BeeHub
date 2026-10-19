import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import 'app_colors.dart';

/// ShadCN theme UniMove — dark glass (mặc định toàn app).
abstract final class UniMoveShadTheme {
  /// Card kính mờ trên nền tối.
  static const glassCard = Color(0xB3111827);
  static const glassCardElevated = Color(0xCC1A2332);
  static const glassBorder = Color(0x33FFFFFF);
  static const glassBorderStrong = Color(0x55FFFFFF);

  static final dark = ShadThemeData(
    brightness: Brightness.dark,
    radius: const BorderRadius.all(Radius.circular(14)),
    colorScheme: const ShadBlueColorScheme.dark(
      background: AppColors.background,
      foreground: AppColors.onSurface,
      card: glassCard,
      cardForeground: AppColors.onSurface,
      popover: AppColors.surfaceElevated,
      popoverForeground: AppColors.onSurface,
      primary: AppColors.primary,
      primaryForeground: AppColors.onPrimary,
      secondary: AppColors.surfaceCard,
      secondaryForeground: AppColors.onSurface,
      muted: AppColors.surfaceMuted,
      mutedForeground: AppColors.onSurfaceVariant,
      accent: Color(0xFF1E3A5F),
      accentForeground: AppColors.primaryLight,
      destructive: AppColors.error,
      destructiveForeground: AppColors.onPrimary,
      border: AppColors.border,
      input: AppColors.surfaceCard,
      ring: AppColors.primary,
      selection: Color(0xFF355172),
    ),
    textTheme: ShadTextTheme(
      googleFontBuilder: GoogleFonts.plusJakartaSans,
    ),
    cardTheme: const ShadCardTheme(
      radius: BorderRadius.all(Radius.circular(24)),
      padding: EdgeInsets.all(24),
      shadows: [
        BoxShadow(
          color: Color(0x40000000),
          blurRadius: 32,
          offset: Offset(0, 12),
        ),
        BoxShadow(
          color: Color(0x263B82F6),
          blurRadius: 24,
          offset: Offset(0, 4),
        ),
      ],
    ),
    primaryButtonTheme: ShadButtonTheme(
      decoration: ShadDecoration(
        border: ShadBorder.all(radius: const BorderRadius.all(Radius.circular(14))),
      ),
    ),
    inputTheme: const ShadInputTheme(
      padding: EdgeInsets.symmetric(horizontal: 14, vertical: 14),
    ),
  );

  static final light = ShadThemeData(
    brightness: Brightness.light,
    radius: const BorderRadius.all(Radius.circular(14)),
    colorScheme: const ShadBlueColorScheme.light(
      background: Color(0xFFF0F4FF),
      foreground: Color(0xFF141B2B),
      card: Color(0xEBFFFFFF),
      cardForeground: Color(0xFF141B2B),
      popover: Color(0xFFFFFFFF),
      popoverForeground: Color(0xFF141B2B),
      primary: Color(0xFF004AC6),
      primaryForeground: Color(0xFFFFFFFF),
      secondary: Color(0xFFE8EFFF),
      secondaryForeground: Color(0xFF141B2B),
      muted: Color(0xFFE1E8FD),
      mutedForeground: Color(0xFF64748B),
      accent: Color(0xFFE8EFFF),
      accentForeground: Color(0xFF004AC6),
      destructive: Color(0xFFEF4444),
      destructiveForeground: Color(0xFFFFFFFF),
      border: Color(0xFFE2E8F0),
      input: Color(0xFFE8ECF8),
      ring: Color(0xFF004AC6),
      selection: Color(0xFFB4D0FF),
    ),
    textTheme: ShadTextTheme(
      googleFontBuilder: GoogleFonts.plusJakartaSans,
    ),
    cardTheme: const ShadCardTheme(
      radius: BorderRadius.all(Radius.circular(24)),
      padding: EdgeInsets.all(24),
    ),
    primaryButtonTheme: ShadButtonTheme(
      decoration: ShadDecoration(
        border: ShadBorder.all(radius: const BorderRadius.all(Radius.circular(14))),
      ),
    ),
    inputTheme: const ShadInputTheme(
      padding: EdgeInsets.symmetric(horizontal: 14, vertical: 14),
    ),
  );

  static ShadThemeData forThemeMode(ThemeMode mode) =>
      mode == ThemeMode.dark ? dark : light;

  /// Alias — mặc định dark.
  static ShadThemeData get theme => dark;
}
