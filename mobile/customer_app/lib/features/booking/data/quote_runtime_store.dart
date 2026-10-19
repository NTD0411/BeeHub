import '../../../core/mock/mock_customer_data.dart';
import '../../chat/domain/chat_models.dart';
import '../../orders/domain/order_models.dart';
import '../domain/quote_models.dart';

/// Đơn + chat tạo từ luồng báo giá (mock runtime — sau nối API).
class QuoteRuntimeStore {
  QuoteRuntimeStore._();

  static final QuoteRuntimeStore instance = QuoteRuntimeStore._();

  final List<CustomerOrder> _orders = [];
  final List<ChatConversation> _conversations = [];
  final List<ChatMessage> _messages = [];

  List<CustomerOrder> get orders => List.unmodifiable(_orders);

  List<ChatConversation> get conversations => List.unmodifiable(_conversations);

  CustomerOrder? orderById(String id) {
    try {
      return _orders.firstWhere((o) => o.id == id);
    } catch (_) {
      return null;
    }
  }

  ChatConversation? conversationById(String id) {
    try {
      return _conversations.firstWhere((c) => c.id == id);
    } catch (_) {
      return null;
    }
  }

  List<ChatMessage> messagesFor(String conversationId) =>
      _messages.where((m) => m.conversationId == conversationId).toList();

  void addMessage(ChatMessage message) => _messages.add(message);

  String orderIdFor(String referenceId) => 'qr-$referenceId-order';

  String conversationIdFor(String referenceId) => 'qr-$referenceId-chat';

  /// Nhà xe xác nhận lịch — tạo đơn (accepted) + mở hội thoại in-app.
  void onProviderAccepted(QuoteRequestSnapshot snap) {
    final q = snap.confirmedQuote;
    if (q == null) return; // caller should ensure quotes are loaded

    final orderId = orderIdFor(snap.id);
    final convId = conversationIdFor(snap.id);
    final orderNumber = 'UM-${snap.id.replaceAll('QR-', '')}';

    _orders.removeWhere((o) => o.id == orderId);
    _conversations.removeWhere((c) => c.id == convId);
    _messages.removeWhere((m) => m.conversationId == convId);

    final welcome =
        'Chào bạn! ${q.providerName} đã xác nhận lịch ${snap.scheduledSlotLabel ?? ''}. '
        'Bạn có thể nhắn tin trực tiếp nếu cần điều chỉnh chi tiết trước ngày chuyển nhé.';

    _orders.add(
      CustomerOrder(
        id: orderId,
        orderNumber: orderNumber,
        customerId: MockCustomerData.userId,
        providerId: q.providerId,
        status: OrderStatus.accepted,
        packageLabel: ServicePackageLabel.standard,
        vehicleLabel: q.vehicleLabel,
        pickupAddress: snap.pickup,
        deliveryAddress: snap.destination,
        totalPrice: q.totalPrice,
        createdAt: DateTime.now(),
        providerName: q.providerName,
        providerAvatarUrl: q.imageUrl,
        providerRating: q.rating,
        providerPlate: '29A-123.45',
        conversationId: convId,
        scheduledPickupAt: snap.scheduledPickupAt,
        quoteReferenceId: snap.id,
      ),
    );

    _conversations.add(
      ChatConversation(
        id: convId,
        orderId: orderId,
        orderNumber: orderNumber,
        providerId: q.providerId,
        providerName: q.providerName,
        providerAvatarUrl: q.imageUrl,
        isOnline: true,
        lastMessagePreview: welcome,
        lastMessageAt: DateTime.now(),
        unreadCount: 1,
      ),
    );

    _messages.add(
      ChatMessage(
        id: '$convId-welcome',
        conversationId: convId,
        senderId: q.providerId,
        senderRole: MessageSenderRole.provider,
        content: welcome,
        createdAt: DateTime.now(),
        isRead: false,
      ),
    );
  }

  /// Đã đặt cọc — giữ chỗ, chờ đến ngày chuyển.
  void onDepositPaid(QuoteRequestSnapshot snap) {
    final orderId = orderIdFor(snap.id);
    final idx = _orders.indexWhere((o) => o.id == orderId);
    if (idx < 0) return;

    final o = _orders[idx];
    _orders[idx] = CustomerOrder(
      id: o.id,
      orderNumber: o.orderNumber,
      customerId: o.customerId,
      providerId: o.providerId,
      status: OrderStatus.accepted,
      packageLabel: o.packageLabel,
      vehicleLabel: o.vehicleLabel,
      pickupAddress: o.pickupAddress,
      deliveryAddress: o.deliveryAddress,
      totalPrice: o.totalPrice,
      createdAt: o.createdAt,
      providerName: o.providerName,
      providerAvatarUrl: o.providerAvatarUrl,
      providerRating: o.providerRating,
      providerPlate: o.providerPlate,
      conversationId: o.conversationId,
      scheduledPickupAt: snap.scheduledPickupAt,
      quoteReferenceId: snap.id,
    );
  }

  /// Đúng ngày chuyển — bắt đầu vận chuyển.
  void onTransportStarted(String orderId, String conversationId) {
    final idx = _orders.indexWhere((o) => o.id == orderId);
    if (idx < 0) return;

    final o = _orders[idx];
    _orders[idx] = CustomerOrder(
      id: o.id,
      orderNumber: o.orderNumber,
      customerId: o.customerId,
      providerId: o.providerId,
      status: OrderStatus.pickingUp,
      packageLabel: o.packageLabel,
      vehicleLabel: o.vehicleLabel,
      pickupAddress: o.pickupAddress,
      deliveryAddress: o.deliveryAddress,
      totalPrice: o.totalPrice,
      createdAt: o.createdAt,
      providerName: o.providerName,
      providerAvatarUrl: o.providerAvatarUrl,
      providerRating: o.providerRating,
      providerPlate: o.providerPlate,
      conversationId: o.conversationId,
      scheduledPickupAt: o.scheduledPickupAt,
      quoteReferenceId: o.quoteReferenceId,
      etaMinutes: 30,
      estimatedDistanceKm: 5.2,
    );

    const systemMsg =
        'Đơn đã bắt đầu vận chuyển. Tài xế sẽ liên hệ qua chat khi đến điểm đón.';
    _messages.add(
      ChatMessage(
        id: '$conversationId-start',
        conversationId: conversationId,
        senderId: o.providerId ?? 'system',
        senderRole: MessageSenderRole.system,
        content: systemMsg,
        createdAt: DateTime.now(),
        messageType: ChatMessageType.orderUpdate,
      ),
    );

    final convIdx = _conversations.indexWhere((c) => c.id == conversationId);
    if (convIdx >= 0) {
      final conv = _conversations[convIdx];
      _conversations[convIdx] = ChatConversation(
        id: conv.id,
        orderId: conv.orderId,
        orderNumber: conv.orderNumber,
        providerId: conv.providerId,
        providerName: conv.providerName,
        providerAvatarUrl: conv.providerAvatarUrl,
        isOnline: conv.isOnline,
        lastMessagePreview: systemMsg,
        lastMessageAt: DateTime.now(),
        unreadCount: conv.unreadCount + 1,
      );
    }
  }
}
