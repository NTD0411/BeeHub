import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/shad_screen_scope.dart';
import '../../domain/provider_notification_models.dart';
import '../providers/notifications_providers.dart';

class ProviderNotificationDetailPage extends ConsumerStatefulWidget {
  const ProviderNotificationDetailPage({super.key, required this.notificationId});

  final String notificationId;

  @override
  ConsumerState<ProviderNotificationDetailPage> createState() =>
      _ProviderNotificationDetailPageState();
}

class _ProviderNotificationDetailPageState extends ConsumerState<ProviderNotificationDetailPage> {
  ProviderNotification? _notification;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final repo = ref.read(providerNotificationsRepositoryProvider);
    final n = await repo.byId(widget.notificationId);
    if (n != null && !n.isRead) {
      await repo.markRead(n.id);
      ref.invalidate(providerUnreadNotificationsProvider);
    }
    if (mounted) {
      setState(() {
        _notification = n;
        _loading = false;
      });
    }
  }

  void _openAction(ProviderNotification n) {
    final route = n.actionRoute;
    if (route == null || route.isEmpty) return;
    context.push(route);
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    return ShadScreenScope(
      builder: (_, theme) {
        return Scaffold(
          backgroundColor: c.background,
          appBar: AppBar(
            backgroundColor: c.background,
            elevation: 0,
            leading: ShadIconButton.ghost(
              icon: Icon(LucideIcons.arrowLeft, color: c.onSurface),
              onPressed: () => context.pop(),
            ),
            title: Text(
              'Chi tiết',
              style: theme.textTheme.large.copyWith(fontWeight: FontWeight.w800, color: c.onSurface),
            ),
          ),
          body: _loading
              ? const Center(child: CircularProgressIndicator())
              : _notification == null
                  ? Center(
                      child: Text(
                        'Không tìm thấy thông báo',
                        style: theme.textTheme.p.copyWith(color: c.onSurfaceMuted),
                      ),
                    )
                  : ListView(
                      padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
                      children: [
                        GlassCard(
                          padding: const EdgeInsets.all(20),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              ShadBadge.secondary(child: Text(_notification!.type.label)),
                              const SizedBox(height: 12),
                              Text(
                                _notification!.title,
                                style: theme.textTheme.h4.copyWith(
                                  fontWeight: FontWeight.w800,
                                  color: c.onSurface,
                                ),
                              ),
                              if (_notification!.subtitle != null) ...[
                                const SizedBox(height: 8),
                                Text(
                                  _notification!.subtitle!,
                                  style: theme.textTheme.p.copyWith(
                                    color: c.primaryLight,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                              const SizedBox(height: 16),
                              Text(
                                _notification!.body,
                                style: theme.textTheme.p.copyWith(
                                  color: c.onSurface,
                                  height: 1.5,
                                ),
                              ),
                              const SizedBox(height: 12),
                              Text(
                                _formatFullTime(_notification!.createdAt),
                                style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted),
                              ),
                            ],
                          ),
                        ),
                        if (_notification!.actionRoute != null) ...[
                          const SizedBox(height: 20),
                          ShadButton(
                            width: double.infinity,
                            onPressed: () => _openAction(_notification!),
                            child: Text(_actionLabel(_notification!)),
                          ),
                        ],
                      ],
                    ),
        );
      },
    );
  }

  String _formatFullTime(DateTime dt) {
    return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year} '
        '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }

  String _actionLabel(ProviderNotification n) => switch (n.type) {
        ProviderNotificationType.newOrder || ProviderNotificationType.orderUpdate => 'Xem đơn hàng',
        ProviderNotificationType.message => 'Mở tin nhắn',
        ProviderNotificationType.documentReview => 'Xem giấy tờ',
        ProviderNotificationType.payment => 'Xem thu nhập',
        ProviderNotificationType.system => 'Đã hiểu',
      };
}
