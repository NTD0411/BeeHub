import 'package:flutter/material.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/theme/uni_move_colors.dart';

class PlaceholderTabPage extends StatelessWidget {
  const PlaceholderTabPage({
    super.key,
    required this.title,
    required this.icon,
  });

  final String title;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final theme = ShadTheme.of(context);
    final c = UniMoveColors.of(context);

    return Center(
      child: ShadCard(
        backgroundColor: c.glassCardElevated,
        border: ShadBorder.all(color: c.glassBorder),
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 36),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 48, color: theme.colorScheme.primary),
            const SizedBox(height: 12),
            Text(
              title,
              style: theme.textTheme.h4.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Text(
              'Sắp ra mắt',
              style: theme.textTheme.muted,
            ),
          ],
        ),
      ),
    );
  }
}
