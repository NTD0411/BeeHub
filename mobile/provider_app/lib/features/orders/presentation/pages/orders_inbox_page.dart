import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/config/dev_config.dart';
import '../../../../core/mock/mock_auth_session.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/shad_screen_scope.dart';
import '../../../auth/data/auth_repository.dart';
import '../../domain/provider_order.dart';
import '../providers/orders_providers.dart';
import '../widgets/provider_order_filter_bar.dart';
import '../widgets/provider_order_list_card.dart';

class OrdersInboxPage extends ConsumerWidget {
  const OrdersInboxPage({super.key, this.embedded = false});

  final bool embedded;

  List<ProviderOrder> _sorted(List<ProviderOrder> orders) {
    final list = List<ProviderOrder>.from(orders);
    list.sort((a, b) => (b.createdAt ?? DateTime(0)).compareTo(a.createdAt ?? DateTime(0)));
    return list;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ordersAsync = ref.watch(providerOrdersListProvider);
    final myId = ref.watch(providerProfileProvider).asData?.value?.id;
    final selectedFilter = ref.watch(providerOrdersFilterProvider);
    final c = UniMoveColors.of(context);

    return ShadScreenScope(
      builder: (_, theme) {
        Widget body = ordersAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => _ErrorState(
            message: _friendlyError(e),
            isAuthError: _isAuthError(e),
            onRetry: () => ref.invalidate(providerOrdersListProvider),
            onSignOut: () async {
              await ref.read(authRepositoryProvider).signOut();
              if (context.mounted) context.go('/login');
            },
            onDemoLogin: DevConfig.useMockAuth
                ? () async {
                    await MockAuthSession.signIn();
                    ref.invalidate(providerOrdersListProvider);
                    ref.invalidate(providerProfileProvider);
                  }
                : null,
          ),
          data: (orders) {
            if (orders.isEmpty) {
              return _emptyAll(theme, c);
            }

            final filtered = _sorted(orders.where((o) => selectedFilter.matches(o, myId)).toList());

            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 8),
                ProviderOrderFilterBar(
                  selected: selectedFilter,
                  orders: orders,
                  myId: myId,
                  onSelected: (f) {
                    ref.read(providerOrdersFilterProvider.notifier).state = f;
                  },
                ),
                const SizedBox(height: 12),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          selectedFilter.hint,
                          style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted),
                        ),
                      ),
                      if (filtered.isNotEmpty)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: c.chipBg,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '${filtered.length} đơn',
                            style: theme.textTheme.small.copyWith(
                              fontWeight: FontWeight.w700,
                              color: c.onSurfaceMuted,
                              fontSize: 11,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                Expanded(
                  child: filtered.isEmpty
                      ? _emptyFilter(theme, c, selectedFilter.label)
                      : RefreshIndicator(
                          onRefresh: () async => ref.invalidate(providerOrdersListProvider),
                          child: ListView.separated(
                            physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                            padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
                            itemCount: filtered.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 12),
                            itemBuilder: (_, i) {
                              final order = filtered[i];
                              return ProviderOrderListCard(
                                order: order,
                                myId: myId,
                                filter: selectedFilter,
                                onTap: () => context.push('/orders/${order.id}'),
                                onPrimaryAction: selectedFilter == OrderInboxFilter.active
                                    ? () => context.push('/orders/${order.id}/tracking')
                                    : null,
                                primaryActionLabel: selectedFilter == OrderInboxFilter.active
                                    ? 'Theo dõi GPS'
                                    : null,
                              );
                            },
                          ),
                        ),
                ),
              ],
            );
          },
        );

        if (embedded) {
          return SafeArea(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 12, 12, 4),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          'Đơn hàng',
                          style: theme.textTheme.h3.copyWith(fontWeight: FontWeight.w800, color: c.onSurface),
                        ),
                      ),
                      IconButton(
                        icon: Icon(LucideIcons.refreshCw, color: c.onSurfaceMuted, size: 20),
                        onPressed: () => ref.invalidate(providerOrdersListProvider),
                      ),
                    ],
                  ),
                ),
                Expanded(child: body),
              ],
            ),
          );
        }

        return Scaffold(
          backgroundColor: c.background,
          appBar: AppBar(
            backgroundColor: c.background,
            surfaceTintColor: Colors.transparent,
            elevation: 0,
            title: Text('Đơn hàng', style: TextStyle(color: c.onSurface, fontWeight: FontWeight.w700)),
            iconTheme: IconThemeData(color: c.onSurface),
            actions: [
              IconButton(
                icon: Icon(LucideIcons.refreshCw, color: c.onSurfaceMuted),
                onPressed: () => ref.invalidate(providerOrdersListProvider),
              ),
            ],
          ),
          body: body,
        );
      },
    );
  }

  Widget _emptyAll(ShadThemeData theme, UniMoveColors c) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: c.chipBg,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Icon(LucideIcons.inbox, size: 32, color: c.onSurfaceMuted),
            ),
            const SizedBox(height: 16),
            Text(
              'Chưa có đơn nào',
              style: theme.textTheme.large.copyWith(fontWeight: FontWeight.w700, color: c.onSurface),
            ),
            const SizedBox(height: 8),
            Text(
              'Bật "Đang nhận đơn" để nhận yêu cầu báo giá từ khách.',
              textAlign: TextAlign.center,
              style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted, height: 1.4),
            ),
          ],
        ),
      ),
    );
  }

  Widget _emptyFilter(ShadThemeData theme, UniMoveColors c, String label) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(LucideIcons.inbox, size: 40, color: c.onSurfaceMuted),
            const SizedBox(height: 12),
            Text(
              'Không có đơn «$label»',
              style: theme.textTheme.p.copyWith(fontWeight: FontWeight.w700, color: c.onSurface),
            ),
            const SizedBox(height: 8),
            Text(
              'Chọn tab khác để xem đơn theo trạng thái.',
              style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted),
            ),
          ],
        ),
      ),
    );
  }
}

bool _isAuthError(Object e) {
  if (e is ApiException) {
    return e.statusCode == 401 ||
        (e.message.contains('Token') && e.message.contains('hết hạn'));
  }
  final s = e.toString();
  return s.contains('Token không hợp lệ') || s.contains('hết hạn');
}

String _friendlyError(Object e) {
  if (_isAuthError(e)) {
    return 'Phiên đăng nhập đã hết hạn.\nVui lòng đăng nhập lại hoặc dùng tài khoản demo.';
  }
  if (e is ApiException) return e.message;
  return e.toString();
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({
    required this.message,
    required this.onRetry,
    this.isAuthError = false,
    this.onSignOut,
    this.onDemoLogin,
  });

  final String message;
  final VoidCallback onRetry;
  final bool isAuthError;
  final VoidCallback? onSignOut;
  final VoidCallback? onDemoLogin;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isAuthError ? Icons.lock_clock_outlined : Icons.cloud_off_outlined,
              size: 48,
              color: Theme.of(context).colorScheme.outline,
            ),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            if (isAuthError && onSignOut != null) ...[
              ShadButton(
                width: double.infinity,
                onPressed: onSignOut,
                child: const Text('Đăng nhập lại'),
              ),
              if (onDemoLogin != null) ...[
                const SizedBox(height: 10),
                ShadButton.outline(
                  width: double.infinity,
                  onPressed: onDemoLogin,
                  child: const Text('Dùng tài khoản demo (không cần API)'),
                ),
              ],
            ] else
              ShadButton(onPressed: onRetry, child: const Text('Thử lại')),
          ],
        ),
      ),
    );
  }
}
