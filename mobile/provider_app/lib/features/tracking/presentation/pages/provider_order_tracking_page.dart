import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/shad_screen_scope.dart';
import '../../domain/provider_tracking_models.dart';
import '../../../orders/domain/provider_order.dart';
import '../../../orders/presentation/providers/orders_providers.dart';

class ProviderOrderTrackingPage extends ConsumerStatefulWidget {
  const ProviderOrderTrackingPage({super.key, required this.orderId});

  final String orderId;

  @override
  ConsumerState<ProviderOrderTrackingPage> createState() => _ProviderOrderTrackingPageState();
}

class _ProviderOrderTrackingPageState extends ConsumerState<ProviderOrderTrackingPage> {
  ProviderOrder? _order;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final order = await ref.read(providerOrdersRepositoryProvider).fetchById(widget.orderId);
    if (!mounted) return;
    setState(() {
      _order = order;
      _loading = false;
    });
  }

  List<TrackingStepItem> _stepsFor(ProviderOrder order) {
    const labels = [
      ('pending', 'Chờ nhận'),
      ('accepted', 'Đã nhận'),
      ('picking_up', 'Đang lấy hàng'),
      ('in_progress', 'Đang giao'),
      ('completed', 'Hoàn thành'),
    ];
    const orderKeys = ['pending', 'accepted', 'picking_up', 'in_progress', 'completed'];
    final current = order.status;
    var passed = true;

    return labels.map((e) {
      final done = passed && orderKeys.indexOf(e.$1) <= orderKeys.indexOf(current);
      final active = e.$1 == current && order.isActive;
      if (e.$1 == current) passed = false;
      return TrackingStepItem(
        key: e.$1,
        label: e.$2,
        done: done || order.isCompleted,
        active: active,
      );
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    if (_loading) {
      return Scaffold(
        backgroundColor: c.background,
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final order = _order!;
    final customer = order.pickupPoint.contactName.isNotEmpty
        ? order.pickupPoint.contactName
        : 'Khách hàng';
    final steps = _stepsFor(order);

    return ShadScreenScope(
      builder: (_, theme) {
        return Scaffold(
          backgroundColor: c.background,
          appBar: AppBar(
            backgroundColor: c.background,
            title: const Text('Theo dõi hành trình'),
          ),
          body: ListView(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
            children: [
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: c.chipBg,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: c.border),
                ),
                child: Row(
                  children: [
                    Icon(LucideIcons.info, size: 18, color: c.onSurfaceMuted),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Theo dõi theo trạng thái đơn. GPS realtime chưa khả dụng.',
                        style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted, height: 1.35),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Text(
                order.statusLabel,
                style: theme.textTheme.h4.copyWith(fontWeight: FontWeight.w800, color: c.onSurface),
              ),
              const SizedBox(height: 6),
              Text(
                '#${order.orderNumber ?? order.id.substring(0, 8)} · $customer',
                style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted),
              ),
              const SizedBox(height: 16),
              _TrackingStepper(steps: steps, c: c),
              const SizedBox(height: 16),
              GlassCard(
                child: Column(
                  children: [
                    _routeRow(c, theme, LucideIcons.circleDot, 'Điểm lấy', order.pickupAddress, true),
                    Divider(height: 20, color: c.border),
                    _routeRow(c, theme, LucideIcons.mapPin, 'Điểm giao', order.deliveryAddress, false),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              ShadButton(
                width: double.infinity,
                onPressed: () => context.push('/orders/${order.id}'),
                child: const Text('Chi tiết đơn đầy đủ'),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _routeRow(
    UniMoveColors c,
    ShadThemeData theme,
    IconData icon,
    String label,
    String address,
    bool isPickup,
  ) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: isPickup ? c.success : c.primaryLight),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted)),
              Text(
                address,
                style: theme.textTheme.small.copyWith(
                  fontWeight: FontWeight.w600,
                  color: c.onSurface,
                  height: 1.35,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _TrackingStepper extends StatelessWidget {
  const _TrackingStepper({required this.steps, required this.c});

  final List<TrackingStepItem> steps;
  final UniMoveColors c;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        for (var i = 0; i < steps.length; i++) ...[
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(
                children: [
                  Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      color: steps[i].done
                          ? c.success
                          : steps[i].active
                              ? c.primary
                              : c.chipBg,
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: steps[i].active ? c.primary : c.border,
                      ),
                    ),
                    child: Icon(
                      steps[i].done ? LucideIcons.check : LucideIcons.circle,
                      size: 14,
                      color: steps[i].done || steps[i].active ? Colors.white : c.onSurfaceMuted,
                    ),
                  ),
                  if (i < steps.length - 1)
                    Container(
                      width: 2,
                      height: 28,
                      color: steps[i].done ? c.success.withValues(alpha: 0.5) : c.border,
                    ),
                ],
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(
                    steps[i].label,
                    style: TextStyle(
                      fontWeight: steps[i].active ? FontWeight.w800 : FontWeight.w500,
                      color: steps[i].active ? c.onSurface : c.onSurfaceMuted,
                      fontSize: 14,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }
}
