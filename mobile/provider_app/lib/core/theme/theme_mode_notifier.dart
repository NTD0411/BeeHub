import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/theme_preferences.dart';

final themeModeProvider = StateNotifierProvider<ThemeModeNotifier, ThemeMode>(
  (ref) => ThemeModeNotifier(),
);

class ThemeModeNotifier extends StateNotifier<ThemeMode> {
  ThemeModeNotifier() : super(ThemeMode.dark) {
    _restore();
  }

  bool get isDark => state == ThemeMode.dark;

  Future<void> _restore() async {
    final dark = await loadPreferDark();
    state = preferDarkToThemeMode(dark);
  }

  Future<void> setDark(bool value) async {
    await savePreferDark(value);
    state = value ? ThemeMode.dark : ThemeMode.light;
  }

  Future<void> toggle() => setDark(!isDark);
}
