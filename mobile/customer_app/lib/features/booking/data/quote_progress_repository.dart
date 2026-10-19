import '../../../core/auth/api_session_mode.dart';
import '../../../core/constants/app_images.dart';
import '../../orders/data/customer_orders_repository.dart';
import '../../orders/domain/order_models.dart';
import '../domain/booking_models.dart';
import '../domain/quote_models.dart';
import '../presentation/cubit/booking_flow_state.dart';
import 'booking_mock_repository.dart';
import 'order_quotes_repository.dart';
import 'quote_local_notifications.dart';
import 'quote_runtime_store.dart';

/// Lưu tiến trình báo giá — session thật đồng bộ từ API đơn hàng.
class QuoteProgressRepository {
  QuoteProgressRepository._({
    BookingMockRepository? partnersRepo,
    CustomerOrdersRepository? ordersRepo,
    OrderQuotesRepository? quotesRepo,
  })  : _partnersRepo = partnersRepo ?? BookingMockRepository(),
        _ordersRepo = ordersRepo ?? CustomerOrdersRepository(),
        _quotesRepo = quotesRepo ?? OrderQuotesRepository();

  static final QuoteProgressRepository instance = QuoteProgressRepository._();

  factory QuoteProgressRepository() => instance;

  final BookingMockRepository _partnersRepo;
  final CustomerOrdersRepository _ordersRepo;
  final OrderQuotesRepository _quotesRepo;
  static final Map<String, QuoteRequestSnapshot> _store = {};

  Future<bool> _useMockQuotes() => ApiSessionMode.useMockQuotes();

  Future<QuoteRequestSnapshot> createFromBooking({
    required String referenceId,
    required BookingFlowState state,
    List<String> imageUrls = const [],
    String? orderId,
  }) async {
    final requestedAt = state.scheduledPickupAt;
    final snapshot = QuoteRequestSnapshot(
      id: referenceId,
      status: QuoteProgressStatus.waitingQuotes,
      pickup: state.pickup,
      destination: state.destination,
      createdAt: DateTime.now(),
      imageUrls: imageUrls,
      dormNote: state.dormNote,
      wantsTransportLabor: state.wantsTransportLabor && !state.isComboBooking,
      transportLaborHelpers: state.transportLaborHelpers,
      transportLaborHours: state.transportLaborHours,
      requestedPickupAt: requestedAt,
      requestedPickupLabel:
          requestedAt != null ? formatQuotePickupLabel(requestedAt) : null,
      orderId: orderId,
    );
    _store[referenceId] = snapshot;

    if (orderId == null) {
      Future<void>.delayed(const Duration(seconds: 2), () => _populateQuotes(referenceId));
    }

    return snapshot;
  }

  QuoteRequestSnapshot? peek(String referenceId) => _store[referenceId];

  /// Các chuyến đã đặt — hiển thị tab Hoạt động.
  List<QuoteRequestSnapshot> listBookedTrips() {
    final list = _store.values.where((s) => s.status.isBookedTrip).toList();
    list.sort((a, b) {
      final at = a.scheduledPickupAt ?? a.createdAt;
      final bt = b.scheduledPickupAt ?? b.createdAt;
      return at.compareTo(bt);
    });
    return list;
  }

  Future<QuoteRequestSnapshot?> fetch(String referenceId) async {
    await Future<void>.delayed(const Duration(milliseconds: 200));
    final snap = _store[referenceId];
    if (snap == null) return null;

    if (snap.orderId != null && !await _useMockQuotes()) {
      await _syncFromApi(referenceId);
    } else if (snap.status == QuoteProgressStatus.waitingQuotes && snap.quotes.isEmpty) {
      await _populateQuotes(referenceId);
    }

    _ensureRuntimeChat(referenceId);
    await _tryAdvanceMoveDay(referenceId);

    return _store[referenceId];
  }

