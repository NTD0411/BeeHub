import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/network/api_client.dart';
import '../../data/provider_chat_repository.dart';
import '../../domain/chat_models.dart';
import '../../../orders/presentation/providers/orders_providers.dart';

final providerChatRepositoryProvider = Provider<ProviderChatRepository>((ref) {
  return ProviderChatRepository(ref.watch(apiClientProvider));
});

final providerChatThreadsProvider = FutureProvider.autoDispose<List<ProviderChatThread>>((ref) async {
  final orders = await ref.watch(providerOrdersListProvider.future);
  return ref.watch(providerChatRepositoryProvider).buildThreads(orders);
});

final providerChatMessagesProvider =
    FutureProvider.autoDispose.family<List<ProviderChatMessage>, String>((ref, threadId) async {
  return ref.watch(providerChatRepositoryProvider).fetchMessages(threadId);
});
