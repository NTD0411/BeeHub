import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/uni_move_colors.dart';
import '../../../chat/data/chat_repository.dart';
import '../../../chat/domain/chat_models.dart';
import '../../data/notifications_repository.dart';
import '../../domain/notification_models.dart';
import 'notification_detail_page.dart';

/// Tab Tin nhắn — chat tài xế/nhà xe + thông báo ưu đãi.
class MessagesTabPage extends StatefulWidget {
  const MessagesTabPage({super.key, this.showTitle = true});

  final bool showTitle;

  @override
  State<MessagesTabPage> createState() => _MessagesTabPageState();
}

class _MessagesTabPageState extends State<MessagesTabPage> {
  final _notificationsRepo = NotificationsRepository();
  final _chatRepo = ChatRepository();
  List<ChatInboxEntry> _chats = [];
  List<AppNotification> _notifications = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final results = await Future.wait([
      _chatRepo.fetchInbox(),
      _notificationsRepo.fetchInbox(),
    ]);
    if (mounted) {
      setState(() {
        _chats = results[0] as List<ChatInboxEntry>;
        _notifications = results[1] as List<AppNotification>;
        _loading = false;
      });
    }
  }

  /// Shell tab: chat + mọi thông báo. Chuông trên Home: chỉ thông báo hệ thống/đơn (không tin chợ).
  List<AppNotification> get _displayNotifications {
    if (widget.showTitle) return _notifications;
    return _notifications
        .where((n) => n.type != AppNotificationType.marketplaceMessage)
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);
    final theme = ShadTheme.of(context);

    if (_loading) {
      return Center(child: CircularProgressIndicator(color: c.primary));
    }

    return SafeArea(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (widget.showTitle)
            Padding(
              padding: EdgeInsets.fromLTRB(20.w, 12.h, 20.w, 8.h),
              child: Text(
                'Tin nhắn',
                style: theme.textTheme.h2.copyWith(fontWeight: FontWeight.w800),
              ),
            ),
          Expanded(
            child: RefreshIndicator(
              color: c.primary,
              onRefresh: _load,
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                padding: EdgeInsets.fromLTRB(12.w, 0, 12.w, 120.h),
                children: [
                  if (widget.showTitle) ...[
                    _sectionTitle(c, 'Tài xế & nhà xe'),
                    SizedBox(height: 8.h),
                    if (_chats.isEmpty)
                      _chatEmptyHint(c)
                    else
                      ..._chats.map(
                        (entry) => _ChatInboxTile(
                          entry: entry,
                          onTap: () => context.push('/chat/${entry.conversation.id}'),
                        ),
                      ),
                    SizedBox(height: 20.h),
                    _sectionTitle(c, 'Thông báo & ưu đãi'),
                    SizedBox(height: 8.h),
                  ],
                  if (_displayNotifications.isEmpty)
                    _notificationEmptyHint(c)
                  else
                    ..._displayNotifications.map(
                      (n) => _NotificationTile(
                        notification: n,
                        onTap: () => _openNotification(context, n),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _sectionTitle(UniMoveColors c, String label) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 8.w),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 13.sp,
          fontWeight: FontWeight.w800,
          color: c.onSurfaceMuted,
          letterSpacing: 0.3,
        ),
      ),
    );
  }

  Widget _chatEmptyHint(UniMoveColors c) {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 8.w),
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        color: c.surfaceTint,
        borderRadius: BorderRadius.circular(14.r),
      ),
      child: Column(
        children: [
          Icon(Icons.chat_bubble_outline_rounded, size: 32.sp, color: c.onSurfaceMuted),
          SizedBox(height: 10.h),
          Text(
            'Chưa có cuộc trò chuyện',
            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15.sp, color: c.onSurface),
          ),
          SizedBox(height: 6.h),
          Text(
            'Chat đơn hàng chưa khả dụng. Bạn vẫn nhận cập nhật trạng thái qua thông báo.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted, height: 1.4),
          ),
        ],
      ),
    );
  }

  Widget _notificationEmptyHint(UniMoveColors c) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 12.h),
      child: Text(
        'Chưa có thông báo — ưu đãi và quà tặng sẽ hiện ở đây.',
        textAlign: TextAlign.center,
        style: TextStyle(fontSize: 13.sp, color: c.onSurfaceMuted),
      ),
    );
  }

  Future<void> _openNotification(BuildContext context, AppNotification n) async {
    if (!n.isRead) {
      _notificationsRepo.markAsRead(n.id);
      setState(() {
        final i = _notifications.indexWhere((x) => x.id == n.id);
        if (i >= 0) {
          _notifications[i] = AppNotification(
            id: n.id,
            type: n.type,
            title: n.title,
            body: n.body,
            createdAt: n.createdAt,
            isRead: true,
            icon: n.icon,
            listingId: n.listingId,
            buyerId: n.buyerId,
          );
        }
      });
    }
    if (!context.mounted) return;
    if (n.actionRoute != null) {
      context.push(n.actionRoute!);
    } else if (n.isMarketplace && n.listingId != null) {
      final route = n.type == AppNotificationType.marketplaceMessage && n.buyerId != null
          ? '/pass-items/${n.listingId}/chat?buyer=${n.buyerId}'
          : '/pass-items/${n.listingId}';
      context.push(route);
    } else {
      await Navigator.of(context, rootNavigator: true).push<void>(
        MaterialPageRoute(
          builder: (_) => NotificationDetailPage(notificationId: n.id),
        ),
      );
      if (mounted) _load();
    }
  }
}

