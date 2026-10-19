import 'package:flutter/material.dart';

/// UniMove dark theme — aligned with product UI mockups.
abstract final class AppColors {
  static const primary = Color(0xFF3B82F6);
  static const primaryDark = Color(0xFF1D4ED8);
  static const primaryLight = Color(0xFF38BDF8);
  static const accent = Color(0xFFFBBF24);
  static const accentOrange = Color(0xFFF59E0B);

  static const background = Color(0xFF070B14);
  static const surface = Color(0xFF111827);
  static const surfaceElevated = Color(0xFF1A2332);
  static const surfaceCard = Color(0xFF1E293B);
  static const surfaceMuted = Color(0xFF0F172A);

  static const onBackground = Color(0xFFF8FAFC);
  static const onSurface = Color(0xFFF1F5F9);
  static const onSurfaceVariant = Color(0xFF94A3B8);
  static const onSurfaceMuted = Color(0xFF64748B);

  static const onPrimary = Color(0xFFFFFFFF);
  static const primaryContainer = Color(0xFF2563EB);
  static const secondary = Color(0xFF0058BE);
  static const secondaryContainer = Color(0xFF2170E4);
  static const tertiary = Color(0xFF22C55E);
  static const tertiaryContainer = Color(0xFF14532D);

  static const outline = Color(0xFF475569);
  static const outlineVariant = Color(0xFF334155);
  static const border = Color(0xFF2D3A4F);

  static const success = Color(0xFF22C55E);
  static const error = Color(0xFFEF4444);

  static const surfaceContainerHigh = surfaceCard;
  static const surfaceContainerLowest = surfaceElevated;
  static const onSecondaryContainer = onPrimary;

  static const gradientPrimary = [
    Color(0xFF1D4ED8),
    Color(0xFF3B82F6),
    Color(0xFF38BDF8),
  ];

  static const gradientSplash = [
    Color(0xFF0A1628),
    Color(0xFF0F2847),
    Color(0xFF1E3A8A),
    Color(0xFF2563EB),
  ];

  // Aliases for home screen widgets
  static const surfaceContainerLow = surfaceMuted;
  static const onPrimaryContainer = Color(0xFFDCE7FF);
}
