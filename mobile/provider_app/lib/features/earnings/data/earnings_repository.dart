import '../../../core/auth/auth_token_storage.dart';
import '../../../core/network/api_client.dart';

class EarningsDay {
  const EarningsDay({required this.date, required this.earned, required this.orders});
  final String date;
  final int earned;
  final int orders;

  factory EarningsDay.fromJson(Map<String, dynamic> j) => EarningsDay(
        date: j['date'] as String,
        earned: (j['earned'] as num?)?.toInt() ?? 0,
        orders: (j['orders'] as num?)?.toInt() ?? 0,
      );
}

class EarningsSummary {
  const EarningsSummary({
    required this.period,
    required this.totalEarned,
    required this.totalOrders,
    required this.breakdown,
  });

  final String period;
  final int totalEarned;
  final int totalOrders;
  final List<EarningsDay> breakdown;

  factory EarningsSummary.fromJson(Map<String, dynamic> j) => EarningsSummary(
        period: j['period'] as String? ?? 'week',
        totalEarned: (j['total_earned'] as num?)?.toInt() ?? 0,
        totalOrders: (j['total_orders'] as num?)?.toInt() ?? 0,
        breakdown: (j['breakdown'] as List<dynamic>? ?? [])
            .map((e) => EarningsDay.fromJson(e as Map<String, dynamic>))
            .toList(),
      );

  static EarningsSummary empty(String period) =>
      EarningsSummary(period: period, totalEarned: 0, totalOrders: 0, breakdown: []);
}

class EarningsRepository {
  EarningsRepository(this._api);
  final ApiClient _api;

  Future<EarningsSummary> fetch(String period) async {
    if (await AuthTokenStorage.instance.isMockSession()) {
      return EarningsSummary.empty(period);
    }
    final envelope = await _api.guard(() => _api.get('/providers/me/earnings?period=$period'));
    return EarningsSummary.fromJson(envelope['data'] as Map<String, dynamic>);
  }
}
