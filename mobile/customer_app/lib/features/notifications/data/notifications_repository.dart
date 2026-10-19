import '../../../core/network/api_client.dart';
import '../domain/notification_models.dart';

class NotificationsRepository {
  final ApiClient _api = ApiClient.instance;

  static AppNotificationType _typeFromApi(String t) => switch (t) {
        'promotion'                    => AppNotificationType.promotion,
        'system_announcement'          => AppNotificationType.systemAnnouncement,
        'marketplace_message'          => AppNotificationType.marketplaceMessage,
        'marketplace_deal_confirmed'   => AppNotificationType.marketplaceDealConfirmed,
        'marketplace_deal_cancelled'   => AppNotificationType.marketplaceDealCancelled,
        'marketplace_transport_booked' => AppNotificationType.marketplaceTransportBooked,
        'marketplace_interest'         => AppNotificationType.marketplaceInterest,
        'order_created' ||
        'order_accepted' ||
        'order_started' ||
        'order_completed' ||
        'order_cancelled' ||
        'quote_received' ||
        'quote_selected'           => AppNotificationType.orderUpdate,
        'payment_received' ||
        'payment_failed'               => AppNotificationType.payment,
        _                              => AppNotificationType.systemAnnouncement,
      };

  static AppNotification _fromJson(Map<String, dynamic> j) {
    final actionData = (j['action_data'] as Map?)?.cast<String, dynamic>();
    return AppNotification(
      id:         j['id'] as String,
      type:       _typeFromApi(j['notification_type'] as String? ?? ''),
      title:      j['title'] as String? ?? '',
      body:       j['body'] as String? ?? '',
      createdAt:  DateTime.parse(j['created_at'] as String).toLocal(),
      isRead:     j['is_read'] as bool? ?? false,
      icon:       j['icon'] as String?,
      listingId:  j['listing_id'] as String?,
      buyerId:    actionData?['buyer_id'] as String?,
    );
  }

  Future<List<AppNotification>> fetchInbox() async {
    try {
      final envelope = await _api.guard(() => _api.get('/notifications'));
      final raw = (envelope['notifications'] as List?) ?? [];
      final remote = raw.map((e) => _fromJson(Map<String, dynamic>.from(e as Map))).toList();
      remote.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      return remote;
    } catch (_) {
      return [];
    }
  }

  Future<int> unreadCount() async {
    try {
      final envelope = await _api.guard(() => _api.get('/notifications/unread-count'));
      return (envelope['unread_count'] as num?)?.toInt() ?? 0;
    } catch (_) {
      return 0;
    }
  }

  Future<void> markAsRead(String id) async {
    try {
      await _api.guard(() => _api.patch('/notifications/$id/read'));
    } catch (_) {}
  }

  Future<void> markAllRead() async {
    try {
      await _api.guard(() => _api.patch('/notifications/read-all'));
    } catch (_) {}
  }

  Future<AppNotification?> fetchById(String id) async {
    try {
      final all = await fetchInbox();
      return all.firstWhere((n) => n.id == id);
    } catch (_) {
      return null;
    }
  }

  Future<List<AppNotification>> fetchPromotions() async {
    final all = await fetchInbox();
    return all.where((n) => n.type == AppNotificationType.promotion).toList();
  }
}
