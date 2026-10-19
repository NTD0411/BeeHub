import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../theme/theme_mode_notifier.dart';
import '../theme/uni_move_colors.dart';

class ThemeToggleTile extends ConsumerWidget {
  const ThemeToggleTile({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = ShadTheme.of(context);
    final c = UniMoveColors.of(context);
    final mode = ref.watch(themeModeProvider);
    final isDark = mode == ThemeMode.dark;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: c.border),
      ),
      child: Row(
        children: [
          Icon(
            isDark ? Icons.dark_mode_rounded : Icons.light_mode_rounded,
            color: theme.colorScheme.primary,
            size: 22,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Giao diện',
                  style: theme.textTheme.p.copyWith(fontWeight: FontWeight.w700),
                ),
                Text(
                  isDark ? 'ShadCN tối (mặc định)' : 'Chế độ sáng',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.small.copyWith(
                    color: theme.colorScheme.mutedForeground,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          ShadSwitch(
            value: isDark,
            onChanged: (_) => ref.read(themeModeProvider.notifier).toggle(),
          ),
        ],
      ),
    );
  }
}
