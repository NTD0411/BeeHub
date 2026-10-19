import '../../features/orders/domain/provider_order.dart';
import '../../features/tracking/domain/provider_tracking_models.dart';

abstract final class MockOrderTracking {
  static ProviderLiveTracking snapshotFor(ProviderOrder order, {double? routeProgressOverride}) {
    final progress = routeProgressOverride ?? _defaultProgress(order.status);
    final (eta, dist, target) = _etaBundle(order.status, progress);

    return ProviderLiveTracking(
      order: order,
      steps: _stepsFor(order.status),
      phaseTitle: _phaseTitle(order.status),
      phaseSubtitle: 'Khách đang thấy vị trí của bạn trên bản đồ (demo)',
      etaMinutes: eta,
      distanceKm: dist,
      routeProgress: progress.clamp(0.0, 1.0),
      isSharingLocation: order.canSendChat,
      targetLabel: target,
      nextActionLabel: _nextAction(order.status),
      nextStatus: _nextStatus(order.status),
    );
  }

  static List<TrackingStepItem> _stepsFor(String status) {
    const keys = [
      ('accepted', 'Đã nhận đơn'),
      ('picking_up', 'Đến điểm lấy'),
      ('picked', 'Đã lấy hàng'),
      ('in_progress', 'Đang giao'),
      ('completed', 'Hoàn thành'),
    ];
    final order = ['accepted', 'picking_up', 'picked', 'in_progress', 'completed'];
    final idx = switch (status) {
      'accepted' => 0,
      'picking_up' => 1,
      'in_progress' => 3,
      'completed' => 4,
      _ => 0,
    };

    return keys.map((e) {
      final i = order.indexOf(e.$1);
      final done = i < idx || status == 'completed';
      final active = i == idx || (status == 'in_progress' && e.$1 == 'in_progress');
      return TrackingStepItem(key: e.$1, label: e.$2, done: done, active: active);
    }).toList();
  }

  static double _defaultProgress(String status) => switch (status) {
        'accepted' => 0.12,
        'picking_up' => 0.38,
        'in_progress' => 0.72,
        'completed' => 1.0,
        _ => 0.2,
      };

  static (int eta, double dist, String target) _etaBundle(String status, double progress) {
    final dist = (8.0 * (1 - progress)).clamp(0.3, 8.0);
    final eta = (dist * 3.5).round().clamp(2, 25);
    final target = switch (status) {
      'accepted' || 'picking_up' => 'điểm lấy hàng',
      'in_progress' => 'điểm giao hàng',
      _ => 'đích đến',
    };
    return (eta, double.parse(dist.toStringAsFixed(1)), target);
  }

  static String _phaseTitle(String status) => switch (status) {
        'accepted' => 'Chuẩn bị đến điểm lấy',
        'picking_up' => 'Đang di chuyển tới điểm lấy',
        'in_progress' => 'Đang mang hàng tới điểm giao',
        _ => 'Theo dõi hành trình',
      };

  static String? _nextAction(String status) => switch (status) {
        'accepted' => 'Bắt đầu đi lấy hàng',
        'picking_up' => 'Đã lấy hàng · Bắt đầu giao',
        'in_progress' => 'Đã giao xong',
        _ => null,
      };

  static String? _nextStatus(String status) => switch (status) {
        'accepted' => 'picking_up',
        'picking_up' => 'in_progress',
        'in_progress' => 'completed',
        _ => null,
      };
}
