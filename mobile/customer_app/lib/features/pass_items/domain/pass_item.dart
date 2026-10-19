import '../../orders/domain/checkout_models.dart';

enum PassItemStatus { open, reserved, completed, hidden }

enum PassItemCondition { likeNew, good, fair }

extension PassItemConditionX on PassItemCondition {
  String get label => switch (this) {
        PassItemCondition.likeNew => 'Như mới',
        PassItemCondition.good => 'Còn tốt',
        PassItemCondition.fair => 'Cũ nhẹ',
      };
}

extension PassItemStatusX on PassItemStatus {
  String get label => switch (this) {
        PassItemStatus.open => 'Đang mở',
        PassItemStatus.reserved => 'Đang giữ chỗ',
        PassItemStatus.completed => 'Đã pass',
        PassItemStatus.hidden => 'Đã ẩn',
      };
}

class PassItemPost {
  const PassItemPost({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    required this.condition,
    required this.area,
    this.provinceId = '',
    required this.price,
    required this.imageUrl,
    this.images = const [],
    required this.usageDuration,
    required this.posterName,
    required this.posterContact,
    this.posterId = '',
    this.posterAvatarUrl,
    required this.status,
    required this.createdAt,
    this.isNegotiable = false,
    this.isMine = false,
    this.interestedCount = 0,
    this.dealConfirmed = false,
    this.confirmedPrice,
    this.buyerTransportBooked = false,
    this.isRated = false,
    this.isInterested = false,
    this.feePaid = true,
  });

  final String id;
  final String title;
  final String description;
  final String category;
  final PassItemCondition condition;

  /// Khu vực / địa chỉ lấy đồ (chi tiết + tỉnh/thành).
  final String area;

  /// Mã tỉnh/thành phố ([PassItemProvince.id]).
  final String provinceId;

  /// 0 = tặng miễn phí.
  final int price;
  final String imageUrl;

  /// Tất cả ảnh; [imageUrl] là ảnh bìa (phần tử đầu tiên).
  final List<String> images;

  /// Thời gian đã sử dụng (vd "6 tháng").
  final String usageDuration;
  final String posterName;
  final String posterContact;
  final String posterId;
  final String? posterAvatarUrl;
  final PassItemStatus status;
  final DateTime createdAt;
  final bool isNegotiable;
  final bool isMine;
  final int interestedCount;

  /// Người bán đã chốt đơn trong chat — người mua mới được đặt xe.
  final bool dealConfirmed;

  /// Giá đã chốt (nếu có), null thì dùng [price] hiển thị.
  final int? confirmedPrice;

  /// Người mua đã tiếp tục đặt xe — người bán không được huỷ chốt.
  final bool buyerTransportBooked;

  /// Buyer đã gửi đánh giá cho giao dịch này.
  final bool isRated;

  /// Người dùng hiện tại đã bấm "Tôi muốn nhận" cho tin này.
  final bool isInterested;

  /// Đã thanh toán phí đăng tin (nếu có).
  final bool feePaid;

  bool get isFree => price <= 0;

  bool get pendingListingFee => isMine && !feePaid && !isFree;

  int get effectivePrice => confirmedPrice ?? price;

  bool get sellerCanCancelDeal => isMine && dealConfirmed && !buyerTransportBooked;

  PassItemPost copyWith({
    String? title,
    String? description,
    String? category,
    PassItemCondition? condition,
    String? area,
    String? provinceId,
    int? price,
    String? imageUrl,
    List<String>? images,
    String? usageDuration,
    PassItemStatus? status,
    bool? isNegotiable,
    int? interestedCount,
    bool? dealConfirmed,
    int? confirmedPrice,
    bool? buyerTransportBooked,
    bool? isRated,
    bool? isInterested,
    bool? feePaid,
    bool clearConfirmedPrice = false,
  }) {
    return PassItemPost(
      id: id,
      title: title ?? this.title,
      description: description ?? this.description,
      category: category ?? this.category,
      condition: condition ?? this.condition,
      area: area ?? this.area,
      provinceId: provinceId ?? this.provinceId,
      price: price ?? this.price,
      imageUrl: imageUrl ?? this.imageUrl,
      images: images ?? this.images,
      usageDuration: usageDuration ?? this.usageDuration,
      posterName: posterName,
      posterContact: posterContact,
      posterId: posterId,
      posterAvatarUrl: posterAvatarUrl,
      status: status ?? this.status,
      createdAt: createdAt,
      isNegotiable: isNegotiable ?? this.isNegotiable,
      isMine: isMine,
      interestedCount: interestedCount ?? this.interestedCount,
      dealConfirmed: dealConfirmed ?? this.dealConfirmed,
      confirmedPrice: clearConfirmedPrice ? null : (confirmedPrice ?? this.confirmedPrice),
      buyerTransportBooked: buyerTransportBooked ?? this.buyerTransportBooked,
      isRated: isRated ?? this.isRated,
      isInterested: isInterested ?? this.isInterested,
      feePaid: feePaid ?? this.feePaid,
    );
  }
}

class CreateListingResult {
  const CreateListingResult({
    required this.post,
    required this.listingFee,
    required this.requiresPayment,
  });

  final PassItemPost post;
  final int listingFee;
  final bool requiresPayment;
}

class ListingFeePayResult {
  const ListingFeePayResult({
    this.listing,
    this.feePaid = 0,
    this.paymentMethod = 'payos',
    this.alreadyPaid = false,
    this.payosPayment,
  });

  final PassItemPost? listing;
  final int feePaid;
  final String paymentMethod;
  final bool alreadyPaid;
  final DepositPaymentInfo? payosPayment;
}

abstract final class PassItemCategories {
  static const all = <String>[
    'Nội thất',
    'Điện tử',
    'Gia dụng',
    'Sách & VPP',
    'Quần áo',
    'Khác',
  ];
}