  Future<void> _syncFromApi(String referenceId) async {
    final snap = _store[referenceId];
    final orderId = snap?.orderId;
    if (snap == null || orderId == null) return;

    final order = await _ordersRepo.fetchById(orderId);
    if (order == null) return;

    var quotes = snap.quotes;
    try {
      final apiQuotes = await _quotesRepo.fetchQuotes(orderId);
      if (apiQuotes.isNotEmpty) quotes = apiQuotes;
    } catch (_) {}

    if (order.status == OrderStatus.pending) {
      var status = snap.status;
      if (quotes.isNotEmpty && status == QuoteProgressStatus.waitingQuotes) {
        status = QuoteProgressStatus.quotesReady;
      }
      _store[referenceId] = snap.copyWith(status: status, quotes: quotes);
      return;
    }

    if (order.status == OrderStatus.cancelled) {
      _store[referenceId] = snap.copyWith(
        status: QuoteProgressStatus.waitingQuotes,
        quotes: quotes,
        providerTripConfirmed: false,
      );
      return;
    }

    final providerId = order.providerId;
    if (providerId == null) return;

    ProviderQuoteResponse? confirmed;
    for (final q in quotes) {
      if (q.providerId == providerId) {
        confirmed = q;
        break;
      }
    }

    confirmed ??= ProviderQuoteResponse(
      id: snap.confirmedQuoteId ?? 'q-$providerId',
      providerId: providerId,
      providerName: order.providerName ?? 'Nhà xe đối tác',
      rating: order.providerRating ?? 4.5,
      reviewCount: 0,
      completedTrips: 0,
      vehicleLabel: order.vehicleLabel,
      distanceKm: 3.0,
      imageUrl: order.providerAvatarUrl ?? AppImages.partnerTruck1,
      basePrice: order.totalPrice,
      surcharges: const [],
      note: 'Giá theo báo giá đã chốt.',
      scheduleFit: QuoteScheduleFit.exactMatch,
    );

    final updatedQuotes = quotes.any((q) => q.id == confirmed!.id) ? quotes : [...quotes, confirmed];

    final scheduledAt = snap.scheduledPickupAt ?? order.scheduledPickupAt;
    final scheduledLabel = snap.scheduledSlotLabel ??
        (scheduledAt != null ? formatQuotePickupLabel(scheduledAt) : snap.requestedPickupLabel);

    final providerTripConfirmed = order.providerTripConfirmed;
    final depositPaid = order.depositPaid || snap.depositPaidAt != null;

    QuoteProgressStatus status;
    if (order.status == OrderStatus.completed) {
      status = QuoteProgressStatus.completed;
    } else if (order.status == OrderStatus.inProgress || order.status == OrderStatus.pickingUp) {
      status = QuoteProgressStatus.inProgress;
    } else if (providerTripConfirmed) {
      status = QuoteProgressStatus.depositPaid;
    } else if (depositPaid) {
      status = QuoteProgressStatus.depositPaid;
    } else if (order.status == OrderStatus.matched || snap.confirmedQuoteId != null) {
      status = QuoteProgressStatus.providerAccepted;
    } else if (quotes.isNotEmpty) {
      status = QuoteProgressStatus.quotesReady;
    } else {
      status = snap.status;
    }

    _store[referenceId] = snap.copyWith(
      status: status,
      quotes: updatedQuotes,
      confirmedQuoteId: snap.confirmedQuoteId ?? confirmed.id,
      scheduledPickupAt: scheduledAt,
      scheduledSlotLabel: scheduledLabel,
      providerTripConfirmed: providerTripConfirmed,
      depositPaidAt: depositPaid ? (snap.depositPaidAt ?? DateTime.now()) : snap.depositPaidAt,
    );
  }

  void _ensureRuntimeChat(String referenceId) {
    final snap = _store[referenceId];
    if (snap == null) return;
    if (snap.status != QuoteProgressStatus.providerAccepted &&
        snap.status != QuoteProgressStatus.depositPaid &&
        snap.status != QuoteProgressStatus.inProgress) {
      return;
    }

    final convId = snap.conversationId ?? QuoteRuntimeStore.instance.conversationIdFor(referenceId);
    if (QuoteRuntimeStore.instance.conversationById(convId) != null) return;
    if (snap.confirmedQuote == null) return;

    QuoteRuntimeStore.instance.onProviderAccepted(snap);
    _store[referenceId] = snap.copyWith(
      orderId: snap.orderId ?? QuoteRuntimeStore.instance.orderIdFor(referenceId),
      conversationId: convId,
    );
  }

