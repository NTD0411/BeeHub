import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/shad_screen_scope.dart';
import '../../../orders/domain/provider_order.dart';
import '../../../orders/presentation/providers/orders_providers.dart';
import '../../data/provider_payout_repository.dart';
import '../../domain/provider_payout_models.dart';
import 'add_provider_payout_method_page.dart';

final _payoutRepo = ProviderPayoutRepository();

class ProviderPayoutSettingsPage extends ConsumerStatefulWidget {
  const ProviderPayoutSettingsPage({super.key});

  @override
  ConsumerState<ProviderPayoutSettingsPage> createState() => _ProviderPayoutSettingsPageState();
}

class _ProviderPayoutSettingsPageState extends ConsumerState<ProviderPayoutSettingsPage> {
  List<ProviderPayoutMethod> _methods = const [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final methods = await _payoutRepo.fetchMethods();
    if (mounted) {
      setState(() {
        _methods = methods;
        _loading = false;
      });
    }
  }

  Future<void> _openAdd() async {
    final added = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => const AddProviderPayoutMethodPage()),
    );
    if (added == true) await _load();
  }

  IconData _iconFor(ProviderPayoutKind kind) => switch (kind) {
        ProviderPayoutKind.bank => LucideIcons.landmark,
        ProviderPayoutKind.momo => LucideIcons.smartphone,
        ProviderPayoutKind.zalopay => LucideIcons.wallet,
      };

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);
    final orders = ref.watch(providerOrdersListProvider).asData?.value ?? const [];
    final now = DateTime.now();
    final netMonth = orders
        .where((o) {
          final d = o.createdAt;
          return o.isCompleted && d != null && d.year == now.year && d.month == now.month;
        })
        .fold<int>(0, (s, o) => s + o.netEarnings);
    final pending = orders.where((o) {
      if (!o.isCompleted) return false;
      final d = o.completedAt ?? o.createdAt;
      if (d == null) return false;
      return DateTime.now().difference(d).inDays <= 5;
    }).fold<int>(0, (s, o) => s + o.netEarnings);
    final wallet = _payoutRepo.walletFromCompletedEarnings(netMonth, pending);
    final transfers = _payoutRepo.mockTransfers();

    return ShadScreenScope(
      builder: (_, theme) {
        return Scaffold(
          backgroundColor: c.background,
          appBar: AppBar(
            backgroundColor: c.background,
            elevation: 0,
            scrolledUnderElevation: 0,
            leading: IconButton(
              icon: Icon(LucideIcons.arrowLeft, color: c.onSurface),
              onPressed: () => context.pop(),
            ),
            title: Text(
              'Nhận tiền',
              style: theme.textTheme.large.copyWith(fontWeight: FontWeight.w800, color: c.onSurface),
            ),
          ),
          body: _loading
              ? const Center(child: CircularProgressIndicator())
              : RefreshIndicator(
                  onRefresh: _load,
                  color: c.primary,
                  child: ListView(
                    physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                    padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
                    children: [
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
                              'Số dư khả dụng',
                              style: theme.textTheme.small.copyWith(color: Colors.white70, fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              ProviderOrder.formatMoney(wallet.available),
                              style: theme.textTheme.h2.copyWith(color: Colors.white, fontWeight: FontWeight.w800),
                            ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Expanded(
                                  child: _balanceChip(
                                    theme,
                                    'Đang chờ giải ngân',
                                    ProviderOrder.formatMoney(wallet.pending),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: _balanceChip(
                                    theme,
                                    'Tổng đã kiếm',
                                    ProviderOrder.formatMoney(wallet.totalEarned),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      GlassCard(
                        padding: const EdgeInsets.all(14),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(LucideIcons.info, size: 18, color: c.primaryLight),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                'Tiền được chuyển sau khi khách xác nhận hoàn tất đơn. Mặc định rút về tài khoản đã đặt làm chính.',
                                style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted, height: 1.4),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              'Phương thức nhận tiền',
                              style: theme.textTheme.large.copyWith(fontWeight: FontWeight.w800, color: c.onSurface),
                            ),
                          ),
                          ShadButton.outline(
                            size: ShadButtonSize.sm,
                            onPressed: _openAdd,
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(LucideIcons.plus, size: 16, color: c.primaryLight),
                                const SizedBox(width: 4),
                                const Text('Thêm'),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      if (_methods.isEmpty)
                        GlassCard(
                          child: Text(
                            'Chưa có tài khoản nhận tiền. Thêm ngân hàng hoặc ví để rút thu nhập.',
                            style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted),
                          ),
                        )
                      else
                        ..._methods.map((m) => _methodTile(theme, c, m)),
                      const SizedBox(height: 24),
                      Text(
                        'Lịch sử giải ngân',
                        style: theme.textTheme.large.copyWith(fontWeight: FontWeight.w800, color: c.onSurface),
                      ),
                      const SizedBox(height: 12),
                      ...transfers.map((t) => _transferTile(theme, c, t)),
                    ],
                  ),
                ),
        );
      },
    );
  }

  Widget _balanceChip(ShadThemeData theme, String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: theme.textTheme.small.copyWith(color: Colors.white70, fontSize: 11)),
          const SizedBox(height: 4),
          Text(value, style: theme.textTheme.p.copyWith(color: Colors.white, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }

  Widget _methodTile(ShadThemeData theme, UniMoveColors c, ProviderPayoutMethod m) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: GlassCard(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: c.iconBgTertiary,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(_iconFor(m.kind), color: c.primaryLight, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          m.displayName.isNotEmpty ? m.displayName : m.kind.label,
                          style: theme.textTheme.p.copyWith(fontWeight: FontWeight.w800, color: c.onSurface),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (m.isDefault) ...[
                        const SizedBox(width: 6),
                        _badge(theme, c, 'Mặc định', c.primaryLight, c.primary.withValues(alpha: 0.12)),
                      ],
                      if (m.verificationStatus == PayoutVerificationStatus.verified) ...[
                        const SizedBox(width: 6),
                        _badge(theme, c, 'PayOS ✓', c.success, c.success.withValues(alpha: 0.12)),
                      ] else if (m.verificationStatus == PayoutVerificationStatus.pending) ...[
                        const SizedBox(width: 6),
                        _badge(theme, c, 'Chờ KYC', Colors.orange, Colors.orange.withValues(alpha: 0.12)),
                      ],
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(m.subtitle, style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted)),
                  Text(
                    m.accountName,
                    style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted, fontSize: 11),
                  ),
                ],
              ),
            ),
            PopupMenuButton<String>(
              icon: Icon(LucideIcons.ellipsisVertical, color: c.onSurfaceMuted, size: 20),
              onSelected: (action) async {
                if (action == 'default' && !m.isDefault) {
                  await _payoutRepo.setDefault(m.id);
                  await _load();
                } else if (action == 'remove' && _methods.length > 1) {
                  await _payoutRepo.removeMethod(m.id);
                  await _load();
                } else if (action == 'remove') {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Cần ít nhất một phương thức nhận tiền')),
                    );
                  }
                }
              },
              itemBuilder: (_) => [
                if (!m.isDefault)
                  const PopupMenuItem(value: 'default', child: Text('Đặt làm mặc định')),
                const PopupMenuItem(value: 'remove', child: Text('Xóa')),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _badge(ShadThemeData theme, UniMoveColors c, String text, Color fg, Color bg) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(8)),
      child: Text(
        text,
        style: theme.textTheme.small.copyWith(color: fg, fontWeight: FontWeight.w700, fontSize: 10),
      ),
    );
  }

  Widget _transferTile(ShadThemeData theme, UniMoveColors c, ProviderPayoutTransfer t) {
    final color = switch (t.status) {
      PayoutTransferStatus.completed => c.success,
      PayoutTransferStatus.pending => Colors.orange,
      PayoutTransferStatus.failed => Colors.red,
    };

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: GlassCard(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10)),
              child: Icon(
                t.status == PayoutTransferStatus.completed ? LucideIcons.circleCheck : LucideIcons.clock,
                color: color,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    ProviderOrder.formatMoney(t.amount),
                    style: theme.textTheme.p.copyWith(fontWeight: FontWeight.w800, color: c.onSurface),
                  ),
                  Text(t.methodLabel, style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted)),
                  Text(
                    '${t.createdAt.day}/${t.createdAt.month}/${t.createdAt.year} · ${t.status.label}',
                    style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted, fontSize: 11),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
