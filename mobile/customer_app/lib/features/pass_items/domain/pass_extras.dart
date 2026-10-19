/// Người mua quan tâm tin pass đồ (hiển thị cho người bán).
class PassInterestedBuyer {
  const PassInterestedBuyer({
    required this.id,
    required this.name,
    required this.contact,
    required this.area,
    required this.interestedAt,
    this.note,
    this.lastMessage,
    this.unreadForSeller = 0,
  });

  final String id;
  final String name;
  final String contact;
  final String area;
  final DateTime interestedAt;
  final String? note;
  final String? lastMessage;
  final int unreadForSeller;

  PassInterestedBuyer copyWith({
    String? name,
    String? contact,
    String? area,
    String? note,
    String? lastMessage,
    int? unreadForSeller,
  }) {
    return PassInterestedBuyer(
      id: id,
      name: name ?? this.name,
      contact: contact ?? this.contact,
      area: area ?? this.area,
      interestedAt: interestedAt,
      note: note ?? this.note,
      lastMessage: lastMessage ?? this.lastMessage,
      unreadForSeller: unreadForSeller ?? this.unreadForSeller,
    );
  }
}

class PassChatMessage {
  const PassChatMessage({
    required this.text,
    required this.fromBuyer,
    required this.time,
    this.isOffer = false,
    this.offerAmount,
    this.isDealConfirm = false,
    this.isDealCancel = false,
  });

  final String text;

  /// Tin nhắn do người mua gửi (người bán đọc sẽ hiển thị bên trái).
  final bool fromBuyer;
  final String time;

  /// Tin nhắn đề nghị giá (hiển thị nổi bật).
  final bool isOffer;
  final int? offerAmount;

  /// Hệ thống: người bán đã chốt đơn, khách được đặt xe.
  final bool isDealConfirm;

  /// Hệ thống: người bán đã huỷ chốt đơn.
  final bool isDealCancel;

}

class PassTransportQuote {
  const PassTransportQuote({
    required this.id,
    required this.providerName,
    required this.vehicleLabel,
    required this.rating,
    required this.price,
    required this.etaMinutes,
    this.badge,
  });

  final String id;
  final String providerName;
  final String vehicleLabel;
  final double rating;
  final int price;
  final int etaMinutes;
  final String? badge;
}

/// Chính sách phí đăng tin pass đồ trên UniMove.
abstract final class PassListingFee {
  static const int minFee = 5000;
  static const int maxFee = 30000;
  static const double rate = 0.02; // 2% giá bán

  /// Đồ cho tặng (miễn phí) thì không tính phí đăng.
  static int compute({required int price, required bool isFree}) {
    if (isFree || price <= 0) return 0;
    final raw = (price * rate).round();
    if (raw < minFee) return minFee;
    if (raw > maxFee) return maxFee;
    return raw;
  }

  static String rateLabel =
      '2 tin đầu miễn phí · sau đó 2% giá bán (tối thiểu 5.000đ, tối đa 30.000đ)';
}
