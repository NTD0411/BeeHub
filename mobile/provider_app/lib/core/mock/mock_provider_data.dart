import '../../features/orders/domain/provider_order.dart';

/// Dữ liệu demo cho provider (không cần backend) — Đà Nẵng, đủ tab trạng thái.
abstract final class MockProviderData {
  static const providerId = 'p1000000-0000-4000-8000-000000000001';

  static const Map<String, dynamic> verifiedProviderUserJson = {
    'id': providerId,
    'email': 'partner@unimove.vn',
    'full_name': 'Nguyễn Văn Provider',
    'role': 'provider',
    'business_name': 'UniMove Test Transport',
    'is_verified': true,
    'verification_status': 'approved',
    'kyc_completed': true,
    'rating': 4.85,
    'phone': '0903 456 789',
    'address': '12 Nguyễn Văn Linh, Thanh Khê',
    'city': 'Đà Nẵng',
    'bio': 'Chuyên chuyển phòng sinh viên Đà Nẵng · 2 người bốc xếp · giá minh bạch.',
    'license_plate': '43A-12345',
    'vehicle_model': 'Hyundai Porter 1 tấn',
    'vehicle_size': 'medium_truck',
    'total_reviews': 38,
    'completed_trips': 52,
    'member_since': '2024-03-15T00:00:00.000Z',
    'bank_name': 'Vietcombank',
    'bank_account_number': '0123456789',
    'bank_account_name': 'NGUYEN VAN PROVIDER',
    'tax_code': '0312789456',
  };

  static const Map<String, dynamic> userJson = verifiedProviderUserJson;

  static const customerNames = <String, String>{
    'c1000000-0000-4000-8000-000000000001': 'Trần Minh Anh',
    'c1000000-0000-4000-8000-000000000002': 'Phan Thị Ngọc Quyên',
    'c1000000-0000-4000-8000-000000000003': 'Hoàng Văn Đức',
    'c1000000-0000-4000-8000-000000000004': 'Đỗ Lan Anh',
    'c1000000-0000-4000-8000-000000000005': 'Võ Thị Mai',
    'c1000000-0000-4000-8000-000000000006': 'Lê Hoàng Nam',
    'c1000000-0000-4000-8000-000000000007': 'Phạm Thu Trang',
    'c1000000-0000-4000-8000-000000000008': 'Nguyễn Bảo Châu',
  };

  static String customerNameOf(String? id) => customerNames[id] ?? 'Khách UniMove';

  static String? chatThreadIdForOrder(String orderId) => 'order-$orderId';

  static final _now = DateTime(2026, 6, 3, 15, 0);

