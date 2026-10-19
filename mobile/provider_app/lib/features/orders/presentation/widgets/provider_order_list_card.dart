import 'package:flutter/material.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/theme/uni_move_colors.dart';
import '../../domain/provider_order.dart';
import 'provider_order_filter_bar.dart';

/// Thẻ đơn hàng thống nhất — dùng Trang chủ và màn Đơn hàng.
class ProviderOrderListCard extends StatelessWidget {
  const ProviderOrderListCard({
    super.key,
    required this.order,
    required this.myId,
    required this.filter,
    this.onTap,
    this.onPrimaryAction,
    this.primaryActionLabel,
    this.compact = false,
  });

  final ProviderOrder order;
  final String? myId;
  final OrderInboxFilter? filter;
  final VoidCallback? onTap;
  final VoidCallback? onPrimaryAction;
  final String? primaryActionLabel;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);
    final theme = ShadTheme.of(context);
    final statusColor = filter != null
        ? ProviderOrderFilterBar.colorFor(c, filter!)
        : _statusColor(c, order, myId);

    final customer = order.pickupPoint.contactName.isNotEmpty
        ? order.pickupPoint.contactName
        : 'Khách hàng';

    final priceLabel = order.isOpenQuoteRequest
        ? 'Báo giá'
        : ProviderOrder.formatMoney(order.totalPrice);

    final showAccept = filter == OrderInboxFilter.ready || order.isReadyToAccept(myId);
    final showTrack = filter == OrderInboxFilter.active || order.isActive;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          decoration: BoxDecoration(
            color: c.surface,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: c.border),
            boxShadow: [
              BoxShadow(
                color: c.navBarShadow,
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(18),
            child: IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(width: 4, color: statusColor),
                  Expanded(
                    child: Padding(
                      padding: EdgeInsets.all(compact ? 14 : 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              _StatusPill(
                                label: order.statusLabelFor(myId),
                                color: statusColor,
                              ),
                              const Spacer(),
                              Text(
                                priceLabel,
                                style: theme.textTheme.p.copyWith(
                                  fontWeight: FontWeight.w800,
                                  color: order.isOpenQuoteRequest ? c.onSurfaceMuted : c.primary,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Text(
                            customer,
                            style: theme.textTheme.p.copyWith(
                              fontWeight: FontWeight.w700,
                              color: c.onSurface,
                            ),
                          ),
                          const SizedBox(height: 10),
                          _RouteTimeline(
                            pickup: order.pickupAddress,
                            delivery: order.deliveryAddress,
                            muted: c.onSurfaceMuted,
                            accent: statusColor,
                          ),
                          if (order.scheduledPickupTime != null && !compact) ...[
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                Icon(LucideIcons.calendar, size: 14, color: c.onSurfaceMuted),
                                const SizedBox(width: 6),
                                Text(
                                  ProviderOrder.formatDateTime(order.scheduledPickupTime),
                                  style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted),
                                ),
                              ],
                            ),
                          ],
                          if (showAccept && onPrimaryAction != null) ...[
                            const SizedBox(height: 14),
                            SizedBox(
                              width: double.infinity,
                              child: FilledButton(
                                onPressed: onPrimaryAction,
                                style: FilledButton.styleFrom(
                                  backgroundColor: c.success,
                                  foregroundColor: Colors.white,
                                  elevation: 0,
                                  padding: const EdgeInsets.symmetric(vertical: 12),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                                child: Text(
                                  primaryActionLabel ?? 'Nhận đơn ngay',
                                  style: const TextStyle(fontWeight: FontWeight.w800),
                                ),
                              ),
                            ),
                          ] else if (showAccept) ...[
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                Icon(LucideIcons.info, size: 14, color: c.success),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: Text(
                                    'Khách đã cọc — nhấn để nhận đơn',
                                    style: theme.textTheme.small.copyWith(
                                      color: c.success,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                          if (showTrack && onPrimaryAction != null) ...[
                            const SizedBox(height: 12),
                            OutlinedButton.icon(
                              onPressed: onPrimaryAction,
                              icon: Icon(LucideIcons.navigation, size: 16, color: c.primary),
                              label: Text(
                                'Theo dõi GPS',
                                style: theme.textTheme.small.copyWith(
                                  fontWeight: FontWeight.w800,
                                  color: c.primary,
                                ),
                              ),
                              style: OutlinedButton.styleFrom(
                                side: BorderSide(color: c.primary.withValues(alpha: 0.4)),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  static Color _statusColor(UniMoveColors c, ProviderOrder o, String? myId) {
    if (o.isReadyToAccept(myId)) return c.success;
    if (o.isOpenQuoteRequest) return c.primaryLight;
    if (o.isAwaitingDeposit(myId)) return const Color(0xFFF59E0B);
    if (o.isActive) return c.primary;
    if (o.isCompleted) return c.accentGreen;
    return c.onSurfaceMuted;
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: color,
        ),
      ),
    );
  }
}

class _RouteTimeline extends StatelessWidget {
  const _RouteTimeline({
    required this.pickup,
    required this.delivery,
    required this.muted,
    required this.accent,
  });

  final String pickup;
  final String delivery;
  final Color muted;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Icon(LucideIcons.circleDot, size: 14, color: accent),
            Container(
              width: 2,
              height: 18,
              margin: const EdgeInsets.symmetric(vertical: 2),
              decoration: BoxDecoration(
                color: muted.withValues(alpha: 0.35),
                borderRadius: BorderRadius.circular(1),
              ),
            ),
            Icon(LucideIcons.mapPin, size: 14, color: muted),
          ],
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                pickup,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(fontSize: 12, color: muted, height: 1.3),
              ),
              const SizedBox(height: 14),
              Text(
                delivery,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(fontSize: 12, color: muted, height: 1.3),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
