import 'booking_models.dart';

/// Trạng thái yêu cầu báo giá trên app.
enum QuoteProgressStatus {
  waitingQuotes,
  quotesReady,
  providerConfirmed,
  scheduled,
  providerAccepted,
  depositPaid,
  inProgress,
  completed;

  String get label => switch (this) {
        QuoteProgressStatus.waitingQuotes => 'Chờ báo giá',
        QuoteProgressStatus.quotesReady => 'Có báo giá',
        QuoteProgressStatus.providerConfirmed => 'Chốt nhà xe',
        QuoteProgressStatus.scheduled => 'Chờ xác nhận',
        QuoteProgressStatus.providerAccepted => 'Đã hẹn lịch',
        QuoteProgressStatus.depositPaid => 'Đã đặt cọc',
        QuoteProgressStatus.inProgress => 'Ngày chuyển',
        QuoteProgressStatus.completed => 'Hoàn thành',
      };

  bool get canCompareQuotes =>
      this == QuoteProgressStatus.quotesReady || this == QuoteProgressStatus.providerConfirmed;

  bool get allowsInAppChat =>
      this == QuoteProgressStatus.providerAccepted ||
      this == QuoteProgressStatus.depositPaid ||
      this == QuoteProgressStatus.inProgress;

  bool get isBookedTrip =>
      this == QuoteProgressStatus.scheduled ||
      this == QuoteProgressStatus.providerAccepted ||
      this == QuoteProgressStatus.depositPaid ||
      this == QuoteProgressStatus.inProgress ||
      this == QuoteProgressStatus.completed;
}

/// Bước timeline user-facing (gọn, phù hợp lịch hẹn).
class QuoteTimelineStep {
  const QuoteTimelineStep(this.key, this.label);
  final String key;
  final String label;
}

const quoteTimelineSteps = [
  QuoteTimelineStep('request', 'Gửi yêu cầu'),
  QuoteTimelineStep('quotes', 'Có báo giá'),
  QuoteTimelineStep('partner', 'Chốt nhà xe'),
  QuoteTimelineStep('booked', 'Đã hẹn lịch'),
  QuoteTimelineStep('deposit', 'Đặt cọc'),
  QuoteTimelineStep('moving', 'Ngày chuyển'),
  QuoteTimelineStep('done', 'Hoàn thành'),
];

int quoteTimelineIndex(QuoteProgressStatus status) => switch (status) {
      QuoteProgressStatus.waitingQuotes => 0,
      QuoteProgressStatus.quotesReady => 1,
      QuoteProgressStatus.providerConfirmed => 2,
      QuoteProgressStatus.scheduled => 3,
      QuoteProgressStatus.providerAccepted => 3,
      QuoteProgressStatus.depositPaid => 4,
      QuoteProgressStatus.inProgress => 5,
      QuoteProgressStatus.completed => 6,
    };

class QuoteSurchargeLine {
  const QuoteSurchargeLine({required this.label, required this.amount});

  final String label;
  final int amount;
}

/// Mức độ nhà xe có thể nhận giờ khách yêu cầu.
enum QuoteScheduleFit {
  exactMatch,
  alternateProposed,
  unavailable;

  String get label => switch (this) {
        QuoteScheduleFit.exactMatch => 'Nhận đúng giờ bạn chọn',
        QuoteScheduleFit.alternateProposed => 'Đề xuất giờ khác',
        QuoteScheduleFit.unavailable => 'Không nhận khung giờ này',
      };
}

/// Báo giá từ một nhà xe / provider.
class ProviderQuoteResponse {
  const ProviderQuoteResponse({
    required this.id,
    required this.providerId,
    required this.providerName,
    required this.rating,
    required this.reviewCount,
    required this.completedTrips,
    required this.vehicleLabel,
    required this.distanceKm,
    required this.imageUrl,
    required this.basePrice,
    required this.surcharges,
    this.recentReviews = const [],
    this.note = '',
    this.scheduleFit = QuoteScheduleFit.exactMatch,
    this.proposedPickupAt,
    this.proposedPickupLabel,
  });

  final String id;
  final String providerId;
  final String providerName;
  final double rating;
  final int reviewCount;
  final int completedTrips;
  final String vehicleLabel;
  final double distanceKm;
  final String imageUrl;
  final int basePrice;
  final List<QuoteSurchargeLine> surcharges;
  final List<ProviderReview> recentReviews;
  final String note;
  final QuoteScheduleFit scheduleFit;
  final DateTime? proposedPickupAt;
  final String? proposedPickupLabel;

  bool get canConfirmSchedule => scheduleFit != QuoteScheduleFit.unavailable;

  int get surchargeTotal => surcharges.fold(0, (sum, s) => sum + s.amount);

  int get totalPrice => basePrice + surchargeTotal;
}

/// Khung giờ nhà xe còn trống.
class MoveTimeSlot {
  const MoveTimeSlot({
    required this.id,
    required this.start,
    required this.end,
    required this.available,
  });

  final String id;
  final DateTime start;
  final DateTime end;
  final bool available;

  String get label {
    String two(int n) => n.toString().padLeft(2, '0');
    return '${two(start.hour)}:${two(start.minute)} – ${two(end.hour)}:${two(end.minute)}';
  }
}

/// Lịch trống theo ngày của một nhà xe.
class MoveDayAvailability {
  const MoveDayAvailability({required this.date, required this.slots});

