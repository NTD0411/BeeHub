import 'package:flutter/material.dart';

import '../theme/home_colors.dart';

class HomePrimaryButton extends StatelessWidget {
  const HomePrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.loading = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null && !loading;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: enabled ? onPressed : null,
        borderRadius: BorderRadius.circular(999),
        child: Ink(
          height: 52,
          decoration: BoxDecoration(
            color: enabled ? HomeColors.primary : HomeColors.outlineVariant,
            borderRadius: BorderRadius.circular(999),
            boxShadow: enabled
                ? [
                    BoxShadow(
                      color: HomeColors.primary.withValues(alpha: 0.25),
                      blurRadius: 14,
                      offset: const Offset(0, 6),
                    ),
                  ]
                : null,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (loading)
                const SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(strokeWidth: 2, color: HomeColors.onPrimary),
                )
              else ...[
                Text(
                  label,
                  style: const TextStyle(
                    color: HomeColors.onPrimary,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (icon != null) ...[
                  const SizedBox(width: 8),
                  Icon(icon, color: HomeColors.onPrimary, size: 20),
                ],
              ],
            ],
          ),
        ),
      ),
    );
  }
}