  static final List<ProviderOrder> orders = [
    // ── Báo giá mới ──
    ProviderOrder(
      id: 'demo-q-001',
      status: 'pending',
      orderNumber: 'DEMO-Q-0001',
      pickupAddress: 'KTX ĐH Đà Nẵng, Ngũ Hành Sơn',
      deliveryAddress: 'Chung cư Monarchy, Ngũ Hành Sơn',
      totalPrice: 0,
      quoteRequest: true,
      serviceType: 'standard',
      vehicleSize: 'medium_truck',
      customerId: 'c1000000-0000-4000-8000-000000000001',
      createdAt: _now.subtract(const Duration(minutes: 18)),
      scheduledPickupTime: _now.add(const Duration(days: 2)),
      requiresHelpers: true,
      numberOfHelpers: 2,
      itemSummary: 'Giường, tủ, bàn học',
    ),
    ProviderOrder(
      id: 'demo-q-002',
      status: 'pending',
      orderNumber: 'DEMO-Q-0002',
      pickupAddress: '254 Nguyễn Văn Linh, Thanh Khê',
      deliveryAddress: '45 Lê Duẩn, Hải Châu',
      totalPrice: 0,
      quoteRequest: true,
      serviceType: 'standard',
      vehicleSize: 'small_truck',
      customerId: 'c1000000-0000-4000-8000-000000000006',
      createdAt: _now.subtract(const Duration(minutes: 42)),
      scheduledPickupTime: _now.add(const Duration(days: 1)),
      itemSummary: 'Vali, thùng sách',
    ),
    ProviderOrder(
      id: 'demo-q-003',
      status: 'pending',
      orderNumber: 'DEMO-Q-0003',
      pickupAddress: '35 Nguyễn Minh Châu, Ngũ Hành Sơn',
      deliveryAddress: 'FPT City, Ngũ Hành Sơn',
      totalPrice: 0,
      quoteRequest: true,
      serviceType: 'premium',
      vehicleSize: 'large_truck',
      customerId: 'c1000000-0000-4000-8000-000000000007',
      createdAt: _now.subtract(const Duration(hours: 1)),
      scheduledPickupTime: _now.add(const Duration(days: 3)),
      requiresHelpers: true,
      numberOfHelpers: 3,
      itemSummary: 'Tủ lạnh, máy giặt, sofa',
    ),
    ProviderOrder(
      id: 'demo-q-004',
      status: 'pending',
      orderNumber: 'DEMO-Q-0004',
      pickupAddress: 'Khu đô thị Hòa Xuân, Cẩm Lệ',
      deliveryAddress: 'KTX FPT, Ngũ Hành Sơn',
      totalPrice: 0,
      quoteRequest: true,
      serviceType: 'standard',
      vehicleSize: 'medium_truck',
      customerId: 'c1000000-0000-4000-8000-000000000008',
      createdAt: _now.subtract(const Duration(hours: 2)),
      scheduledPickupTime: _now.add(const Duration(days: 4)),
      itemSummary: 'Chuyển phòng cuối kỳ',
    ),
    // ── Chờ cọc ──
    ProviderOrder(
      id: 'demo-m-001',
      status: 'matched',
      orderNumber: 'DEMO-M-0001',
      providerId: providerId,
      pickupAddress: '152 Huỳnh Tấn Phát, Hải Châu',
      deliveryAddress: 'Khu Sơn Trà, Sơn Trà',
      totalPrice: 505000,
      quoteRequest: true,
      serviceType: 'standard',
      vehicleSize: 'medium_truck',
      customerId: 'c1000000-0000-4000-8000-000000000005',
      createdAt: _now.subtract(const Duration(hours: 3)),
      scheduledPickupTime: _now.add(const Duration(hours: 27)),
      requiresHelpers: true,
      numberOfHelpers: 2,
    ),
    // ── Sẵn sàng nhận ──
    ProviderOrder(
      id: 'demo-m-002',
      status: 'matched',
      orderNumber: 'DEMO-M-0002',
      providerId: providerId,
      depositPaid: true,
      depositAmount: 3300,
      remainingAmount: 7700,
      pickupAddress: '35, Đường Nguyễn Minh Châu, Ngũ Hành Sơn',
      deliveryAddress: 'Huỳnh Lắm, Ngũ Hành Sơn',
      totalPrice: 11000,
      quoteRequest: true,
      serviceType: 'standard',
      vehicleSize: 'medium_truck',
      customerId: 'c1000000-0000-4000-8000-000000000002',
      createdAt: _now.subtract(const Duration(hours: 5)),
      scheduledPickupTime: _now.add(const Duration(hours: 8)),
      requiresHelpers: true,
      numberOfHelpers: 2,
    ),
    // ── Đang chạy ──
    ProviderOrder(
      id: 'demo-a-001',
      status: 'accepted',
      orderNumber: 'DEMO-A-0001',
      providerId: providerId,
      depositPaid: true,
      depositAmount: 160500,
      remainingAmount: 374500,
      pickupAddress: 'KTX ĐH Đà Nẵng, Ngũ Hành Sơn',
      deliveryAddress: 'Chung cư Golden House, Hải Châu',
      totalPrice: 535000,
      serviceType: 'standard',
      vehicleSize: 'medium_truck',
      customerId: 'c1000000-0000-4000-8000-000000000003',
      createdAt: _now.subtract(const Duration(days: 1)),
      scheduledPickupTime: _now.add(const Duration(hours: 6)),
      requiresHelpers: true,
      numberOfHelpers: 2,
    ),
    ProviderOrder(
      id: 'demo-p-001',
      status: 'in_progress',
      orderNumber: 'DEMO-P-0001',
      providerId: providerId,
      depositPaid: true,
      pickupAddress: 'An Thượng, Ngũ Hành Sơn',
      deliveryAddress: 'Cầu Rồng, Hải Châu',
      totalPrice: 390000,
      serviceType: 'standard',
      vehicleSize: 'medium_truck',
      customerId: 'c1000000-0000-4000-8000-000000000004',
      createdAt: _now.subtract(const Duration(hours: 4)),
      distanceKm: 6.2,
      etaMinutes: 18,
    ),
    // ── Hoàn thành ──
    ProviderOrder(
      id: 'demo-c-001',
      status: 'completed',
      orderNumber: 'DEMO-C-0001',
      providerId: providerId,
      depositPaid: true,
      pickupAddress: 'KTX FPT, Ngũ Hành Sơn',
      deliveryAddress: 'An Thượng, Ngũ Hành Sơn',
      totalPrice: 440000,
      serviceType: 'standard',
      vehicleSize: 'medium_truck',
      customerId: 'c1000000-0000-4000-8000-000000000004',
      createdAt: _now.subtract(const Duration(days: 3)),
      completedAt: _now.subtract(const Duration(days: 1)),
    ),
    ProviderOrder(
      id: 'demo-c-002',
      status: 'completed',
      orderNumber: 'DEMO-C-0002',
      providerId: providerId,
      depositPaid: true,
      pickupAddress: 'Cầu Rồng, Hải Châu',
      deliveryAddress: 'Vincom Đà Nẵng, Hải Châu',
      totalPrice: 930000,
      serviceType: 'premium',
      vehicleSize: 'large_truck',
      customerId: 'c1000000-0000-4000-8000-000000000001',
      createdAt: _now.subtract(const Duration(days: 6)),
      completedAt: _now.subtract(const Duration(days: 4)),
    ),
    // ── Đã hủy ──
    ProviderOrder(
      id: 'demo-x-001',
      status: 'cancelled',
      orderNumber: 'DEMO-X-0001',
      pickupAddress: 'Hòa Khánh, Liên Chiểu',
      deliveryAddress: 'Sơn Trà, Sơn Trà',
      totalPrice: 280000,
      quoteRequest: true,
      serviceType: 'standard',
      vehicleSize: 'small_truck',
      customerId: 'c1000000-0000-4000-8000-000000000006',
      createdAt: _now.subtract(const Duration(days: 2)),
      cancelledAt: _now.subtract(const Duration(hours: 12)),
      cancellationReason: 'Khách đổi lịch',
    ),
  ];

