import 'package:flutter/material.dart';

class RecentPlace {
  const RecentPlace({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.icon,
    this.lat,
    this.lng,
  });

  final String id;
  final String title;
  final String subtitle;
  final IconData icon;
  final double? lat;
  final double? lng;
}

/// Gợi ý địa chỉ — GET /maps/places/autocomplete
class PlaceSuggestion {
  const PlaceSuggestion({
    required this.placeId,
    required this.mainText,
    required this.secondaryText,
    this.lat,
    this.lng,
  });

  final String placeId;
  final String mainText;
  final String secondaryText;
  final double? lat;
  final double? lng;

  String get displayAddress =>
      secondaryText.trim().isNotEmpty ? secondaryText.trim() : mainText.trim();
}

/// Chi tiết địa chỉ đã chọn — GET /maps/places/details
class PlaceDetails {
  const PlaceDetails({
    required this.placeId,
    required this.title,
    required this.address,
    this.lat,
    this.lng,
  });

  final String placeId;
  final String title;
  final String address;
  final double? lat;
  final double? lng;
}

/// Hint luồng báo giá (chuyến thường) — GET /customers/me/booking-locations
class QuoteFlowHint {
  const QuoteFlowHint({required this.title, required this.subtitle});

  final String title;
  final String subtitle;
}

/// Payload cho màn chọn địa điểm — GET /customers/me/booking-locations
class BookingLocationsPayload {
  const BookingLocationsPayload({
    this.defaultPickup,
    this.defaultPickupLat,
    this.defaultPickupLng,
    this.recentPlaces = const [],
    this.comboFlowHint,
    this.quoteFlowHint,
    this.mapPreviewUrl,
  });

  final String? defaultPickup;
  final double? defaultPickupLat;
  final double? defaultPickupLng;
  final List<RecentPlace> recentPlaces;
  final String? comboFlowHint;
  final QuoteFlowHint? quoteFlowHint;
  final String? mapPreviewUrl;
}

enum ServiceTier { economy, standard, premium }

class ServicePackage {
  const ServicePackage({
    required this.tier,
    required this.label,
    required this.badge,
    required this.features,
    required this.popular,
    required this.transportBasePrice,
    required this.laborSuggested,
    required this.maxLaborCount,
    required this.includedKm,
    required this.extraKmPrice,
    required this.extraLaborComboPrice,
    required this.extraLaborRetailPrice,
    this.subtitle = '',
  });

  final ServiceTier tier;
  final String label;
  final String badge;
  final List<PackageFeature> features;
  final bool popular;

  /// Giá xe + km niêm yết trên app (cố định, nhà xe combo không được báo giá phần này).
  final int transportBasePrice;

  /// Số người khuân vác gợi ý mặc định cho quy mô combo.
  final int laborSuggested;

  /// Số người khuân vác tối đa khách có thể chọn trong combo.
  final int maxLaborCount;

  /// Số km di chuyển đã bao gồm trong giá combo.
  final int includedKm;

  /// Giá mỗi km vượt quá [includedKm] — niêm yết combo (rẻ hơn đặt chuyến thường).
  final int extraKmPrice;

  /// Giá khuân vác mặc định/người trong combo (nhà xe đăng ký combo chỉ được chỉnh mục này).
  final int extraLaborComboPrice;

  /// Giá tham chiếu thuê khuân vác riêng ngoài combo (cao hơn, do đối tác đặt).
  final int extraLaborRetailPrice;

  final String subtitle;

  /// Giá tham chiếu tại [laborSuggested] người — hiển thị "từ X".
  int get referencePrice => priceAtLabor(laborSuggested);

  /// Giá tham chiếu theo số người khách chọn.
  int priceAtLabor(int laborCount) =>
      transportBasePrice + laborCount * extraLaborComboPrice;

  int get laborSavingsPerPerson => extraLaborRetailPrice - extraLaborComboPrice;
}

class PackageFeature {
  const PackageFeature({required this.text, required this.included});

  final String text;
  final bool included;
}

class PartnerOffer {
  const PartnerOffer({
    required this.id,
    required this.name,
    required this.distanceKm,
    required this.rating,
    required this.reviewCount,
    required this.price,
    required this.imageUrl,
    required this.vehicleLabel,
    this.completedTrips = 0,
    this.recentReviews = const [],
    this.offeredComboTiers = const {},
    this.comboLaborUnitPrice,
  });

  final String id;
  final String name;
  final double distanceKm;
  final double rating;
  final int reviewCount;

  /// Giá khởi điểm khi đặt chuyến thường (nhà xe báo giá). Không dùng cho combo niêm yết.
  final int price;
  final String imageUrl;
  final String vehicleLabel;
  final int completedTrips;
  final List<ProviderReview> recentReviews;

  /// Các gói combo nhà xe đã đăng ký — phải theo giá niêm yết xe/km trên app.
  final Set<ServiceTier> offeredComboTiers;

  /// Giá khuân vác/người trong combo do nhà xe đặt (mục duy nhất được chỉnh).
  final int? comboLaborUnitPrice;

  bool offersCombo(ServiceTier tier) => offeredComboTiers.contains(tier);
}

class ProviderReview {
  const ProviderReview({
    required this.author,
    required this.rating,
    required this.comment,
    required this.timeAgoLabel,
  });

  final String author;
  final double rating;
  final String comment;
  final String timeAgoLabel;
}

enum PaymentMethod { payos, momo, otherWallet }

