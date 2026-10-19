/// Khớp `notification_type` trong Supabase.
enum AppNotificationType {
  promotion,
  systemAnnouncement,
  orderUpdate,
  payment,
  marketplaceMessage,
  marketplaceDealConfirmed,
  marketplaceDealCancelled,
  marketplaceTransportBooked,
  marketplaceInterest,
}

class AppNotification {
  const AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.createdAt,
    this.isRead = false,
    this.icon,
    this.imageUrl,
    this.promoCode,
    this.promotionId,
    this.actionRoute,
    this.listingId,
    this.buyerId,
    this.subtitle,
    String? ctaLabel,
  }) : _ctaLabel = ctaLabel;

  final String id;
  final AppNotificationType type;
  final String title;
  final String body;
  final DateTime createdAt;
  final bool isRead;
  final String? icon;
  final String? imageUrl;
  final String? promoCode;
  final String? promotionId;
  final String? actionRoute;
  final String? listingId;
  final String? buyerId;
  final String? subtitle;
  final String? _ctaLabel;

  String get ctaLabel => _ctaLabel ?? 'Xem thêm';

  String get preview => body.length > 60 ? '${body.substring(0, 60)}...' : body;

  bool get isMarketplace => type == AppNotificationType.marketplaceMessage ||
      type == AppNotificationType.marketplaceDealConfirmed ||
      type == AppNotificationType.marketplaceDealCancelled ||
      type == AppNotificationType.marketplaceTransportBooked ||
      type == AppNotificationType.marketplaceInterest;

  String get categoryLabel => switch (type) {
        AppNotificationType.promotion => 'Ưu đãi',
        AppNotificationType.systemAnnouncement => 'Hệ thống',
        AppNotificationType.orderUpdate => 'Đơn hàng',
        AppNotificationType.payment => 'Thanh toán',
        AppNotificationType.marketplaceMessage => 'Chợ sinh viên',
        AppNotificationType.marketplaceDealConfirmed => 'Chợ sinh viên',
        AppNotificationType.marketplaceDealCancelled => 'Chợ sinh viên',
        AppNotificationType.marketplaceTransportBooked => 'Chợ sinh viên',
        AppNotificationType.marketplaceInterest => 'Chợ sinh viên',
      };
}
