/// Thông báo nhà xe — khớp `notification_type` backend.
enum ProviderNotificationType {
  newOrder('Đơn mới'),
  orderUpdate('Đơn hàng'),
  message('Tin nhắn'),
  documentReview('Giấy tờ'),
  payment('Thanh toán'),
  system('Hệ thống');

  const ProviderNotificationType(this.label);
  final String label;
}

enum ProviderNotificationFilter {
  all('Tất cả'),
  orders('Đơn hàng'),
  messages('Tin nhắn'),
  system('Hệ thống');

  const ProviderNotificationFilter(this.label);
  final String label;
}

class ProviderNotification {
  const ProviderNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.createdAt,
    this.subtitle,
    this.isRead = false,
    this.orderId,
    this.threadId,
    this.actionRoute,
  });

  final String id;
  final ProviderNotificationType type;
  final String title;
  final String body;
  final DateTime createdAt;
  final String? subtitle;
  final bool isRead;
  final String? orderId;
  final String? threadId;
  final String? actionRoute;

  String get preview {
    final text = subtitle ?? body;
    return text.length > 72 ? '${text.substring(0, 72)}...' : text;
  }

  bool matchesFilter(ProviderNotificationFilter filter) => switch (filter) {
        ProviderNotificationFilter.all => true,
        ProviderNotificationFilter.orders =>
          type == ProviderNotificationType.newOrder || type == ProviderNotificationType.orderUpdate,
        ProviderNotificationFilter.messages => type == ProviderNotificationType.message,
        ProviderNotificationFilter.system =>
          type == ProviderNotificationType.system ||
          type == ProviderNotificationType.documentReview ||
          type == ProviderNotificationType.payment,
      };
}
