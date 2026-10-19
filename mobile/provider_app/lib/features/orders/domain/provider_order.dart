/// Điểm lấy / giao — khớp cột `pickup_*` / `delivery_*` bảng `orders`.
class OrderLocationPoint {
  const OrderLocationPoint({
    required this.address,
    required this.city,
    required this.district,
    this.ward,
    this.floor = 1,
    this.hasElevator = false,
    required this.contactName,
    required this.contactPhone,
    this.notes,
  });

  factory OrderLocationPoint.fromJson(Map<String, dynamic> json, {required String prefix}) {
    final p = prefix;
    return OrderLocationPoint(
      address: json['${p}address'] as String? ?? '',
      city: json['${p}city'] as String? ?? '',
      district: json['${p}district'] as String? ?? '',
      ward: json['${p}ward'] as String?,
      floor: (json['${p}floor'] as num?)?.toInt() ?? 1,
      hasElevator: json['${p}has_elevator'] as bool? ?? false,
      contactName: json['${p}contact_name'] as String? ?? '',
      contactPhone: json['${p}contact_phone'] as String? ?? '',
      notes: json['${p}notes'] as String?,
    );
  }

  final String address;
  final String city;
  final String district;
  final String? ward;
  final int floor;
  final bool hasElevator;
  final String contactName;
  final String contactPhone;
  final String? notes;

  String get districtLine {
    final parts = <String>[
      if (ward != null && ward!.isNotEmpty) ward!,
      district,
      city,
    ];
    return parts.join(', ');
  }
}

/// Giá — khớp `base_price`, `distance_price`, … bảng `orders`.
class OrderPriceBreakdown {
  const OrderPriceBreakdown({
    required this.basePrice,
    required this.distancePrice,
    required this.floorPrice,
    required this.serviceFee,
    required this.discountAmount,
    required this.totalPrice,
  });

  factory OrderPriceBreakdown.fromJson(Map<String, dynamic> json) {
    int n(String k) => ((json[k] as num?) ?? 0).round();
    return OrderPriceBreakdown(
      basePrice: n('base_price'),
      distancePrice: n('distance_price'),
      floorPrice: n('floor_price'),
      serviceFee: n('service_fee'),
      discountAmount: n('discount_amount'),
      totalPrice: n('total_price'),
    );
  }

  final int basePrice;
  final int distancePrice;
  final int floorPrice;
  final int serviceFee;
  final int discountAmount;
  final int totalPrice;
}

/// Một món trong `items` JSONB.
class OrderLineItem {
  const OrderLineItem({
    required this.name,
    this.qty = 1,
    this.weightKg,
    this.fragile = false,
  });

  factory OrderLineItem.fromJson(Map<String, dynamic> json) {
    return OrderLineItem(
      name: json['name'] as String? ?? 'Món đồ',
      qty: (json['qty'] as num?)?.toInt() ?? 1,
      weightKg: (json['weight_kg'] as num?)?.toDouble(),
      fragile: json['fragile'] as bool? ?? false,
    );
  }

  final String name;
  final int qty;
  final double? weightKg;
  final bool fragile;
}

class ProviderOrder {
  const ProviderOrder({
    required this.id,
    required this.status,
    required this.pickupAddress,
    required this.deliveryAddress,
    required this.totalPrice,
    this.orderNumber,
    this.serviceType,
    this.vehicleSize,
    this.customerId,
    this.createdAt,
    this.distanceKm,
    this.etaMinutes,
    this.itemSummary,
    this.pickup,
    this.delivery,
    this.pricing,
    this.items = const [],
    this.itemsDescription,
    this.estimatedWeightKg,
    this.hasFragileItems = false,
    this.requiresHelpers = false,
    this.numberOfHelpers = 0,
    this.hasInsurance = false,
    this.insuranceValue,
    this.hasPackingService = false,
    this.scheduledPickupTime,
    this.actualPickupTime,
    this.actualDeliveryTime,
    this.completedAt,
    this.cancellationReason,
    this.cancelledAt,
    this.quoteRequest = false,
    this.providerId,
    this.depositPaid = false,
    this.depositAmount = 0,
    this.remainingAmount = 0,
  });

