import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/pages/login_page.dart';
import '../../features/auth/presentation/pages/register_page.dart';
import '../../features/documents/presentation/pages/documents_page.dart';
import '../../features/earnings/presentation/pages/provider_earnings_history_page.dart';
import '../../features/payments/presentation/pages/provider_payout_settings_page.dart';
import '../../features/notifications/presentation/pages/provider_notification_detail_page.dart';
import '../../features/notifications/presentation/pages/provider_notifications_page.dart';
import '../../features/profile/presentation/pages/provider_reviews_page.dart';
import '../../features/profile/presentation/pages/public_profile_page.dart';
import '../../features/schedule/presentation/pages/schedule_page.dart';
import '../../features/tracking/presentation/pages/provider_order_tracking_page.dart';
import '../../features/onboarding/presentation/pages/provider_onboarding_page.dart';
import '../../features/orders/presentation/pages/order_detail_page.dart';
import '../../features/orders/presentation/pages/orders_inbox_page.dart';
import '../../features/shell/presentation/pages/provider_shell_page.dart';
import '../../features/splash/presentation/pages/splash_page.dart';
import '../auth/auth_token_storage.dart';
import '../services/auth_session_notifier.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/splash',
    refreshListenable: authSessionNotifier,
    redirect: (context, state) {
      final location = state.matchedLocation;
      final isAuthRoute = location == '/login' || location == '/register';
      final isSplash = location == '/splash';
      final isOnboarding = location == '/onboarding';

      if (isSplash || isOnboarding) return null;

      final hasSession = AuthTokenStorage.instance.cachedToken?.isNotEmpty == true;

      if (!hasSession) {
        if (isAuthRoute) return null;
        return '/login';
      }

      if (isAuthRoute) return '/home';
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, __) => const SplashPage()),
      GoRoute(path: '/onboarding', builder: (_, __) => const ProviderOnboardingPage()),
      GoRoute(path: '/login', builder: (_, __) => const LoginPage()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterPage()),
      GoRoute(path: '/home', builder: (_, __) => const ProviderShellPage()),
      GoRoute(path: '/documents', builder: (_, __) => const DocumentsPage()),
      GoRoute(path: '/orders', builder: (_, __) => const OrdersInboxPage()),
      GoRoute(
        path: '/orders/:id',
        builder: (_, state) => OrderDetailPage(orderId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/orders/:id/tracking',
        builder: (_, state) => ProviderOrderTrackingPage(orderId: state.pathParameters['id']!),
      ),
      GoRoute(path: '/schedule', builder: (_, __) => const SchedulePage()),
      GoRoute(path: '/earnings/history', builder: (_, __) => const ProviderEarningsHistoryPage()),
      GoRoute(path: '/payout/settings', builder: (_, __) => const ProviderPayoutSettingsPage()),
      GoRoute(
        path: '/chat/:threadId',
        redirect: (_, __) => '/home',
      ),
      GoRoute(path: '/profile/reviews', builder: (_, __) => const ProviderReviewsPage()),
      GoRoute(
        path: '/profile/public/:id',
        builder: (_, state) => PublicProfilePage(providerId: state.pathParameters['id']!),
      ),
      GoRoute(path: '/notifications', builder: (_, __) => const ProviderNotificationsPage()),
      GoRoute(
        path: '/notifications/:id',
        builder: (_, state) =>
            ProviderNotificationDetailPage(notificationId: state.pathParameters['id']!),
      ),
    ],
  );
});
