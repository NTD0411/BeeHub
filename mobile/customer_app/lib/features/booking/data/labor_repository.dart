import '../domain/booking_models.dart';

class LaborRepository {
  Future<LaborServiceInfo> fetchServiceInfo() async {
    await Future<void>.delayed(const Duration(milliseconds: 80));
    return const LaborServiceInfo(
      title: 'Thêm khuân vác vào đơn',
      description:
          'Đã đặt xe nhưng quên thuê người khuân? Bạn có thể bổ sung vào đơn chuyển trọ — '
          'chỉ với đội khuân vác của nhà xe đã đặt.',
      benefits: [
        'Chỉ thêm sau khi đã có đơn vận chuyển',
        'Đội khuân vác do chính nhà xe cung cấp — phối hợp đồng bộ',
        'Minh bạch số người · giờ · phụ phí tầng',
        'Cọc qua UniMove — giữ an toàn đến khi hoàn thành',
      ],
      minPrice: LaborPricing.perHelperPerHour,
    );
  }

  /// Báo giá từ nhiều bên — giá do đối tác đặt, thay đổi theo cấu hình.
  Future<List<LaborProviderQuote>> fetchLaborQuotes({
    required int helperCount,
    required int laborHours,
    required int floorFee,
    bool forExistingOrder = false,
    /// Thuê riêng ngoài combo — giá cao hơn giá combo.
    bool retailMode = false,
    int? comboLaborUnitPrice,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 220));
    final unitRate = retailMode
        ? (comboLaborUnitPrice ?? LaborPricing.perHelperPerHour) + 35000
        : LaborPricing.perHelperPerHour;
    final base = helperCount * laborHours * unitRate + floorFee;

    return [
      LaborProviderQuote(
        id: 'labor-p1',
        name: 'SV Help Team ĐHQG',
        teamLabel: 'Sinh viên part-time · 4.9★',
        rating: 4.9,
        reviewCount: 328,
        price: base + 15000,
        etaMinutes: 25,
        badge: 'Gần bạn nhất',
        canCombineWithTransport: true,
      ),
      LaborProviderQuote(
        id: 'labor-p2',
        name: 'ProMove Khuân vác',
        teamLabel: 'Đội chuyên nghiệp · Bảo hiểm',
        rating: 4.8,
        reviewCount: 512,
        price: base + 45000,
        etaMinutes: 40,
        badge: forExistingOrder ? 'Phối hợp nhà xe' : 'Đề xuất',
        canCombineWithTransport: true,
      ),
      LaborProviderQuote(
        id: 'labor-p3',
        name: 'FastLift Express',
        teamLabel: 'Làm nhanh · Cuối tuần',
        rating: 4.6,
        reviewCount: 189,
        price: base - 10000,
        etaMinutes: 55,
        badge: 'Giá tốt nhất',
        canCombineWithTransport: false,
      ),
      LaborProviderQuote(
        id: 'labor-p4',
        name: 'GreenLine Movers',
        teamLabel: 'Cùng hệ sinh thái nhà xe',
        rating: 4.7,
        reviewCount: 276,
        price: base + 25000,
        etaMinutes: 35,
        canCombineWithTransport: true,
      ),
      LaborProviderQuote(
        id: 'labor-p5',
        name: 'Campus Carry 24/7',
        teamLabel: 'Ca đêm · KTX khu vực',
        rating: 4.5,
        reviewCount: 142,
        price: base + 5000,
        etaMinutes: 30,
        badge: 'Linh hoạt giờ',
        canCombineWithTransport: false,
      ),
      LaborProviderQuote(
        id: 'labor-p6',
        name: 'UniLift Partners',
        teamLabel: 'Đối tác nội bộ UniMove',
        rating: 4.85,
        reviewCount: 640,
        price: base + 35000,
        etaMinutes: 45,
        badge: forExistingOrder ? 'Đồng bộ nhà xe' : 'Uy tín cao',
        canCombineWithTransport: true,
      ),
    ]..sort((a, b) => a.price.compareTo(b.price));
  }

  /// Báo giá khuân vác từ nhà xe vận chuyển đã đặt — không dùng đối tác khác.
  Future<LaborProviderQuote> fetchTransportProviderLaborQuote({
    required String? providerId,
    required String providerName,
    required int helperCount,
    required int laborHours,
    required int floorFee,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 180));
    final unitRate = switch (providerId) {
      'p1' => 60000,
      'p2' => 62000,
      'p3' => 68000,
      _ => LaborPricing.perHelperPerHour + 10000,
    };
    final base = helperCount * laborHours * unitRate + floorFee;

    return LaborProviderQuote(
      id: 'transport-labor-${providerId ?? 'linked'}',
      name: providerName,
      teamLabel: 'Đội khuân vác của nhà xe · phối hợp cùng chuyến',
      rating: 4.8,
      reviewCount: 0,
      price: base,
      etaMinutes: 0,
      badge: 'Nhà xe bạn đã đặt',
      canCombineWithTransport: true,
    );
  }
}