  Future<QuoteRequestSnapshot> confirmProvider({
    required String referenceId,
    required String quoteId,
    DateTime? pickupAt,
  }) async {
    final snap = _store[referenceId];
    if (snap == null) throw Exception('Không tìm thấy yêu cầu báo giá');

    ProviderQuoteResponse? quote;
    for (final q in snap.quotes) {
      if (q.id == quoteId) {
        quote = q;
        break;
      }
    }
    if (quote == null) throw Exception('Không tìm thấy báo giá');

    if (!quote.canConfirmSchedule) {
      throw Exception(
        'Nhà xe này không nhận khung giờ bạn chọn. Hãy chọn nhà xe khác hoặc đổi giờ.',
      );
    }

    // Đã chọn giờ trước → chốt và gửi lịch cho nhà xe xác nhận.
    if (snap.hasRequestedPickup) {
      return confirmQuoteWithPickupTime(
        referenceId: referenceId,
        quoteId: quoteId,
        pickupAt: pickupAt,
      );
    }

    // Luồng cũ: chưa chọn giờ trước → chọn lịch sau khi chốt nhà xe.
    final updated = snap.copyWith(
      status: QuoteProgressStatus.providerConfirmed,
      confirmedQuoteId: quoteId,
    );
    _store[referenceId] = updated;
    return updated;
  }

  /// Chốt báo giá kèm giờ chuyển — chờ nhà xe xác nhận trên app.
  Future<QuoteRequestSnapshot> confirmQuoteWithPickupTime({
    required String referenceId,
    required String quoteId,
    DateTime? pickupAt,
  }) async {
    final snap = _store[referenceId];
    if (snap == null) throw Exception('Không tìm thấy yêu cầu báo giá');

    ProviderQuoteResponse? quote;
    for (final q in snap.quotes) {
      if (q.id == quoteId) {
        quote = q;
        break;
      }
    }
    if (quote == null) throw Exception('Không tìm thấy báo giá');
    if (!quote.canConfirmSchedule) {
      throw Exception('Nhà xe này không nhận khung giờ bạn chọn.');
    }

    final DateTime scheduledAt;
    switch (quote.scheduleFit) {
      case QuoteScheduleFit.exactMatch:
        final at = pickupAt ?? snap.requestedPickupAt;
        if (at == null) throw Exception('Chưa chọn giờ chuyển');
        scheduledAt = at;
      case QuoteScheduleFit.alternateProposed:
        final at = pickupAt ?? quote.proposedPickupAt;
        if (at == null) throw Exception('Nhà xe chưa đề xuất giờ thay thế');
        scheduledAt = at;
      case QuoteScheduleFit.unavailable:
        throw Exception('Nhà xe không nhận khung giờ này');
    }

    final label = formatQuotePickupLabel(scheduledAt);
    if (snap.orderId != null && !await _useMockQuotes()) {
      await _quotesRepo.selectQuote(orderId: snap.orderId!, quoteId: quoteId);
      final updated = snap.copyWith(
        status: QuoteProgressStatus.providerAccepted,
        confirmedQuoteId: quoteId,
        scheduledPickupAt: scheduledAt,
        scheduledSlotLabel: label,
        providerTripConfirmed: false,
      );
      _store[referenceId] = updated;
      return updated;
    }

    if (snap.orderId != null) {
      final updated = snap.copyWith(
        status: QuoteProgressStatus.providerAccepted,
        confirmedQuoteId: quoteId,
        scheduledPickupAt: scheduledAt,
        scheduledSlotLabel: label,
      );
      _store[referenceId] = updated;
      return updated;
    }

    final updated = snap.copyWith(
      status: QuoteProgressStatus.scheduled,
      confirmedQuoteId: quoteId,
      scheduledPickupAt: scheduledAt,
      scheduledSlotLabel: label,
    );
    _store[referenceId] = updated;
    Future<void>.delayed(const Duration(seconds: 4), () => _tryAdvanceProviderAccept(referenceId));
    return updated;
  }

  Future<QuoteRequestSnapshot> acceptAlternateSchedule({
    required String referenceId,
  }) async {
    final snap = _store[referenceId];
    if (snap == null) throw Exception('Không tìm thấy yêu cầu báo giá');

    final quote = snap.confirmedQuote;
    final proposed = quote?.proposedPickupAt;
    if (quote?.scheduleFit != QuoteScheduleFit.alternateProposed || proposed == null) {
      throw Exception('Không có giờ đề xuất để xác nhận');
    }

    final label = quote!.proposedPickupLabel ?? formatQuotePickupLabel(proposed);
    final updated = snap.copyWith(
      status: QuoteProgressStatus.scheduled,
      scheduledPickupAt: proposed,
      scheduledSlotLabel: label,
    );
    _store[referenceId] = updated;
    Future<void>.delayed(const Duration(seconds: 4), () => _tryAdvanceProviderAccept(referenceId));
    return updated;
  }

