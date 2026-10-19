import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/network/api_client.dart';
import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/shad_screen_scope.dart';
import '../../data/earnings_repository.dart';

// ── Providers ─────────────────────────────────────────────────────────────────

final _earningsRepoProvider = Provider<EarningsRepository>((ref) {
  return EarningsRepository(ref.watch(apiClientProvider));
});

final _earningsProvider =
    FutureProvider.autoDispose.family<EarningsSummary, String>((ref, period) async {
  return ref.watch(_earningsRepoProvider).fetch(period);
});

// ── Page ──────────────────────────────────────────────────────────────────────

class EarningsTabPage extends ConsumerStatefulWidget {
  const EarningsTabPage({super.key});

  @override
  ConsumerState<EarningsTabPage> createState() => _EarningsTabPageState();
}

class _EarningsTabPageState extends ConsumerState<EarningsTabPage> {
  String _period = 'week';

  static const _periods = [
    ('week', 'Tuần này'),
    ('month', 'Tháng này'),
    ('year', 'Năm nay'),
  ];

  @override
  Widget build(BuildContext context) {
    final earningsAsync = ref.watch(_earningsProvider(_period));
    final c = UniMoveColors.of(context);

    return ShadScreenScope(
      builder: (_, theme) {
        return SafeArea(
          child: RefreshIndicator(
            onRefresh: () async => ref.invalidate(_earningsProvider(_period)),
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
              children: [
                // Header
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Thu nhập',
                        style: theme.textTheme.h3
                            .copyWith(fontWeight: FontWeight.w800, color: c.onSurface),
                      ),
                    ),
                    TextButton.icon(
                      onPressed: () => context.push('/payout/settings'),
                      icon: Icon(LucideIcons.landmark, size: 18, color: c.primaryLight),
                      label: Text('Nhận tiền',
                          style: theme.textTheme.small
                              .copyWith(color: c.primaryLight, fontWeight: FontWeight.w700)),
                    ),
                    TextButton.icon(
                      onPressed: () => context.push('/earnings/history'),
                      icon: Icon(LucideIcons.history, size: 18, color: c.primaryLight),
                      label: Text('Lịch sử',
                          style: theme.textTheme.small
                              .copyWith(color: c.primaryLight, fontWeight: FontWeight.w700)),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Period selector
                Row(
                  children: _periods.map(((String, String) p) {
                    final selected = _period == p.$1;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: GestureDetector(
                        onTap: () => setState(() => _period = p.$1),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 160),
                          padding:
                              const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                          decoration: BoxDecoration(
                            color: selected ? c.primary : c.surface,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                                color: selected ? c.primary : c.border),
                          ),
                          child: Text(
                            p.$2,
                            style: theme.textTheme.small.copyWith(
                              color: selected ? Colors.white : c.onSurfaceMuted,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 20),

                // Data
                earningsAsync.when(
                  loading: () => const Center(
                      child: Padding(
                          padding: EdgeInsets.symmetric(vertical: 48),
                          child: CircularProgressIndicator())),
                  error: (e, _) => Center(
                      child: Text('Lỗi: $e',
                          style: const TextStyle(color: Color(0xFFEF4444)))),
                  data: (s) => _body(theme, c, s),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _body(ShadThemeData theme, UniMoveColors c, EarningsSummary s) {
    final net = (s.totalEarned * 0.85).round();
    final fee = s.totalEarned - net;
    final periodLabel = _periods
        .firstWhere((p) => p.$1 == _period,
            orElse: () => ('week', 'Tuần này'))
        .$2
        .toLowerCase();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Hero card
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [c.primary, c.primaryLight],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Thực nhận $periodLabel',
                style: theme.textTheme.small
                    .copyWith(color: Colors.white70, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 8),
              Text(
                _money(net),
                style: theme.textTheme.h2
                    .copyWith(color: Colors.white, fontWeight: FontWeight.w800),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // Payout card
        Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () => context.push('/payout/settings'),
            borderRadius: BorderRadius.circular(16),
            child: GlassCard(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                        color: c.iconBgTertiary,
                        borderRadius: BorderRadius.circular(12)),
                    child: Icon(LucideIcons.wallet, color: c.primaryLight, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Phương thức nhận tiền',
                            style: theme.textTheme.p
                                .copyWith(fontWeight: FontWeight.w800, color: c.onSurface)),
                        Text('Ngân hàng, MoMo, ZaloPay · quản lý giải ngân',
                            style: theme.textTheme.small
                                .copyWith(color: c.onSurfaceMuted)),
                      ],
                    ),
                  ),
                  Icon(LucideIcons.chevronRight, size: 18, color: c.onSurfaceMuted),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),

        // Stats
        GlassCard(
          child: Column(
            children: [
              _row(theme, c, 'Đơn hoàn thành', '${s.totalOrders}'),
              _row(theme, c, 'Doanh thu gộp', _money(s.totalEarned)),
              _row(theme, c, 'Phí nền tảng (15%)', _money(fee)),
              _row(theme, c, 'Thực nhận', _money(net), highlight: true),
            ],
          ),
        ),
        const SizedBox(height: 24),

        // Breakdown
        if (s.breakdown.isNotEmpty) ...[
          Text('Chi tiết theo ngày',
              style: theme.textTheme.large
                  .copyWith(fontWeight: FontWeight.w700, color: c.onSurface)),
          const SizedBox(height: 12),
          ...s.breakdown
              .where((d) => d.orders > 0)
              .map((d) => _dayTile(theme, c, d)),
          if (s.breakdown.every((d) => d.orders == 0))
            GlassCard(
              child: Text('Chưa có đơn hoàn thành $periodLabel.',
                  style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted)),
            ),
        ] else
          GlassCard(
            child: Text('Chưa có dữ liệu.',
                style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted)),
          ),
      ],
    );
  }

  Widget _row(ShadThemeData theme, UniMoveColors c, String label, String value,
      {bool highlight = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: theme.textTheme.p.copyWith(color: c.onSurfaceMuted)),
          Text(value,
              style: theme.textTheme.p.copyWith(
                  fontWeight: FontWeight.w700,
                  color: highlight ? c.success : c.onSurface)),
        ],
      ),
    );
  }

  Widget _dayTile(ShadThemeData theme, UniMoveColors c, EarningsDay d) {
    final parts = d.date.split('-');
    final label = parts.length == 3 ? '${parts[2]}/${parts[1]}' : d.date;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: GlassCard(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        radius: 14,
        child: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                  color: c.iconBgTertiary, borderRadius: BorderRadius.circular(10)),
              child: Icon(LucideIcons.circleCheck, color: c.success, size: 18),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label,
                      style: theme.textTheme.p
                          .copyWith(fontWeight: FontWeight.w700, color: c.onSurface)),
                  Text('${d.orders} đơn',
                      style:
                          theme.textTheme.small.copyWith(color: c.onSurfaceMuted)),
                ],
              ),
            ),
            Text(_money((d.earned * 0.85).round()),
                style: theme.textTheme.p
                    .copyWith(fontWeight: FontWeight.w800, color: c.success)),
          ],
        ),
      ),
    );
  }

  static String _money(int amount) {
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