  static ProviderOrder? orderById(String id) {
    try {
      final order = orders.firstWhere((o) => o.id == id);
      return enrichOrderDetails(order);
    } catch (_) {
      return null;
    }
  }

  static ProviderOrder enrichOrderDetails(ProviderOrder o) {
    if (o.pickup != null) return o;

    final customerName = customerNameOf(o.customerId);
    final phones = {
      'c1000000-0000-4000-8000-000000000001': '0901 111 001',
      'c1000000-0000-4000-8000-000000000002': '0901 111 002',
      'c1000000-0000-4000-8000-000000000003': '0901 111 003',
      'c1000000-0000-4000-8000-000000000004': '0901 111 004',
      'c1000000-0000-4000-8000-000000000005': '0901 111 005',
      'c1000000-0000-4000-8000-000000000006': '0901 111 006',
      'c1000000-0000-4000-8000-000000000007': '0901 111 007',
      'c1000000-0000-4000-8000-000000000008': '0901 111 008',
    };
    final phone = phones[o.customerId] ?? '0901 000 000';

    final base = o.totalPrice > 0 ? ((o.totalPrice * 0.55) / 1000).round() * 1000 : 0;
    final dist = o.totalPrice > 0 ? ((o.totalPrice * 0.25) / 1000).round() * 1000 : 0;
    final floor = o.totalPrice > 0 && o.totalPrice - base - dist > 0 ? o.totalPrice - base - dist : 0;

    return ProviderOrder(
      id: o.id,
      status: o.status,
      pickupAddress: o.pickupAddress,
      deliveryAddress: o.deliveryAddress,
      totalPrice: o.totalPrice,
      orderNumber: o.orderNumber,
      serviceType: o.serviceType,
      vehicleSize: o.vehicleSize,
      customerId: o.customerId,
      createdAt: o.createdAt,
      distanceKm: o.distanceKm ?? 5.5,
      etaMinutes: o.etaMinutes ?? 22,
      itemSummary: o.itemSummary,
      quoteRequest: o.quoteRequest,
      providerId: o.providerId,
      depositPaid: o.depositPaid,
      depositAmount: o.depositAmount,
      remainingAmount: o.remainingAmount,
      pickup: OrderLocationPoint(
        address: o.pickupAddress,
        city: 'Đà Nẵng',
        district: 'Ngũ Hành Sơn',
        ward: 'Hòa Quý',
        floor: 2,
        hasElevator: false,
        contactName: customerName,
        contactPhone: phone,
        notes: o.quoteRequest ? 'Mã báo giá: ${o.orderNumber}' : 'Gọi trước 15 phút',
      ),
      delivery: OrderLocationPoint(
        address: o.deliveryAddress,
        city: 'Đà Nẵng',
        district: 'Ngũ Hành Sơn',
        floor: 3,
        hasElevator: true,
        contactName: customerName,
        contactPhone: phone,
      ),
      pricing: OrderPriceBreakdown(
        basePrice: base,
        distancePrice: dist,
        floorPrice: floor,
        serviceFee: o.serviceType == 'premium' ? 50000 : 0,
        discountAmount: 0,
        totalPrice: o.totalPrice,
      ),
      items: const [OrderLineItem(name: 'Đồ chuyển phòng', qty: 1, weightKg: 120)],
      itemsDescription: o.itemSummary ?? 'Đồ chuyển phòng sinh viên',
      estimatedWeightKg: 150,
      requiresHelpers: o.requiresHelpers,
      numberOfHelpers: o.numberOfHelpers,
      hasInsurance: o.serviceType == 'premium',
      scheduledPickupTime: o.scheduledPickupTime,
      actualPickupTime: o.isActive || o.isCompleted ? o.createdAt?.add(const Duration(hours: 3)) : null,
      completedAt: o.completedAt ?? (o.isCompleted ? o.createdAt?.add(const Duration(hours: 5)) : null),
      cancellationReason: o.cancellationReason,
      cancelledAt: o.cancelledAt,
    );
  }

  static void updateStatus(String id, String status) {
    final i = orders.indexWhere((o) => o.id == id);
    if (i == -1) return;
    orders[i] = orders[i].copyWith(status: status);
  }
}