  factory ProviderOrder.fromJson(Map<String, dynamic> json) {
    final itemsRaw = json['items'];
    final items = itemsRaw is List
        ? itemsRaw
            .whereType<Map>()
            .map((e) => OrderLineItem.fromJson(Map<String, dynamic>.from(e)))
            .toList()
        : <OrderLineItem>[];

    OrderLocationPoint? pickup;
    OrderLocationPoint? delivery;
    if (json['pickup_city'] != null || json['pickup_contact_name'] != null) {
      pickup = OrderLocationPoint.fromJson(json, prefix: 'pickup_');
    }
    if (json['delivery_city'] != null || json['delivery_contact_name'] != null) {
      delivery = OrderLocationPoint.fromJson(json, prefix: 'delivery_');
    }

    return ProviderOrder(
      id: json['id'] as String,
      status: json['status'] as String? ?? 'pending',
      pickupAddress: json['pickup_address'] as String? ?? '',
      deliveryAddress: json['delivery_address'] as String? ?? '',
      totalPrice: ((json['total_price'] as num?) ?? 0).round(),
      orderNumber: json['order_number'] as String?,
      serviceType: json['service_type'] as String?,
      vehicleSize: json['vehicle_size'] as String?,
      customerId: json['customer_id'] as String?,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'] as String)
          : null,
      distanceKm: (json['estimated_distance'] as num?)?.toDouble() ??
          (json['distance_km'] as num?)?.toDouble(),
      etaMinutes: (json['eta_minutes'] as num?)?.toInt(),
      itemSummary: json['items_description'] as String? ?? json['item_summary'] as String?,
      pickup: pickup,
      delivery: delivery,
      pricing: json['base_price'] != null ? OrderPriceBreakdown.fromJson(json) : null,
      items: items,
      itemsDescription: json['items_description'] as String?,
      estimatedWeightKg: (json['estimated_weight'] as num?)?.toDouble(),
      hasFragileItems: json['has_fragile_items'] as bool? ?? false,
      requiresHelpers: json['requires_helpers'] as bool? ?? false,
      numberOfHelpers: (json['number_of_helpers'] as num?)?.toInt() ?? 0,
      hasInsurance: json['has_insurance'] as bool? ?? false,
      insuranceValue: (json['insurance_value'] as num?)?.toInt(),
      hasPackingService: json['has_packing_service'] as bool? ?? false,
      scheduledPickupTime: json['scheduled_pickup_time'] != null
          ? DateTime.tryParse(json['scheduled_pickup_time'] as String)
          : null,
      actualPickupTime: json['actual_pickup_time'] != null
          ? DateTime.tryParse(json['actual_pickup_time'] as String)
          : null,
      actualDeliveryTime: json['actual_delivery_time'] != null
          ? DateTime.tryParse(json['actual_delivery_time'] as String)
          : null,
      completedAt: json['completed_at'] != null
          ? DateTime.tryParse(json['completed_at'] as String)
          : null,
      cancellationReason: json['cancellation_reason'] as String?,
      cancelledAt: json['cancelled_at'] != null
          ? DateTime.tryParse(json['cancelled_at'] as String)
          : null,
      quoteRequest: json['quote_request'] as bool? ?? false,
      providerId: json['provider_id'] as String?,
      depositPaid: json['deposit_paid'] as bool? ?? false,
      depositAmount: ((json['deposit_amount'] as num?) ?? 0).round(),
      remainingAmount: ((json['remaining_amount'] as num?) ?? 0).round(),
    );
  }

  final String id;
  final String status;
  final String pickupAddress;
  final String deliveryAddress;
  final int totalPrice;
  final String? orderNumber;
  final String? serviceType;
  final String? vehicleSize;
  final String? customerId;
  final DateTime? createdAt;
  final double? distanceKm;
  final int? etaMinutes;
  final String? itemSummary;

  final OrderLocationPoint? pickup;
  final OrderLocationPoint? delivery;
  final OrderPriceBreakdown? pricing;
  final List<OrderLineItem> items;
  final String? itemsDescription;
  final double? estimatedWeightKg;
  final bool hasFragileItems;
  final bool requiresHelpers;
  final int numberOfHelpers;
  final bool hasInsurance;
  final int? insuranceValue;
  final bool hasPackingService;
  final DateTime? scheduledPickupTime;
  final DateTime? actualPickupTime;
  final DateTime? actualDeliveryTime;
  final DateTime? completedAt;
  final String? cancellationReason;
  final DateTime? cancelledAt;
  final bool quoteRequest;
  final String? providerId;
  final bool depositPaid;
  final int depositAmount;
  final int remainingAmount;

