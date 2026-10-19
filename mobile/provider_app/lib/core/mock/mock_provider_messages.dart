import '../../features/messages/domain/chat_models.dart';
import '../../features/orders/domain/provider_order.dart';
import 'mock_provider_data.dart';

/// Tin nhắn demo theo đơn — provider app.
abstract final class MockProviderMessages {
  static final Map<String, List<ProviderChatMessage>> _byThread = {};
  static final Map<String, _ThreadMeta> _meta = {};

  static void ensureSeeded(List<ProviderOrder> orders) {
    if (_byThread.isNotEmpty) return;

    for (final o in orders) {
      final tid = ProviderChatThread.threadIdFor(o.id);
      final customer = MockProviderData.customerNameOf(o.customerId);
      final now = DateTime.now();

      if (o.canSendChat) {
        _meta[tid] = _ThreadMeta(
          preview: o.isPending ? 'Khách đang chờ bạn xác nhận đơn' : 'Tôi sắp đến điểm lấy hàng',
          lastAt: now.subtract(Duration(minutes: o.isPending ? 8 : 25)),
          unread: o.isPending ? 1 : 0,
        );
        _byThread[tid] = [
          ProviderChatMessage(
            id: '${tid}-1',
            threadId: tid,
            senderRole: MessageSenderRole.customer,
            content: o.isPending
                ? 'Anh/chị nhận giúp em đơn #${o.orderNumber ?? ''} nhé ạ!'
                : 'Em đã chuẩn bị đồ xong, anh/chị đến lúc ${now.hour}:${(now.minute + 15) % 60} được không?',
            createdAt: now.subtract(const Duration(hours: 2)),
          ),
          ProviderChatMessage(
            id: '${tid}-2',
            threadId: tid,
            senderRole: MessageSenderRole.provider,
            content: o.isPending
                ? 'Dạ em xem đơn và phản hồi trong ít phút ạ.'
                : 'Dạ được, em đến đúng giờ. Gọi em khi xuống nhé.',
            createdAt: now.subtract(const Duration(hours: 1, minutes: 50)),
          ),
          if (!o.isPending)
            ProviderChatMessage(
              id: '${tid}-3',
              threadId: tid,
              senderRole: MessageSenderRole.system,
              content: 'Đơn ${o.statusLabel.toLowerCase()} · theo dõi trên bản đồ.',
              createdAt: now.subtract(const Duration(minutes: 40)),
              messageType: ChatMessageType.orderUpdate,
            ),
        ];
      } else if (o.isCompleted) {
        _meta[tid] = _ThreadMeta(
          preview: 'Cảm ơn anh/chị, chuyến đi hoàn tất!',
          lastAt: o.createdAt ?? now.subtract(const Duration(days: 2)),
          unread: 0,
        );
        _byThread[tid] = [
          ProviderChatMessage(
            id: '${tid}-1',
            threadId: tid,
            senderRole: MessageSenderRole.provider,
            content: 'Em đã giao xong đồ cho $customer. Chúc bạn ở nhà mới vui vẻ!',
            createdAt: (o.createdAt ?? now).add(const Duration(hours: 4)),
          ),
          ProviderChatMessage(
            id: '${tid}-2',
            threadId: tid,
            senderRole: MessageSenderRole.customer,
            content: 'Cảm ơn anh/chị, chuyến đi hoàn tất!',
            createdAt: (o.createdAt ?? now).add(const Duration(hours: 4, minutes: 5)),
          ),
        ];
      } else if (o.isCancelled) {
        _meta[tid] = _ThreadMeta(
          preview: 'Đơn đã hủy — chỉ xem lại tin nhắn',
          lastAt: o.createdAt ?? now.subtract(const Duration(days: 5)),
          unread: 0,
        );
        _byThread[tid] = [
          ProviderChatMessage(
            id: '${tid}-1',
            threadId: tid,
            senderRole: MessageSenderRole.system,
            content: 'Đơn ${o.statusLabel}. Không thể gửi tin nhắn mới.',
            createdAt: o.createdAt ?? now,
            messageType: ChatMessageType.system,
          ),
        ];
      }
    }
  }

  static _ThreadMeta? metaFor(String threadId) => _meta[threadId];

  static List<ProviderChatMessage> messagesFor(String threadId) =>
      List<ProviderChatMessage>.from(_byThread[threadId] ?? const []);

  static void appendMessage(ProviderChatMessage msg) {
    _byThread.putIfAbsent(msg.threadId, () => []).add(msg);
    _meta[msg.threadId] = _ThreadMeta(
      preview: msg.content,
      lastAt: msg.createdAt,
      unread: 0,
    );
  }
}

class _ThreadMeta {
  const _ThreadMeta({required this.preview, required this.lastAt, this.unread = 0});
  final String preview;
  final DateTime lastAt;
  final int unread;
}
