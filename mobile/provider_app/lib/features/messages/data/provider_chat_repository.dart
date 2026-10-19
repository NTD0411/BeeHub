import '../../../core/auth/auth_token_storage.dart';
import '../../../core/mock/mock_provider_data.dart';
import '../../../core/mock/mock_provider_messages.dart';
import '../../../core/network/api_client.dart';
import '../../orders/domain/provider_order.dart';
import '../domain/chat_models.dart';

class ProviderChatRepository {
  ProviderChatRepository(this._api);

  final ApiClient _api;

  // ── Conversations list ─────────────────────────────────────────────────────

  Future<List<ProviderChatThread>> buildThreads(List<ProviderOrder> orders) async {
    if (await AuthTokenStorage.instance.isMockSession()) {
      return _buildMockThreads(orders);
    }
    try {
      final envelope = await _api.guard(() => _api.get('/conversations'));
      final list = (envelope['data'] as List<dynamic>? ?? []);
      return list
          .map((e) => _threadFromApi(e as Map<String, dynamic>))
          .whereType<ProviderChatThread>()
          .toList();
    } catch (_) {
      return _buildMockThreads(orders);
    }
  }

  ProviderChatThread? _threadFromApi(Map<String, dynamic> j) {
    final orderId = j['order_id'] as String?;
    if (orderId == null) return null;

    final order = j['order'] as Map<String, dynamic>?;
    final counterpart = j['counterpart'] as Map<String, dynamic>?;
    final statusCode = order?['status'] as String? ?? 'pending';

    return ProviderChatThread(
      id: ProviderChatThread.threadIdFor(orderId),
      orderId: orderId,
      orderNumber: order?['id']?.toString().substring(0, 8) ?? orderId.substring(0, 8),
      customerId: counterpart?['id'] as String? ?? '',
      customerName: counterpart?['full_name'] as String? ?? 'Khách hàng',
      orderStatus: _statusLabel(statusCode),
      statusCode: statusCode,
      canSendMessages: _canSend(statusCode),
      lastMessagePreview: j['last_message_preview'] as String? ?? 'Chưa có tin nhắn',
      lastMessageAt: j['last_message_at'] != null
          ? DateTime.tryParse(j['last_message_at'] as String) ?? DateTime.now()
          : DateTime.now(),
      unreadCount: (j['unread_count'] as num?)?.toInt() ?? 0,
      pickupShort: '',
    );
  }

  static String _statusLabel(String code) => switch (code) {
        'pending' => 'Chờ nhận',
        'in_progress' => 'Đang chạy',
        'completed' => 'Hoàn thành',
        'cancelled' => 'Đã hủy',
        _ => code,
      };

  static bool _canSend(String code) =>
      code == 'pending' || code == 'in_progress' || code == 'accepted';

  // ── Messages ───────────────────────────────────────────────────────────────

  Future<List<ProviderChatMessage>> fetchMessages(String threadId) async {
    if (await AuthTokenStorage.instance.isMockSession()) {
      await Future<void>.delayed(const Duration(milliseconds: 120));
      return MockProviderMessages.messagesFor(threadId);
    }
    final orderId = threadId.startsWith('order-') ? threadId.substring(6) : threadId;
    try {
      final envelope =
          await _api.guard(() => _api.get('/conversations/$orderId/messages'));
      final data = envelope['data'] as Map<String, dynamic>?;
      final msgs = data?['messages'] as List<dynamic>? ?? [];
      return msgs.map((e) => _messageFromApi(e as Map<String, dynamic>, threadId)).toList();
    } catch (_) {
      return MockProviderMessages.messagesFor(threadId);
    }
  }

  ProviderChatMessage _messageFromApi(Map<String, dynamic> j, String threadId) {
    final isMine = j['is_mine'] as bool? ?? false;
    return ProviderChatMessage(
      id: j['id'] as String,
      threadId: threadId,
      senderRole: isMine ? MessageSenderRole.provider : MessageSenderRole.customer,
      content: j['content'] as String? ?? '',
      createdAt: j['created_at'] != null
          ? DateTime.tryParse(j['created_at'] as String) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  // ── Send ───────────────────────────────────────────────────────────────────

  Future<ProviderChatMessage> sendMessage({
    required String threadId,
    required String content,
    required bool canSend,
  }) async {
    if (!canSend) {
      throw StateError('Đơn đã kết thúc — chỉ được xem lại tin nhắn.');
    }
    if (await AuthTokenStorage.instance.isMockSession()) {
      await Future<void>.delayed(const Duration(milliseconds: 80));
      final msg = ProviderChatMessage(
        id: 'local-${DateTime.now().millisecondsSinceEpoch}',
        threadId: threadId,
        senderRole: MessageSenderRole.provider,
        content: content,
        createdAt: DateTime.now(),
      );
      MockProviderMessages.appendMessage(msg);
      return msg;
    }
    final orderId = threadId.startsWith('order-') ? threadId.substring(6) : threadId;
    final envelope = await _api.guard(
      () => _api.post('/conversations/$orderId/messages', body: {'content': content}),
    );
    final data = envelope['data'] as Map<String, dynamic>;
    return ProviderChatMessage(
      id: data['id'] as String,
      threadId: threadId,
      senderRole: MessageSenderRole.provider,
      content: data['content'] as String? ?? content,
      createdAt: data['created_at'] != null
          ? DateTime.tryParse(data['created_at'] as String) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  // ── Mock fallback ──────────────────────────────────────────────────────────

  List<ProviderChatThread> _buildMockThreads(List<ProviderOrder> orders) {
    MockProviderMessages.ensureSeeded(orders);
    final threads = <ProviderChatThread>[];
    for (final o in orders) {
      if (o.customerId == null || o.customerId!.isEmpty) continue;
      final tid = ProviderChatThread.threadIdFor(o.id);
      final meta = MockProviderMessages.metaFor(tid);
      if (meta == null) continue;
      threads.add(ProviderChatThread.fromOrder(
        o,
        customerName: MockProviderData.customerNameOf(o.customerId),
        lastPreview: meta.preview,
        lastAt: meta.lastAt,
        unreadCount: meta.unread,
      ));
    }
    threads.sort((a, b) => b.lastMessageAt.compareTo(a.lastMessageAt));
    return threads;
  }
}