  bool isAssignedTo(String? providerUserId) =>
      providerUserId != null && providerId != null && providerId == providerUserId;

  /// Yêu cầu báo giá còn mở — chưa có nhà xe được chốt.
  bool get isOpenQuoteRequest => quoteRequest && status == 'pending' && providerId == null;

  bool isAwaitingDeposit(String? providerUserId) =>
      isAssignedTo(providerUserId) && status == 'matched' && !depositPaid;

  bool isDepositConfirmed(String? providerUserId) =>
      isAssignedTo(providerUserId) && depositPaid && (status == 'matched' || status == 'accepted');

  bool isReadyToAccept(String? providerUserId) =>
      isDepositConfirmed(providerUserId) && status == 'matched';

  String? get quoteReferenceCode {
    final notes = pickupPoint.notes;
    if (notes == null || notes.isEmpty) return null;
    final match = RegExp(r'Mã báo giá:\s*(\S+)').firstMatch(notes);
    return match?.group(1);
  }

  OrderLocationPoint get pickupPoint =>
      pickup ??
      OrderLocationPoint(
        address: pickupAddress,
        city: '',
        district: '',
        contactName: '',
        contactPhone: '',
      );

  OrderLocationPoint get deliveryPoint =>
      delivery ??
      OrderLocationPoint(
        address: deliveryAddress,
        city: '',
        district: '',
        contactName: '',
        contactPhone: '',
      );

  OrderPriceBreakdown get priceBreakdown =>
      pricing ??
      OrderPriceBreakdown(
        basePrice: totalPrice,
        distancePrice: 0,
        floorPrice: 0,
        serviceFee: 0,
        discountAmount: 0,
        totalPrice: totalPrice,
      );

  ProviderOrder copyWith({String? status}) {
    return ProviderOrder(
      id: id,
      status: status ?? this.status,
      pickupAddress: pickupAddress,
      deliveryAddress: deliveryAddress,
      totalPrice: totalPrice,
      orderNumber: orderNumber,
      serviceType: serviceType,
      vehicleSize: vehicleSize,
      customerId: customerId,
      createdAt: createdAt,
      distanceKm: distanceKm,
      etaMinutes: etaMinutes,
      itemSummary: itemSummary,
      pickup: pickup,
      delivery: delivery,
      pricing: pricing,
      items: items,
      itemsDescription: itemsDescription,
      estimatedWeightKg: estimatedWeightKg,
      hasFragileItems: hasFragileItems,
      requiresHelpers: requiresHelpers,
      numberOfHelpers: numberOfHelpers,
      hasInsurance: hasInsurance,
      insuranceValue: insuranceValue,
      hasPackingService: hasPackingService,
      scheduledPickupTime: scheduledPickupTime,
      actualPickupTime: actualPickupTime,
      actualDeliveryTime: actualDeliveryTime,
      completedAt: completedAt,
      cancellationReason: cancellationReason,
      cancelledAt: cancelledAt,
      quoteRequest: quoteRequest,
      providerId: providerId,
      depositPaid: depositPaid,
      depositAmount: depositAmount,
      remainingAmount: remainingAmount,
    );
  }

  bool get isPending => status == 'pending' || status == 'matched';
  bool get isMatched => status == 'matched';
  bool get isActive =>
      status == 'accepted' || status == 'picking_up' || status == 'in_progress';
  bool get isCompleted => status == 'completed';
  bool get isCancelled => status == 'cancelled' || status == 'declined';

  /// Chỉ nhắn tin khi đơn chưa kết thúc (chờ nhận / đang thực hiện).
  bool get canSendChat => isPending || isActive;

  bool get isChatReadOnly => !canSendChat;

  /// Thu nhập thực nhận sau phí nền tảng (~15%).
  int get netEarnings => (totalPrice * 0.85).round();

  bool get appearsInEarningsHistory => !isPending;

