import '../domain/order_models.dart';

abstract final class OrderApiMapper {
  static CustomerOrder fromJson(Map<String, dynamic> json) {
    final serviceType = json['service_type'] as String? ?? 'standard';
    final vehicleSize = json['vehicle_size'] as String? ?? 'medium_truck';
    final total = ((json['total_price'] as num?) ?? 0).round();

    return CustomerOrder(
      id: json['id'] as String,
      orderNumber: json['order_number'] as String? ?? '',
      customerId: json['customer_id'] as String? ?? '',
      providerId: json['provider_id'] as String?,
      status: OrderStatus.fromDb(json['status'] as String? ?? 'pending'),
      packageLabel: _packageFromService(serviceType),
      vehicleLabel: _vehicleLabel(vehicleSize),
      pickupAddress: json['pickup_address'] as String? ?? '',
      deliveryAddress: json['delivery_address'] as String? ?? '',
      totalPrice: total,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : DateTime.now(),
      completedAt: json['completed_at'] != null
          ? DateTime.tryParse(json['completed_at'] as String)
          : null,
      cancelledAt: json['cancelled_at'] != null
          ? DateTime.tryParse(json['cancelled_at'] as String)
          : null,
      cancellationNote: json['cancellation_reason'] as String?,
      estimatedDistanceKm: (json['estimated_distance'] as num?)?.toDouble(),
      providerName: json['provider_name'] as String?,
      providerAvatarUrl: json['provider_avatar_url'] as String?,
      providerRating: (json['provider_rating'] as num?)?.toDouble(),
      providerPlate: json['provider_plate'] as String?,
      conversationId: null,
      scheduledPickupAt: json['scheduled_pickup_time'] != null
          ? DateTime.tryParse(json['scheduled_pickup_time'] as String)
          : null,
      depositPaid: json['deposit_paid'] as bool? ?? false,
      quoteRequest: json['quote_request'] as bool? ?? false,
    );
  }

  static ServicePackageLabel _packageFromService(String serviceType) {
    return switch (serviceType) {
      'premium' => ServicePackageLabel.premium,
      'express' => ServicePackageLabel.standard,
      _ => ServicePackageLabel.economy,
    };
  }

  static String _vehicleLabel(String vehicleSize) {
    return switch (vehicleSize) {
      'motorbike' => 'Xe máy',
      'small_truck' => 'Xe tải nhỏ',
      'large_truck' => 'Xe tải lớn',
      _ => 'Xe tải trung',
    };
  }

  static TrackingSnapshot trackingFromOrder(CustomerOrder order) {
    final awaiting = order.isAwaitingScheduledPickup;
    final steps = _stepsForStatus(
      order.status,
      scheduled: order.scheduledPickupAt != null,
      depositPaid: order.depositPaid,
    );
    final activeIndex = steps.indexWhere((s) => s.active);
    final eta = awaiting ? 0 : (order.etaMinutes ?? (order.showLiveTracking ? 25 : 0));

    String statusLabel;
    if (order.awaitingProviderAccept) {
      statusLabel = 'Chờ nhà xe xác nhận';
    } else if (awaiting) {
      statusLabel = 'Chờ đến giờ lấy đồ';
    } else if (order.providerTripConfirmed) {
      statusLabel = 'Nhà xe đã nhận đơn';
    } else {
      statusLabel = steps[activeIndex >= 0 ? activeIndex : 0].label;
    }

    return TrackingSnapshot(
      order: order,
      steps: steps,
      etaMinutes: eta,
      distanceKm: awaiting ? 0 : (order.estimatedDistanceKm ?? 5.2),
      driverLat: 10.762622,
      driverLng: 106.660172,
      statusLabel: statusLabel,
      isAwaitingScheduledPickup: awaiting,
    );
  }

  static List<TrackingStep> _stepsForStatus(
    OrderStatus status, {
    bool scheduled = false,
    bool depositPaid = false,
  }) {
    final labels = scheduled
        ? [
            ('pending', 'Đã đặt lịch'),
            ('accepted', 'Nhà xe xác nhận'),
            ('picking_up', 'Đến giờ lấy đồ'),
            ('in_progress', 'Đang vận chuyển'),
            ('completed', 'Hoàn thành'),
          ]
        : [
            ('pending', 'Đã đặt đơn'),
            ('accepted', 'Nhà xe nhận'),
            ('picking_up', 'Đang lấy hàng'),
            ('in_progress', 'Đang vận chuyển'),
            ('completed', 'Hoàn thành'),
          ];

    // Sau khi nhà xe nhận đơn (accepted), bước «Nhà xe xác nhận» đã xong —
    // active chuyển sang bước lấy hàng / chờ giờ hẹn.
    final currentIndex = switch (status) {
      OrderStatus.pending => 0,
      OrderStatus.matched => depositPaid ? 1 : 0,
      OrderStatus.accepted => 2,
      OrderStatus.pickingUp => 2,
      OrderStatus.inProgress => 3,
      OrderStatus.completed => 4,
      _ => 0,
    };

    return labels.asMap().entries.map((entry) {
      final i = entry.key;
      final e = entry.value;
      final done = status == OrderStatus.completed || i < currentIndex;
      final active = status != OrderStatus.completed && i == currentIndex && status.isActive;

      var label = e.$2;
      var key = e.$1;
      if (status == OrderStatus.matched && i == 1) {
        if (depositPaid) {
          label = 'Chờ nhà xe xác nhận';
          key = 'awaiting_provider';
        } else {
          label = 'Chờ đặt cọc';
          key = 'awaiting_deposit';
        }
      }

      return TrackingStep(key: key, label: label, done: done, active: active);
    }).toList();
  }
}
