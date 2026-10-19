import 'package:flutter/material.dart';

class AppTheme {
  static const _seed = Color(0xFF059669);

  static ThemeData get light => ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: _seed, brightness: Brightness.light),
        inputDecorationTheme: const InputDecorationTheme(border: OutlineInputBorder(), filled: true),
        appBarTheme: const AppBarTheme(centerTitle: true),
      );

  static ThemeData get dark => ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: _seed, brightness: Brightness.dark),
        inputDecorationTheme: const InputDecorationTheme(border: OutlineInputBorder(), filled: true),
        appBarTheme: const AppBarTheme(centerTitle: true),
      );
}
