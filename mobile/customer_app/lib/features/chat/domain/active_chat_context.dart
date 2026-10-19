import '../../orders/domain/order_models.dart';
import 'chat_models.dart';

/// Chat chỉ khả dụng khi có đơn đang chạy + đã có tài xế (giống Grab).
class ActiveChatContext {
  const ActiveChatContext({
    required this.order,
    required this.conversation,
  });

  final CustomerOrder order;
  final ChatConversation conversation;

  /// Chỉ đơn đang thực hiện (đã chốt + chưa hoàn thành) mới được nhắn tin.
  static bool orderAllowsChat(CustomerOrder order) {
    if (order.providerId == null) return false;
    return order.status == OrderStatus.accepted ||
        order.status == OrderStatus.pickingUp ||
        order.status == OrderStatus.inProgress;
  }

  /// Lý do không gửi được tin — tránh trao đổi ngoài app sau khi hoàn thành.
  static String? chatBlockReason(CustomerOrder order) {
    if (orderAllowsChat(order)) return null;
    return switch (order.status) {
      OrderStatus.completed =>
        'Đơn đã hoàn thành — không nhắn tin thêm để bảo vệ giao dịch trên UniMove.',
      OrderStatus.cancelled || OrderStatus.disputed =>
        'Đơn đã kết thúc — chỉ xem lại tin nhắn.',
      OrderStatus.pending =>
        'Chưa chốt nhà xe — chat mở khi nhà xe xác nhận lịch.',
      _ => 'Chat chỉ khả dụng khi đơn đang thực hiện.',
    };
  }

  String get statusLabel => switch (order.status) {
        OrderStatus.accepted => 'Tài xế đã nhận đơn',
        OrderStatus.pickingUp => 'Tài xế đang đến',
        OrderStatus.inProgress => 'Đang vận chuyển',
        _ => 'Đang xử lý',
      };
}
