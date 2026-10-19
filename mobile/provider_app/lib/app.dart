import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import 'core/router/app_router.dart';
import 'core/theme/flex_unimove_theme.dart';
import 'core/theme/shad_unimove_theme.dart';
import 'core/theme/theme_mode_notifier.dart';

const _appName = 'UniMove Provider';

class UniMoveProviderApp extends ConsumerWidget {
  const UniMoveProviderApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);
    final themeMode = ref.watch(themeModeProvider);

    return ScreenUtilInit(
      designSize: const Size(390, 844),
      minTextAdapt: true,
      splitScreenMode: true,
      builder: (context, _) {
        return MaterialApp.router(
          title: _appName,
          debugShowCheckedModeBanner: false,
          theme: FlexUniMoveTheme.material(isDark: false),
          darkTheme: FlexUniMoveTheme.material(isDark: true),
          themeMode: themeMode,
          routerConfig: router,
          builder: (context, child) {
            return ShadTheme(
              data: UniMoveShadTheme.forThemeMode(themeMode),
              child: ShadToaster(
                child: child ?? const SizedBox.shrink(),
              ),
            );
          },
        );
      },
    );
  }
}
