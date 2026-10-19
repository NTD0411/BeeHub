import '../../../core/auth/api_session_mode.dart';
import '../../../core/auth/auth_token_storage.dart';
import '../../../core/mock/mock_orders_data.dart';
import '../../../core/network/api_client.dart';
import '../../booking/domain/booking_models.dart';
import '../../booking/presentation/cubit/booking_flow_state.dart';
import '../domain/checkout_models.dart';
import '../domain/order_models.dart';
import 'order_api_mapper.dart';

class CustomerOrdersRepository {
  CustomerOrdersRepository({ApiClient? api}) : _api = api ?? ApiClient.instance;

  final ApiClient _api;

  Future<bool> _useMockData() => ApiSessionMode.useMockData();

  Future<List<CustomerOrder>> fetchOrders({bool activeOnly = false, bool completedOnly = false}) async {
    if (await _useMockData()) {
      return _mockFilter(activeOnly: activeOnly, completedOnly: completedOnly);
    }

    final envelope = await _api.guard(() => _api.get('/orders'));
    final raw = envelope['data'];

    var list = raw is List
        ? raw
            .map((e) => OrderApiMapper.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList()
        : <CustomerOrder>[];

    if (activeOnly) {
      list = list.where((o) => o.status.isActive).toList();
    }
    if (completedOnly) {
      list = list
          .where((o) => o.status == OrderStatus.completed || o.status == OrderStatus.cancelled)
          .toList();
    }
    return list;
  }

  Future<CustomerOrder?> fetchById(String id) async {
    if (await _useMockData()) {
      return MockOrdersData.orderById(id);
    }

    try {
      final envelope = await _api.guard(() => _api.get('/orders/$id'));
      final data = envelope['data'];
      if (data is! Map) return null;
      return OrderApiMapper.fromJson(Map<String, dynamic>.from(data));
    } on ApiException {
      return null;
    }
  }

  Future<TrackingSnapshot> fetchTracking(String orderId) async {
    final order = await fetchById(orderId);
    if (order == null) {
      if (await _useMockData()) {
        return MockOrdersData.trackingFor(orderId);
      }
      throw ApiException('Không tìm thấy đơn hàng');
    }
    return OrderApiMapper.trackingFromOrder(order);
  }

  /// Tạo đơn chờ nhà xe nhận (luồng báo giá) — không đặt cọc ngay.
  Future<String> createQuoteRequestOrder(BookingFlowState state, String referenceId) async {
    if (await _useMockData()) {
      throw ApiException('Cần đăng nhập để gửi yêu cầu báo giá');
    }

    // Giá do nhà xe báo sau — không gửi giá tham chiếu lên server.
    final body = await _buildOrderBody(
      state,
      basePrice: 0,
      totalPrice: 0,
      quoteReferenceId: referenceId,
    );

    final envelope = await _api.guard(() => _api.post('/orders', body: body));
    final orderJson = Map<String, dynamic>.from(envelope['data'] as Map);
    return orderJson['id'] as String;
  }

  /// Đặt cọc cho đơn đã tồn tại (sau khi chốt nhà xe báo giá).
  Future<DepositPaymentInfo?> createDepositForOrder({
    required String orderId,
    required int amount,
  }) async {
    if (await _useMockData()) return null;

    final user = await AuthTokenStorage.instance.loadUser();
    final contactName = user?['full_name'] as String? ?? 'Khách UniMove';

    final depositEnvelope = await _api.guard(
      () => _api.post('/payments/deposit', body: {
        'order_id': orderId,
        'amount': amount,
        'payment_method': 'payos',
        if (contactName.isNotEmpty) 'customer_name': contactName,
        if ((user?['email'] as String?)?.isNotEmpty == true) 'customer_email': user!['email'],
      }),
    );
    final depositJson = depositEnvelope['data'];
    if (depositJson is! Map) return null;

    final d = Map<String, dynamic>.from(depositJson);
    return DepositPaymentInfo(
      paymentId: d['payment_id'] as String? ?? '',
      paymentCode: d['payment_code'] as String? ?? '',
      amount: (d['amount'] as num?)?.round() ?? amount,
      qrCode: d['qr_code'] as String? ?? d['qr_code_data_url'] as String?,
      checkoutUrl: d['checkout_url'] as String?,
      bankAccountNumber: d['bank_account_number'] as String?,
      bankAccountName: d['bank_account_name'] as String?,
    );
  }

  /// Tạo đơn từ luồng booking + đặt cọc qua API.
  Future<CheckoutResult> createFromBooking(BookingFlowState state) async {
    if (await _useMockData()) {
      await Future<void>.delayed(const Duration(milliseconds: 400));
      return CheckoutResult(orderId: MockOrdersData.placeBookingOrder(state));
    }

    final basePrice = state.isComboBooking
        ? state.movePackagePrice + state.comboLaborFee + state.retailLaborFee
        : state.partnerTransportPrice + state.retailLaborFee;
    final total = state.total;

    final body = await _buildOrderBody(state, basePrice: basePrice, totalPrice: total);
    final envelope = await _api.guard(() => _api.post('/orders', body: body));

    final orderJson = Map<String, dynamic>.from(envelope['data'] as Map);
    final orderId = orderJson['id'] as String;

    DepositPaymentInfo? depositInfo;
    final deposit = (total * 0.3).round();
    if (deposit > 0 && !state.isLaborAddon) {
      depositInfo = await createDepositForOrder(orderId: orderId, amount: deposit);
    }

    return CheckoutResult(orderId: orderId, deposit: depositInfo);
  }

  Future<Map<String, dynamic>> _buildOrderBody(
    BookingFlowState state, {
    required int basePrice,
    required int totalPrice,
    String? quoteReferenceId,
  }) async {
    final user = await AuthTokenStorage.instance.loadUser();
    final contactName = user?['full_name'] as String? ?? 'Khách UniMove';
    final contactPhone = user?['phone'] as String? ?? '+84900000000';

    final pickup = _splitAddress(state.pickup);
    final delivery = _splitAddress(
      state.destination.isEmpty ? '152 Nguyễn Văn Cừ, Quận 5' : state.destination,
    );

    final tier = state.selectedTier;
    final vehicleSize = switch (tier) {
      ServiceTier.economy => 'small_truck',
      ServiceTier.premium => 'large_truck',
      _ => 'medium_truck',
    };
    final serviceType = switch (tier) {
      ServiceTier.premium => 'premium',
      ServiceTier.economy => 'standard',
      _ => 'standard',
    };

    var pickupNotes = _formatLocationNotes(
      alley: state.pickupAlleyAccess,
      extra: state.dormNote,
      imageCount: state.dormImageCount,
      isPickup: true,
    );
    if (quoteReferenceId != null) {
      pickupNotes = '$pickupNotes · Mã báo giá: $quoteReferenceId';
    }

    final deliveryNotes = _formatLocationNotes(
      alley: state.destinationAlleyAccess,
      cargo: state.cargoVolume,
      extra: state.dormNote,
      imageCount: state.dormImageCount,
      isPickup: false,
    );

    final helpers = state.wantsTransportLabor && !state.isComboBooking
        ? state.transportLaborHelpers
        : (state.isComboBooking ? state.effectiveComboLaborCount : 0);

    return {
      'vehicle_size': vehicleSize,
      'service_type': serviceType,
      'pickup_address': pickup.address,
      'pickup_city': pickup.city,
      'pickup_district': pickup.district,
      'pickup_floor': state.pickupFloor,
      'pickup_has_elevator': state.pickupHasElevator,
      if (state.pickupLat != null) 'pickup_latitude': state.pickupLat,
      if (state.pickupLng != null) 'pickup_longitude': state.pickupLng,
      'pickup_notes': pickupNotes,
      'pickup_contact_name': contactName,
      'pickup_contact_phone': contactPhone,
      'delivery_address': delivery.address,
      'delivery_city': delivery.city,
      'delivery_district': delivery.district,
      if (state.destinationLat != null) 'delivery_latitude': state.destinationLat,
      if (state.destinationLng != null) 'delivery_longitude': state.destinationLng,
      'delivery_floor': state.floorCount,
      'delivery_has_elevator': state.hasElevator,
      'delivery_notes': deliveryNotes,
      'delivery_contact_name': contactName,
      'delivery_contact_phone': contactPhone,
      'base_price': basePrice,
      'distance_price': 0,
      'floor_price': state.floorFee,
      'service_fee': state.serviceFee,
      'total_price': totalPrice,
      'number_of_rooms': 1,
      'requires_helpers': helpers > 0,
      'number_of_helpers': helpers,
      'quote_request': quoteReferenceId != null,
      if (state.scheduledPickupAt != null)
        'scheduled_pickup_time': state.scheduledPickupAt!.toIso8601String()
      else if (state.isLaborService)
        'scheduled_pickup_time': DateTime.now().add(const Duration(hours: 2)).toIso8601String(),
    };
  }

  List<CustomerOrder> _mockFilter({required bool activeOnly, required bool completedOnly}) {
    var list = [...MockOrdersData.orders];
    if (activeOnly) {
      list = list.where((o) => o.status.isActive).toList();
    }
    if (completedOnly) {
      list = list
          .where((o) => o.status == OrderStatus.completed || o.status == OrderStatus.cancelled)
          .toList();
    }
    return list;
  }
}

class _ParsedAddress {
  const _ParsedAddress({required this.address, required this.city, required this.district});
  final String address;
  final String city;
  final String district;
}

String _formatLocationNotes({
  required AlleyAccess alley,
  CargoVolume? cargo,
  String extra = '',
  int imageCount = 0,
  required bool isPickup,
}) {
  final parts = <String>['Đường vào: ${alley.label}'];
  if (!isPickup && cargo != null) {
    parts.add('Khối lượng đồ: ${cargo.label}');
  }
  if (extra.trim().isNotEmpty) {
    parts.add(extra.trim());
  }
  if (imageCount > 0) {
    parts.add('Ảnh đính kèm: $imageCount');
  }
  return parts.join(' · ');
}

_ParsedAddress _splitAddress(String raw) {
  final trimmed = raw.trim();
  if (trimmed.isEmpty) {
    return const _ParsedAddress(address: 'Chưa nhập địa chỉ', city: 'Đà Nẵng', district: 'Hải Châu');
  }
  return _ParsedAddress(address: trimmed, city: 'Đà Nẵng', district: 'Hải Châu');
}
