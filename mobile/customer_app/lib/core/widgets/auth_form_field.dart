import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/home_colors.dart';

class AuthFormField extends StatelessWidget {
  const AuthFormField({
    super.key,
    required this.label,
    required this.controller,
    this.hint,
    this.icon,
    this.keyboardType,
    this.obscureText = false,
    this.suffix,
    this.inputFormatters,
    this.textInputAction,
  });

  final String label;
  final TextEditingController controller;
  final String? hint;
  final IconData? icon;
  final TextInputType? keyboardType;
  final bool obscureText;
  final Widget? suffix;
  final List<TextInputFormatter>? inputFormatters;
  final TextInputAction? textInputAction;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: HomeColors.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          obscureText: obscureText,
          inputFormatters: inputFormatters,
          textInputAction: textInputAction,
          style: const TextStyle(color: HomeColors.onSurface, fontSize: 15),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: HomeColors.outline),
            filled: true,
            fillColor: HomeColors.surfaceContainerLow,
            prefixIcon: icon != null
                ? Icon(icon, color: HomeColors.onSurfaceVariant, size: 22)
                : null,
            suffixIcon: suffix,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: HomeColors.outlineVariant),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: HomeColors.outlineVariant),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: HomeColors.primary, width: 2),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
          ),
        ),
      ],
    );
  }
}
