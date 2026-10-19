import '../../../core/network/api_client.dart';
import '../domain/provider_review.dart';

class ReviewsRepository {
  ReviewsRepository(this._api);
  final ApiClient _api;

  Future<List<ProviderReview>> fetchMyReviews() async {
    final envelope = await _api.guard(() => _api.get('/reviews/mine'));
    final rows = envelope['data'] as List<dynamic>? ?? [];
    return rows.map((e) => _fromApi(e as Map<String, dynamic>)).toList();
  }

  Future<String> respond(String reviewId, String response) async {
    final envelope = await _api.guard(
      () => _api.patch('/reviews/$reviewId/respond', body: {'response': response}),
    );
    final data = envelope['data'] as Map<String, dynamic>;
    return data['provider_response'] as String? ?? response;
  }

  static ProviderReview _fromApi(Map<String, dynamic> j) {
    return ProviderReview(
      id: j['id'] as String,
      orderNumber: j['order_number'] as String? ?? '—',
      customerName: j['customer_name'] as String? ?? 'Khách hàng',
      rating: (j['rating'] as num).toInt(),
      comment: j['comment'] as String? ?? '',
      title: j['title'] as String?,
      tags: (j['tags'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      serviceQuality: (j['service_quality'] as num?)?.toInt(),
      punctuality: (j['punctuality'] as num?)?.toInt(),
      professionalism: (j['professionalism'] as num?)?.toInt(),
      valueForMoney: (j['value_for_money'] as num?)?.toInt(),
      providerResponse: j['provider_response'] as String?,
      providerRespondedAt: j['provider_responded_at'] != null
          ? DateTime.tryParse(j['provider_responded_at'] as String)
          : null,
      createdAt: j['created_at'] != null
          ? DateTime.tryParse(j['created_at'] as String) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}
