import 'package:flutter/material.dart';

import '../../../core/auth/auth_token_storage.dart';
import '../../../core/config/dev_config.dart';
import '../../../core/constants/app_images.dart';
import '../../../core/mock/mock_auth_session.dart';
import '../../../core/network/api_client.dart';
import '../domain/booking_models.dart';

class BookingMockRepository {
  BookingMockRepository({ApiClient? api}) : _api = api ?? ApiClient.instance;

  final ApiClient _api;

  Future<bool> _useMockData() async {
    if (DevConfig.useMockAuth && await MockAuthSession.isSignedIn()) return true;
    return !(await AuthTokenStorage.instance.hasSession());
  }

  static const _mockRecentPlaces = [
      RecentPlace(
        id: '1',
        title: 'KTX ĐH Đà Nẵng',
        subtitle: 'Ngũ Hành Sơn, Đà Nẵng',
        icon: Icons.history,
      ),
      RecentPlace(
        id: '2',
        title: '35 Nguyễn Minh Châu',
        subtitle: 'Ngũ Hành Sơn, Đà Nẵng',
        icon: Icons.work_outline,
      ),
      RecentPlace(
        id: '3',
        title: 'Chung cư Monarchy',
        subtitle: 'Ngũ Hành Sơn, Đà Nẵng',
        icon: Icons.home_outlined,
      ),
      RecentPlace(
        id: '4',
        title: '254 Nguyễn Văn Linh',
        subtitle: 'Thanh Khê, Đà Nẵng',
        icon: Icons.apartment_outlined,
      ),
  ];

  static const _defaultComboHint =
      'Combo — giá niêm yết, không chờ báo giá. Bước sau: mô tả trọ → chọn ngày giờ → chọn gói.';

  static const _defaultQuoteHint = QuoteFlowHint(
    title: 'Báo giá minh bạch',
    subtitle: 'Bước tiếp: mô tả trọ → chọn giờ → nhà xe báo giá theo khung đó.',
  );

  List<RecentPlace> _mapRecentPlaces(List raw) {
    return raw.asMap().entries.map((entry) {
      final j = Map<String, dynamic>.from(entry.value as Map);
      final address = j['address'] as String? ?? '';
      return RecentPlace(
        id: 'rp-${entry.key}-$address',
        title: j['title'] as String? ?? address,
        subtitle: address,
        icon: Icons.history,
        lat: _toDouble(j['lat']),
        lng: _toDouble(j['lng']),
      );
    }).toList();
  }

