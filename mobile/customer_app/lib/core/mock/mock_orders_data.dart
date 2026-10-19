import '../../features/booking/domain/booking_models.dart';
import '../../features/booking/presentation/cubit/booking_flow_state.dart';
import '../../features/chat/domain/chat_models.dart';
import '../../features/orders/data/order_api_mapper.dart';
import '../../features/orders/domain/order_models.dart';
import 'mock_customer_data.dart';

/// Dữ liệu demo — field names khớp schema Supabase.
abstract final class MockOrdersData {
  static const activeOrderId = 'a1000000-0000-4000-8000-000000000001';
  static const completedOrderId = 'a1000000-0000-4000-8000-000000000002';
  static const cancelledOrderId = 'a1000000-0000-4000-8000-000000000003';
  static const conversationId = 'c1000000-0000-4000-8000-000000000001';
  static const completedConversationId = 'c1000000-0000-4000-8000-000000000002';
  static const providerId = 'p1000000-0000-4000-8000-000000000001';

  static const providerName = 'UniMove Test Transport';
  static const providerPlate = '43A-12345';
  static const providerRating = 4.85;

  static final _now = DateTime(2026, 6, 3, 15, 0);

  static final Map<String, CustomerOrder> _placedOrders = {};

  static String placeBookingOrder(BookingFlowState state) {
    final id = 'b${DateTime.now().millisecondsSinceEpoch.remainder(1000000000)}';
    final partner = state.selectedPartner;
    final pkg = state.selectedPackage;
    final order = CustomerOrder(
      id: id,
      orderNumber: 'UM-${id.substring(id.length - 5)}',
      customerId: MockCustomerData.userId,
      providerId: partner?.id,
      status: OrderStatus.pending,
      packageLabel: switch (state.selectedTier) {
        ServiceTier.premium => ServicePackageLabel.premium,
        ServiceTier.economy => ServicePackageLabel.economy,
        _ => ServicePackageLabel.standard,
      },
      vehicleLabel: partner?.vehicleLabel ?? pkg?.label ?? 'Xe tải',
      pickupAddress: state.pickup,
      deliveryAddress: state.destination.isEmpty ? 'Chưa nhập điểm đến' : state.destination,
      totalPrice: state.total,
      createdAt: DateTime.now(),
      scheduledPickupAt: state.scheduledPickupAt,
      providerName: partner?.name,
      providerRating: partner?.rating,
      providerPlate: providerPlate,
    );
    _placedOrders[id] = order;
    return id;
  }

  static CustomerOrder? orderById(String id) {
    final placed = _placedOrders[id];
    if (placed != null) return placed;
    try {
      return orders.firstWhere((o) => o.id == id);
    } catch (_) {
      return null;
    }
  }

  static List<CustomerOrder> get allOrders {
    final merged = <CustomerOrder>[..._placedOrders.values, ...orders];
    merged.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return merged;
  }

