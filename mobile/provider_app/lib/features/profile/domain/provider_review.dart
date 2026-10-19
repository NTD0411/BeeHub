class ProviderReviewSummary {
  const ProviderReviewSummary({
    required this.averageRating,
    required this.totalReviews,
    required this.rating5Count,
    required this.rating4Count,
    required this.rating3Count,
    required this.rating2Count,
    required this.rating1Count,
    required this.avgServiceQuality,
    required this.avgPunctuality,
    required this.avgProfessionalism,
    required this.avgValueForMoney,
    required this.responseRate,
  });

  final double averageRating;
  final int totalReviews;
  final int rating5Count;
  final int rating4Count;
  final int rating3Count;
  final int rating2Count;
  final int rating1Count;
  final double avgServiceQuality;
  final double avgPunctuality;
  final double avgProfessionalism;
  final double avgValueForMoney;
  final double responseRate;

  int countForStar(int star) => switch (star) {
        5 => rating5Count,
        4 => rating4Count,
        3 => rating3Count,
        2 => rating2Count,
        1 => rating1Count,
        _ => 0,
      };

  double fractionForStar(int star) =>
      totalReviews == 0 ? 0 : countForStar(star) / totalReviews;
}

class ProviderReview {
  const ProviderReview({
    required this.id,
    required this.orderNumber,
    required this.customerName,
    required this.rating,
    required this.comment,
    required this.createdAt,
    this.title,
    this.tags = const [],
    this.serviceQuality,
    this.punctuality,
    this.professionalism,
    this.valueForMoney,
    this.providerResponse,
    this.providerRespondedAt,
  });

  final String id;
  final String orderNumber;
  final String customerName;
  final int rating;
  final String? title;
  final String comment;
  final List<String> tags;
  final DateTime createdAt;
  final int? serviceQuality;
  final int? punctuality;
  final int? professionalism;
  final int? valueForMoney;
  final String? providerResponse;
  final DateTime? providerRespondedAt;
}
