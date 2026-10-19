import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/dev/dev_session_bootstrap.dart';
import '../../../../core/mock/mock_provider_reviews.dart';
import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/shad_screen_scope.dart';
import '../../../../core/widgets/theme_toggle_tile.dart';
import '../../../auth/data/auth_repository.dart';
import '../../../auth/domain/provider_profile.dart';
import '../../domain/provider_review.dart';
import '../../../orders/presentation/providers/orders_providers.dart';

class ProviderProfileTabPage extends ConsumerWidget {
  const ProviderProfileTabPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(providerProfileProvider);
    final ordersAsync = ref.watch(providerOrdersListProvider);
    final c = UniMoveColors.of(context);
    final reviewSummary = MockProviderReviews.summary;

    return ShadScreenScope(
      builder: (_, theme) {
        return SafeArea(
          child: profileAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('Lỗi: $e', textAlign: TextAlign.center),
                    const SizedBox(height: 16),
                    ShadButton(
                      onPressed: () async {
                        await DevSessionBootstrap.apply();
                        ref.invalidate(providerProfileProvider);
                      },
                      child: const Text('Thử lại'),
                    ),
                  ],
                ),
              ),
            ),
            data: (profile) {
              final orders = ordersAsync.asData?.value ?? const [];
              final completed = orders.where((o) => o.isCompleted).length;
              final active = orders.where((o) => o.isActive || o.isPending).length;

              return RefreshIndicator(
                onRefresh: () async {
                  ref.invalidate(providerProfileProvider);
                  ref.invalidate(providerOrdersListProvider);
                },
                child: ListView(
                  physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
                  children: [
                    Text('Hồ sơ', style: theme.textTheme.h3.copyWith(fontWeight: FontWeight.w800, color: c.onSurface)),
                    const SizedBox(height: 16),
                    _ProfileHero(theme: theme, c: c, profile: profile, reviewSummary: reviewSummary),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(child: _StatChip(c: c, theme: theme, icon: LucideIcons.circleCheck, value: '${profile?.completedTrips ?? completed}', label: 'Chuyến')),
                        const SizedBox(width: 10),
                        Expanded(child: _StatChip(c: c, theme: theme, icon: LucideIcons.star, value: '${profile?.rating.toStringAsFixed(1) ?? '0'}', label: 'Điểm')),
                        const SizedBox(width: 10),
                        Expanded(child: _StatChip(c: c, theme: theme, icon: LucideIcons.truck, value: '$active', label: 'Đang chạy')),
                      ],
                    ),
                    const SizedBox(height: 20),
                    _sectionTitle(theme, c, 'Thông tin nhà xe'),
                    const SizedBox(height: 10),
                    GlassCard(
                      child: Column(
                        children: [
                          _infoRow(theme, c, LucideIcons.building2, 'Tên nhà xe', profile?.businessName ?? '—'),
                          _divider(c),
                          _infoRow(theme, c, LucideIcons.phone, 'Điện thoại', profile?.phone ?? '—'),
                          _divider(c),
                          _infoRow(theme, c, LucideIcons.mail, 'Email', profile?.email ?? '—'),
                          _divider(c),
                          _infoRow(theme, c, LucideIcons.mapPin, 'Địa chỉ', profile?.locationLine ?? '—'),
                          if ((profile?.bio ?? '').isNotEmpty) ...[
                            _divider(c),
                            _infoRow(theme, c, LucideIcons.fileText, 'Giới thiệu', profile!.bio!),
                          ],
                          _divider(c),
                          _infoRow(
                            theme,
                            c,
                            LucideIcons.calendar,
                            'Tham gia',
                            profile?.memberSince != null
                                ? '${profile!.memberSince!.day}/${profile.memberSince!.month}/${profile.memberSince!.year}'
                                : '—',
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    _sectionTitle(theme, c, 'Phương tiện'),
                    const SizedBox(height: 10),
                    GlassCard(
                      child: Column(
                        children: [
                          _infoRow(theme, c, LucideIcons.car, 'Xe', profile?.vehicleModel ?? '—'),
                          _divider(c),
                          _infoRow(theme, c, LucideIcons.badge, 'Biển số', profile?.licensePlate ?? '—'),
                          _divider(c),
                          _infoRow(
                            theme,
                            c,
                            LucideIcons.package,
                            'Loại xe',
                            _vehicleLabel(profile?.vehicleSize),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: () => context.push('/profile/reviews'),
                        borderRadius: BorderRadius.circular(18),
                        child: GlassCard(
                          padding: const EdgeInsets.all(16),
                          child: Row(
                            children: [
                              Container(
                                width: 48,
                                height: 48,
                                decoration: BoxDecoration(
                                  color: Colors.amber.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                child: Icon(Icons.star_rounded, color: Colors.amber.shade700, size: 28),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Đánh giá từ khách hàng',
                                      style: theme.textTheme.p.copyWith(fontWeight: FontWeight.w800, color: c.onSurface),
                                    ),
                                    Text(
                                      '${reviewSummary.averageRating} ★ · ${reviewSummary.totalReviews} nhận xét',
                                      style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted),
                                    ),
                                  ],
                                ),
                              ),
                              Icon(LucideIcons.chevronRight, color: c.onSurfaceMuted),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    _sectionTitle(theme, c, 'Cài đặt'),
                    const SizedBox(height: 10),
                    const ThemeToggleTile(),
                    const SizedBox(height: 10),
                    _MenuTile(
                      icon: LucideIcons.userCheck,
                      title: 'Hồ sơ công khai',
                      subtitle: 'Xem hồ sơ như khách hàng nhìn thấy',
                      onTap: () {
                        final id = profile?.id;
                        if (id != null) context.push('/profile/public/$id');
                      },
                    ),
                    _MenuTile(icon: LucideIcons.calendarDays, title: 'Lịch làm việc', subtitle: 'Quản lý giờ và ngày hoạt động', onTap: () => context.push('/schedule')),
                    _MenuTile(icon: LucideIcons.fileUp, title: 'Giấy tờ & xác thực', subtitle: 'GPLX, đăng ký xe, bảo hiểm', onTap: () => context.push('/documents')),
                    _MenuTile(
                      icon: LucideIcons.bell,
                      title: 'Thông báo',
                      subtitle: 'Đơn mới, tin nhắn, duyệt giấy tờ',
                      onTap: () => context.push('/notifications'),
                    ),
                    _MenuTile(
                      icon: LucideIcons.helpCircle,
                      title: 'Hỗ trợ & FAQ',
                      onTap: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Liên hệ support@unimove.vn'))),
                    ),
                    const SizedBox(height: 24),
                    ShadButton.destructive(
                      width: double.infinity,
                      onPressed: () async {
                        await ref.read(authRepositoryProvider).signOut();
                        if (context.mounted) context.go('/login');
                      },
                      child: const Text('Đăng xuất'),
                    ),
                  ],
                ),
              );
            },
          ),
        );
      },
    );
  }

  Widget _sectionTitle(ShadThemeData theme, UniMoveColors c, String text) {
    return Text(text, style: theme.textTheme.large.copyWith(fontWeight: FontWeight.w800, color: c.onSurface));
  }

  Widget _infoRow(ShadThemeData theme, UniMoveColors c, IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: c.primaryLight),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted)),
                const SizedBox(height: 2),
                Text(value, style: theme.textTheme.p.copyWith(fontWeight: FontWeight.w600, color: c.onSurface, height: 1.35)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _divider(UniMoveColors c) => Divider(height: 1, color: c.border);

  String _vehicleLabel(String? size) => switch (size) {
        'motorbike' => 'Xe máy (< 50kg)',
        'small_truck' => 'Xe tải nhỏ',
        'medium_truck' => 'Xe tải vừa (~1 tấn)',
        'large_truck' => 'Xe tải lớn',
        _ => '—',
      };
}

