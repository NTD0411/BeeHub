import '../../../core/auth/auth_token_storage.dart';
import '../../../core/config/dev_config.dart';
import '../../../core/constants/app_images.dart';
import '../../../core/mock/mock_auth_session.dart';
import '../../../core/network/api_client.dart';
import '../domain/booking_models.dart';

class ProvidersRepository {
  ProvidersRepository({ApiClient? api}) : _api = api ?? ApiClient.instance;

  final ApiClient _api;

  Future<bool> _useMockData() async {
    if (DevConfig.useMockAuth && await MockAuthSession.isSignedIn()) return true;
    return !(await AuthTokenStorage.instance.hasSession());
  }

  Future<List<PartnerOffer>> browse({String? city, int limit = 20}) async {
    if (await _useMockData()) return [];

    final query = <String, dynamic>{'limit': limit};
    if (city != null && city.isNotEmpty) query['city'] = city;

    final envelope = await _api.guard(
      () => _api.get('/providers/browse', queryParameters: query),
    );
    final raw = envelope['data'];
    if (raw is! List) return [];

    final images = [AppImages.partnerTruck1, AppImages.partnerTruck2];
    var i = 0;

    return raw.map((item) {
      final map = Map<String, dynamic>.from(item as Map);
      final profile = map['profiles'] is Map
          ? Map<String, dynamic>.from(map['profiles'] as Map)
          : <String, dynamic>{};
      final name = map['business_name'] as String? ??
          profile['full_name'] as String? ??
          'Đối tác';
      final basePrice = ((map['base_price'] as num?) ?? 450000).round();
      final rating = (map['rating'] as num?)?.toDouble() ?? 4.5;
      final reviewCount = ((map['review_count'] as num?) ?? (60 + i * 7)).round();
      final vehicle = map['vehicle_type'] as String? ?? 'medium_truck';
      final img = images[i % images.length];
      i++;

      return PartnerOffer(
        id: map['id'] as String,
        name: name,
        distanceKm: 2.5 + (i % 5) * 0.8,
        rating: rating,
        reviewCount: reviewCount,
        price: basePrice,
        imageUrl: profile['avatar_url'] as String? ?? img,
        vehicleLabel: _vehicleLabel(vehicle),
        completedTrips: ((map['completed_trips'] as num?) ?? 500 + i * 24).round(),
        recentReviews: _defaultReviews(name),
      );
    }).toList();
  }

  static List<ProviderReview> _defaultReviews(String name) {
    return [
      ProviderReview(
        author: 'Khách hàng A',
        rating: 4.8,
        comment: 'Dịch vụ của $name khá tốt, đúng giờ và hỗ trợ nhiệt tình.',
        timeAgoLabel: '3 ngày trước',
      ),
      const ProviderReview(
        author: 'Khách hàng B',
        rating: 4.7,
        comment: 'Giá hợp lý, không phát sinh thêm chi phí.',
        timeAgoLabel: '1 tuần trước',
      ),
      const ProviderReview(
        author: 'Khách hàng C',
        rating: 4.9,
        comment: 'Đồ đạc được bọc kỹ, đội ngũ thân thiện.',
        timeAgoLabel: '2 tuần trước',
      ),
    ];
  }

  static String _vehicleLabel(String vehicle) {
    return switch (vehicle) {
      'motorbike' => 'Xe máy',
      'small_truck' => 'Xe tải nhỏ',
      'large_truck' => 'Xe tải lớn',
      _ => 'Xe tải trung',
    };
  }
}
