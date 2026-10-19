import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/network/api_client.dart';
import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/shad_screen_scope.dart';
import '../../../auth/data/auth_repository.dart';
import '../../../auth/domain/provider_profile.dart';

final _publicProfileProvider =
    FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, providerId) async {
  final api = ref.watch(apiClientProvider);
  final envelope = await api.guard(() => api.get('/providers/$providerId'));
  return envelope['data'] as Map<String, dynamic>;
});

class PublicProfilePage extends ConsumerWidget {
  const PublicProfilePage({super.key, required this.providerId});

  final String providerId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(_publicProfileProvider(providerId));
    final c = UniMoveColors.of(context);

    return ShadScreenScope(
      builder: (_, theme) {
        return Scaffold(
          backgroundColor: c.background,
          body: profileAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text('Lỗi: $e', style: TextStyle(color: c.onSurface)),
              ),
            ),
            data: (p) => _buildProfile(context, ref, theme, c, p),
          ),
        );
      },
    );
  }

  Widget _buildProfile(BuildContext context, WidgetRef ref, ShadThemeData theme,
      UniMoveColors c, Map<String, dynamic> p) {
    final name = p['full_name'] as String? ?? 'Nhà xe';
    final businessName = p['business_name'] as String? ?? '';
    final bio = p['bio'] as String? ?? '';
    final rating = (p['rating'] as num?)?.toDouble() ?? 0.0;
    final completedTrips = (p['completed_trips'] as num?)?.toInt() ?? 0;
    final isVerified = p['is_verified'] as bool? ?? false;
    final vehicleModel = p['vehicle_model'] as String? ?? '—';
    final licensePlate = p['license_plate'] as String? ?? '—';
    final vehicleSize = p['vehicle_size'] as String? ?? '';
    final locationLine = p['location_line'] as String? ?? p['city'] as String? ?? '—';

    final reviews = (p['reviews'] as List<dynamic>?) ?? [];
    final summary = p['reviews_summary'] as Map<String, dynamic>?;
    final packages = (p['packages'] as List<dynamic>?) ?? [];

    final myProfile = ref.read(providerProfileProvider).asData?.value;
    final isOwnProfile = myProfile?.id == providerId;

    return CustomScrollView(
      slivers: [
        SliverAppBar(
          pinned: true,
          expandedHeight: 200,
          backgroundColor: c.primary,
          foregroundColor: Colors.white,
          iconTheme: const IconThemeData(color: Colors.white),
          title: isOwnProfile
              ? Text('Hồ sơ công khai của bạn',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700))
              : null,
          flexibleSpace: FlexibleSpaceBar(
            background: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [c.primary, c.primaryLight],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              padding: const EdgeInsets.fromLTRB(20, 80, 20, 20),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
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
                        child: Text(
                          name.isNotEmpty ? name[0].toUpperCase() : 'P',
                          style: const TextStyle(
                              color: Colors.white, fontSize: 24, fontWeight: FontWeight.w800),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(name,
                                style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 20,
                                    fontWeight: FontWeight.w800)),
                            if (businessName.isNotEmpty)
                              Text(businessName,
                                  style: const TextStyle(color: Colors.white70, fontSize: 13)),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: isVerified ? Colors.white.withValues(alpha: 0.22) : Colors.black26,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(isVerified ? LucideIcons.badgeCheck : LucideIcons.clock,
                                size: 14, color: Colors.white),
                            const SizedBox(width: 4),
                            Text(isVerified ? 'Đã xác thực' : 'Chờ duyệt',
                                style: const TextStyle(
                                    color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
          sliver: SliverList(
            delegate: SliverChildListDelegate([
              // Stats row
              Row(
                children: [
                  Expanded(child: _statChip(theme, c, LucideIcons.circleCheck, '$completedTrips', 'Chuyến')),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _statChip(theme, c, LucideIcons.star,
                        rating.toStringAsFixed(1), 'Đánh giá'),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _statChip(theme, c, LucideIcons.messageSquare,
                        '${summary?['total_reviews'] ?? 0}', 'Nhận xét'),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              if (isOwnProfile) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: c.iconBgTertiary,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: c.primary.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      Icon(LucideIcons.eye, size: 16, color: c.primary),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text('Đây là hồ sơ khách hàng nhìn thấy khi chọn bạn.',
                            style: theme.textTheme.small
                                .copyWith(color: c.primary, fontWeight: FontWeight.w600)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
              ],

              // Bio
              if (bio.isNotEmpty) ...[
                _sectionTitle(theme, c, 'Giới thiệu'),
                const SizedBox(height: 10),
                GlassCard(
                  padding: const EdgeInsets.all(14),
                  child: Text(bio,
                      style: theme.textTheme.p.copyWith(color: c.onSurface, height: 1.5)),
                ),
                const SizedBox(height: 20),
              ],

              // Vehicle
              _sectionTitle(theme, c, 'Phương tiện'),
              const SizedBox(height: 10),
              GlassCard(
                padding: const EdgeInsets.all(14),
                child: Column(
                  children: [
                    _infoRow(theme, c, LucideIcons.car, 'Xe', vehicleModel),
                    Divider(height: 16, color: c.border),
                    _infoRow(theme, c, LucideIcons.badge, 'Biển số', licensePlate),
                    Divider(height: 16, color: c.border),
                    _infoRow(theme, c, LucideIcons.package, 'Loại xe',
                        _vehicleLabel(vehicleSize)),
                    Divider(height: 16, color: c.border),
                    _infoRow(theme, c, LucideIcons.mapPin, 'Khu vực', locationLine),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Service packages
              if (packages.isNotEmpty) ...[
                _sectionTitle(theme, c, 'Gói dịch vụ'),
                const SizedBox(height: 10),
                ...packages.map((pkg) => _packageCard(theme, c, pkg as Map<String, dynamic>)),
                const SizedBox(height: 20),
              ],

              // Reviews
              if (summary != null) ...[
                _sectionTitle(theme, c, 'Đánh giá từ khách hàng'),
                const SizedBox(height: 10),
                GlassCard(
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    children: [
                      Column(
                        children: [
                          Text(
                            (summary['average_rating'] as num? ?? 0).toStringAsFixed(1),
                            style: theme.textTheme.h1.copyWith(
                                fontWeight: FontWeight.w800, color: c.onSurface),
                          ),
                          Row(
                            children: List.generate(
                              5,
                              (i) => Icon(
                                i < ((summary['average_rating'] as num?) ?? 0).round()
                                    ? Icons.star_rounded
                                    : Icons.star_outline_rounded,
                                color: Colors.amber.shade700,
                                size: 16,
                              ),
                            ),
                          ),
                          Text('${summary['total_reviews']} đánh giá',
                              style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted)),
                        ],
                      ),
                      const SizedBox(width: 20),
                      Expanded(
                        child: Column(
                          children: [
                            for (var star = 5; star >= 1; star--)
                              Padding(
                                padding: const EdgeInsets.only(bottom: 4),
                                child: Row(
                                  children: [
                                    Text('$star',
                                        style: TextStyle(
                                            fontSize: 11, color: c.onSurfaceMuted)),
                                    const SizedBox(width: 4),
                                    Icon(Icons.star_rounded,
                                        size: 11, color: Colors.amber.shade700),
                                    const SizedBox(width: 6),
                                    Expanded(
                                      child: ClipRRect(
                                        borderRadius: BorderRadius.circular(3),
                                        child: LinearProgressIndicator(
                                          value: _starFraction(summary, star),
                                          minHeight: 5,
                                          backgroundColor: c.chipBg,
                                          color: c.primary,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
              ],

              if (reviews.isNotEmpty) ...[
                ...reviews.take(3).map((r) => _reviewTile(theme, c, r as Map<String, dynamic>)),
              ],
            ]),
          ),
        ),
      ],
    );
  }

  Widget _statChip(ShadThemeData theme, UniMoveColors c, IconData icon, String value,
      String label) {
    return GlassCard(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
      child: Column(
        children: [
          Icon(icon, size: 20, color: c.primary),
          const SizedBox(height: 6),
          Text(value,
              style: theme.textTheme.h4
                  .copyWith(fontWeight: FontWeight.w800, color: c.onSurface)),
          Text(label,
              style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted)),
        ],
      ),
    );
  }

  Widget _sectionTitle(ShadThemeData theme, UniMoveColors c, String text) {
    return Text(text,
        style: theme.textTheme.large.copyWith(fontWeight: FontWeight.w800, color: c.onSurface));
  }

  Widget _infoRow(ShadThemeData theme, UniMoveColors c, IconData icon, String label,
      String value) {
    return Row(
      children: [
        Icon(icon, size: 16, color: c.primaryLight),
        const SizedBox(width: 10),
        Text(label,
            style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted)),
        const Spacer(),
        Text(value,
            style: theme.textTheme.p.copyWith(fontWeight: FontWeight.w600, color: c.onSurface)),
      ],
    );
  }

  Widget _packageCard(ShadThemeData theme, UniMoveColors c, Map<String, dynamic> pkg) {
    final price = (pkg['base_price'] as num?)?.toInt() ?? 0;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: GlassCard(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(pkg['name'] as String? ?? '—',
                      style: theme.textTheme.p
                          .copyWith(fontWeight: FontWeight.w700, color: c.onSurface)),
                  if ((pkg['description'] as String? ?? '').isNotEmpty)
                    Text(pkg['description'] as String,
                        style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted)),
                ],
              ),
            ),
            Text(
              _formatMoney(price),
              style: theme.textTheme.p
                  .copyWith(fontWeight: FontWeight.w800, color: c.primaryLight),
            ),
          ],
        ),
      ),
    );
  }

  Widget _reviewTile(ShadThemeData theme, UniMoveColors c, Map<String, dynamic> r) {
    final customerName = (r['customer'] as Map?)?['full_name'] as String? ?? 'Khách';
    final comment = r['comment'] as String? ?? '';
    final rating = (r['rating'] as num?)?.toInt() ?? 5;

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: GlassCard(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 16,
                  backgroundColor: c.iconBgSecondary,
                  child: Text(customerName.isNotEmpty ? customerName[0] : 'K',
                      style: TextStyle(color: c.primary, fontSize: 12, fontWeight: FontWeight.w800)),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(customerName,
                      style: theme.textTheme.p
                          .copyWith(fontWeight: FontWeight.w600, color: c.onSurface)),
                ),
                Row(
                  children: List.generate(
                    5,
                    (i) => Icon(
                      i < rating ? Icons.star_rounded : Icons.star_outline_rounded,
                      size: 14,
                      color: Colors.amber.shade700,
                    ),
                  ),
                ),
              ],
            ),
            if (comment.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(comment,
                  style: theme.textTheme.small.copyWith(color: c.onSurface, height: 1.4)),
            ],
          ],
        ),
      ),
    );
  }

  double _starFraction(Map<String, dynamic> summary, int star) {
    final total = (summary['total_reviews'] as num?)?.toInt() ?? 0;
    if (total == 0) return 0;
    final key = 'rating_${star}_count';
    final count = (summary[key] as num?)?.toInt() ?? 0;
    return count / total;
  }

  String _vehicleLabel(String size) => switch (size) {
        'motorbike' => 'Xe máy (< 50kg)',
        'small_truck' => 'Xe tải nhỏ',
        'medium_truck' => 'Xe tải vừa (~1 tấn)',
        'large_truck' => 'Xe tải lớn',
        _ => '—',
      };

  String _formatMoney(int amount) {
    if (amount == 0) return '0đ';
    final s = amount.toString();
    final buf = StringBuffer();
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buf.write('.');
      buf.write(s[i]);
    }
    return '${buf}đ';
  }
}
