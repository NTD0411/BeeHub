import 'package:flutter/material.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../theme/uni_move_colors.dart';

/// Bọc màn con — [ShadTheme] + [ShadToaster] đã có ở root [UniMoveApp].
class ShadScreenScope extends StatelessWidget {
  const ShadScreenScope({
    super.key,
    required this.builder,
    this.withToaster = false,
  });

  final Widget Function(BuildContext shadContext, ShadThemeData theme) builder;
  final bool withToaster;

  @override
  Widget build(BuildContext context) {
    Widget child = Builder(
      builder: (shadContext) => builder(shadContext, ShadTheme.of(shadContext)),
    );

    if (withToaster) {
      child = ShadToaster(child: child);
    }

    return child;
  }
}

/// Card kính mờ — màu theo theme sáng/tối.
class GlassCard extends StatelessWidget {
  const GlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(24),
    this.radius = 24,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final double radius;

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: c.glassCard,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: c.glassBorder, width: 1),
        boxShadow: const [
          BoxShadow(
            color: Color(0x40000000),
            blurRadius: 28,
            offset: Offset(0, 12),
          ),
        ],
      ),
      child: child,
    );
  }
}
