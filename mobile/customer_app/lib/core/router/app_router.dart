import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../features/booking/data/quote_progress_repository.dart';
import '../../features/booking/domain/quote_models.dart';
import '../../features/booking/presentation/cubit/booking_flow_cubit.dart';
import '../../features/booking/presentation/pages/choose_location_page.dart';
import '../../features/booking/presentation/pages/labor_configure_page.dart';
import '../../features/booking/presentation/pages/labor_order_picker_page.dart';
import '../../features/booking/presentation/pages/labor_providers_page.dart';
import '../../features/booking/presentation/pages/labor_service_page.dart';
import '../../features/booking/presentation/pages/choose_partner_page.dart';
import '../../features/booking/presentation/pages/insurance_selection_page.dart';
import '../../features/booking/presentation/pages/payment_page.dart';
import '../../features/booking/presentation/pages/move_dorm_details_page.dart';
import '../../features/booking/presentation/pages/move_schedule_page.dart';
import '../../features/booking/presentation/pages/provider_quote_detail_page.dart';
import '../../features/booking/presentation/pages/quote_move_schedule_page.dart';
import '../../features/booking/presentation/pages/quote_progress_page.dart';
import '../../features/booking/presentation/pages/reference_prices_page.dart';
import '../../features/booking/presentation/pages/service_packages_page.dart';
import '../../features/notifications/presentation/pages/notification_detail_page.dart';
import '../../features/payments/domain/payment_method_models.dart';
import '../../features/payments/presentation/pages/add_card_page.dart';
import '../../features/payments/presentation/pages/add_payment_method_page.dart';
import '../../features/payments/presentation/pages/financial_settings_page.dart';
import '../../features/payments/presentation/pages/link_payment_method_page.dart';
import '../../features/payments/presentation/pages/payment_detail_page.dart';
import '../../features/payments/presentation/pages/payment_methods_page.dart';
import '../../features/pass_items/presentation/pages/create_pass_item_page.dart';
import '../../features/pass_items/presentation/pages/listing_fee_pay_page.dart';
import '../../features/pass_items/presentation/pages/pass_item_chat_page.dart';
import '../../features/pass_items/presentation/pages/pass_item_detail_page.dart';
import '../../features/pass_items/presentation/pages/pass_item_seller_page.dart';
import '../../features/pass_items/presentation/pages/pass_item_transport_options_page.dart';
import '../../features/pass_items/presentation/pages/pass_items_page.dart';
import '../../features/auth/data/customer_auth_repository.dart';
import '../../features/auth/presentation/pages/forgot_password_page.dart';
import '../../features/auth/presentation/pages/reset_password_page.dart';
import '../../features/home/presentation/pages/change_password_page.dart';
import '../../features/home/presentation/pages/edit_profile_page.dart';
import '../../features/home/presentation/pages/home_shell_page.dart';
import '../../features/home/presentation/pages/profile_page.dart';
import '../../features/login/presentation/pages/login_page.dart';
import '../../features/onboarding/presentation/pages/onboarding_page.dart';
import '../../features/orders/presentation/pages/orders_history_page.dart';
import '../../features/register/presentation/pages/register_page.dart';
import '../../features/reviews/presentation/pages/review_trip_page.dart';
import '../../features/splash/presentation/pages/splash_page.dart';
import '../../features/tracking/presentation/pages/order_tracking_page.dart';

abstract final class AppRouter {
  static final rootNavigatorKey = GlobalKey<NavigatorState>();

