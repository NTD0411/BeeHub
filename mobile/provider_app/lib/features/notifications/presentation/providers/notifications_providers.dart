import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/provider_notifications_repository.dart';
import '../../domain/provider_notification_models.dart';

final providerNotificationsRepositoryProvider =
    Provider((ref) => ProviderNotificationsRepository());

final providerNotificationsProvider = FutureProvider<List<ProviderNotification>>((ref) async {
  return ref.read(providerNotificationsRepositoryProvider).fetchInbox();
});

final providerUnreadNotificationsProvider = FutureProvider<int>((ref) async {
  return ref.read(providerNotificationsRepositoryProvider).unreadCount();
});
