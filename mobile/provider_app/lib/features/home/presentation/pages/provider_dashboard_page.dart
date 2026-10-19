import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/shad_screen_scope.dart';
import '../../../auth/data/auth_repository.dart';
import '../../../documents/presentation/providers/documents_providers.dart';
import '../../../notifications/presentation/providers/notifications_providers.dart';
import '../../../orders/domain/provider_order.dart';
import '../../../orders/presentation/providers/orders_providers.dart';
import '../../../orders/presentation/widgets/provider_order_list_card.dart';
import '../../../orders/presentation/widgets/provider_order_status_tiles.dart';

class ProviderDashboardPage extends ConsumerStatefulWidget {
  const ProviderDashboardPage({super.key});

  @override
  ConsumerState<ProviderDashboardPage> createState() => _ProviderDashboardPageState();
}

class _ProviderDashboardPageState extends ConsumerState<ProviderDashboardPage> {
  bool _online = true;
  Timer? _ordersPoll;

  @override
  void initState() {
    super.initState();
    _ordersPoll = Timer.periodic(const Duration(seconds: 12), (_) {
      if (!mounted) return;
      ref.invalidate(providerOrdersListProvider);
      ref.invalidate(providerUnreadNotificationsProvider);
    });
  }

  @override
  void dispose() {
    _ordersPoll?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final profileAsync = ref.watch(providerProfileProvider);
    final ordersAsync = ref.watch(providerOrdersListProvider);
    final verification = ref.watch(providerVerificationProvider).asData?.value;
    final canGoOnline = verification?.canGoOnline ?? false;
    final unreadNotifications = ref.watch(providerUnreadNotificationsProvider).asData?.value ?? 0;
    final c = UniMoveColors.of(context);

    return ShadScreenScope(
      builder: (_, theme) {
        return SafeArea(
          child: profileAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('Lỗi: $e', textAlign: TextAlign.center, style: TextStyle(color: c.onSurface)),
                    const SizedBox(height: 16),
                    ShadButton(
                      onPressed: () {
                        ref.invalidate(providerProfileProvider);
                        ref.invalidate(providerOrdersListProvider);
                      },
                      child: const Text('Thử lại'),
                    ),
                    const SizedBox(height: 8),
                    ShadButton.outline(
                      onPressed: () => context.go('/login'),
                      child: const Text('Đăng nhập lại'),
                    ),
                  ],
                ),
              ),
            ),
            data: (profile) {
              final myId = profile?.id;
              final orders = ordersAsync.asData?.value ?? const <ProviderOrder>[];
              final completed = orders.where((o) => o.isCompleted).toList();
              final active = orders.where((o) => o.isActive).toList();
              final readyToStart = orders.where((o) => o.isReadyToAccept(myId)).toList();
              final awaitingDeposit = orders.where((o) => o.isAwaitingDeposit(myId)).toList();
              final openQuotes = orders.where((o) => o.isOpenQuoteRequest).toList();
              final earnings = completed.fold<int>(0, (s, o) => s + o.netEarnings);

              return RefreshIndicator(
                onRefresh: () async {
                  ref.invalidate(providerProfileProvider);
                  ref.invalidate(providerOrdersListProvider);
                },
                child: ListView(
                  physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                  children: [
                    _header(
                      theme,
                      c,
                      profile?.fullName ?? 'Đối tác',
                      profile?.businessName,
                      unreadNotifications,
                    ),
                    if (!canGoOnline) ...[
                      const SizedBox(height: 12),
                      _kycBanner(theme, c, verification?.kycStatus.label ?? 'Chưa xác thực'),
                    ],
                    const SizedBox(height: 16),
                    _onlineCard(theme, c, canGoOnline: canGoOnline),
                    const SizedBox(height: 16),
                    _earningsHero(theme, c, earnings, completed.length),
                    const SizedBox(height: 12),
                    _quickStatsRow(theme, c, completed.length, profile?.rating ?? 0),
                    const SizedBox(height: 20),
                    _ordersHub(
                      theme,
                      c,
                      myId: myId,
                      ready: readyToStart.length,
                      quotes: openQuotes.length,
                      awaiting: awaitingDeposit.length,
                      active: active.length,
                      onOpenTab: (filter) {
                        ref.read(providerOrdersFilterProvider.notifier).state = filter;
                        ref.read(providerShellTabIndexProvider.notifier).state = 1;
                      },
                    ),
                    if (active.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      _sectionTitle(theme, c, 'Đang chạy', trailing: '${active.length} đơn'),
                      const SizedBox(height: 10),
                      ProviderOrderListCard(
                        order: active.first,
                        myId: myId,
                        filter: OrderInboxFilter.active,
                        onTap: () => context.push('/orders/${active.first.id}'),
                        onPrimaryAction: () => context.push('/orders/${active.first.id}/tracking'),
                        primaryActionLabel: 'Theo dõi GPS',
                      ),
                    ] else if (readyToStart.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      _sectionTitle(theme, c, 'Cần nhận ngay', trailing: '${readyToStart.length} đơn'),
                      const SizedBox(height: 10),
                      ProviderOrderListCard(
                        order: readyToStart.first,
                        myId: myId,
                        filter: OrderInboxFilter.ready,
                        onTap: () => context.push('/orders/${readyToStart.first.id}'),
                        onPrimaryAction: () => context.push('/orders/${readyToStart.first.id}'),
                        primaryActionLabel: 'Nhận đơn ngay',
                      ),
                    ],
                  ],
                ),
              );
            },
          ),
        );
      },
    );
  }

  // ---------- Header ----------
  Widget _header(
    ShadThemeData theme,
    UniMoveColors c,
    String name,
    String? business,
    int unreadNotifications,
  ) {
    final initial = name.isNotEmpty ? name[0].toUpperCase() : 'P';
    return Row(
      children: [
        Container(
          width: 46,
          height: 46,
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: [c.primary, c.primaryLight]),
            borderRadius: BorderRadius.circular(14),
          ),
          alignment: Alignment.center,
          child: Text(initial, style: theme.textTheme.h4.copyWith(color: Colors.white, fontWeight: FontWeight.w800)),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Xin chào,', style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted)),
              Text(
                name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: theme.textTheme.large.copyWith(fontWeight: FontWeight.w800, color: c.onSurface),
              ),
            ],
          ),
        ),
        _notificationButton(c, unreadNotifications),
      ],
    );
  }

  Widget _notificationButton(UniMoveColors c, int unread) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        _iconButton(c, LucideIcons.bell, () => context.push('/notifications')),
        if (unread > 0)
          Positioned(
            right: 2,
            top: 2,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
              constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
              decoration: BoxDecoration(
                color: AppColors.error,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: c.surface, width: 1.5),
              ),
              alignment: Alignment.center,
              child: Text(
                unread > 9 ? '9+' : '$unread',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _iconButton(UniMoveColors c, IconData icon, VoidCallback onTap) {
    return Material(
      color: c.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: c.border),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Icon(icon, color: c.onSurface, size: 20),
        ),
      ),
    );
  }

  Widget _kycBanner(ShadThemeData theme, UniMoveColors c, String statusLabel) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => context.push('/documents'),
        borderRadius: BorderRadius.circular(16),
        child: GlassCard(
          padding: const EdgeInsets.all(14),
          radius: 16,
          child: Row(
            children: [
              Icon(LucideIcons.shieldAlert, color: Colors.orange.shade700, size: 22),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Hoàn tất xác thực giấy tờ',
                      style: theme.textTheme.p.copyWith(fontWeight: FontWeight.w800, color: c.onSurface),
                    ),
                    Text(
                      '$statusLabel · Nhấn để nộp hồ sơ',
                      style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted),
                    ),
                  ],
                ),
              ),
              Icon(LucideIcons.chevronRight, color: c.onSurfaceMuted, size: 18),
            ],
          ),
        ),
      ),
    );
  }

  // ---------- Online toggle ----------
  Widget _onlineCard(ShadThemeData theme, UniMoveColors c, {required bool canGoOnline}) {
    final effectiveOnline = canGoOnline && _online;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: effectiveOnline ? c.success.withValues(alpha: 0.3) : c.border),
      ),
      child: Row(
        children: [
          Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(
              color: effectiveOnline ? c.success : c.onSurfaceMuted,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  effectiveOnline ? 'Đang nhận đơn' : 'Đang nghỉ',
                  style: theme.textTheme.p.copyWith(fontWeight: FontWeight.w700, color: c.onSurface),
                ),
                Text(
                  canGoOnline
                      ? (effectiveOnline ? 'Khách có thể thấy và đặt bạn' : 'Bạn sẽ không nhận đơn mới')
                      : 'Cần xác thực giấy tờ trước khi nhận đơn',
                  style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted),
                ),
              ],
            ),
          ),
          Switch.adaptive(
            value: effectiveOnline,
            activeThumbColor: c.primary,
            onChanged: canGoOnline
                ? (v) {
                    setState(() => _online = v);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(v ? 'Đã bật nhận đơn' : 'Đã tạm nghỉ')),
                    );
                  }
                : (_) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Hoàn tất xác thực giấy tờ để bật nhận đơn')),
                    );
                    context.push('/documents');
                  },
          ),
        ],
      ),
    );
  }

  // ---------- Earnings hero ----------
  Widget _earningsHero(ShadThemeData theme, UniMoveColors c, int earnings, int trips) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => context.push('/earnings/history'),
        borderRadius: BorderRadius.circular(22),
        child: Ink(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [c.primary, c.primaryLight],
            ),
            borderRadius: BorderRadius.circular(22),
            boxShadow: [
              BoxShadow(color: c.primary.withValues(alpha: 0.35), blurRadius: 24, offset: const Offset(0, 10)),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(LucideIcons.wallet, color: Colors.white70, size: 18),
                    const SizedBox(width: 8),
                    Text(
                      'TỔNG THU NHẬP',
                      style: theme.textTheme.small.copyWith(
                        color: Colors.white70,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.18),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'Xem tất cả',
                            style: theme.textTheme.small.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                              fontSize: 11,
                            ),
                          ),
                          const SizedBox(width: 2),
                          const Icon(Icons.chevron_right, color: Colors.white, size: 18),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  _money(earnings),
                  style: theme.textTheme.h1.copyWith(color: Colors.white, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 4),
                Text(
                  'Từ $trips chuyến hoàn thành · chạm để xem lịch sử',
                  style: theme.textTheme.small.copyWith(color: Colors.white70),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _quickStatsRow(ShadThemeData theme, UniMoveColors c, int trips, double rating) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: c.border),
      ),
      child: Row(
        children: [
          Expanded(
            child: _inlineStat(theme, c, LucideIcons.circleCheck, '$trips', 'Chuyến xong', c.success),
          ),
          Container(width: 1, height: 36, color: c.border),
          Expanded(
            child: _inlineStat(theme, c, LucideIcons.star, '$rating', 'Đánh giá', c.primary),
          ),
        ],
      ),
    );
  }

  Widget _inlineStat(ShadThemeData theme, UniMoveColors c, IconData icon, String value, String label, Color tint) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: tint.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, size: 16, color: tint),
        ),
        const SizedBox(width: 10),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(value, style: theme.textTheme.p.copyWith(fontWeight: FontWeight.w800, color: c.onSurface)),
            Text(label, style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted, fontSize: 11)),
          ],
        ),
      ],
    );
  }

  Widget _sectionTitle(ShadThemeData theme, UniMoveColors c, String text, {String? trailing}) {
    return Row(
      children: [
        Expanded(
          child: Text(text, style: theme.textTheme.large.copyWith(fontWeight: FontWeight.w800, color: c.onSurface)),
        ),
        if (trailing != null)
          Text(trailing, style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted, fontWeight: FontWeight.w600)),
      ],
    );
  }

  Widget _ordersHub(
    ShadThemeData theme,
    UniMoveColors c, {
    required String? myId,
    required int ready,
    required int quotes,
    required int awaiting,
    required int active,
    required void Function(OrderInboxFilter filter) onOpenTab,
  }) {
    final total = ready + quotes + awaiting + active;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Đơn hàng',
                    style: theme.textTheme.large.copyWith(fontWeight: FontWeight.w800, color: c.onSurface),
                  ),
                  if (total > 0)
                    Text(
                      '$total đơn cần xử lý',
                      style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted),
                    ),
                ],
              ),
            ),
            TextButton.icon(
              onPressed: () => onOpenTab(OrderInboxFilter.defaultFor(
                ref.read(providerOrdersListProvider).asData?.value ?? [],
                myId,
              )),
              icon: Icon(LucideIcons.arrowRight, size: 16, color: c.primaryLight),
              label: Text(
                'Xem tất cả',
                style: theme.textTheme.small.copyWith(color: c.primaryLight, fontWeight: FontWeight.w700),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        ProviderOrderStatusTiles(
          ready: ready,
          quotes: quotes,
          awaiting: awaiting,
          active: active,
          onTap: onOpenTab,
        ),
      ],
    );
  }

  static String _money(int amount) {
    if (amount <= 0) return '0đ';
    final s = amount.toString();
    final buf = StringBuffer();
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buf.write('.');
      buf.write(s[i]);
    }
    buf.write('đ');
    return buf.toString();
  }
}
