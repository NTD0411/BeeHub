import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/shad_screen_scope.dart';
import '../../domain/provider_order.dart';
import '../providers/orders_providers.dart';

class IncomingRequestPage extends ConsumerStatefulWidget {
  const IncomingRequestPage({super.key, required this.orderId});

  final String orderId;

  @override
  ConsumerState<IncomingRequestPage> createState() => _IncomingRequestPageState();
}

class _IncomingRequestPageState extends ConsumerState<IncomingRequestPage> {
  static const _totalSeconds = 30;
  int _remaining = _totalSeconds;
  Timer? _timer;
  bool _submitting = false;
  bool _loading = true;
  ProviderOrder? _order;

  @override
  void initState() {
    super.initState();
    _loadOrder();
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) return;
      setState(() => _remaining -= 1);
      if (_remaining <= 0) {
        t.cancel();
        _onExpired();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _loadOrder() async {
    try {
      final order = await ref.read(providerOrdersRepositoryProvider).fetchById(widget.orderId);
      if (!mounted) return;
      setState(() {
        _order = order;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  void _onExpired() {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Đã bỏ lỡ yêu cầu')),
    );
    context.pop();
  }

  Future<void> _respond(String response) async {
    _timer?.cancel();
    setState(() => _submitting = true);
    try {
      await ref.read(providerOrdersRepositoryProvider).respond(orderId: widget.orderId, response: response);
      ref.invalidate(providerOrdersListProvider);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(response == 'accepted' ? 'Đã nhận chuyến' : 'Đã từ chối chuyến')),
      );
      context.pop();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
        setState(() => _submitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);
    final order = _order;

    return ShadScreenScope(
      builder: (_, theme) {
        return Scaffold(
          backgroundColor: c.surfaceHigh,
          body: Stack(
            fit: StackFit.expand,
            children: [
              _mapBackdrop(c),
              SafeArea(
                child: _loading
                    ? const Center(child: CircularProgressIndicator())
                    : order == null
                    ? Center(child: Text('Không tìm thấy yêu cầu', style: TextStyle(color: c.onSurfaceMuted)))
                    : Column(
                        children: [
                          Expanded(
                            child: SingleChildScrollView(
                              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                              child: _offerCard(theme, c, order),
                            ),
                          ),
                          _footerNote(theme, c),
                        ],
                      ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _mapBackdrop(UniMoveColors c) {
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [c.surfaceHigh, c.surfaceTint, c.surfaceHigh],
        ),
      ),
      child: CustomPaint(painter: _GridPainter(c.border)),
    );
  }

  Widget _offerCard(ShadThemeData theme, UniMoveColors c, ProviderOrder order) {
    return Container(
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: c.border),
        boxShadow: [BoxShadow(color: c.navBarShadow, blurRadius: 30, offset: const Offset(0, 16))],
      ),
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header banner with countdown
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [c.primary, c.primaryLight],
              ),
              borderRadius: BorderRadius.circular(18),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('YÊU CẦU MỚI',
                          style: theme.textTheme.small
                              .copyWith(color: Colors.white70, fontWeight: FontWeight.w700, letterSpacing: 0.5)),
                      const SizedBox(height: 4),
                      Text('Chuyến xe khả dụng',
                          style: theme.textTheme.h3.copyWith(color: Colors.white, fontWeight: FontWeight.w800)),
                    ],
                  ),
                ),
                _countdownRing(theme),
              ],
            ),
          ),
          const SizedBox(height: 18),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(_money(order.totalPrice),
                  style: theme.textTheme.h1.copyWith(color: c.primary, fontWeight: FontWeight.w800)),
              const SizedBox(width: 8),
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Text('Dự kiến', style: theme.textTheme.p.copyWith(color: c.onSurfaceMuted)),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _routeCard(theme, c, order),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _infoTile(theme, c, LucideIcons.route, 'Khoảng cách',
                    order.distanceKm != null ? '${_trimNum(order.distanceKm!)}km' : '—'),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _infoTile(theme, c, LucideIcons.clock, 'Thời gian',
                    order.etaMinutes != null ? '${order.etaMinutes} phút' : '—'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _itemsTile(theme, c, order.itemSummary ?? 'Không có mô tả'),
          const SizedBox(height: 18),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: c.onSurface,
                    side: BorderSide(color: c.border),
                    padding: const EdgeInsets.symmetric(vertical: 15),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  onPressed: _submitting ? null : () => _respond('declined'),
                  child: const Text('Từ chối', style: TextStyle(fontWeight: FontWeight.w700)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: c.primary,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(vertical: 15),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  onPressed: _submitting ? null : () => _respond('accepted'),
                  child: _submitting
                      ? const SizedBox(
                          width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Chấp nhận', style: TextStyle(fontWeight: FontWeight.w800)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _countdownRing(ShadThemeData theme) {
    return SizedBox(
      width: 52,
      height: 52,
      child: Stack(
        alignment: Alignment.center,
        children: [
          SizedBox(
            width: 52,
            height: 52,
            child: CircularProgressIndicator(
              value: _remaining / _totalSeconds,
              strokeWidth: 4,
              backgroundColor: Colors.white24,
              valueColor: const AlwaysStoppedAnimation(Colors.white),
            ),
          ),
          Text('${_remaining}s',
              style: theme.textTheme.small.copyWith(color: Colors.white, fontWeight: FontWeight.w800)),
        ],
      ),
    );
  }

  Widget _routeCard(ShadThemeData theme, UniMoveColors c, ProviderOrder order) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: c.surfaceHigh, borderRadius: BorderRadius.circular(16)),
      child: Column(
        children: [
          _routeRow(theme, c, LucideIcons.circleDot, c.primary, 'ĐIỂM LẤY HÀNG', order.pickupAddress),
          Padding(
            padding: const EdgeInsets.only(left: 11),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Container(width: 2, height: 18, color: c.border),
            ),
          ),
          _routeRow(theme, c, LucideIcons.mapPin, c.success, 'ĐIỂM GIAO HÀNG', order.deliveryAddress),
        ],
      ),
    );
  }

  Widget _routeRow(ShadThemeData theme, UniMoveColors c, IconData icon, Color tint, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 22, color: tint),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label,
                  style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted, fontWeight: FontWeight.w600)),
              const SizedBox(height: 2),
              Text(value, style: theme.textTheme.p.copyWith(color: c.onSurface, fontWeight: FontWeight.w700)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _infoTile(ShadThemeData theme, UniMoveColors c, IconData icon, String label, String value) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: c.surfaceHigh, borderRadius: BorderRadius.circular(14)),
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(color: c.iconBgSecondary, borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, size: 18, color: c.primary),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted)),
                Text(value, style: theme.textTheme.p.copyWith(color: c.onSurface, fontWeight: FontWeight.w800)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _itemsTile(ShadThemeData theme, UniMoveColors c, String text) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: c.surfaceHigh, borderRadius: BorderRadius.circular(14)),
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(color: c.iconBgSecondary, borderRadius: BorderRadius.circular(10)),
            child: Icon(LucideIcons.package, size: 18, color: c.primary),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Chi tiết đồ đạc', style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted)),
                Text(text, style: theme.textTheme.p.copyWith(color: c.onSurface, fontWeight: FontWeight.w700)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _footerNote(ShadThemeData theme, UniMoveColors c) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 4, 24, 12),
      child: Row(
        children: [
          Icon(LucideIcons.info, size: 14, color: c.onSurfaceMuted),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Đảm bảo an toàn khi lái xe. Chỉ thao tác khi dừng hẳn.',
              style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted),
            ),
          ),
        ],
      ),
    );
  }

  static String _trimNum(double v) => v == v.roundToDouble() ? v.toInt().toString() : v.toString();

  static String _money(int amount) {
    final s = amount.toString();
    final buf = StringBuffer();
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buf.write('.');
      buf.write(s[i]);
    }
    buf.write('đ');
    return buf.toString();
  }
}

class _GridPainter extends CustomPainter {
  _GridPainter(this.color);
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color.withValues(alpha: 0.5)
      ..strokeWidth = 1;
    const step = 48.0;
    for (var x = 0.0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (var y = 0.0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant _GridPainter oldDelegate) => oldDelegate.color != color;
}
