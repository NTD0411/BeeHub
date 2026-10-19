import '../../../core/constants/app_images.dart';
import '../../../core/network/api_client.dart';
import '../../booking/domain/quote_models.dart';

class OrderQuotesRepository {
  OrderQuotesRepository({ApiClient? api}) : _api = api ?? ApiClient.instance;

  final ApiClient _api;

  Future<List<ProviderQuoteResponse>> fetchQuotes(String orderId) async {
    final envelope = await _api.guard(() => _api.get('/orders/$orderId/quotes'));
    final raw = envelope['data'];
    if (raw is! List) return [];

    return raw
        .map((e) => _fromApiJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }

  Future<void> selectQuote({
    required String orderId,
    required String quoteId,
  }) async {
    await _api.guard(
      () => _api.post('/orders/$orderId/quotes/$quoteId/select'),
    );
  }

  static ProviderQuoteResponse _fromApiJson(Map<String, dynamic> json) {
    final surchargesRaw = json['surcharges'];
    final surcharges = surchargesRaw is List
        ? surchargesRaw
            .whereType<Map>()
            .map(
              (s) => QuoteSurchargeLine(
                label: s['label'] as String? ?? 'Phụ phí',
                amount: ((s['amount'] as num?) ?? 0).round(),
              ),
            )
            .toList()
        : <QuoteSurchargeLine>[];

    final scheduleFit = _scheduleFitFromApi(json['schedule_fit'] as String?);
    final proposedAt = json['proposed_pickup_at'] != null
        ? DateTime.tryParse(json['proposed_pickup_at'] as String)
        : null;

    final vehicle = json['vehicle_label'] as String? ?? 'medium_truck';
    final vehicleLabel = switch (vehicle) {
      'motorbike' => 'Xe máy',
      'small_truck' => 'Xe tải nhỏ',
      'large_truck' => 'Xe tải lớn',
      _ => 'Xe tải trung',
    };

    return ProviderQuoteResponse(
      id: json['id'] as String,
      providerId: json['provider_id'] as String,
      providerName: json['provider_name'] as String? ?? 'Nhà xe',
      rating: (json['provider_rating'] as num?)?.toDouble() ?? 4.5,
      reviewCount: ((json['provider_review_count'] as num?) ?? 0).round(),
      completedTrips: ((json['provider_completed_trips'] as num?) ?? 0).round(),
      vehicleLabel: vehicleLabel,
      distanceKm: 3.0,
      imageUrl: json['provider_avatar_url'] as String? ?? AppImages.partnerTruck1,
      basePrice: ((json['base_price'] as num?) ?? 0).round(),
      surcharges: surcharges,
      note: json['note'] as String? ?? '',
      scheduleFit: scheduleFit,
      proposedPickupAt: proposedAt,
      proposedPickupLabel:
          proposedAt != null ? formatQuotePickupLabel(proposedAt) : null,
    );
  }

  static QuoteScheduleFit _scheduleFitFromApi(String? value) => switch (value) {
        'alternate_proposed' => QuoteScheduleFit.alternateProposed,
        'unavailable' => QuoteScheduleFit.unavailable,
        _ => QuoteScheduleFit.exactMatch,
      };
}
