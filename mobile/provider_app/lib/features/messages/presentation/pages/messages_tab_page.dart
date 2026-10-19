import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/category_filter_bar.dart';
import '../../../../core/widgets/shad_screen_scope.dart';
import '../../domain/chat_models.dart';
import '../../../orders/presentation/providers/orders_providers.dart';
import '../providers/messages_providers.dart';

class MessagesTabPage extends ConsumerStatefulWidget {
  const MessagesTabPage({super.key});

  @override
  ConsumerState<MessagesTabPage> createState() => _MessagesTabPageState();
}

class _MessagesTabPageState extends ConsumerState<MessagesTabPage> {
  MessageInboxFilter _filter = MessageInboxFilter.all;

  @override
  Widget build(BuildContext context) {
    final threadsAsync = ref.watch(providerChatThreadsProvider);
    final c = UniMoveColors.of(context);

    return ShadScreenScope(
      builder: (_, theme) {
        return SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 4),
                child: Text(
                  'Tin nhắn',
                  style: theme.textTheme.h3.copyWith(fontWeight: FontWeight.w800, color: c.onSurface),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
                child: Text(
                  'Lọc theo trạng thái đơn · chỉ nhắn khi đơn còn mở',
                  style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted, height: 1.35),
                ),
              ),
              threadsAsync.when(
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
                data: (threads) {
                  if (threads.isEmpty) return const SizedBox.shrink();
                  final options = MessageInboxFilter.values
                      .map(
                        (f) => CategoryFilterOption(
                          id: f.id,
                          label: f.label,
                          count: threads.where(f.matches).length,
                        ),
                      )
                      .toList();
                  return CategoryFilterBar(
                    options: options,
                    selectedId: _filter.id,
                    onSelected: (id) {
                      setState(() {
                        _filter = MessageInboxFilter.values.firstWhere((f) => f.id == id);
                      });
                    },
                  );
                },
              ),
              const SizedBox(height: 8),
              Expanded(
                child: threadsAsync.when(
                  loading: () => const Center(child: CircularProgressIndicator()),
                  error: (e, _) => Center(child: Text('Lỗi: $e', style: TextStyle(color: c.onSurface))),
                  data: (threads) {
                    if (threads.isEmpty) {
                      return _emptyState(theme, c);
                    }

                    final filtered = threads.where(_filter.matches).toList()
                      ..sort((a, b) => b.lastMessageAt.compareTo(a.lastMessageAt));

                    if (filtered.isEmpty) {
                      return _emptyFilter(theme, c, _filter.label);
                    }

                    return RefreshIndicator(
                      onRefresh: () async {
                        ref.invalidate(providerChatThreadsProvider);
                        ref.invalidate(providerOrdersListProvider);
                      },
                      child: ListView.builder(
                        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                        padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                        itemCount: filtered.length,
                        itemBuilder: (_, i) {
                          final t = filtered[i];
                          return _ThreadTile(
                            thread: t,
                            onTap: () => context.push('/chat/${t.id}'),
                            readOnly: !t.canSendMessages,
                          );
                        },
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _emptyState(ShadThemeData theme, UniMoveColors c) {
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
                color: c.iconBgSecondary,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Icon(LucideIcons.messagesSquare, size: 36, color: c.primary),
            ),
            const SizedBox(height: 16),
            Text(
              'Chưa có hội thoại',
              style: theme.textTheme.large.copyWith(fontWeight: FontWeight.w700, color: c.onSurface),
            ),
            const SizedBox(height: 8),
            Text(
              'Khi có đơn mới hoặc đơn đang chạy, khách sẽ xuất hiện ở đây.',
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
            Icon(LucideIcons.filterX, size: 40, color: c.onSurfaceMuted),
            const SizedBox(height: 12),
            Text(
              'Không có tin «$label»',
              style: theme.textTheme.p.copyWith(fontWeight: FontWeight.w700, color: c.onSurface),
            ),
            const SizedBox(height: 8),
            Text(
              'Thử chọn «Tất cả» hoặc mục khác.',
              style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted),
            ),
          ],
        ),
      ),
    );
  }
}

class _ThreadTile extends StatelessWidget {
  const _ThreadTile({required this.thread, required this.onTap, this.readOnly = false});

  final ProviderChatThread thread;
  final VoidCallback onTap;
  final bool readOnly;

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);
    final theme = ShadTheme.of(context);
    final initial = thread.customerName.isNotEmpty ? thread.customerName[0].toUpperCase() : 'K';

    final badgeColor = switch (true) {
      _ when readOnly => c.onSurfaceMuted,
      _ when thread.isOrderPending => c.primaryLight,
      _ when thread.isOrderRunning => c.primary,
      _ => c.primaryLight,
    };

    final badgeLabel = switch (true) {
      _ when readOnly => 'Chỉ xem',
      _ when thread.isOrderPending => 'Chờ nhận',
      _ when thread.isOrderRunning => 'Đang chạy',
      _ => thread.orderStatus,
    };

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(18),
          child: GlassCard(
            padding: const EdgeInsets.all(14),
            radius: 18,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(colors: [c.primary.withValues(alpha: 0.85), c.primaryLight]),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        initial,
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 18),
                      ),
                    ),
                    if (thread.unreadCount > 0)
                      Positioned(
                        right: -2,
                        top: -2,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(color: c.primary, shape: BoxShape.circle),
                          constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
                          child: Text(
                            '${thread.unreadCount}',
                            textAlign: TextAlign.center,
                            style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800),
                          ),
                        ),
                      ),
                  ],
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
                              thread.customerName,
                              style: theme.textTheme.p.copyWith(fontWeight: FontWeight.w800, color: c.onSurface),
                            ),
                          ),
                          Text(
                            _timeShort(thread.lastMessageAt),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted, fontSize: 11),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '#${thread.orderNumber}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.small.copyWith(fontWeight: FontWeight.w700, color: c.onSurface),
                      ),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: badgeColor.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          badgeLabel,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: theme.textTheme.small.copyWith(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: badgeColor,
                          ),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        thread.lastMessagePreview,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.small.copyWith(
                          color: thread.unreadCount > 0 ? c.onSurface : c.onSurfaceMuted,
                          fontWeight: thread.unreadCount > 0 ? FontWeight.w600 : FontWeight.w400,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(LucideIcons.chevronRight, color: c.onSurfaceMuted, size: 18),
              ],
            ),
          ),
        ),
      ),
    );
  }

  static String _timeShort(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 60) return '${diff.inMinutes}p';
    if (diff.inHours < 24) return '${diff.inHours}g';
    return '${dt.day}/${dt.month}';
  }
}
