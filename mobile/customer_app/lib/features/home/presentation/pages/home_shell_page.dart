import 'package:flutter/material.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/dark_glass_background.dart';
import '../../../../core/widgets/shad_screen_scope.dart';
import '../../../notifications/data/notifications_repository.dart';
import '../../../notifications/presentation/pages/messages_tab_page.dart';
import '../../../orders/presentation/pages/activity_page.dart';
import '../../../payments/presentation/pages/payments_tab_page.dart';
import 'home_page.dart';

class HomeShellPage extends StatefulWidget {
  const HomeShellPage({super.key, this.initialTab = 0});

  final int initialTab;

  @override
  State<HomeShellPage> createState() => _HomeShellPageState();
}

class _HomeShellPageState extends State<HomeShellPage> {
  late int _index;
  int _unreadMessages = 0;
  final _notificationsRepo = NotificationsRepository();

  static const _tabs = [
    (icon: LucideIcons.house, label: 'Trang chủ'),
    (icon: LucideIcons.creditCard, label: 'Thanh toán'),
    (icon: LucideIcons.clipboardList, label: 'Hoạt động'),
    (icon: LucideIcons.messageCircle, label: 'Tin nhắn'),
  ];

  @override
  void initState() {
    super.initState();
    _index = widget.initialTab.clamp(0, _tabs.length - 1);
    _loadUnread();
  }

  Future<void> _loadUnread() async {
    final count = await _notificationsRepo.unreadCount();
    if (mounted) setState(() => _unreadMessages = count);
  }

  Widget _pageAt(int index) {
    return switch (index) {
      0 => const HomePage(),
      1 => const PaymentsTabPage(),
      2 => const ActivityPage(),
      3 => const MessagesTabPage(),
      _ => const SizedBox.shrink(),
    };
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    return ShadScreenScope(
      builder: (_, theme) {
        return Scaffold(
          backgroundColor: Colors.transparent,
          body: Stack(
            fit: StackFit.expand,
            children: [
              const DarkGlassBackground(variant: DarkGlassVariant.subtle, animated: false),
              Positioned.fill(
                child: IndexedStack(
                  index: _index,
                  children: [
                    _pageAt(0),
                    _pageAt(1),
                    _pageAt(2),
                    _pageAt(3),
                  ],
                ),
              ),
            ],
          ),
          bottomNavigationBar: ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            child: Container(
              decoration: BoxDecoration(
                color: c.glassCard,
                border: Border(top: BorderSide(color: c.glassBorder)),
                boxShadow: [
                  BoxShadow(
                    color: c.navBarShadow,
                    blurRadius: 24,
                    offset: const Offset(0, -6),
                  ),
                ],
              ),
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(8, 8, 8, 8),
                  child: Row(
                    children: List.generate(_tabs.length, (i) {
                      final tab = _tabs[i];
                      final active = i == _index;
                      final showBadge = i == 3 && _unreadMessages > 0;
                      return Expanded(
                        child: GestureDetector(
                          onTap: () {
                            setState(() => _index = i);
                            if (i == 3) _loadUnread();
                          },
                          behavior: HitTestBehavior.opaque,
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 6),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Stack(
                                  clipBehavior: Clip.none,
                                  children: [
                                    Icon(
                                      tab.icon,
                                      color: active ? c.primary : c.onSurfaceMuted,
                                      size: 24,
                                    ),
                                    if (showBadge)
                                      Positioned(
                                        right: -8,
                                        top: -4,
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                          decoration: BoxDecoration(
                                            color: AppColors.error,
                                            borderRadius: BorderRadius.circular(10),
                                          ),
                                          child: Text(
                                            '$_unreadMessages',
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 10,
                                              fontWeight: FontWeight.w700,
                                            ),
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  tab.label,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: theme.textTheme.small.copyWith(
                                    fontSize: 10,
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
