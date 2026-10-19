import 'package:flutter/material.dart';
import '../theme/uni_move_colors.dart';

/// Một chip lọc có nhãn + số lượng (dùng chung Đơn hàng / Tin nhắn).
class CategoryFilterOption {
  const CategoryFilterOption({required this.id, required this.label, required this.count});

  final String id;
  final String label;
  final int count;
}

/// Hàng chip cuộn ngang — shadcn / UniMove.
class CategoryFilterBar extends StatelessWidget {
  const CategoryFilterBar({
    super.key,
    required this.options,
    required this.selectedId,
    required this.onSelected,
    this.height = 44,
  });

  final List<CategoryFilterOption> options;
  final String selectedId;
  final ValueChanged<String> onSelected;
  final double height;

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    return SizedBox(
      height: height,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        itemCount: options.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (_, i) {
          final opt = options[i];
          final selected = opt.id == selectedId;
          return GestureDetector(
            onTap: () => onSelected(opt.id),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              curve: Curves.easeOutCubic,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: selected ? c.primary : c.surface,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: selected ? c.primary : c.border),
                boxShadow: selected
                    ? [
                        BoxShadow(
                          color: c.primary.withValues(alpha: 0.25),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ]
                    : null,
              ),
              child: Row(
                children: [
                  Text(
                    opt.label,
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                      color: selected ? Colors.white : c.onSurface,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                    decoration: BoxDecoration(
                      color: selected ? Colors.white.withValues(alpha: 0.22) : c.chipBg,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      '${opt.count}',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: selected ? Colors.white : c.onSurfaceMuted,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
