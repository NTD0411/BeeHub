import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shadcn_ui/shadcn_ui.dart';
import 'package:unimove_customer/core/theme/shad_unimove_theme.dart';
import 'package:unimove_customer/features/booking/presentation/cubit/booking_flow_cubit.dart';
import 'package:unimove_customer/features/login/presentation/pages/login_page.dart';

void main() {
  testWidgets('Login page renders email form', (WidgetTester tester) async {
    await tester.pumpWidget(
      ScreenUtilInit(
        designSize: const Size(390, 844),
        builder: (_, __) => MaterialApp(
          themeMode: ThemeMode.dark,
          home: BlocProvider(
            create: (_) => BookingFlowCubit(),
            child: const LoginPage(),
          ),
          builder: (context, child) {
            return ShadTheme(
              data: UniMoveShadTheme.dark,
              child: ShadToaster(child: child ?? const SizedBox.shrink()),
            );
          },
        ),
      ),
    );
    expect(find.text('Chào mừng trở lại 👋'), findsOneWidget);
    expect(find.text('Email sinh viên'), findsOneWidget);
    expect(find.text('Đăng nhập'), findsOneWidget);
  });
}