  Future<QuoteRequestSnapshot> declineAlternateSchedule({
    required String referenceId,
  }) async {
    final snap = _store[referenceId];
    if (snap == null) throw Exception('Không tìm thấy yêu cầu báo giá');

    final updated = snap.copyWith(
      status: QuoteProgressStatus.quotesReady,
      clearConfirmedQuote: true,
      clearScheduled: true,
    );
    _store[referenceId] = updated;
    return updated;
  }

  Future<QuoteRequestSnapshot> selectMoveSlot({
    required String referenceId,
    required MoveTimeSlot slot,
  }) async {
    final snap = _store[referenceId];
    if (snap == null) throw Exception('Không tìm thấy yêu cầu báo giá');
    if (!slot.available) throw Exception('Khung giờ đã được đặt');

    final slotLabel = _formatScheduledLabel(slot);
    final updated = snap.copyWith(
      status: QuoteProgressStatus.scheduled,
      scheduledPickupAt: slot.start,
      scheduledSlotLabel: slotLabel,
    );
    _store[referenceId] = updated;

    Future<void>.delayed(const Duration(seconds: 4), () => _tryAdvanceProviderAccept(referenceId));

    return updated;
  }

  /// Cập nhật trạng thái sau khi khách đặt cọc qua API.
  Future<QuoteRequestSnapshot> markDepositPaid(String referenceId) async {
    final snap = _store[referenceId];
    if (snap == null) throw Exception('Không tìm thấy yêu cầu báo giá');

    final updated = snap.copyWith(
      status: QuoteProgressStatus.depositPaid,
      depositPaidAt: DateTime.now(),
    );
    _store[referenceId] = updated;
    return updated;
  }

  /// Đặt cọc giữ chỗ — chưa bắt đầu vận chuyển ngay.
  Future<QuoteRequestSnapshot> payDeposit(String referenceId) async {
    final snap = _store[referenceId];
    if (snap == null) throw Exception('Không tìm thấy yêu cầu báo giá');
    if (snap.status != QuoteProgressStatus.providerAccepted) {
      throw Exception('Nhà xe chưa xác nhận lịch');
    }

    final orderId = snap.orderId ?? QuoteRuntimeStore.instance.orderIdFor(referenceId);
    final convId = snap.conversationId ?? QuoteRuntimeStore.instance.conversationIdFor(referenceId);
    QuoteRuntimeStore.instance.onDepositPaid(snap);
    QuoteLocalNotifications.scheduleMoveReminders(snap);

    final updated = snap.copyWith(
      status: QuoteProgressStatus.depositPaid,
      depositPaidAt: DateTime.now(),
      orderId: orderId,
      conversationId: convId,
    );
    _store[referenceId] = updated;
    return updated;
  }

  Future<void> _tryAdvanceProviderAccept(String referenceId) async {
    var snap = _store[referenceId];
    if (snap == null || snap.status != QuoteProgressStatus.scheduled) return;

    if (snap.confirmedQuote == null && snap.quotes.isEmpty) {
      await _populateQuotes(referenceId);
      snap = _store[referenceId];
      if (snap == null) return;
    }

    final orderId = QuoteRuntimeStore.instance.orderIdFor(referenceId);
    final convId = QuoteRuntimeStore.instance.conversationIdFor(referenceId);
    if (snap.confirmedQuote != null) {
      QuoteRuntimeStore.instance.onProviderAccepted(snap);
    }

    _store[referenceId] = snap.copyWith(
      status: QuoteProgressStatus.providerAccepted,
      orderId: orderId,
      conversationId: convId,
    );
  }

  Future<void> _tryAdvanceMoveDay(String referenceId) async {
    final snap = _store[referenceId];
    if (snap == null || snap.status != QuoteProgressStatus.depositPaid) return;
    if (!_shouldStartMoveDay(snap)) return;

    final orderId = snap.orderId ?? QuoteRuntimeStore.instance.orderIdFor(referenceId);
    final convId = snap.conversationId ?? QuoteRuntimeStore.instance.conversationIdFor(referenceId);
    QuoteRuntimeStore.instance.onTransportStarted(orderId, convId);

    _store[referenceId] = snap.copyWith(status: QuoteProgressStatus.inProgress);
  }

  bool _shouldStartMoveDay(QuoteRequestSnapshot snap) {
    final at = snap.scheduledPickupAt;
    if (at == null) return false;
    return !DateTime.now().isBefore(at);
  }

  String _formatScheduledLabel(MoveTimeSlot slot) {
    String two(int n) => n.toString().padLeft(2, '0');
    final d = slot.start;
    return '${two(d.day)}/${two(d.month)}/${d.year} · ${slot.label}';
  }

