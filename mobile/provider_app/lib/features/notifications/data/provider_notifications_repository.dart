import '../../../core/network/api_client.dart';
import '../domain/provider_notification_models.dart';

class ProviderNotificationsRepository {
  ProviderNotificationsRepository({ApiClient? api}) : _api = api ?? ApiClient.instance;

  final ApiClient _api;

  static ProviderNotificationType _typeFromApi(String t) => switch (t) {
        'order_created' || 'order_accepted' || 'order_started' || 'order_completed' || 'order_cancelled' ||
        'quote_received' || 'quote_selected' =>
          ProviderNotificationType.newOrder,
        'order_update' => ProviderNotificationType.orderUpdate,
        'payment_received' || 'payment_failed' || 'withdrawal_approved' || 'withdrawal_rejected' =>
          ProviderNotificationType.payment,
        'provider_verified' || 'document_review' => ProviderNotificationType.documentReview,
        'system_announcement' || 'account_status_update' => ProviderNotificationType.system,
        _ => ProviderNotificationType.system,
      };

  static ProviderNotification _fromJson(Map<String, dynamic> j) {
    final actionData = (j['action_data'] as Map?)?.cast<String, dynamic>();
    final orderId = actionData?['order_id'] as String?;
    return ProviderNotification(
      id: j['id'] as String,
      type: _typeFromApi(j['notification_type'] as String? ?? ''),
      title: j['title'] as String? ?? '',
      body: j['body'] as String? ?? '',
      subtitle: j['body'] as String?,
      createdAt: DateTime.parse(j['created_at'] as String).toLocal(),
      isRead: j['is_read'] as bool? ?? false,
      orderId: orderId,
      actionRoute: orderId != null ? '/orders/$orderId' : null,
    );
  }

  Future<List<ProviderNotification>> fetchInbox() async {
    try {
      final envelope = await _api.guard(() => _api.get('/notifications'));
      final raw = (envelope['notifications'] as List?) ?? [];
      final list = raw.map((e) => _fromJson(Map<String, dynamic>.from(e as Map))).toList();
      list.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      return list;
    } catch (_) {
      return [];
    }
  }

  Future<ProviderNotification?> byId(String id) async {
    try {
      final all = await fetchInbox();
      return all.firstWhere((n) => n.id == id);
    } catch (_) {
      return null;
    }
  }

  Future<void> markRead(String id) async {
    try {
      await _api.guard(() => _api.patch('/notifications/$id/read'));
    } catch (_) {}
  }

  Future<void> markAllRead() async {
    try {
      await _api.guard(() => _api.patch('/notifications/read-all'));
    } catch (_) {}
  }

  Future<int> unreadCount() async {
    try {
      final envelope = await _api.guard(() => _api.get('/notifications/unread-count'));
      return (envelope['unread_count'] as num?)?.toInt() ?? 0;
    } catch (_) {
      return 0;
    }
  }
}