  static final List<CustomerOrder> orders = [
    CustomerOrder(
      id: activeOrderId,
      orderNumber: 'DEMO-A-0001',
      customerId: MockCustomerData.userId,
      providerId: providerId,
      status: OrderStatus.accepted,
      packageLabel: ServicePackageLabel.standard,
      vehicleLabel: 'Xe tải trung',
      pickupAddress: 'KTX ĐH Đà Nẵng, Ngũ Hành Sơn',
      deliveryAddress: 'Chung cư Golden House, Hải Châu',
      totalPrice: 535000,
      createdAt: _now.subtract(const Duration(days: 1)),
      scheduledPickupAt: _now.add(const Duration(hours: 6)),
      depositPaid: true,
      quoteRequest: false,
      etaMinutes: 0,
      estimatedDistanceKm: 8.4,
      providerName: providerName,
      providerAvatarUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuBGFoTg7NghjPuAR_l_24vH7bPAvReVKw8S0JyqDk7DnwrXAzbREJXSyxNKUUBynTCdT_1u6IFQ2K-3z3d_gilgFCZAKIwMLPo4GbaAST0QnUtgCOHYHhHBBNzhxfCOLr2ccnd32yjvLibc2RZ9W9Him2flnnvn6i1drxClJx56l207I2q4UU1Z6Q0-FjprMvR0cJj0Aew4bS4HcKMgXYEez6IAIWeb79KTPosUcvRRnU36Tjq_qgjFQVqps1Zn-JagW9VdHxu8hFVC',
      providerRating: providerRating,
      providerPlate: providerPlate,
      conversationId: conversationId,
    ),
    CustomerOrder(
      id: 'a1000000-0000-4000-8000-000000000004',
      orderNumber: 'DEMO-M-0002',
      customerId: MockCustomerData.userId,
      providerId: providerId,
      status: OrderStatus.matched,
      packageLabel: ServicePackageLabel.standard,
      vehicleLabel: 'Xe tải trung',
      pickupAddress: '35, Đường Nguyễn Minh Châu, Ngũ Hành Sơn',
      deliveryAddress: 'Huỳnh Lắm, Ngũ Hành Sơn',
      totalPrice: 11000,
      createdAt: _now.subtract(const Duration(hours: 5)),
      scheduledPickupAt: _now.add(const Duration(hours: 8)),
      depositPaid: true,
      quoteRequest: true,
      providerName: providerName,
      providerRating: providerRating,
      providerPlate: providerPlate,
    ),
    CustomerOrder(
      id: 'a1000000-0000-4000-8000-000000000005',
      orderNumber: 'DEMO-P-0001',
      customerId: MockCustomerData.userId,
      providerId: providerId,
      status: OrderStatus.inProgress,
      packageLabel: ServicePackageLabel.standard,
      vehicleLabel: 'Xe tải trung',
      pickupAddress: 'An Thượng, Ngũ Hành Sơn',
      deliveryAddress: 'Cầu Rồng, Hải Châu',
      totalPrice: 390000,
      createdAt: _now.subtract(const Duration(hours: 4)),
      depositPaid: true,
      etaMinutes: 18,
      estimatedDistanceKm: 6.2,
      providerName: providerName,
      providerRating: providerRating,
      providerPlate: providerPlate,
    ),
    CustomerOrder(
      id: completedOrderId,
      orderNumber: 'DEMO-C-0001',
      customerId: MockCustomerData.userId,
      providerId: providerId,
      status: OrderStatus.completed,
      packageLabel: ServicePackageLabel.standard,
      vehicleLabel: 'Xe tải trung',
      pickupAddress: 'KTX FPT, Ngũ Hành Sơn',
      deliveryAddress: 'An Thượng, Ngũ Hành Sơn',
      totalPrice: 440000,
      createdAt: _now.subtract(const Duration(days: 3)),
      completedAt: _now.subtract(const Duration(days: 1)),
      depositPaid: true,
      providerName: providerName,
      providerRating: providerRating,
      conversationId: completedConversationId,
      hasReview: false,
    ),
    CustomerOrder(
      id: 'a1000000-0000-4000-8000-000000000006',
      orderNumber: 'DEMO-C-0002',
      customerId: MockCustomerData.userId,
      providerId: providerId,
      status: OrderStatus.completed,
      packageLabel: ServicePackageLabel.premium,
      vehicleLabel: 'Xe tải lớn',
      pickupAddress: 'Cầu Rồng, Hải Châu',
      deliveryAddress: 'Vincom Đà Nẵng, Hải Châu',
      totalPrice: 930000,
      createdAt: _now.subtract(const Duration(days: 6)),
      completedAt: _now.subtract(const Duration(days: 4)),
      depositPaid: true,
      providerName: providerName,
      providerRating: providerRating,
      hasReview: true,
    ),
    CustomerOrder(
      id: cancelledOrderId,
      orderNumber: 'DEMO-X-0001',
      customerId: MockCustomerData.userId,
      status: OrderStatus.cancelled,
      packageLabel: ServicePackageLabel.economy,
      vehicleLabel: 'Xe tải nhỏ',
      pickupAddress: 'Hòa Khánh, Liên Chiểu',
      deliveryAddress: 'Sơn Trà, Sơn Trà',
      totalPrice: 280000,
      createdAt: _now.subtract(const Duration(days: 2)),
      cancelledAt: _now.subtract(const Duration(hours: 12)),
      quoteRequest: true,
      cancellationNote: 'Khách đổi lịch — tiền cọc đã hoàn về tài khoản ngân hàng.',
    ),
  ];

  static final conversations = [
    ChatConversation(
      id: conversationId,
      orderId: activeOrderId,
      orderNumber: 'DEMO-A-0001',
      providerId: providerId,
      providerName: providerName,
      providerAvatarUrl: orders.first.providerAvatarUrl!,
      isOnline: true,
      lastMessagePreview: 'Nhà xe đã nhận đơn — chuẩn bị đúng giờ hẹn nhé!',
      lastMessageAt: DateTime.now().subtract(const Duration(minutes: 2)),
      unreadCount: 1,
    ),
    ChatConversation(
      id: completedConversationId,
      orderId: completedOrderId,
      orderNumber: 'DEMO-C-0001',
      providerId: providerId,
      providerName: providerName,
      providerAvatarUrl: orders.first.providerAvatarUrl!,
      isOnline: false,
      lastMessagePreview: 'Cảm ơn bạn, chuyến đi đã hoàn thành!',
      lastMessageAt: DateTime(2023, 10, 15, 14, 25),
      unreadCount: 0,
    ),
  ];

  static final messages = <ChatMessage>[
    ChatMessage(
      id: 'm1',
      conversationId: conversationId,
      senderId: providerId,
      senderRole: MessageSenderRole.provider,
      content: 'Chào bạn, mình đã nhận đơn DEMO-A-0001. Sẽ có mặt đúng giờ hẹn.',
      createdAt: DateTime.now().subtract(const Duration(hours: 1, minutes: 5)),
    ),
    ChatMessage(
      id: 'm2',
      conversationId: conversationId,
      senderId: MockCustomerData.userId,
      senderRole: MessageSenderRole.customer,
      content: 'Dạ vâng đợi em 2 phút em xuống ngay ạ.',
      createdAt: DateTime.now().subtract(const Duration(hours: 1, minutes: 4)),
      isRead: true,
    ),
    ChatMessage(
      id: 'm3',
      conversationId: conversationId,
      senderId: providerId,
      senderRole: MessageSenderRole.system,
      content: 'Tài xế đang đợi tại điểm đón của bạn.',
      createdAt: DateTime.now().subtract(const Duration(minutes: 30)),
      messageType: ChatMessageType.orderUpdate,
    ),
  ];

  static TrackingSnapshot trackingFor(String orderId) {
    final order = orderById(orderId) ?? orders.first;
    return OrderApiMapper.trackingFromOrder(order);
  }
}
