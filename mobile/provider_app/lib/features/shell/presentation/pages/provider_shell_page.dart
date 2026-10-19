import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../orders/presentation/providers/orders_providers.dart';

import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/shad_screen_scope.dart';
import '../../../earnings/presentation/pages/earnings_tab_page.dart';
import '../../../home/presentation/pages/provider_dashboard_page.dart';
import '../../../messages/presentation/pages/messages_tab_page.dart';
import '../../../orders/presentation/pages/orders_inbox_page.dart';
import '../../../profile/presentation/pages/provider_profile_tab_page.dart';

class ProviderShellPage extends ConsumerStatefulWidget {
  const ProviderShellPage({super.key});

  @override
  ConsumerState<ProviderShellPage> createState() => _ProviderShellPageState();
}

class _ProviderShellPageState extends ConsumerState<ProviderShellPage> {
  int _index = 0;

  static const _tabs = [
    (icon: LucideIcons.layoutDashboard, label: 'Trang chủ'),
    (icon: LucideIcons.inbox, label: 'Đơn hàng'),
    (icon: LucideIcons.wallet, label: 'Thu nhập'),
    (icon: LucideIcons.messageCircle, label: 'Tin nhắn'),
    (icon: LucideIcons.user, label: 'Hồ sơ'),
  ];

  Widget _pageAt(int index) {
    return switch (index) {
      0 => const ProviderDashboardPage(),
      1 => const OrdersInboxPage(embedded: true),
      2 => const EarningsTabPage(),
      3 => const MessagesTabPage(),
      4 => const ProviderProfileTabPage(),
      _ => const SizedBox.shrink(),
    };
  }

  @override
  Widget build(BuildContext context) {
    final shellTab = ref.watch(providerShellTabIndexProvider);
    if (shellTab != _index) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) setState(() => _index = shellTab);
      });
    }

    final c = UniMoveColors.of(context);

    return ShadScreenScope(
      builder: (_, theme) {
        return Scaffold(
          backgroundColor: c.background,
          body: IndexedStack(index: _index, children: List.generate(_tabs.length, _pageAt)),
          bottomNavigationBar: ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            child: Container(
              decoration: BoxDecoration(
                color: c.glassCard,
                border: Border(top: BorderSide(color: c.glassBorder)),
                boxShadow: [
                  BoxShadow(color: c.navBarShadow, blurRadius: 24, offset: const Offset(0, -6)),
                ],
              ),
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(4, 8, 4, 8),
                  child: Row(
                    children: List.generate(_tabs.length, (i) {
                      final tab = _tabs[i];
                      final active = i == _index;
                      return Expanded(
                        child: GestureDetector(
                          onTap: () {
                            setState(() => _index = i);
                            ref.read(providerShellTabIndexProvider.notifier).state = i;
                          },
                          behavior: HitTestBehavior.opaque,
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 6),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(tab.icon, color: active ? c.primary : c.onSurfaceMuted, size: 22),
                                const SizedBox(height: 4),
                                Text(
                                  tab.label,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: theme.textTheme.small.copyWith(
                                    fontSize: 9,
                                    fontWeight: FontWeight.w600,
                                    color: active ? c.primary : c.onSurfaceMuted,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
