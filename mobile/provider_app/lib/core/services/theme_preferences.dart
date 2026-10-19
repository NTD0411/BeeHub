import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _key = 'provider_app_theme_dark';

Future<bool> loadPreferDark() async {
  final prefs = await SharedPreferences.getInstance();
  return prefs.getBool(_key) ?? true;
}

Future<void> savePreferDark(bool isDark) async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.setBool(_key, isDark);
}

ThemeMode preferDarkToThemeMode(bool isDark) => isDark ? ThemeMode.dark : ThemeMode.light;
