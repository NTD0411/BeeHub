import 'package:flex_color_scheme/flex_color_scheme.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';
import 'uni_move_colors.dart';

abstract final class FlexUniMoveTheme {
  static ThemeData material({required bool isDark}) {
    final base = isDark
        ? FlexThemeData.dark(
            scheme: FlexScheme.blue,
            primary: AppColors.primary,
            surface: AppColors.background,
            useMaterial3: true,
            fontFamily: GoogleFonts.plusJakartaSans().fontFamily,
          )
        : FlexThemeData.light(
            scheme: FlexScheme.blue,
            primary: const Color(0xFF004AC6),
            surface: const Color(0xFFF9F9FF),
            useMaterial3: true,
            subThemesData: const FlexSubThemesData(
              interactionEffects: true,
              defaultRadius: 14,
            ),
            fontFamily: GoogleFonts.plusJakartaSans().fontFamily,
          );

    return base.copyWith(
      scaffoldBackgroundColor: isDark ? AppColors.background : const Color(0xFFF0F4FF),
      extensions: [isDark ? UniMoveColors.dark : UniMoveColors.light],
    );
  }
}