  double? _toDouble(dynamic value) {
    if (value == null) return null;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString());
  }

  Future<BookingLocationsPayload> fetchBookingLocations() async {
    if (await _useMockData()) {
      await Future<void>.delayed(const Duration(milliseconds: 200));
      return BookingLocationsPayload(
        recentPlaces: _mockRecentPlaces,
        comboFlowHint: _defaultComboHint,
        quoteFlowHint: _defaultQuoteHint,
      );
    }

    try {
      final envelope = await _api.guard(() => _api.get('/customers/me/booking-locations'));
      final data = envelope['data'];
      if (data is! Map) {
        return const BookingLocationsPayload(
          comboFlowHint: _defaultComboHint,
          quoteFlowHint: _defaultQuoteHint,
        );
      }
      final j = Map<String, dynamic>.from(data);
      final pickup = j['default_pickup'];
      String? defaultPickup;
      double? defaultPickupLat;
      double? defaultPickupLng;
      if (pickup is Map) {
        final p = Map<String, dynamic>.from(pickup);
        defaultPickup = p['address'] as String? ?? p['title'] as String?;
        defaultPickupLat = _toDouble(p['lat']);
        defaultPickupLng = _toDouble(p['lng']);
      }
      final recentRaw = j['recent_places'];
      final recent = recentRaw is List ? _mapRecentPlaces(recentRaw) : <RecentPlace>[];
      final quoteRaw = j['quote_flow_hint'];
      QuoteFlowHint? quoteHint;
      if (quoteRaw is Map) {
        final q = Map<String, dynamic>.from(quoteRaw);
        quoteHint = QuoteFlowHint(
          title: q['title'] as String? ?? _defaultQuoteHint.title,
          subtitle: q['subtitle'] as String? ?? _defaultQuoteHint.subtitle,
        );
      }
      return BookingLocationsPayload(
        defaultPickup: defaultPickup,
        defaultPickupLat: defaultPickupLat,
        defaultPickupLng: defaultPickupLng,
        recentPlaces: recent,
        comboFlowHint: j['combo_flow_hint'] as String? ?? _defaultComboHint,
        quoteFlowHint: quoteHint ?? _defaultQuoteHint,
        mapPreviewUrl: j['map_preview_url'] as String?,
      );
    } catch (_) {
      return const BookingLocationsPayload(
        comboFlowHint: _defaultComboHint,
        quoteFlowHint: _defaultQuoteHint,
      );
    }
  }

  Future<List<RecentPlace>> fetchRecentPlaces() async {
    final payload = await fetchBookingLocations();
    return payload.recentPlaces;
  }

  Future<void> clearRecentPlaces() async {
    if (await _useMockData()) return;
    try {
      await _api.guard(() => _api.delete('/customers/me/recent-places'));
    } catch (_) {}
  }

  /// Lưu địa chỉ vào recent — POST /customers/me/recent-places
  Future<RecentPlace?> saveRecentPlace({
    required String address,
    required String title,
    double? lat,
    double? lng,
  }) async {
    final trimmed = address.trim();
    if (trimmed.isEmpty) return null;
    if (await _useMockData()) {
      return RecentPlace(
        id: 'mock-$trimmed',
        title: title,
        subtitle: trimmed,
        icon: Icons.history,
        lat: lat,
        lng: lng,
      );
    }
    try {
      final envelope = await _api.guard(
        () => _api.post('/customers/me/recent-places', body: {
          'title': title,
          'address': trimmed,
          if (lat != null) 'lat': lat,
          if (lng != null) 'lng': lng,
        }),
      );
      final data = envelope['data'];
      if (data is Map) {
        final j = Map<String, dynamic>.from(data);
        return RecentPlace(
          id: 'saved-$trimmed',
          title: j['title'] as String? ?? title,
          subtitle: j['address'] as String? ?? trimmed,
          icon: Icons.history,
          lat: _toDouble(j['lat']),
          lng: _toDouble(j['lng']),
        );
      }
    } catch (_) {}
    return null;
  }

  /// Lưu điểm đi mặc định — PATCH /customers/me (default_pickup_address).
  Future<void> saveDefaultPickup(String address) async {
    final trimmed = address.trim();
    if (trimmed.isEmpty || await _useMockData()) return;
    try {
      await _api.guard(
        () => _api.patch('/customers/me', body: {'default_pickup_address': trimmed}),
      );
    } catch (_) {}
  }

  /// Combo chuyển trọ — chưa có API backend; giữ mock.
  Future<List<ServicePackage>> fetchPackages() async {
    await Future<void>.delayed(const Duration(milliseconds: 180));
    return const [
      ServicePackage(
        tier: ServiceTier.economy,
        label: 'Combo nhẹ',
        subtitle: 'Ít đồ · gợi ý 1 người',
        badge: 'TIẾT KIỆM',
        popular: false,
        transportBasePrice: 134000,
        laborSuggested: 1,
        maxLaborCount: 3,
        includedKm: 5,
        extraKmPrice: 8000,
        extraLaborComboPrice: 65000,
        extraLaborRetailPrice: 120000,
        features: [
          PackageFeature(text: 'Vali, bàn, vài thùng — chuyến ngắn', included: true),
          PackageFeature(text: 'Xe tải ~500kg · giá niêm yết cố định', included: true),
          PackageFeature(text: 'Chọn 1–3 người khuân vác (giá combo)', included: true),
          PackageFeature(text: 'Bảo hiểm hàng hóa', included: false),
        ],
      ),
      ServicePackage(
        tier: ServiceTier.standard,
        label: 'Combo phòng trọ',
        subtitle: 'Đồ vừa · gợi ý 2 người',
        badge: 'PHỔ BIẾN',
        popular: true,
        transportBasePrice: 300000,
        laborSuggested: 2,
        maxLaborCount: 3,
        includedKm: 10,
        extraKmPrice: 7000,
        extraLaborComboPrice: 75000,
        extraLaborRetailPrice: 120000,
        features: [
          PackageFeature(text: 'Giường, tủ, bếp — đa số sinh viên', included: true),
          PackageFeature(text: 'Xe tải ~1 tấn · giá niêm yết cố định', included: true),
          PackageFeature(text: 'Chọn 1–3 người khuân vác (giá combo)', included: true),
          PackageFeature(text: 'Bảo hiểm cơ bản', included: true),
        ],
      ),
      ServicePackage(
        tier: ServiceTier.premium,
        label: 'Combo trọn gói',
        subtitle: 'Nhiều đồ · gợi ý 3 người',
        badge: 'TRỌN CHUYẾN',
        popular: false,
        transportBasePrice: 680000,
        laborSuggested: 3,
        maxLaborCount: 4,
        includedKm: 15,
        extraKmPrice: 6000,
        extraLaborComboPrice: 70000,
        extraLaborRetailPrice: 120000,
        features: [
          PackageFeature(text: 'Nhiều đồ lớn, cần đóng gói', included: true),
          PackageFeature(text: 'Xe tải ~1.5 tấn · giá niêm yết cố định', included: true),
          PackageFeature(text: 'Chọn 1–4 người khuân vác (giá combo)', included: true),
          PackageFeature(text: 'Bảo hiểm toàn diện', included: true),
        ],
      ),
    ];
  }

  /// Gói bảo hiểm — chưa có API backend; giữ mock.
  Future<List<CargoInsurancePlan>> fetchInsurancePlans() async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    return const [
      CargoInsurancePlan(
        id: 'none',
        name: 'Không mua bảo hiểm',
        tagline: 'Tự chịu rủi ro hư hỏng, mất mát',
        coverageAmount: 0,
        price: 0,
        benefits: ['Không phí thêm', 'Phù hợp đồ ít giá trị'],
        isNoCoverage: true,
      ),
      CargoInsurancePlan(
        id: 'basic',
        name: 'Bảo hiểm cơ bản',
        tagline: 'Đồ sinh viên thông thường',
        coverageAmount: 10000000,
        price: 35000,
        benefits: [
          'Bồi thường tối đa 10 triệu',
          'Hư hỏng do va chạm, rơi vỡ',
          'Xử lý qua UniMove trong 7 ngày',
        ],
      ),
      CargoInsurancePlan(
        id: 'standard',
        name: 'Bảo hiểm tiêu chuẩn',
        tagline: 'Phòng trọ đầy đủ đồ',
        coverageAmount: 30000000,
        price: 75000,
        recommended: true,
        benefits: [
          'Bồi thường tối đa 30 triệu',
          'Bao gồm thiết bị điện tử (laptop, màn hình)',
          'Ưu tiên xử lý khiếu nại 48h',
        ],
      ),
      CargoInsurancePlan(
        id: 'premium',
        name: 'Bảo hiểm toàn diện',
        tagline: 'Đồ giá trị cao, chuyến xa',
        coverageAmount: 50000000,
        price: 120000,
        benefits: [
          'Bồi thường tối đa 50 triệu',
          'Mất mát, trộm cắp trong chuyến (có biên bản)',
          'Hỗ trợ tạm ứng chi phí sửa chữa',
        ],
      ),
    ];
  }

  /// Nhà xe combo niêm yết — chưa có API backend; giữ mock.
  Future<List<PartnerOffer>> fetchComboPartners(ServiceTier tier) async {
    final all = await fetchPartners();
    return all.where((p) => p.offersCombo(tier)).toList();
  }

  /// Nhà xe linh hoạt (demo auth) — session thật dùng `ProvidersRepository.browse`.
  Future<List<PartnerOffer>> fetchPartners() async {
    await Future<void>.delayed(const Duration(milliseconds: 220));
    return [
      const PartnerOffer(
        id: 'p1',
        name: 'UniMove Test Transport',
        distanceKm: 1.2,
        rating: 4.9,
        reviewCount: 148,
        price: 250000,
        imageUrl: AppImages.partnerTruck1,
        vehicleLabel: 'Xe tải 1 tấn',
        completedTrips: 1260,
        offeredComboTiers: {ServiceTier.economy, ServiceTier.standard, ServiceTier.premium},
        comboLaborUnitPrice: 60000,
        recentReviews: [
          ProviderReview(
            author: 'Ngọc A.',
            rating: 5.0,
            comment: 'Đúng giờ, bốc xếp cẩn thận, thái độ rất ổn.',
            timeAgoLabel: '2 ngày trước',
          ),
          ProviderReview(
            author: 'Tuấn K.',
            rating: 4.8,
            comment: 'Xe sạch, hỗ trợ nhiệt tình, giá minh bạch.',
            timeAgoLabel: '1 tuần trước',
          ),
          ProviderReview(
            author: 'Trâm L.',
            rating: 4.9,
            comment: 'Di chuyển nhanh, không phát sinh phí ngoài.',
            timeAgoLabel: '2 tuần trước',
          ),
          ProviderReview(
            author: 'Đức H.',
            rating: 5.0,
            comment:
                'Chuyển từ KTX lên trọ mới, đồ khá nhiều nhưng team bốc xếp rất cẩn thận. '
                'Báo giá trên app khớp với thực tế, phụ phí tầng và hẻm được giải thích rõ trước khi chốt.',
            timeAgoLabel: '3 tuần trước',
          ),
          ProviderReview(
            author: 'Lan P.',
            rating: 4.8,
            comment: 'Tài xế gọi trước 30 phút, đến đúng giờ. Máy giặt và tủ quần áo được bọc kỹ.',
            timeAgoLabel: '1 tháng trước',
          ),
        ],
      ),
      const PartnerOffer(
        id: 'p2',
        name: 'Hùng Move Express',
        distanceKm: 2.4,
        rating: 4.7,
        reviewCount: 96,
        price: 235000,
        imageUrl: AppImages.partnerTruck2,
        vehicleLabel: 'Xe tải 500kg',
        completedTrips: 840,
        offeredComboTiers: {ServiceTier.economy, ServiceTier.standard},
        comboLaborUnitPrice: 62000,
        recentReviews: [
          ProviderReview(
            author: 'Hào P.',
            rating: 4.6,
            comment: 'Giá mềm, phù hợp chuyển trọ sinh viên.',
            timeAgoLabel: '3 ngày trước',
          ),
          ProviderReview(
            author: 'Yến N.',
            rating: 4.7,
            comment: 'Đúng hẹn, hỗ trợ lên tầng khá nhanh.',
            timeAgoLabel: '6 ngày trước',
          ),
          ProviderReview(
            author: 'Minh T.',
            rating: 4.8,
            comment: 'Tư vấn rõ ràng trước khi chốt đơn.',
            timeAgoLabel: '10 ngày trước',
          ),
          ProviderReview(
            author: 'Vy T.',
            rating: 4.5,
            comment:
                'Giá rẻ hơn vài nhà xe khác. Hẻm hơi hẹp nên phải khuân bộ một đoạn nhưng '
                'đã báo phụ phí từ đầu nên mình thấy ổn. Nhìn chung phù hợp sinh viên.',
            timeAgoLabel: '2 tuần trước',
          ),
        ],
      ),
      const PartnerOffer(
        id: 'p3',
        name: 'GreenLine Moving',
        distanceKm: 3.1,
        rating: 4.8,
        reviewCount: 121,
        price: 268000,
        imageUrl: AppImages.partnerTruck1,
        vehicleLabel: 'Xe tải 1.5 tấn',
        completedTrips: 1025,
        offeredComboTiers: {ServiceTier.standard, ServiceTier.premium},
        comboLaborUnitPrice: 68000,
        recentReviews: [
          ProviderReview(
            author: 'Phương D.',
            rating: 4.9,
            comment: 'Nhân viên thân thiện, bọc đồ kỹ.',
            timeAgoLabel: '1 ngày trước',
          ),
          ProviderReview(
            author: 'Long V.',
            rating: 4.7,
            comment: 'Chuyến đi êm, tài xế xử lý đường tốt.',
            timeAgoLabel: '4 ngày trước',
          ),
          ProviderReview(
            author: 'Hạnh M.',
            rating: 4.8,
            comment: 'Tổng thể dịch vụ tốt, đáng tiền.',
            timeAgoLabel: '9 ngày trước',
          ),
          ProviderReview(
            author: 'Khoa N.',
            rating: 4.9,
            comment:
                'Xe lớn nên chở được full đồ phòng trọ một chuyến. Đánh giá chi tiết từng khoản phụ phí '
                'giúp mình so sánh dễ hơn các bên khác. Sẽ dùng lại lần sau.',
            timeAgoLabel: '2 tuần trước',
          ),
        ],
      ),
    ];
  }
}
