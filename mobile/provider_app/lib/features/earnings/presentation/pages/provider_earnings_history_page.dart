import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/shad_screen_scope.dart';
import '../../../orders/domain/provider_order.dart';
import '../../../orders/presentation/providers/orders_providers.dart';

class ProviderEarningsHistoryPage extends ConsumerStatefulWidget {
  const ProviderEarningsHistoryPage({super.key});

  @override
  ConsumerState<ProviderEarningsHistoryPage> createState() => _ProviderEarningsHistoryPageState();
}

class _ProviderEarningsHistoryPageState extends ConsumerState<ProviderEarningsHistoryPage> {
  TripHistoryFilter _filter = TripHistoryFilter.all;

  @override
  Widget build(BuildContext context) {
    final ordersAsync = ref.watch(providerOrdersListProvider);
    final c = UniMoveColors.of(context);

    return ShadScreenScope(
      builder: (_, theme) {
        return Scaffold(
          backgroundColor: c.background,
          body: ordersAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(child: Text('Lỗi: $e', style: TextStyle(color: c.onSurface))),
            data: (orders) {
              final history = orders.where((o) => o.matchesTripHistoryFilter(_filter)).toList()
                ..sort((a, b) => (b.createdAt ?? DateTime(0)).compareTo(a.createdAt ?? DateTime(0)));

              final completed = orders.where((o) => o.isCompleted).toList();
              final gross = completed.fold<int>(0, (s, o) => s + o.netEarnings);
              final cancelledCount = orders.where((o) => o.isCancelled).length;
              final activeCount = orders.where((o) => o.isActive).length;

              return RefreshIndicator(
                onRefresh: () async => ref.invalidate(providerOrdersListProvider),
                color: c.primary,
                child: CustomScrollView(
                  physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                  slivers: [
                    SliverAppBar(
                      pinned: true,
                      expandedHeight: 200,
                      backgroundColor: c.primary,
                      foregroundColor: Colors.white,
                      iconTheme: const IconThemeData(color: Colors.white),
                      flexibleSpace: FlexibleSpaceBar(
                        background: Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [c.primary, c.primaryLight],
                            ),
                          ),
                          padding: const EdgeInsets.fromLTRB(20, 56, 20, 16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              Text(
                                'Lịch sử chuyến',
                                style: theme.textTheme.small.copyWith(
                                  color: Colors.white70,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                ProviderOrder.formatMoney(gross),
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 32,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: -0.5,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Thực nhận từ ${completed.length} chuyến hoàn thành',
                                style: theme.textTheme.small.copyWith(color: Colors.white70),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                        child: Row(
                          children: [
                            Expanded(
                              child: _summaryChip(
                                c,
                                LucideIcons.circleCheck,
                                '${completed.length}',
                                'Hoàn thành',
                                c.success,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: _summaryChip(
                                c,
                                LucideIcons.truck,
                                '$activeCount',
                                'Đang làm',
                                c.primary,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: _summaryChip(
                                c,
                                LucideIcons.circleX,
                                '$cancelledCount',
                                'Huỷ',
                                c.onSurfaceMuted,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    SliverToBoxAdapter(
                      child: SizedBox(
                        height: 44,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: TripHistoryFilter.values.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 8),
                          itemBuilder: (_, i) {
                            final f = TripHistoryFilter.values[i];
                            final selected = f == _filter;
                            final count = orders.where((o) => o.matchesTripHistoryFilter(f)).length;
                            return GestureDetector(
                              onTap: () => setState(() => _filter = f),
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
                                      f.label,
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
                                        color: selected
                                            ? Colors.white.withValues(alpha: 0.22)
                                            : c.chipBg,
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: Text(
                                        '$count',
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
                      ),
                    ),
                    if (history.isEmpty)
                      SliverFillRemaining(
                        hasScrollBody: false,
                        child: Center(
                          child: Padding(
                            padding: const EdgeInsets.all(32),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(LucideIcons.inbox, size: 48, color: c.onSurfaceMuted),
                                const SizedBox(height: 12),
                                Text(
                                  'Không có chuyến trong mục này',
                                  style: TextStyle(fontWeight: FontWeight.w600, color: c.onSurface),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'Thử đổi bộ lọc hoặc nhận thêm đơn mới.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(fontSize: 13, color: c.onSurfaceMuted),
                                ),
                              ],
                            ),
                          ),
                        ),
                      )
                    else
                      SliverPadding(
                        padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
                        sliver: SliverList(
                          delegate: SliverChildBuilderDelegate(
                            (context, index) {
                              final o = history[index];
                              return _tripTile(context, theme, c, o, index);
                            },
                            childCount: history.length,
                          ),
                        ),
                      ),
                  ],
                ),
              );
            },
          ),
        );
      },
    );
  }

  Widget _summaryChip(UniMoveColors c, IconData icon, String value, String label, Color tint) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: c.border),
      ),
      child: Column(
        children: [
          Icon(icon, size: 18, color: tint),
          const SizedBox(height: 6),
          Text(value, style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: c.onSurface)),
          Text(label, style: TextStyle(fontSize: 10, color: c.onSurfaceMuted, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _tripTile(
    BuildContext context,
    ShadThemeData theme,
    UniMoveColors c,
    ProviderOrder o,
    int index,
  ) {
    final customer = o.pickupPoint.contactName.isNotEmpty
        ? o.pickupPoint.contactName
        : 'Khách hàng';
    final (Color tint, IconData icon) = switch (true) {
      _ when o.isCompleted => (c.success, LucideIcons.circleCheck),
      _ when o.isCancelled => (c.onSurfaceMuted, LucideIcons.circleX),
      _ when o.isActive => (c.primary, LucideIcons.truck),
      _ => (c.primaryLight, LucideIcons.package),
    };

    final amountText = o.isCompleted
        ? '+ ${ProviderOrder.formatMoney(o.netEarnings)}'
        : o.isCancelled
            ? 'Không thu'
            : 'Dự kiến ${ProviderOrder.formatMoney(o.netEarnings)}';

    final amountColor = o.isCompleted
        ? c.success
        : o.isCancelled
            ? c.onSurfaceMuted
            : c.primary;

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(18),
          onTap: () => context.push('/orders/${o.id}'),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: c.surface,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: c.border),
              boxShadow: [
                BoxShadow(
                  color: c.navBarShadow.withValues(alpha: 0.06),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: tint.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, color: tint, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              '#${o.orderNumber ?? o.id.substring(0, 8)}',
                              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: c.onSurface),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: tint.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              o.statusLabel,
                              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: tint),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        customer,
                        style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted, fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 8),
                      _miniRoute(c, o.pickupAddress, isPickup: true),
                      const SizedBox(height: 4),
                      _miniRoute(c, o.deliveryAddress, isPickup: false),
                      const SizedBox(height: 8),
                      Text(
                        [
                          if (o.createdAt != null) ProviderOrder.formatDateTime(o.createdAt),
                          if (o.distanceKm != null) '${o.distanceKm!.toStringAsFixed(1)} km',
                        ].join(' · '),
                        style: TextStyle(fontSize: 11, color: c.onSurfaceMuted),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      amountText,
                      style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: amountColor),
                    ),
                    if (o.isCompleted) ...[
                      const SizedBox(height: 2),
                      Text(
                        ProviderOrder.formatMoney(o.totalPrice),
                        style: TextStyle(
                          fontSize: 10,
                          color: c.onSurfaceMuted,
                          decoration: TextDecoration.lineThrough,
                        ),
                      ),
                    ],
                    const SizedBox(height: 8),
                    Icon(Icons.chevron_right, size: 20, color: c.onSurfaceMuted),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _miniRoute(UniMoveColors c, String address, {required bool isPickup}) {
    return Row(
      children: [
        Icon(
          isPickup ? Icons.trip_origin : Icons.location_on,
          size: 12,
          color: isPickup ? c.primary : c.success,
        ),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            address,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(fontSize: 12, color: c.onSurface, height: 1.2),
          ),
        ),
      ],
    );
  }
}