  final DateTime date;
  final List<MoveTimeSlot> slots;

  bool get hasAvailable => slots.any((s) => s.available);
}

class QuoteRequestSnapshot {
  const QuoteRequestSnapshot({
    required this.id,
    required this.status,
    required this.pickup,
    required this.destination,
    required this.createdAt,
    this.quotes = const [],
    this.confirmedQuoteId,
    this.orderId,
    this.conversationId,
    this.imageUrls = const [],
    this.dormNote = '',
    this.wantsTransportLabor = false,
    this.transportLaborHelpers = 2,
    this.transportLaborHours = 2,
    this.requestedPickupAt,
    this.requestedPickupLabel,
    this.scheduledPickupAt,
    this.scheduledSlotLabel,
    this.depositPaidAt,
    this.providerTripConfirmed = false,
  });

  final String id;
  final QuoteProgressStatus status;
  final String pickup;
  final String destination;
  final DateTime createdAt;
  final List<ProviderQuoteResponse> quotes;
  final String? confirmedQuoteId;
  final String? orderId;
  final String? conversationId;
  final List<String> imageUrls;
  final String dormNote;
  final bool wantsTransportLabor;
  final int transportLaborHelpers;
  final int transportLaborHours;

  String? get transportLaborLabel => wantsTransportLabor
      ? '$transportLaborHelpers người · $transportLaborHours giờ'
      : null;

  /// Giờ mong muốn khách chọn trước khi gửi báo giá.
  final DateTime? requestedPickupAt;
  final String? requestedPickupLabel;

  /// Giờ đã được nhà xe xác nhận (có thể trùng requested hoặc giờ đề xuất).
  final DateTime? scheduledPickupAt;
  final String? scheduledSlotLabel;
  final DateTime? depositPaidAt;

  /// Nhà xe đã nhận đơn trên app (sau khi khách đặt cọc).
  final bool providerTripConfirmed;

  bool get hasRequestedPickup => requestedPickupAt != null;

  bool get hasScheduledMove => scheduledPickupAt != null;

  bool get pendingAlternateSchedule =>
      status == QuoteProgressStatus.providerConfirmed &&
      confirmedQuote?.scheduleFit == QuoteScheduleFit.alternateProposed &&
      scheduledPickupAt == null;

  bool get isMoveDay {
    final at = scheduledPickupAt;
    if (at == null) return false;
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final moveDay = DateTime(at.year, at.month, at.day);
    return !today.isBefore(moveDay) && (status == QuoteProgressStatus.depositPaid || status == QuoteProgressStatus.inProgress);
  }

  String? get daysUntilMoveLabel {
    final at = scheduledPickupAt;
    if (at == null) return null;
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final moveDay = DateTime(at.year, at.month, at.day);
    final days = moveDay.difference(today).inDays;
    return switch (days) {
      < 0 => 'Đã qua ngày hẹn',
      0 => 'Hôm nay là ngày chuyển',
      1 => 'Còn 1 ngày nữa',
      _ => 'Còn $days ngày nữa',
    };
  }

  ProviderQuoteResponse? get confirmedQuote {
    if (confirmedQuoteId == null) return null;
    for (final q in quotes) {
      if (q.id == confirmedQuoteId) return q;
    }
    return null;
  }

  QuoteRequestSnapshot copyWith({
    QuoteProgressStatus? status,
    List<ProviderQuoteResponse>? quotes,
    String? confirmedQuoteId,
    String? orderId,
    String? conversationId,
    DateTime? requestedPickupAt,
    String? requestedPickupLabel,
    DateTime? scheduledPickupAt,
    String? scheduledSlotLabel,
    DateTime? depositPaidAt,
    bool? providerTripConfirmed,
    bool? wantsTransportLabor,
    int? transportLaborHelpers,
    int? transportLaborHours,
    bool clearConfirmedQuote = false,
    bool clearScheduled = false,
  }) {
    return QuoteRequestSnapshot(
      id: id,
      status: status ?? this.status,
      pickup: pickup,
      destination: destination,
      createdAt: createdAt,
      quotes: quotes ?? this.quotes,
      confirmedQuoteId:
          clearConfirmedQuote ? null : (confirmedQuoteId ?? this.confirmedQuoteId),
      orderId: orderId ?? this.orderId,
      conversationId: conversationId ?? this.conversationId,
      imageUrls: imageUrls,
      dormNote: dormNote,
      wantsTransportLabor: wantsTransportLabor ?? this.wantsTransportLabor,
      transportLaborHelpers: transportLaborHelpers ?? this.transportLaborHelpers,
      transportLaborHours: transportLaborHours ?? this.transportLaborHours,
      requestedPickupAt: requestedPickupAt ?? this.requestedPickupAt,
      requestedPickupLabel: requestedPickupLabel ?? this.requestedPickupLabel,
      scheduledPickupAt:
          clearScheduled ? null : (scheduledPickupAt ?? this.scheduledPickupAt),
      scheduledSlotLabel:
          clearScheduled ? null : (scheduledSlotLabel ?? this.scheduledSlotLabel),
      depositPaidAt: depositPaidAt ?? this.depositPaidAt,
      providerTripConfirmed: providerTripConfirmed ?? this.providerTripConfirmed,
    );
  }
}

String formatQuotePickupLabel(DateTime dt) {
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