class _ProfileHero extends StatelessWidget {
  const _ProfileHero({
    required this.theme,
    required this.c,
    required this.profile,
    required this.reviewSummary,
  });

  final ShadThemeData theme;
  final UniMoveColors c;
  final ProviderProfile? profile;
  final ProviderReviewSummary reviewSummary;

  @override
  Widget build(BuildContext context) {
    final name = profile?.fullName ?? 'Đối tác';
    final initial = name.isNotEmpty ? name[0].toUpperCase() : 'P';
    final verified = profile?.isVerified == true;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [c.primary.withValues(alpha: 0.9), c.primaryLight],
        ),
        borderRadius: BorderRadius.circular(22),
        boxShadow: [
          BoxShadow(color: c.primary.withValues(alpha: 0.25), blurRadius: 20, offset: const Offset(0, 8)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white30),
                ),
                alignment: Alignment.center,
                child: Text(initial, style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w800)),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name, style: theme.textTheme.h4.copyWith(color: Colors.white, fontWeight: FontWeight.w800)),
                    if ((profile?.businessName ?? '').isNotEmpty)
                      Text(
                        profile!.businessName!,
                        style: theme.textTheme.small.copyWith(color: Colors.white70),
                      ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: verified ? Colors.white.withValues(alpha: 0.22) : Colors.black26,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(verified ? LucideIcons.badgeCheck : LucideIcons.clock, size: 14, color: Colors.white),
                    const SizedBox(width: 4),
                    Text(
                      verified ? 'Đã xác thực' : 'Chờ duyệt',
                      style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  const _StatChip({required this.c, required this.theme, required this.icon, required this.value, required this.label});

  final UniMoveColors c;
  final ShadThemeData theme;
  final IconData icon;
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
      child: Column(
        children: [
          Icon(icon, size: 20, color: c.primary),
          const SizedBox(height: 6),
          Text(value, style: theme.textTheme.h4.copyWith(fontWeight: FontWeight.w800, color: c.onSurface)),
          Text(label, style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted)),
        ],
      ),
    );
  }
}

class _MenuTile extends StatelessWidget {
  const _MenuTile({
    required this.icon,
    required this.title,
    this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);
    final theme = ShadTheme.of(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: GlassCard(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            radius: 16,
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(color: c.iconBgSecondary, borderRadius: BorderRadius.circular(10)),
                  child: Icon(icon, color: c.primary, size: 20),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: theme.textTheme.p.copyWith(fontWeight: FontWeight.w600, color: c.onSurface)),
                      if (subtitle != null)
                        Text(subtitle!, style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted)),
                    ],
                  ),
                ),
                Icon(LucideIcons.chevronRight, color: c.onSurfaceMuted, size: 18),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
