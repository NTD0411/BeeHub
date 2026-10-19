import '../../features/notifications/domain/notification_models.dart';

abstract final class MockNotificationsData {
  static final Set<String> readIds = {};

  /// Getter — tránh giữ instance cũ sau hot reload (field `ctaLabel` null).
  static List<AppNotification> get inbox => [
    AppNotification(
      id: 'notif001',
      type: AppNotificationType.promotion,
      title: '🎉 STUDENT15 — Giảm 15% chuyển trọ',
      subtitle: '✨ Tiết kiệm tối đa 100.000đ cho sinh viên',
      body: 'Dùng mã STUDENT15 cho đơn từ 200.000đ. Hết hạn 31/08/2026.',
      createdAt: DateTime.now().subtract(const Duration(hours: 2)),
      isRead: false,
      icon: 'gift',
      promoCode: 'STUDENT15',
      promotionId: 'promo-student15',
      actionRoute: '/booking/location',
      ctaLabel: 'Đặt ngay',
    ),
    AppNotification(
      id: 'notif002',
      type: AppNotificationType.promotion,
      title: '🎁 WELCOME10 — Khách hàng mới',
      subtitle: '✨ Giảm 10% đơn chuyển trọ đầu tiên',
      body: 'Chào mừng bạn đến UniMove! Nhận mã WELCOME10 khi thanh toán.',
      createdAt: DateTime.now().subtract(const Duration(days: 1)),
      isRead: false,
      icon: 'star',
      promoCode: 'WELCOME10',
      promotionId: 'promo-welcome10',
      actionRoute: '/booking/location',
      ctaLabel: 'Xem thêm',
    ),
    AppNotification(
      id: 'notif003',
      type: AppNotificationType.systemAnnouncement,
      title: 'Chuyển trọ không phát sinh',
      subtitle: 'Cam kết minh bạch giá',
      body: 'UniMove cam kết giá minh bạch — không phát sinh chi phí ngoài báo giá đã xác nhận.',
      createdAt: DateTime.now().subtract(const Duration(days: 3)),
      isRead: true,
      icon: 'bell',
      ctaLabel: 'Tìm hiểu',
    ),
    AppNotification(
      id: 'notif004',
      type: AppNotificationType.promotion,
      title: '💰 SAVE50K — Đơn từ 500K',
      subtitle: '✨ Thanh toán PayOS hoặc MoMo',
      body: 'Mã SAVE50K — áp dụng khi thanh toán qua PayOS hoặc MoMo.',
      createdAt: DateTime(2026, 5, 25, 17, 5),
      isRead: true,
      icon: 'ticket',
      promoCode: 'SAVE50K',
      promotionId: 'promo-save50k',
      actionRoute: '/booking/location',
      ctaLabel: 'Xem thêm',
    ),
  ];

  static List<AppNotification> inboxWithReadState() {
    return inbox
        .map(
          (n) => AppNotification(
            id: n.id,
            type: n.type,
            title: n.title,
            body: n.body,
            createdAt: n.createdAt,
            isRead: readIds.contains(n.id) || n.isRead,
            icon: n.icon,
            imageUrl: n.imageUrl,
            promoCode: n.promoCode,
            promotionId: n.promotionId,
            actionRoute: n.actionRoute,
            subtitle: n.subtitle,
            ctaLabel: n.ctaLabel,
          ),
        )
        .toList();
  }

  static List<AppNotification> promotions() {
    return inboxWithReadState().where((n) => n.type == AppNotificationType.promotion).toList();
  }

  static AppNotification? byId(String id) {
    try {
      final base = inbox.firstWhere((n) => n.id == id);
      return AppNotification(
        id: base.id,
        type: base.type,
        title: base.title,
        body: base.body,
        createdAt: base.createdAt,
        isRead: readIds.contains(base.id) || base.isRead,
        icon: base.icon,
        imageUrl: base.imageUrl,
        promoCode: base.promoCode,
        promotionId: base.promotionId,
        actionRoute: base.actionRoute,
        subtitle: base.subtitle,
        ctaLabel: base.ctaLabel,
      );
    } catch (_) {
      return null;
    }
  }
}
