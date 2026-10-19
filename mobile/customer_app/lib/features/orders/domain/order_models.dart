/// Khớp bảng `orders` + enum `order_status` trong Supabase.
enum OrderStatus {
  pending,
  matched,
  accepted,
  pickingUp,
  inProgress,
  completed,
  cancelled,
  disputed;

  static OrderStatus fromDb(String value) {
    return switch (value) {
      'pending' => OrderStatus.pending,
      'matched' => OrderStatus.matched,
      'accepted' => OrderStatus.accepted,
      'picking_up' => OrderStatus.pickingUp,
      'in_progress' => OrderStatus.inProgress,
      'completed' => OrderStatus.completed,
      'cancelled' => OrderStatus.cancelled,
      'disputed' => OrderStatus.disputed,
      _ => OrderStatus.pending,
    };
  }

  String get dbValue => switch (this) {
        OrderStatus.pending => 'pending',
        OrderStatus.matched => 'matched',
        OrderStatus.accepted => 'accepted',
        OrderStatus.pickingUp => 'picking_up',
        OrderStatus.inProgress => 'in_progress',
        OrderStatus.completed => 'completed',
        OrderStatus.cancelled => 'cancelled',
        OrderStatus.disputed => 'disputed',
      };

  bool get isActive =>
      this == OrderStatus.pending ||
      this == OrderStatus.matched ||
      this == OrderStatus.accepted ||
      this == OrderStatus.pickingUp ||
      this == OrderStatus.inProgress;
}

enum ServicePackageLabel { economy, standard, premium }

class CustomerOrder {
  const CustomerOrder({
    required this.id,
    required this.orderNumber,
    required this.customerId,
    this.providerId,
    required this.status,
    required this.packageLabel,
    required this.vehicleLabel,
    required this.pickupAddress,
    required this.deliveryAddress,
    required this.totalPrice,
    required this.createdAt,
    this.completedAt,
    this.cancelledAt,
    this.cancellationNote,
    this.etaMinutes,
    this.estimatedDistanceKm,
    this.providerName,
    this.providerAvatarUrl,
    this.providerRating,
    this.providerPlate,
    this.conversationId,
    this.hasReview = false,
    this.scheduledPickupAt,
    this.quoteReferenceId,
    this.depositPaid = false,
    this.quoteRequest = false,
  });

  final String id;
  final String orderNumber;
  final String customerId;
  final String? providerId;
  final OrderStatus status;
  final ServicePackageLabel packageLabel;
  final String vehicleLabel;
  final String pickupAddress;
  final String deliveryAddress;
  final int totalPrice;
  final DateTime createdAt;
  final DateTime? completedAt;
  final DateTime? cancelledAt;
  final String? cancellationNote;
  final int? etaMinutes;
  final double? estimatedDistanceKm;
  final String? providerName;
  final String? providerAvatarUrl;
  final double? providerRating;
  final String? providerPlate;
  final String? conversationId;
  final bool hasReview;
  final DateTime? scheduledPickupAt;
  final String? quoteReferenceId;
  final bool depositPaid;
  final bool quoteRequest;

  /// Khách đã cọc, chờ nhà xe nhận đơn.
  bool get awaitingProviderAccept => status == OrderStatus.matched && depositPaid;

  /// Nhà xe đã nhận đơn (sau khi khách cọc).
  bool get providerTripConfirmed =>
      status == OrderStatus.accepted ||
      status == OrderStatus.pickingUp ||
      status == OrderStatus.inProgress;

  bool get isAwaitingScheduledPickup {
    final at = scheduledPickupAt;
    if (at == null) return false;
    if (status == OrderStatus.completed || status == OrderStatus.cancelled) return false;
    if (status == OrderStatus.pickingUp || status == OrderStatus.inProgress) return false;
    return DateTime.now().isBefore(at);
  }

  bool get showLiveTracking =>
      !isAwaitingScheduledPickup &&
      (status == OrderStatus.pickingUp || status == OrderStatus.inProgress);

  String get scheduledPickupLabel {
    final dt = scheduledPickupAt;
    if (dt == null) return '';
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final pickedDay = DateTime(dt.year, dt.month, dt.day);
    final dayLabel = pickedDay == today
        ? 'Hôm nay'
        : pickedDay == today.add(const Duration(days: 1))
            ? 'Ngày mai'
            : '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year}';
    final h = dt.hour.toString().padLeft(2, '0');
    final m = dt.minute.toString().padLeft(2, '0');
    return '$dayLabel · $h:$m';
  }

  int? get minutesUntilPickup {
    final at = scheduledPickupAt;
    if (at == null) return null;
    final diff = at.difference(DateTime.now()).inMinutes;
    return diff > 0 ? diff : null;
  }

  String get packageDisplay => switch (packageLabel) {
        ServicePackageLabel.economy => 'Gói Economy',
        ServicePackageLabel.standard => 'Gói Standard',
        ServicePackageLabel.premium => 'Gói Premium',
      };

  /// Tiêu đề danh sách Hoạt động — ưu tiên tuyến đường thay vì tên gói.
  String get activityRouteTitle {
    final from = _shortAddress(pickupAddress);
    final dest = deliveryAddress.trim();
    final to = dest.isEmpty || dest == 'Chưa nhập điểm đến' ? '' : _shortAddress(deliveryAddress);
    if (from.isNotEmpty && to.isNotEmpty) return '$from → $to';
    if (from.isNotEmpty) return 'Từ $from';
    if (to.isNotEmpty) return 'Đến $to';
    return '#$orderNumber';
  }

  String get activityMetaLine {
    final parts = <String>['#$orderNumber', packageDisplay];
    if (scheduledPickupAt != null && status.isActive) {
      parts.add('Lấy $scheduledPickupLabel');
    }
    final provider = providerName?.trim();
    if (provider != null && provider.isNotEmpty) parts.add(provider);
    return parts.join(' · ');
  }

  static String _shortAddress(String address, {int maxLen = 26}) {
    var s = address.trim();
    if (s.isEmpty) return '';
    final comma = s.indexOf(',');
    if (comma > 0 && comma <= maxLen + 10) {
      s = s.substring(0, comma).trim();
    }
    if (s.length <= maxLen) return s;
    return '${s.substring(0, maxLen)}…';
  }

  String get formattedPrice {
    final s = totalPrice.toString();
    final buf = StringBuffer();
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buf.write('.');
      buf.write(s[i]);
    }
    return '${buf}đ';
  }
}

class TrackingStep {
  const TrackingStep({
    required this.key,
    required this.label,
    required this.done,
    required this.active,
  });

  final String key;
  final String label;
  final bool done;
  final bool active;
}

class TrackingSnapshot {
  const TrackingSnapshot({
    required this.order,
    required this.steps,
    required this.etaMinutes,
    required this.distanceKm,
    required this.driverLat,
    required this.driverLng,
    required this.statusLabel,
    required this.isAwaitingScheduledPickup,
  });

  final CustomerOrder order;
  final List<TrackingStep> steps;
  final int etaMinutes;
  final double distanceKm;
  final double driverLat;
  final double driverLng;
  final String statusLabel;
  final bool isAwaitingScheduledPickup;

  /// Backend chưa có API GPS — chỉ hiển thị timeline trạng thái.
  bool get showLiveTracking => false;
}
