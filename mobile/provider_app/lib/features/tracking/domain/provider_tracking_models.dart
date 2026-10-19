import '../../orders/domain/provider_order.dart';

/// Mốc hành trình — khớp `order_tracking_events` (demo UI).
enum TrackingEventType {
  accepted,
  enRoutePickup,
  arrivedPickup,
  pickedUp,
  inTransit,
  arrivedDelivery,
  completed,
}

class TrackingStepItem {
  const TrackingStepItem({
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

/// Snapshot tracking cho màn provider (mock, chưa backend).
class ProviderLiveTracking {
  const ProviderLiveTracking({
    required this.order,
    required this.steps,
    required this.phaseTitle,
    required this.phaseSubtitle,
    required this.etaMinutes,
    required this.distanceKm,
    required this.routeProgress,
    required this.isSharingLocation,
    required this.targetLabel,
    required this.nextActionLabel,
    required this.nextStatus,
  });

  final ProviderOrder order;
  final List<TrackingStepItem> steps;
  final String phaseTitle;
  final String phaseSubtitle;
  final int etaMinutes;
  final double distanceKm;
  /// 0.0 = gần điểm lấy, 1.0 = gần điểm giao (vị trí xe trên map demo).
  final double routeProgress;
  final bool isSharingLocation;
  final String targetLabel;
  final String? nextActionLabel;
  final String? nextStatus;

  String get statusHeadline => switch (order.status) {
        'accepted' => 'Sẵn sàng đi lấy hàng',
        'picking_up' => 'Đang đến điểm lấy',
        'in_progress' => 'Đang vận chuyển',
        _ => order.statusLabel,
      };
}
