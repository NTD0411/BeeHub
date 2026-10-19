import '../../notifications/domain/notification_models.dart';
import '../domain/quote_models.dart';

/// Thông báo local từ luồng chuyển trọ (mock — sau nối push notification).
class QuoteLocalNotifications {
  QuoteLocalNotifications._();

  static final List<AppNotification> _items = [];
  static final Map<String, TimerToken> _scheduled = {};

  static List<AppNotification> get all => List.unmodifiable(_items);

  static void scheduleMoveReminders(QuoteRequestSnapshot snap) {
    final pickup = snap.scheduledPickupAt;
    if (pickup == null) return;

    _items.insert(
      0,
      AppNotification(
        id: 'ql-deposit-${snap.id}',
        type: AppNotificationType.orderUpdate,
        title: 'Đã đặt cọc giữ chỗ',
        body:
            'Chuyến chuyển trọ ${snap.scheduledSlotLabel ?? ''} đã được giữ. '
            'Bạn sẽ được nhắc khi đến ngày chuyển.',
        createdAt: DateTime.now(),
        actionRoute: '/booking/quotes/${snap.id}/progress',
        icon: 'bell',
      ),
    );

    _cancelTimers(snap.id);

    final now = DateTime.now();
    final dayBefore = pickup.subtract(const Duration(days: 1));
    if (dayBefore.isAfter(now)) {
      _scheduled['${snap.id}-eve'] = TimerToken(
        Future.delayed(dayBefore.difference(now), () => _notifyEve(snap)),
      );
    }

    if (pickup.isAfter(now)) {
      _scheduled['${snap.id}-day'] = TimerToken(
        Future.delayed(pickup.difference(now), () => _notifyMoveDay(snap)),
      );
    } else {
      _notifyMoveDay(snap);
    }
  }

  static void _notifyEve(QuoteRequestSnapshot snap) {
    _items.insert(
      0,
      AppNotification(
        id: 'ql-eve-${snap.id}-${DateTime.now().millisecondsSinceEpoch}',
        type: AppNotificationType.orderUpdate,
        title: 'Ngày mai là ngày chuyển trọ',
        body:
            'Chuẩn bị đồ và xác nhận địa chỉ với ${snap.confirmedQuote?.providerName ?? 'nhà xe'} qua chat nhé.',
        createdAt: DateTime.now(),
        actionRoute: '/booking/quotes/${snap.id}/progress',
        icon: 'bell',
      ),
    );
  }

  static void _notifyMoveDay(QuoteRequestSnapshot snap) {
    _items.insert(
      0,
      AppNotification(
        id: 'ql-move-${snap.id}-${DateTime.now().millisecondsSinceEpoch}',
        type: AppNotificationType.orderUpdate,
        title: 'Đến giờ chuyển trọ!',
        body:
            'Tài xế ${snap.confirmedQuote?.providerName ?? ''} sẽ đến trong khung '
            '${snap.scheduledSlotLabel ?? ''}. Mở Hoạt động để theo dõi.',
        createdAt: DateTime.now(),
        actionRoute: '/booking/quotes/${snap.id}/progress',
        icon: 'bell',
      ),
    );
  }

  static void _cancelTimers(String referenceId) {
    _scheduled.remove('${referenceId}-eve');
    _scheduled.remove('${referenceId}-day');
  }
}

class TimerToken {
  TimerToken(this.future);
  final Future<void> future;
}
