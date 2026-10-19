import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/shad_screen_scope.dart';
import '../../domain/provider_notification_models.dart';
import '../providers/notifications_providers.dart';

class ProviderNotificationsPage extends ConsumerStatefulWidget {
  const ProviderNotificationsPage({super.key});

  @override
  ConsumerState<ProviderNotificationsPage> createState() => _ProviderNotificationsPageState();
}

class _ProviderNotificationsPageState extends ConsumerState<ProviderNotificationsPage> {
  ProviderNotificationFilter _filter = ProviderNotificationFilter.all;

  Future<void> _markAllRead() async {
    await ref.read(providerNotificationsRepositoryProvider).markAllRead();
    ref.invalidate(providerNotificationsProvider);
    ref.invalidate(providerUnreadNotificationsProvider);
  }

  @override
  Widget build(BuildContext context) {
    final notificationsAsync = ref.watch(providerNotificationsProvider);
    final c = UniMoveColors.of(context);

    return ShadScreenScope(
      builder: (_, theme) {
        return Scaffold(
          backgroundColor: c.background,
          appBar: AppBar(
            backgroundColor: c.background,
            elevation: 0,
            scrolledUnderElevation: 0,
            leading: ShadIconButton.ghost(
              icon: Icon(LucideIcons.arrowLeft, color: c.onSurface),
              onPressed: () => context.pop(),
            ),
            title: Text(
              'Thông báo',
              style: theme.textTheme.large.copyWith(fontWeight: FontWeight.w800, color: c.onSurface),
            ),
            actions: [
              TextButton(
                onPressed: notificationsAsync.asData?.value.any((n) => !n.isRead) == true
                    ? _markAllRead
                    : null,
                child: Text(
                  'Đọc tất cả',
                  style: theme.textTheme.small.copyWith(
                    color: c.primaryLight,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          body: notificationsAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(child: Text('Lỗi: $e', style: TextStyle(color: c.onSurface))),
            data: (items) {
              final filtered = items.where((n) => n.matchesFilter(_filter)).toList();
              final unread = items.where((n) => !n.isRead).length;

              return Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (unread > 0)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
                      child: GlassCard(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        child: Row(
                          children: [
                            Icon(LucideIcons.bellRing, size: 18, color: c.primaryLight),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                'Bạn có $unread thông báo chưa đọc',
                                style: theme.textTheme.small.copyWith(
                                  color: c.onSurface,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 4, 20, 12),
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: ProviderNotificationFilter.values.map((f) {
                          final selected = _filter == f;
                          return Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: FilterChip(
                              label: Text(f.label),
                              selected: selected,
                              onSelected: (_) => setState(() => _filter = f),
                              selectedColor: c.primary.withValues(alpha: 0.18),
                              checkmarkColor: c.primaryLight,
                              labelStyle: theme.textTheme.small.copyWith(
                                fontWeight: FontWeight.w700,
                                color: selected ? c.primaryLight : c.onSurfaceMuted,
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ),
                  Expanded(
                    child: filtered.isEmpty
                        ? _emptyState(theme, c)
                        : RefreshIndicator(
                            color: c.primary,
                            onRefresh: () async {
                              ref.invalidate(providerNotificationsProvider);
                              ref.invalidate(providerUnreadNotificationsProvider);
                            },
                            child: ListView.separated(
                              physics: const AlwaysScrollableScrollPhysics(
                                parent: BouncingScrollPhysics(),
                              ),
                              padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                              itemCount: filtered.length,
                              separatorBuilder: (_, __) => const SizedBox(height: 10),
                              itemBuilder: (_, i) => _NotificationTile(
                                notification: filtered[i],
                                onTap: () async {
                                  await context.push(
                                    '/notifications/${filtered[i].id}',
                                  );
                                  ref.invalidate(providerNotificationsProvider);
                                  ref.invalidate(providerUnreadNotificationsProvider);
                                },
                              ),
                            ),
                          ),
                  ),
                ],
              );
            },
          ),
        );
      },
    );
  }

  Widget _emptyState(ShadThemeData theme, UniMoveColors c) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        SizedBox(height: MediaQuery.sizeOf(context).height * 0.2),
        Icon(LucideIcons.bellOff, size: 56, color: c.onSurfaceMuted),
        const SizedBox(height: 16),
        Text(
          'Không có thông báo',
          textAlign: TextAlign.center,
          style: theme.textTheme.large.copyWith(fontWeight: FontWeight.w800, color: c.onSurface),
        ),
        const SizedBox(height: 8),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Text(
            'Đơn mới, tin nhắn khách và cập nhật hệ thống sẽ hiện tại đây.',
            textAlign: TextAlign.center,
            style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted, height: 1.4),
          ),
        ),
      ],
    );
  }
}

class _NotificationTile extends StatelessWidget {
  const _NotificationTile({required this.notification, required this.onTap});

  final ProviderNotification notification;
  final VoidCallback onTap;

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inMinutes < 60) return '${diff.inMinutes} phút';
    if (diff.inHours < 24) return '${diff.inHours} giờ';
    if (diff.inDays < 7) return '${diff.inDays} ngày';
    return '${dt.day}/${dt.month}';
  }

  IconData _iconFor(ProviderNotificationType type) => switch (type) {
        ProviderNotificationType.newOrder => LucideIcons.package,
        ProviderNotificationType.orderUpdate => LucideIcons.circleCheck,
        ProviderNotificationType.message => LucideIcons.messageCircle,
        ProviderNotificationType.documentReview => LucideIcons.fileCheck,
        ProviderNotificationType.payment => LucideIcons.wallet,
        ProviderNotificationType.system => LucideIcons.info,
      };

  Color _accent(ProviderNotificationType type, UniMoveColors c) => switch (type) {
        ProviderNotificationType.newOrder => c.primaryLight,
        ProviderNotificationType.orderUpdate => c.success,
        ProviderNotificationType.message => const Color(0xFF8B5CF6),
        ProviderNotificationType.documentReview => Colors.orange.shade700,
        ProviderNotificationType.payment => c.success,
        ProviderNotificationType.system => c.onSurfaceMuted,
      };

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);
    final n = notification;
    final unread = !n.isRead;
    final accent = _accent(n.type, c);

    return ShadScreenScope(
      builder: (_, theme) {
        return Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(16),
            child: GlassCard(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              radius: 16,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: accent.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Icon(_iconFor(n.type), color: accent, size: 24),
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
                                n.title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: theme.textTheme.p.copyWith(
                                  fontWeight: unread ? FontWeight.w800 : FontWeight.w600,
                                  color: c.onSurface,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              _formatTime(n.createdAt),
                              style: theme.textTheme.small.copyWith(
                                color: c.onSurfaceMuted,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: c.iconBgTertiary,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            n.type.label,
                            style: theme.textTheme.small.copyWith(
                              color: c.onSurfaceMuted,
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          n.preview,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: theme.textTheme.small.copyWith(
                            color: c.onSurfaceMuted,
                            height: 1.3,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (unread) ...[
                    const SizedBox(width: 8),
                    Container(
                      width: 10,
                      height: 10,
                      margin: const EdgeInsets.only(top: 4),
                      decoration: BoxDecoration(color: c.primary, shape: BoxShape.circle),
                    ),
                  ],
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