  static final GoRouter router = GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: '/',
    routes: [
      GoRoute(path: '/', builder: (_, __) => const SplashPage()),
      GoRoute(path: '/onboarding', builder: (_, __) => const OnboardingPage()),
      GoRoute(path: '/login', builder: (_, __) => const LoginPage()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterPage()),
      GoRoute(
        path: '/forgot-password',
        builder: (_, state) =>
            ForgotPasswordPage(initialEmail: state.uri.queryParameters['email']),
      ),
      GoRoute(
        path: '/reset-password',
        builder: (_, state) =>
            ResetPasswordPage(initialEmail: state.uri.queryParameters['email']),
      ),
      GoRoute(
        path: '/home',
        builder: (_, state) {
          final tab = state.uri.queryParameters['tab'];
          final index = switch (tab) {
            'payments' => 1,
            'activity' => 2,
            'messages' => 3,
            _ => 0,
          };
          return HomeShellPage(initialTab: index);
        },
      ),
      GoRoute(path: '/profile', builder: (_, __) => const ProfilePage()),
      GoRoute(
        path: '/profile/edit',
        builder: (_, state) => EditProfilePage(initial: state.extra as CustomerProfile?),
      ),
      GoRoute(path: '/change-password', builder: (_, __) => const ChangePasswordPage()),
      GoRoute(
        path: '/orders/history',
        builder: (_, __) => const OrdersHistoryPage(),
      ),
      GoRoute(path: '/booking/labor', builder: (_, __) => const LaborServicePage()),
      GoRoute(path: '/booking/labor/orders', builder: (_, __) => const LaborOrderPickerPage()),
      GoRoute(path: '/booking/labor/configure', builder: (_, __) => const LaborConfigurePage()),
      GoRoute(path: '/booking/labor/providers', builder: (_, __) => const LaborProvidersPage()),
      GoRoute(path: '/booking/location', builder: (_, __) => const ChooseLocationPage()),
      GoRoute(
        path: '/booking/pass-item/transport',
        builder: (_, __) => const PassItemTransportOptionsPage(),
      ),
      GoRoute(path: '/booking/dorm-details', builder: (_, __) => const MoveDormDetailsPage()),
      GoRoute(path: '/booking/schedule', builder: (_, __) => const MoveSchedulePage()),
      GoRoute(
        path: '/booking/quotes/:refId/progress',
        redirect: (_, state) {
          final refId = state.pathParameters['refId']!;
          final snap = QuoteProgressRepository.instance.peek(refId);
          if (snap?.status == QuoteProgressStatus.providerConfirmed &&
              !snap!.hasRequestedPickup) {
            return '/booking/quotes/$refId/schedule';
          }
          return null;
        },
        builder: (_, state) => QuoteProgressPage(
          referenceId: state.pathParameters['refId']!,
          photosUploadFailed: state.uri.queryParameters['photos'] == 'failed',
        ),
      ),
      GoRoute(
        path: '/booking/quotes/:refId/offer/:quoteId',
        parentNavigatorKey: rootNavigatorKey,
        builder: (_, state) => ProviderQuoteDetailPage(
          referenceId: state.pathParameters['refId']!,
          quoteId: state.pathParameters['quoteId']!,
        ),
      ),
      GoRoute(
        path: '/booking/quotes/:refId/schedule',
        builder: (_, state) => QuoteMoveSchedulePage(
          referenceId: state.pathParameters['refId']!,
        ),
      ),
      GoRoute(
        path: '/booking/quote-submitted',
        redirect: (_, state) {
          final ref = state.uri.queryParameters['ref'];
          if (ref != null && ref.isNotEmpty) {
            return '/booking/quotes/$ref/progress';
          }
          return '/home';
        },
      ),
      GoRoute(path: '/booking/reference-prices', builder: (_, __) => const ReferencePricesPage()),
      GoRoute(path: '/booking/packages', builder: (_, __) => const ServicePackagesPage()),
      GoRoute(path: '/booking/partners', builder: (_, __) => const ChoosePartnerPage()),
      GoRoute(path: '/pass-items', builder: (_, __) => const PassItemsPage()),
      GoRoute(path: '/pass-items/new', builder: (_, __) => const CreatePassItemPage()),
      GoRoute(
        path: '/pass-items/:listingId/pay-fee',
        parentNavigatorKey: rootNavigatorKey,
        builder: (_, state) {
          final fee = int.tryParse(state.uri.queryParameters['fee'] ?? '') ?? 0;
          return ListingFeePayPage(
            listingId: state.pathParameters['listingId']!,
            fee: fee,
          );
        },
      ),
      GoRoute(
        path: '/pass-items/seller/:sellerId',
        builder: (_, state) => PassItemSellerPage(
          sellerId: state.pathParameters['sellerId']!,
          sellerName: state.uri.queryParameters['name'],
        ),
      ),
      GoRoute(
        path: '/pass-items/:id',
        builder: (_, state) => PassItemDetailPage(id: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/pass-items/:id/chat',
        builder: (_, state) => PassItemChatPage(
          id: state.pathParameters['id']!,
          buyerId: state.uri.queryParameters['buyer'],
        ),
      ),
      GoRoute(path: '/booking/insurance', builder: (_, __) => const InsuranceSelectionPage()),
      GoRoute(
        path: '/booking/move-labor',
        redirect: (_, __) => '/booking/payment',
      ),
      GoRoute(
        path: '/booking/payment',
        parentNavigatorKey: rootNavigatorKey,
        builder: (_, __) => const PaymentPage(),
      ),
      GoRoute(
        path: '/orders/:orderId/tracking',
        builder: (_, state) => OrderTrackingPage(orderId: state.pathParameters['orderId']!),
      ),
      GoRoute(
        path: '/orders/:orderId/review',
        builder: (_, state) => ReviewTripPage(orderId: state.pathParameters['orderId']!),
      ),
      GoRoute(
        path: '/payments/settings',
        parentNavigatorKey: rootNavigatorKey,
        builder: (_, __) => const FinancialSettingsPage(),
      ),
      GoRoute(
        path: '/payments/methods',
        parentNavigatorKey: rootNavigatorKey,
        builder: (_, __) => const PaymentMethodsPage(),
      ),
      GoRoute(
        path: '/payments/methods/add',
        parentNavigatorKey: rootNavigatorKey,
        builder: (_, __) => const AddPaymentMethodPage(),
      ),
      GoRoute(
        path: '/payments/methods/add-card',
        parentNavigatorKey: rootNavigatorKey,
        builder: (_, __) => const AddCardPage(),
      ),
      GoRoute(
        path: '/payments/methods/link/:kind',
        parentNavigatorKey: rootNavigatorKey,
        builder: (_, state) {
          final kind = state.pathParameters['kind'];
          final parsed = switch (kind) {
            'momo' => PaymentMethodKind.momo,
            'payos' => PaymentMethodKind.payos,
            _ => PaymentMethodKind.payos,
          };
          return LinkPaymentMethodPage(kind: parsed);
        },
      ),
      GoRoute(
        path: '/payments/:paymentId',
        parentNavigatorKey: rootNavigatorKey,
        builder: (_, state) {
          final id = state.pathParameters['paymentId'];
          if (id == null || id.isEmpty) {
            return const Scaffold(body: Center(child: Text('Giao dịch không hợp lệ')));
          }
          return PaymentDetailPage(paymentId: id);
        },
      ),
      GoRoute(
        path: '/notifications/:notificationId',
        parentNavigatorKey: rootNavigatorKey,
        builder: (_, state) {
          final id = state.pathParameters['notificationId'];
          if (id == null || id.isEmpty) {
            return const Scaffold(body: Center(child: Text('Thông báo không hợp lệ')));
          }
          return NotificationDetailPage(notificationId: id);
        },
      ),
      GoRoute(
        path: '/chat/:conversationId',
        redirect: (_, __) => '/home?tab=messages',
      ),
    ],
  );

  static BookingFlowCubit bookingCubit(BuildContext context) =>
      context.read<BookingFlowCubit>();
}
