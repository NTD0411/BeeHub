import 'package:flutter/material.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/theme/uni_move_colors.dart';
import '../../domain/provider_order.dart';

/// Thanh lọc trạng thái đơn — cuộn ngang, dễ đọc trên màn Đơn hàng.
class ProviderOrderFilterBar extends StatelessWidget {
  const ProviderOrderFilterBar({
    super.key,
    required this.selected,
    required this.orders,
    required this.myId,
    required this.onSelected,
  });

  final OrderInboxFilter selected;
  final List<ProviderOrder> orders;
  final String? myId;
  final ValueChanged<OrderInboxFilter> onSelected;

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);
    final filters = OrderInboxFilter.values;

    return SizedBox(
      height: 40,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        itemCount: filters.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (_, i) {
          final f = filters[i];
          final count = orders.where((o) => f.matches(o, myId)).length;
          final isSelected = f == selected;
          final tint = _filterColor(c, f);

          return GestureDetector(
            onTap: () => onSelected(f),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              curve: Curves.easeOutCubic,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: isSelected ? tint : c.surface,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isSelected ? tint : c.border,
                  width: isSelected ? 1.5 : 1,
                ),
                boxShadow: isSelected
                    ? [
                        BoxShadow(
                          color: tint.withValues(alpha: 0.3),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ]
                    : null,
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    _filterIcon(f),
                    size: 14,
                    color: isSelected ? Colors.white : tint,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    f.label,
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                      color: isSelected ? Colors.white : c.onSurface,
                    ),
                  ),
                  if (count > 0) ...[
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? Colors.white.withValues(alpha: 0.22)
                            : tint.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '$count',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: isSelected ? Colors.white : tint,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  static Color _filterColor(UniMoveColors c, OrderInboxFilter f) => switch (f) {
        OrderInboxFilter.ready => c.success,
        OrderInboxFilter.quoteNew => c.primaryLight,
        OrderInboxFilter.awaitingDeposit => const Color(0xFFF59E0B),
        OrderInboxFilter.active => c.primary,
        OrderInboxFilter.completed => c.accentGreen,
        OrderInboxFilter.cancelled => c.onSurfaceMuted,
      };

  static IconData _filterIcon(OrderInboxFilter f) => switch (f) {
        OrderInboxFilter.ready => LucideIcons.badgeCheck,
        OrderInboxFilter.quoteNew => LucideIcons.filePen,
        OrderInboxFilter.awaitingDeposit => LucideIcons.clock,
        OrderInboxFilter.active => LucideIcons.truck,
        OrderInboxFilter.completed => LucideIcons.circleCheck,
        OrderInboxFilter.cancelled => LucideIcons.circleX,
      };

  static Color colorFor(UniMoveColors c, OrderInboxFilter f) => _filterColor(c, f);
}
