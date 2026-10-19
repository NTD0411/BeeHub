import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';
import '../../../../core/constants/app_images.dart';
import '../../../orders/data/customer_orders_repository.dart';
import '../../../orders/domain/order_models.dart';
import '../../../../core/auth/auth_token_storage.dart';
import '../../../auth/data/customer_auth_repository.dart';
import '../../../booking/presentation/cubit/booking_flow_cubit.dart';
import '../../../chat/domain/active_chat_context.dart';
import '../../../../core/mock/mock_auth_session.dart';
import '../../../../core/mock/mock_customer_data.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/fade_slide_in.dart';
import '../../../../core/widgets/pressable_scale.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  String _userName = '';

  @override
  void initState() {
    super.initState();
    _loadProfileName();
  }

  static String _greetingFirstName(String fullName) {
    final parts = fullName.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty) return '';
    return parts.length == 1 ? parts.first : parts.last;
  }

  Future<void> _loadProfileName() async {
    if (await MockAuthSession.isSignedIn()) {
      if (mounted) setState(() => _userName = MockCustomerData.greetingName);
      return;
    }

    final stored = await AuthTokenStorage.instance.loadUser();
    final storedName = stored?['full_name'] as String?;
    if (storedName != null && storedName.trim().isNotEmpty && mounted) {
      setState(() => _userName = _greetingFirstName(storedName));
    }

    try {
      final profile = await CustomerAuthRepository().fetchMe();
      if (profile.fullName.trim().isNotEmpty && mounted) {
        setState(() => _userName = _greetingFirstName(profile.fullName));
      }
    } catch (_) {
      // Giữ tên từ JWT snapshot nếu /customers/me lỗi tạm thời
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth.isFinite
            ? constraints.maxWidth
            : MediaQuery.sizeOf(context).width;

        return SizedBox(
          width: width,
          child: _buildScrollContent(c),
        );
      },
    );
  }

  Widget _buildScrollContent(UniMoveColors c) {
    return CustomScrollView(
      physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
      slivers: [
        SliverAppBar(
          pinned: true,
          elevation: 0,
          scrolledUnderElevation: 0,
          backgroundColor: c.glassCard,
          surfaceTintColor: Colors.transparent,
          toolbarHeight: 64,
          title: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: c.glassBorderStrong, width: 2),
                ),
                child: Material(
                  color: Colors.transparent,
                  shape: const CircleBorder(),
                  child: InkWell(
                    onTap: () => context.push('/profile'),
                    customBorder: const CircleBorder(),
                    child: ClipOval(
                      child: Image.network(
                        AppImages.profileAvatar,
                        fit: BoxFit.cover,
                        cacheWidth: 80,
                        errorBuilder: (_, __, ___) => Icon(Icons.person, color: c.primary),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Flexible(
                child: Text(
                  'UniMove',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: c.primary,
                    fontSize: 28,
                    fontWeight: FontWeight.w700,
                    letterSpacing: -0.5,
                  ),
                ),
              ),
            ],
          ),
          actions: [
            Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () {},
                customBorder: const CircleBorder(),
                child: SizedBox(
                  width: 40,
                  height: 40,
                  child: Icon(Icons.notifications_outlined, color: c.primary),
                ),
              ),
            ),
            const SizedBox(width: 8),
          ],
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 120),
          sliver: SliverList(
            delegate: SliverChildListDelegate([
              FadeSlideIn(
                delay: const Duration(milliseconds: 80),
                child: Text(
                  'Chào buổi sáng, ${_userName.isNotEmpty ? _userName : 'bạn'}! 👋',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w600,
                    color: c.onSurface,
                    letterSpacing: -0.3,
                  ),
                ),
              ),
              const SizedBox(height: 4),
              FadeSlideIn(
                delay: const Duration(milliseconds: 140),
                child: Text(
                  'So sánh báo giá nhà xe · Đặt cọc an toàn qua UniMove',
                  style: TextStyle(fontSize: 16, color: c.onSurfaceMuted),
                ),
              ),
              const SizedBox(height: 16),
              FadeSlideIn(
                delay: const Duration(milliseconds: 200),
                child: _SearchBar(colors: c),
              ),
              const SizedBox(height: 24),
              FadeSlideIn(
                delay: const Duration(milliseconds: 260),
                child: Text(
                  'Dịch vụ chính',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: c.onSurface),
                ),
              ),
              const SizedBox(height: 12),
              FadeSlideIn(
                delay: const Duration(milliseconds: 320),
                child: _MainServiceCard(
                  colors: c,
                  onTap: () {
                    context.read<BookingFlowCubit>().startComboBooking();
                    context.push('/booking/location');
                  },
                ),
              ),
              const SizedBox(height: 16),
              FadeSlideIn(
                delay: const Duration(milliseconds: 360),
                child: Text(
                  'Tất cả dịch vụ',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: c.onSurface),
                ),
              ),
              const SizedBox(height: 12),
              FadeSlideIn(
                delay: const Duration(milliseconds: 400),
                child: IntrinsicHeight(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Expanded(
                        child: _SmallServiceCard(
                          colors: c,
                          icon: Icons.route_outlined,
                          useSecondaryIconBg: true,
                          title: 'Đặt chuyến',
                          subtitle: 'Chọn điểm đón & đến',
                          onTap: () {
                            context.read<BookingFlowCubit>().startFullMoveBooking();
                            context.push('/booking/location');
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _SmallServiceCard(
                          colors: c,
                          icon: Icons.groups_outlined,
                          useSecondaryIconBg: false,
                          title: 'Khuân vác',
                          subtitle: 'Thêm vào đơn đã đặt',
                          onTap: () => context.push('/booking/labor'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              FadeSlideIn(
                delay: const Duration(milliseconds: 440),
                child: IntrinsicHeight(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Expanded(
                        child: _SmallServiceCard(
                          colors: c,
                          icon: Icons.storefront,
                          useSecondaryIconBg: false,
                          title: 'Chợ sinh viên',
                          subtitle: 'Mua bán đồ · sinh viên tin nhau',
                          onTap: () => context.push('/pass-items'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _SmallServiceCard(
                          colors: c,
                          icon: Icons.receipt_long_outlined,
                          useSecondaryIconBg: false,
                          title: 'Bảng phụ phí',
                          subtitle: 'Tham khảo minh bạch',
                          onTap: () => context.push('/booking/reference-prices'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              FadeSlideIn(
                delay: const Duration(milliseconds: 440),
                child: _FlashSaleBanner(colors: c),
              ),
              const SizedBox(height: 24),
              FadeSlideIn(
                delay: const Duration(milliseconds: 500),
                child: Text(
                  'Đơn hàng gần đây',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: c.onSurface),
                ),
              ),
              const SizedBox(height: 12),
              FadeSlideIn(
                delay: const Duration(milliseconds: 560),
                child: _RecentOrderCard(colors: c),
              ),
            ]),
          ),
        ),
      ],
    );
  }
}

class _SearchBar extends StatelessWidget {
  _SearchBar({required this.colors});

  final UniMoveColors colors;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        context.read<BookingFlowCubit>().startFullMoveBooking();
        context.push('/booking/location');
      },
      child: AbsorbPointer(
        child: ShadInput(
          placeholder: const Text('Bạn muốn chuyển đến đâu?'),
          leading: Icon(LucideIcons.search, size: 18, color: colors.primary),
        ),
      ),
    );
  }
}

class _MainServiceCard extends StatelessWidget {
  _MainServiceCard({required this.colors, required this.onTap});

  final UniMoveColors colors;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return PressableScale(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: isDark
              ? null
              : LinearGradient(
                  colors: [colors.primaryContainer, colors.surfaceTint],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
          color: isDark ? colors.primaryContainer : null,
          borderRadius: BorderRadius.circular(16),
          border: isDark ? null : Border.all(color: colors.border),
          boxShadow: isDark
              ? null
              : [
                  BoxShadow(
                    color: colors.primary.withValues(alpha: 0.08),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Marketplace · Đã xác minh',
                    style: TextStyle(
                      color: isDark ? colors.onPrimaryContainer : colors.primary,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Combo chuyển trọ',
                    style: TextStyle(
                      color: isDark ? AppColors.onPrimary : colors.onSurface,
                      fontSize: 20,
                      fontWeight: FontWeight.w600,
                      height: 1.2,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Tiết kiệm nhất · Chuyến chuẩn · Giá niêm yết',
                    style: TextStyle(
                      color: isDark ? colors.onPrimaryContainer : colors.onSurfaceMuted,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: isDark
                    ? Colors.white.withValues(alpha: 0.12)
                    : colors.primary.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.inventory_2_outlined,
                color: isDark ? AppColors.onPrimary : colors.primary,
                size: 36,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SmallServiceCard extends StatelessWidget {
  _SmallServiceCard({
    required this.colors,
    required this.icon,
    required this.useSecondaryIconBg,
    required this.title,
    required this.subtitle,
    this.onTap,
  });

  final UniMoveColors colors;
  final IconData icon;
  final bool useSecondaryIconBg;
  final String title;
  final String subtitle;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final iconBg = useSecondaryIconBg ? colors.iconBgSecondary : colors.iconBgTertiary;

    return PressableScale(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: colors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: colors.border),
          boxShadow: isDark
              ? null
              : [
                  BoxShadow(
                    color: colors.navBarShadow,
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(color: iconBg, borderRadius: BorderRadius.circular(16)),
              child: Icon(icon, color: colors.primary, size: 24),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16, color: colors.onSurface),
            ),
            const SizedBox(height: 4),
            Text(subtitle, style: TextStyle(color: colors.onSurfaceMuted, fontSize: 14)),
          ],
        ),
      ),
    );
  }
}

class _FlashSaleBanner extends StatelessWidget {
  _FlashSaleBanner({required this.colors});

  final UniMoveColors colors;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;
        // Đủ cao cho badge + 2 dòng chữ + nút (tránh overflow ~3px trên màn hẹp).
        final height = (width / 1.55).clamp(188.0, 260.0);

        return PressableScale(
          onTap: () {},
          child: ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: SizedBox(
              height: height,
              width: width,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Image.network(
                    AppImages.flashSaleBanner,
                    fit: BoxFit.cover,
                    cacheWidth: 800,
                    errorBuilder: (_, __, ___) => ColoredBox(color: colors.primaryContainer),
                  ),
                  DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [colors.onSurface.withValues(alpha: 0.78), Colors.transparent],
                        begin: Alignment.centerLeft,
                        end: Alignment.centerRight,
                      ),
                    ),
                  ),
                  Positioned(
                    top: 14,
                    left: 14,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: colors.primary,
                        borderRadius: BorderRadius.circular(99),
                      ),
                      child: const Text(
                        'UNIMOVE',
                        style: TextStyle(
                          color: AppColors.onPrimary,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    left: 14,
                    right: 14,
                    bottom: 14,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text(
                          'Chuyến không vừa combo?',
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                            height: 1.2,
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Đặt linh hoạt · So sánh báo giá nhà xe',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(color: Colors.white70, fontSize: 13, height: 1.25),
                        ),
                        const SizedBox(height: 8),
                        Material(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(99),
                          child: InkWell(
                            onTap: () {
                              context.read<BookingFlowCubit>().startFullMoveBooking();
                              context.push('/booking/location');
                            },
                            borderRadius: BorderRadius.circular(99),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                              child: Text(
                                'Đặt chuyến',
                                style: TextStyle(
                                  color: colors.primary,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class _RecentOrderCard extends StatefulWidget {
  const _RecentOrderCard({required this.colors});

  final UniMoveColors colors;

  @override
  State<_RecentOrderCard> createState() => _RecentOrderCardState();
}

class _RecentOrderCardState extends State<_RecentOrderCard> {
  final _repo = CustomerOrdersRepository();
  CustomerOrder? _order;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final list = await _repo.fetchOrders(activeOnly: true);
    if (!mounted) return;
    setState(() {
      _order = list.isNotEmpty ? list.first : null;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const SizedBox(height: 120, child: Center(child: CircularProgressIndicator()));
    }
    final order = _order;
    if (order == null) return const SizedBox.shrink();

    final colors = widget.colors;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return PressableScale(
      onTap: () => context.push('/orders/${order.id}/tracking'),
      child: Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.border),
        boxShadow: isDark
            ? null
            : [
                BoxShadow(
                  color: colors.navBarShadow,
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: colors.surfaceTint,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: colors.border),
                ),
                child: Icon(Icons.local_shipping_outlined, color: colors.primary),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '#${order.orderNumber}',
                      style: TextStyle(color: colors.primary, fontWeight: FontWeight.w700, fontSize: 12),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      order.vehicleLabel,
                      style: TextStyle(fontWeight: FontWeight.w600, fontSize: 18, color: colors.onSurface),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: colors.accentGreen.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(99),
                ),
                child: Text(
                  order.status == OrderStatus.pending ? 'Chờ nhà xe' : 'Đang xử lý',
                  style: TextStyle(color: colors.accentGreen, fontWeight: FontWeight.w600, fontSize: 12),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _RouteTimeline(
            colors: colors,
            startLabel: order.pickupAddress,
            endLabel: order.deliveryAddress,
          ),
          const SizedBox(height: 16),
          Divider(color: colors.border, height: 1),
          const SizedBox(height: 12),
          Row(
            children: [
              ClipOval(
                child: Image.network(
                  AppImages.driverAvatar,
                  width: 32,
                  height: 32,
                  fit: BoxFit.cover,
                  cacheWidth: 64,
                  errorBuilder: (_, __, ___) => CircleAvatar(
                    radius: 16,
                    backgroundColor: colors.surfaceTint,
                    child: Icon(Icons.person, size: 16, color: colors.onSurfaceMuted),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  order.providerName != null ? 'Nhà xe: ${order.providerName}' : 'Đang tìm nhà xe...',
                  style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12, color: colors.onSurface),
                ),
              ),
              Material(
                color: colors.primaryContainer,
                shape: const CircleBorder(),
                elevation: isDark ? 4 : 0,
                shadowColor: colors.primary.withValues(alpha: 0.3),
                child: InkWell(
                  onTap: () {
                    if (ActiveChatContext.orderAllowsChat(order) && order.conversationId != null) {
                      context.push('/chat/${order.conversationId}');
                    }
                  },
                  customBorder: const CircleBorder(),
                  child: SizedBox(
                    width: 40,
                    height: 40,
                    child: Icon(Icons.chat_bubble_outline, color: colors.primary, size: 20),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    ),
    );
  }
}

class _RouteTimeline extends StatelessWidget {
  _RouteTimeline({
    required this.colors,
    required this.startLabel,
    required this.endLabel,
  });

  final UniMoveColors colors;
  final String startLabel;
  final String endLabel;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _routeRow(colors.onSurfaceMuted, startLabel),
        const SizedBox(height: 10),
        _routeRow(colors.primary, endLabel),
      ],
    );
  }

  Widget _routeRow(Color dot, String label) {
    return Row(
      children: [
        Container(width: 8, height: 8, decoration: BoxDecoration(color: dot, shape: BoxShape.circle)),
        const SizedBox(width: 12),
        Expanded(
          child: Text(label, style: TextStyle(fontSize: 14, color: colors.onSurfaceMuted)),
        ),
      ],
    );
  }
}
