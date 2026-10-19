import 'package:flutter/material.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/theme/uni_move_colors.dart';
import '../../domain/provider_order.dart';
import 'provider_order_filter_bar.dart';

/// Ô thống kê trạng thái đơn trên Trang chủ — cuộn ngang, một dòng.
class ProviderOrderStatusTiles extends StatelessWidget {
  const ProviderOrderStatusTiles({
    super.key,
    required this.ready,
    required this.quotes,
    required this.awaiting,
    required this.active,
    required this.onTap,
  });

  final int ready;
  final int quotes;
  final int awaiting;
  final int active;
  final void Function(OrderInboxFilter filter) onTap;

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);
    final items = [
      _TileData(OrderInboxFilter.ready, ready, LucideIcons.badgeCheck),
      _TileData(OrderInboxFilter.quoteNew, quotes, LucideIcons.filePen),
      _TileData(OrderInboxFilter.awaitingDeposit, awaiting, LucideIcons.clock),
      _TileData(OrderInboxFilter.active, active, LucideIcons.truck),
    ];

    return SizedBox(
      height: 88,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: EdgeInsets.zero,
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (_, i) {
          final item = items[i];
          final tint = ProviderOrderFilterBar.colorFor(c, item.filter);
          final hasItems = item.count > 0;

          return Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () => onTap(item.filter),
              borderRadius: BorderRadius.circular(16),
              child: Ink(
                width: 96,
                decoration: BoxDecoration(
                  color: hasItems ? tint.withValues(alpha: 0.1) : c.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: hasItems ? tint.withValues(alpha: 0.25) : c.border,
                  ),
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(item.icon, size: 15, color: hasItems ? tint : c.onSurfaceMuted),
                          const Spacer(),
                          Text(
                            '${item.count}',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w800,
                              color: hasItems ? tint : c.onSurfaceMuted,
                              height: 1,
                            ),
                          ),
                        ],
                      ),
                      const Spacer(),
                      Text(
                        item.filter.label,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: hasItems ? c.onSurface : c.onSurfaceMuted,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _TileData {
  const _TileData(this.filter, this.count, this.icon);
  final OrderInboxFilter filter;
  final int count;
  final IconData icon;
}
