import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/network/api_client.dart';
import '../../data/provider_orders_repository.dart';
import '../../domain/provider_order.dart';

final providerOrdersRepositoryProvider = Provider<ProviderOrdersRepository>((ref) {
  return ProviderOrdersRepository(ref.watch(apiClientProvider));
});

final providerOrdersListProvider = FutureProvider.autoDispose<List<ProviderOrder>>((ref) async {
  return ref.watch(providerOrdersRepositoryProvider).fetchOrders();
});

final providerOrderDetailProvider =
    FutureProvider.autoDispose.family<ProviderOrder, String>((ref, id) async {
  return ref.watch(providerOrdersRepositoryProvider).fetchById(id);
});

/// Chuyển tab shell + lọc đơn (từ Trang chủ).
final providerShellTabIndexProvider = StateProvider<int>((ref) => 0);
final providerOrdersFilterProvider = StateProvider<OrderInboxFilter>(
  (ref) => OrderInboxFilter.ready,
);
