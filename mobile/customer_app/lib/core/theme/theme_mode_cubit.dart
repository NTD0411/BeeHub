import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../services/theme_preferences.dart';

class ThemeModeCubit extends Cubit<ThemeMode> {
  ThemeModeCubit() : super(ThemeMode.dark) {
    _restore();
  }

  bool get isDark => state == ThemeMode.dark;

  Future<void> _restore() async {
    final dark = await loadPreferDark();
    emit(preferDarkToThemeMode(dark));
  }

  Future<void> setDark(bool value) async {
    await savePreferDark(value);
    emit(value ? ThemeMode.dark : ThemeMode.light);
  }

  Future<void> toggle() => setDark(!isDark);
}
