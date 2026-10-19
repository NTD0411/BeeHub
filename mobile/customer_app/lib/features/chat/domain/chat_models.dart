import '../../orders/domain/order_models.dart';

/// Khớp `conversations` + `messages` trong Supabase.
enum MessageSenderRole { customer, provider, system }

enum ChatMessageType { text, image, location, system, orderUpdate }

class ChatConversation {
  const ChatConversation({
    required this.id,
    required this.orderId,
    required this.orderNumber,
    required this.providerId,
    required this.providerName,
    required this.providerAvatarUrl,
    required this.isOnline,
    required this.lastMessagePreview,
    required this.lastMessageAt,
    required this.unreadCount,
  });

  final String id;
  final String orderId;
  final String orderNumber;
  final String providerId;
  final String providerName;
  final String providerAvatarUrl;
  final bool isOnline;
  final String lastMessagePreview;
  final DateTime lastMessageAt;
  final int unreadCount;
}

class ChatMessage {
  const ChatMessage({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.senderRole,
    required this.content,
    required this.createdAt,
    this.isRead = true,
    this.messageType = ChatMessageType.text,
  });

  final String id;
  final String conversationId;
  final String senderId;
  final MessageSenderRole senderRole;
  final String content;
  final DateTime createdAt;
  final bool isRead;
  final ChatMessageType messageType;

  bool get isMine => senderRole == MessageSenderRole.customer;
}

/// Một dòng trong inbox Tin nhắn — ghép `conversations` + `orders`.
class ChatInboxEntry {
  const ChatInboxEntry({
    required this.conversation,
    required this.order,
    required this.isActive,
  });

  final ChatConversation conversation;
  final CustomerOrder order;
  final bool isActive;
}
