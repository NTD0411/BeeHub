import '../../features/notifications/domain/provider_notification_models.dart';

abstract final class MockProviderNotifications {
  static final Set<String> readIds = {};

  static List<ProviderNotification> get inbox => [
        ProviderNotification(
          id: 'pn-001',
          type: ProviderNotificationType.newOrder,
          title: 'Đơn mới #UM-240603',
          subtitle: 'Chuyển trọ 1.5 tấn · Q.7 → Thủ Đức',
          body: 'Khách Lê Nhật Nam vừa đặt đơn. Nhận trong 15 phút để không bị hủy.',
          createdAt: DateTime.now().subtract(const Duration(minutes: 12)),
          orderId: 'a1000000-0000-4000-8000-000000000001',
          actionRoute: '/orders/a1000000-0000-4000-8000-000000000001',
        ),
        ProviderNotification(
          id: 'pn-002',
          type: ProviderNotificationType.message,
          title: 'Tin nhắn từ khách',
          subtitle: 'Trần Thu Hà · Đơn #UM-240528',
          body: 'Cho em hỏi tài xế có thể đến sớm 30 phút được không ạ?',
          createdAt: DateTime.now().subtract(const Duration(hours: 2)),
          threadId: 'order-a1000000-0000-4000-8000-000000000002',
          actionRoute: '/chat/order-a1000000-0000-4000-8000-000000000002',
        ),
        ProviderNotification(
          id: 'pn-003',
          type: ProviderNotificationType.payment,
          title: 'Đã giải ngân thu nhập',
          subtitle: '2.450.000đ · Vietcombank',
          body: 'Khoản thanh toán đơn #UM-240601 đã chuyển vào tài khoản của bạn.',
          createdAt: DateTime.now().subtract(const Duration(hours: 5)),
          isRead: true,
        ),
        ProviderNotification(
          id: 'pn-004',
          type: ProviderNotificationType.documentReview,
          title: 'Giấy tờ đã được duyệt',
          subtitle: 'GPLX · Hồ sơ xác thực',
          body: 'Giấy phép lái xe của bạn đã được admin phê duyệt. Bạn có thể nhận đơn bình thường.',
          createdAt: DateTime.now().subtract(const Duration(days: 1)),
          isRead: true,
          actionRoute: '/documents',
        ),
        ProviderNotification(
          id: 'pn-005',
          type: ProviderNotificationType.orderUpdate,
          title: 'Khách xác nhận hoàn tất',
          subtitle: '#UM-240525 · +820.000đ thực nhận',
          body: 'Đơn đã hoàn thành. Tiền sẽ được giải ngân sau khi đối soát.',
          createdAt: DateTime.now().subtract(const Duration(days: 2)),
          orderId: 'a1000000-0000-4000-8000-000000000004',
          actionRoute: '/orders/a1000000-0000-4000-8000-000000000004',
          isRead: true,
        ),
        ProviderNotification(
          id: 'pn-006',
          type: ProviderNotificationType.system,
          title: 'Cập nhật chính sách phí',
          subtitle: 'Áp dụng từ 01/07/2026',
          body: 'Phí nền tảng giữ ở mức 15% cho đối tác đã xác thực đủ giấy tờ.',
          createdAt: DateTime(2026, 5, 28, 9, 0),
          isRead: true,
        ),
      ];

  static List<ProviderNotification> inboxWithReadState() {
    return inbox
        .map(
          (n) => ProviderNotification(
            id: n.id,
            type: n.type,
            title: n.title,
            body: n.body,
            createdAt: n.createdAt,
            subtitle: n.subtitle,
            isRead: readIds.contains(n.id) || n.isRead,
            orderId: n.orderId,
            threadId: n.threadId,
            actionRoute: n.actionRoute,
          ),
        )
        .toList()
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
  }

  static ProviderNotification? byId(String id) {
    try {
      return inboxWithReadState().firstWhere((n) => n.id == id);
    } catch (_) {
      return null;
    }
  }

  static int unreadCount() => inboxWithReadState().where((n) => !n.isRead).length;
}