/// Loại đặt dịch vụ — khớp `orders.requires_helpers` / `number_of_helpers`.
enum BookingServiceType { fullMove, laborOnly, laborAddon }

/// Báo giá đội khuân vác từ đối tác marketplace (UniMove trung gian).
class LaborProviderQuote {
  const LaborProviderQuote({
    required this.id,
    required this.name,
    required this.teamLabel,
    required this.rating,
    required this.reviewCount,
    required this.price,
    required this.etaMinutes,
    this.badge,
    this.canCombineWithTransport = true,
  });

  final String id;
  final String name;
  final String teamLabel;
  final double rating;
  final int reviewCount;
  final int price;
  final int etaMinutes;
  final String? badge;
  /// Có thể phối hợp cùng nhà xe / đơn chuyển trọ hiện có.
  final bool canCombineWithTransport;
}

/// Cấu hình giá khuân vác (tham chiếu seed: 50.000–100.000đ/người).
abstract final class LaborPricing {
  static const int perHelperPerHour = 75000;
  static const int perFloorNoElevator = 15000;
  static const List<int> hourOptions = [2, 4, 8];
}

class LaborServiceInfo {
  const LaborServiceInfo({
    required this.title,
    required this.description,
    required this.benefits,
    required this.minPrice,
  });

  final String title;
  final String description;
  final List<String> benefits;
  final int minPrice;
}

/// Gói bảo hiểm đồ đạc — khớp `orders.has_insurance`, `orders.insurance_value`.
class CargoInsurancePlan {
  const CargoInsurancePlan({
    required this.id,
    required this.name,
    required this.tagline,
    required this.coverageAmount,
    required this.price,
    required this.benefits,
    this.recommended = false,
    this.isNoCoverage = false,
  });

  final String id;
  final String name;
  final String tagline;

  /// Mức bồi thường tối đa (VND).
  final int coverageAmount;
  final int price;
  final List<String> benefits;
  final bool recommended;
  final bool isNoCoverage;
}

/// Đường vào trọ — nhà xe biết loại xe và phụ phí có thể phát sinh.
enum AlleyAccess {
  truckOk,
  smallOnly,
  motorbikeOnly,
  unknown;

  String get label => switch (this) {
        AlleyAccess.truckOk => 'Xe tải vào được',
        AlleyAccess.smallOnly => 'Chỉ xe nhỏ / ba gác',
        AlleyAccess.motorbikeOnly => 'Hẻm hẹp — chỉ xe máy',
        AlleyAccess.unknown => 'Chưa rõ — cần ảnh',
      };

  String get hint => switch (this) {
        AlleyAccess.truckOk => 'Đường rộng, xe tải ~1 tấn vào cổng được',
        AlleyAccess.smallOnly => 'Hẻm vừa, ba gác hoặc xe tải nhỏ',
        AlleyAccess.motorbikeOnly => 'Hẻm nhỏ, có thể phụ phí khuân bộ',
        AlleyAccess.unknown => 'Nên chụp ảnh cổng hẻm để nhà xe chuẩn bị',
      };
}

/// Khối lượng đồ ước tính trong chuyến chuyển trọ.
enum CargoVolume {
  light,
  medium,
  heavy;

  String get label => switch (this) {
        CargoVolume.light => 'Ít đồ',
        CargoVolume.medium => 'Vừa (phòng trọ thường)',
        CargoVolume.heavy => 'Nhiều đồ',
      };

  String get examples => switch (this) {
        CargoVolume.light => 'Vali, vài thùng, bàn nhỏ',
        CargoVolume.medium => 'Giường, tủ, bếp, máy giặt',
        CargoVolume.heavy => 'Full phòng trọ + tủ lớn',
      };

  bool get needsCargoPhoto => this != CargoVolume.light;
}

/// Kết quả gửi yêu cầu báo giá.
class QuoteSubmitResult {
  const QuoteSubmitResult({
    required this.referenceId,
    this.photoUploadFailed = false,
  });

  final String referenceId;
  final bool photoUploadFailed;
}

/// Nhóm ảnh theo từng mục trong form mô tả trọ.
enum DormPhotoSection {
  pickupStairs,
  pickupAlley,
  destinationStairs,
  destinationAlley,
  cargo;

  String get label => switch (this) {
        DormPhotoSection.pickupStairs => 'Ảnh cầu thang trọ cũ',
        DormPhotoSection.pickupAlley => 'Ảnh hẻm / cổng trọ cũ',
        DormPhotoSection.destinationStairs => 'Ảnh cầu thang trọ mới',
        DormPhotoSection.destinationAlley => 'Ảnh hẻm / cổng trọ mới',
        DormPhotoSection.cargo => 'Ảnh đồ cần chuyển',
      };

  bool isVisible({
    required bool pickupHasElevator,
    required AlleyAccess pickupAlley,
    required bool destinationHasElevator,
    required AlleyAccess destinationAlley,
    required CargoVolume cargoVolume,
  }) =>
      switch (this) {
        DormPhotoSection.pickupStairs => !pickupHasElevator,
        DormPhotoSection.pickupAlley => pickupAlley != AlleyAccess.truckOk,
        DormPhotoSection.destinationStairs => !destinationHasElevator,
        DormPhotoSection.destinationAlley => destinationAlley != AlleyAccess.truckOk,
        DormPhotoSection.cargo => cargoVolume.needsCargoPhoto,
      };
}