  Future<void> _populateQuotes(String referenceId) async {
    final snap = _store[referenceId];
    if (snap == null || snap.quotes.isNotEmpty) return;

    final partners = await _partnersRepo.fetchPartners();
    final requestedAt = snap.requestedPickupAt;
    final quotes = partners.asMap().entries.map((e) {
      final p = e.value;
      final surcharges = _surchargesForPartner(e.key, p, snap);
      final scheduleFit =
          requestedAt == null ? QuoteScheduleFit.exactMatch : _scheduleFitForIndex(e.key);
      final proposedAt = scheduleFit == QuoteScheduleFit.alternateProposed && requestedAt != null
          ? requestedAt.add(const Duration(hours: 1, minutes: 30))
          : null;
      return ProviderQuoteResponse(
        id: 'q-${p.id}',
        providerId: p.id,
        providerName: p.name,
        rating: p.rating,
        reviewCount: p.reviewCount,
        completedTrips: p.completedTrips,
        vehicleLabel: p.vehicleLabel,
        distanceKm: p.distanceKm,
        imageUrl: p.imageUrl,
        basePrice: p.price,
        surcharges: surcharges,
        recentReviews: p.recentReviews,
        note: snap.wantsTransportLabor
            ? 'Giá gồm xe + khuân vác theo yêu cầu (${snap.transportLaborLabel}). Phụ phí liệt kê bên dưới.'
            : 'Giá gồm xe vận chuyển. Phụ phí liệt kê bên dưới.',
        scheduleFit: scheduleFit,
        proposedPickupAt: proposedAt,
        proposedPickupLabel:
            proposedAt != null ? formatQuotePickupLabel(proposedAt) : null,
      );
    }).toList();

    final status = snap.status == QuoteProgressStatus.waitingQuotes
        ? QuoteProgressStatus.quotesReady
        : snap.status;

    _store[referenceId] = snap.copyWith(status: status, quotes: quotes);
  }

  QuoteScheduleFit _scheduleFitForIndex(int index) => switch (index % 3) {
        0 => QuoteScheduleFit.exactMatch,
        1 => QuoteScheduleFit.alternateProposed,
        _ => QuoteScheduleFit.unavailable,
      };

  List<QuoteSurchargeLine> _surchargesForPartner(
    int index,
    PartnerOffer p,
    QuoteRequestSnapshot snap,
  ) {
    final base = switch (index) {
      0 => const [
          QuoteSurchargeLine(label: 'Tầng không thang máy (x2)', amount: 80000),
          QuoteSurchargeLine(label: 'Hẻm hẹp — xe nhỏ', amount: 50000),
        ],
      1 => const [
          QuoteSurchargeLine(label: 'Đồ cồng kềnh thêm', amount: 100000),
        ],
      _ => const [
          QuoteSurchargeLine(label: 'Km vượt gói (3 km)', amount: 21000),
        ],
    };

    if (!snap.wantsTransportLabor) return base;

    final unit = p.comboLaborUnitPrice ?? 60000;
    final laborFee = snap.transportLaborHelpers * snap.transportLaborHours * unit;
    return [
      ...base,
      QuoteSurchargeLine(
        label: 'Khuân vác · ${snap.transportLaborHelpers} người × ${snap.transportLaborHours} giờ',
        amount: laborFee,
      ),
    ];
  }

  static void seedDemoIfEmpty() {
    if (_store.isNotEmpty) return;
    _store['QR-DEMO'] = QuoteRequestSnapshot(
      id: 'QR-DEMO',
      status: QuoteProgressStatus.quotesReady,
      pickup: 'Ký túc xá Khu B',
      destination: '152 Nguyễn Văn Cừ, Quận 5',
      createdAt: DateTime.now().subtract(const Duration(hours: 1)),
      quotes: [
        ProviderQuoteResponse(
          id: 'q-p1',
          providerId: 'p1',
          providerName: 'Minh Quân Logistics',
          rating: 4.9,
          reviewCount: 148,
          completedTrips: 1260,
          vehicleLabel: 'Xe tải 1 tấn',
          distanceKm: 1.2,
          imageUrl: AppImages.partnerTruck1,
          basePrice: 250000,
          surcharges: const [
            QuoteSurchargeLine(label: 'Tầng không thang máy (x2)', amount: 80000),
            QuoteSurchargeLine(label: 'Hẻm hẹp', amount: 50000),
          ],
        ),
      ],
    );
  }
}