  bool matchesTripHistoryFilter(TripHistoryFilter filter) {
    return switch (filter) {
      TripHistoryFilter.all => appearsInEarningsHistory,
      TripHistoryFilter.completed => isCompleted,
      TripHistoryFilter.active => isActive,
      TripHistoryFilter.cancelled => isCancelled,
    };
  }

  String get serviceLabel => switch (serviceType) {
        'premium' => 'Cao cấp',
        'express' => 'Nhanh',
        'standard' => 'Tiêu chuẩn',
        _ => 'Tiêu chuẩn',
      };

  String get vehicleLabel => switch (vehicleSize) {
        'motorbike' => 'Xe máy (< 50kg)',
        'small_truck' => 'Xe tải nhỏ (~500kg)',
        'medium_truck' => 'Xe tải vừa (~1 tấn)',
        'large_truck' => 'Xe tải lớn (~1.5 tấn)',
        _ => 'Xe tải',
      };

  String statusLabelFor(String? providerUserId) {
    if (isDepositConfirmed(providerUserId) && status == 'matched') return 'Đã đặt cọc';
    if (isAwaitingDeposit(providerUserId)) return 'Chờ khách cọc';
    if (isAssignedTo(providerUserId) && status == 'accepted') return 'Đã nhận';
    if (isOpenQuoteRequest) return 'Yêu cầu báo giá';
    return statusLabel;
  }

  String get statusLabel => switch (status) {
        'pending' => 'Chờ nhận',
        'matched' => 'Khách đã chốt',
        'accepted' => 'Đã nhận',
        'declined' => 'Đã từ chối',
        'picking_up' => 'Đang lấy hàng',
        'in_progress' => 'Đang chuyển',
        'completed' => 'Hoàn thành',
        'cancelled' => 'Đã hủy',
        'disputed' => 'Tranh chấp',
        _ => status,
      };

  static String formatMoney(int amount) {
    final s = amount.toString();
    final buf = StringBuffer();
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buf.write('.');
      buf.write(s[i]);
    }
    return '${buf}đ';
  }

  static String formatDateTime(DateTime? dt) {
    if (dt == null) return '—';
    final d = dt.toLocal();
    final h = d.hour.toString().padLeft(2, '0');
    final m = d.minute.toString().padLeft(2, '0');
    return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year} · $h:$m';
  }

  static String timeAgo(DateTime? dt) {
    if (dt == null) return '';
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 60) return '${diff.inMinutes} phút trước';
    if (diff.inHours < 24) return '${diff.inHours} giờ trước';
    return '${diff.inDays} ngày trước';
  }
}

/// Tab trạng thái đơn — tab Đơn hàng (provider).
enum OrderInboxFilter {
  ready('Sẵn sàng', 'Đã cọc — nhận đơn'),
  quoteNew('Báo giá', 'Yêu cầu mới'),
  awaitingDeposit('Chờ cọc', 'Khách đã chốt bạn'),
  active('Đang chạy', 'Đang thực hiện'),
  completed('Hoàn thành', 'Đã giao xong'),
  cancelled('Đã hủy', 'Huỷ / từ chối');

  const OrderInboxFilter(this.label, this.hint);
  final String label;
  final String hint;

  String get id => name;

  bool matches(ProviderOrder o, String? myId) => switch (this) {
        OrderInboxFilter.ready => o.isReadyToAccept(myId),
        OrderInboxFilter.quoteNew => o.isOpenQuoteRequest,
        OrderInboxFilter.awaitingDeposit => o.isAwaitingDeposit(myId),
        OrderInboxFilter.active => o.isActive,
        OrderInboxFilter.completed => o.isCompleted,
        OrderInboxFilter.cancelled => o.isCancelled,
      };

  /// Tab ưu tiên khi mở màn Đơn hàng (đơn cần xử lý trước).
  static OrderInboxFilter defaultFor(List<ProviderOrder> orders, String? myId) {
    for (final f in [ready, quoteNew, awaitingDeposit, active]) {
      if (orders.any((o) => f.matches(o, myId))) return f;
    }
    return quoteNew;
  }
}

/// Lọc lịch sử chuyến trên màn thu nhập.
enum TripHistoryFilter {
  all('Tất cả'),
  completed('Hoàn thành'),
  active('Đang làm'),
  cancelled('Huỷ / Từ chối');

  const TripHistoryFilter(this.label);
  final String label;
}
