import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import 'core/router/app_router.dart';
import 'core/theme/flex_unimove_theme.dart';
import 'core/theme/shad_unimove_theme.dart';
import 'core/theme/theme_mode_cubit.dart';
import 'features/booking/presentation/cubit/booking_flow_cubit.dart';

class UniMoveApp extends StatelessWidget {
  const UniMoveApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ScreenUtilInit(
      designSize: const Size(390, 844),
      minTextAdapt: true,
      splitScreenMode: true,
      builder: (context, _) {
        return MultiBlocProvider(
          providers: [
            BlocProvider(create: (_) => ThemeModeCubit()),
            BlocProvider(create: (_) => BookingFlowCubit()),
          ],
          child: BlocBuilder<ThemeModeCubit, ThemeMode>(
            builder: (context, mode) {
              return MaterialApp.router(
                title: 'UniMove',
                debugShowCheckedModeBanner: false,
                theme: FlexUniMoveTheme.material(isDark: false),
                darkTheme: FlexUniMoveTheme.material(isDark: true),
                themeMode: mode,
                routerConfig: AppRouter.router,
                builder: (context, child) {
                  return ShadTheme(
                    data: UniMoveShadTheme.forThemeMode(mode),
                    child: ShadToaster(
                      child: child ?? const SizedBox.shrink(),
                    ),
                  );
                },
              );
            },
          ),
        );
      },
    );
  }
}
