import '../../orders/domain/provider_order.dart';

enum MessageSenderRole { customer, provider, system }

enum ChatMessageType { text, system, orderUpdate }

/// Hội thoại gắn với một đơn — provider chỉ chat khi đơn còn mở.
class ProviderChatThread {
  const ProviderChatThread({
    required this.id,
    required this.orderId,
    required this.orderNumber,
    required this.customerId,
    required this.customerName,
    required this.orderStatus,
    required this.statusCode,
    required this.canSendMessages,
    required this.lastMessagePreview,
    required this.lastMessageAt,
    required this.unreadCount,
    required this.pickupShort,
  });

  final String id;
  final String orderId;
  final String orderNumber;
  final String customerId;
  final String customerName;
  final String orderStatus;
  final String statusCode;
  final bool canSendMessages;

  bool get isOrderPending => statusCode == 'pending' || statusCode == 'matched';
  bool get isOrderRunning =>
      statusCode == 'accepted' || statusCode == 'picking_up' || statusCode == 'in_progress';
  final String lastMessagePreview;
  final DateTime lastMessageAt;
  final int unreadCount;
  final String pickupShort;

  static String threadIdFor(String orderId) => 'order-$orderId';

  factory ProviderChatThread.fromOrder(ProviderOrder order, {
    required String customerName,
    required String lastPreview,
    required DateTime lastAt,
    int unreadCount = 0,
  }) {
    return ProviderChatThread(
      id: threadIdFor(order.id),
      orderId: order.id,
      orderNumber: order.orderNumber ?? order.id.substring(0, 8),
      customerId: order.customerId ?? '',
      customerName: customerName,
      orderStatus: order.statusLabel,
      statusCode: order.status,
      canSendMessages: order.canSendChat,
      lastMessagePreview: lastPreview,
      lastMessageAt: lastAt,
      unreadCount: unreadCount,
      pickupShort: order.pickupAddress,
    );
  }
}

class ProviderChatMessage {
  const ProviderChatMessage({
    required this.id,
    required this.threadId,
    required this.senderRole,
    required this.content,
    required this.createdAt,
    this.messageType = ChatMessageType.text,
  });

  final String id;
  final String threadId;
  final MessageSenderRole senderRole;
  final String content;
  final DateTime createdAt;
  final ChatMessageType messageType;

  bool get isMine => senderRole == MessageSenderRole.provider;
  bool get isSystem => senderRole == MessageSenderRole.system || messageType != ChatMessageType.text;
}

/// Lọc hội thoại tab Tin nhắn.
enum MessageInboxFilter {
  all('Tất cả'),
  unread('Chưa đọc'),
  pending('Chờ nhận'),
  running('Đang chạy'),
  archived('Đã kết thúc');

  const MessageInboxFilter(this.label);
  final String label;

  String get id => name;

  bool matches(ProviderChatThread t) => switch (this) {
        MessageInboxFilter.all => true,
        MessageInboxFilter.unread => t.unreadCount > 0,
        MessageInboxFilter.pending => t.isOrderPending && t.canSendMessages,
        MessageInboxFilter.running => t.isOrderRunning,
        MessageInboxFilter.archived => !t.canSendMessages,
      };
}
