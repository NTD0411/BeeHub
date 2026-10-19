import '../../../core/auth/auth_token_storage.dart';
import '../domain/active_chat_context.dart';
import '../domain/chat_models.dart';

/// Chat đơn vận chuyển — backend chưa có API; chỉ trả về rỗng khi đã đăng nhập.
class ChatRepository {
  Future<bool> _hasRealSession() => AuthTokenStorage.instance.hasSession();

  Future<List<ChatInboxEntry>> fetchInbox() async {
    if (!await _hasRealSession()) return [];
    await Future<void>.delayed(const Duration(milliseconds: 80));
    return [];
  }

  Future<int> totalUnreadCount() async => 0;

  Future<ActiveChatContext?> fetchActiveChat() async => null;

  Future<ActiveChatContext?> fetchThreadContext(String conversationId) async => null;

  Future<List<ChatMessage>> fetchMessages(String conversationId) async => [];

  Future<ChatMessage> sendMessage({
    required String conversationId,
    required String senderId,
    required String content,
  }) async {
    throw UnsupportedError('Chat đơn hàng chưa được backend hỗ trợ');
  }
}