class _ChatInboxTile extends StatelessWidget {
  const _ChatInboxTile({required this.entry, required this.onTap});

  final ChatInboxEntry entry;
  final VoidCallback onTap;

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    if (now.difference(dt).inDays == 0) {
      return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    }
    if (now.difference(dt).inDays < 7) {
      const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      return days[dt.weekday % 7];
    }
    return '${dt.day}/${dt.month}';
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);
    final conv = entry.conversation;
    final muted = !entry.isActive;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 14.h),
          child: Row(
            children: [
              Opacity(
                opacity: muted ? 0.45 : 1,
                child: CircleAvatar(
                  radius: 26.r,
                  backgroundColor: c.surfaceTint,
                  backgroundImage: conv.providerAvatarUrl.isNotEmpty
                      ? CachedNetworkImageProvider(conv.providerAvatarUrl)
                      : null,
                  child: conv.providerAvatarUrl.isEmpty
                      ? Icon(Icons.person, color: c.primary)
                      : null,
                ),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${conv.providerName} · #${conv.orderNumber}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 15.sp,
                        color: muted ? c.onSurfaceMuted : c.onSurface,
                      ),
                    ),
                    SizedBox(height: 4.h),
                    Text(
                      conv.lastMessagePreview,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontSize: 13.sp, color: c.onSurfaceMuted),
                    ),
                  ],
                ),
              ),
              SizedBox(width: 8.w),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    _formatTime(conv.lastMessageAt),
                    style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted),
                  ),
                  if (conv.unreadCount > 0 && entry.isActive) ...[
                    SizedBox(height: 6.h),
                    Container(
                      constraints: BoxConstraints(minWidth: 20.w),
                      height: 20.w,
                      alignment: Alignment.center,
                      padding: EdgeInsets.symmetric(horizontal: 6.w),
                      decoration: BoxDecoration(
                        color: c.primary,
                        borderRadius: BorderRadius.circular(10.r),
                      ),
                      child: Text(
                        '${conv.unreadCount}',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 11.sp,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  const _NotificationTile({required this.notification, required this.onTap});

  final AppNotification notification;
  final VoidCallback onTap;

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    if (now.difference(dt).inDays == 0) {
      final h = dt.hour > 12 ? dt.hour - 12 : (dt.hour == 0 ? 12 : dt.hour);
      final suffix = dt.hour >= 12 ? 'CH' : 'SA';
      return '$h:${dt.minute.toString().padLeft(2, '0')} $suffix';
    }
    if (now.difference(dt).inDays < 7) {
      const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      return days[dt.weekday % 7];
    }
    return '${dt.day}/${dt.month}';
  }

  IconData _iconFor(AppNotification n) {
    if (n.type == AppNotificationType.marketplaceMessage) return Icons.chat_bubble_outline_rounded;
    if (n.type == AppNotificationType.marketplaceDealConfirmed) return Icons.handshake_outlined;
    if (n.type == AppNotificationType.marketplaceDealCancelled) return Icons.cancel_outlined;
    if (n.type == AppNotificationType.marketplaceTransportBooked) return Icons.local_shipping_outlined;
    if (n.type == AppNotificationType.marketplaceInterest) return Icons.favorite_rounded;
    return switch (n.icon) {
      'gift' => Icons.card_giftcard_rounded,
      'star' => Icons.star_rounded,
      'ticket' => Icons.confirmation_number_outlined,
      'bell' => Icons.notifications_rounded,
      _ => Icons.local_offer_outlined,
    };
  }

  Color _iconColor(AppNotificationType type, UniMoveColors c) => switch (type) {
        AppNotificationType.promotion => c.primaryLight,
        AppNotificationType.systemAnnouncement => c.primary,
        AppNotificationType.marketplaceMessage => c.primary,
        AppNotificationType.marketplaceDealConfirmed => c.success,
        AppNotificationType.marketplaceDealCancelled => c.accentGreen,
        AppNotificationType.marketplaceTransportBooked => c.primary,
        AppNotificationType.marketplaceInterest => Colors.pinkAccent,
        _ => c.onSurfaceMuted,
      };

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);
    final n = notification;
    final unread = !n.isRead;
    final isPromo = n.type == AppNotificationType.promotion;
    final title = isPromo ? 'Ưu đãi UniMove' : n.title;
    final preview = isPromo ? (n.subtitle ?? n.preview) : n.preview;
    final iconColor = isPromo ? AppColors.accentOrange : _iconColor(n.type, c);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14.r),
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 14.h),
          child: Row(
            children: [
              Container(
                width: 48.w,
                height: 48.w,
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isPromo ? Icons.local_offer_rounded : _iconFor(n),
                  color: iconColor,
                  size: 24.sp,
                ),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontWeight: unread ? FontWeight.w800 : FontWeight.w600,
                        fontSize: 15.sp,
                        color: c.onSurface,
                      ),
                    ),
                    SizedBox(height: 4.h),
                    Text(
                      preview,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontSize: 13.sp, color: c.onSurfaceMuted),
                    ),
                  ],
                ),
              ),
              SizedBox(width: 8.w),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    _formatTime(n.createdAt),
                    style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted),
                  ),
                  if (unread) ...[
                    SizedBox(height: 6.h),
                    Container(
                      width: 10.w,
                      height: 10.w,
                      decoration: BoxDecoration(color: c.primary, shape: BoxShape.circle),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
