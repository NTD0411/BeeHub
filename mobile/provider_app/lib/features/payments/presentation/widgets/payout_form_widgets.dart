import 'package:flutter/material.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/shad_screen_scope.dart';
import '../../data/vietnam_banks.dart';
import '../../domain/provider_payout_models.dart';

class PayoutFormSection extends StatelessWidget {
  const PayoutFormSection({
    super.key,
    required this.title,
    this.subtitle,
    required this.child,
    this.trailing,
  });

  final String title;
  final String? subtitle;
  final Widget child;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    return ShadScreenScope(
      builder: (_, theme) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: theme.textTheme.large.copyWith(fontWeight: FontWeight.w800, color: c.onSurface),
                      ),
                      if (subtitle != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          subtitle!,
                          style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted, height: 1.35),
                        ),
                      ],
                    ],
                  ),
                ),
                if (trailing != null) trailing!,
              ],
            ),
            const SizedBox(height: 12),
            GlassCard(padding: const EdgeInsets.all(16), child: child),
          ],
        );
      },
    );
  }
}

class PayoutFieldLabel extends StatelessWidget {
  const PayoutFieldLabel({super.key, required this.label, this.required = false, this.hint});

  final String label;
  final bool required;
  final String? hint;

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    return ShadScreenScope(
      builder: (_, theme) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    label,
                    style: theme.textTheme.small.copyWith(
                      fontWeight: FontWeight.w700,
                      color: c.onSurface,
                    ),
                  ),
                  if (required)
                    Text(' *', style: theme.textTheme.small.copyWith(color: AppColors.error, fontWeight: FontWeight.w700)),
                ],
              ),
              if (hint != null) ...[
                const SizedBox(height: 2),
                Text(hint!, style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted, fontSize: 11)),
              ],
            ],
          ),
        );
      },
    );
  }
}

class PayoutMethodTypeCard extends StatelessWidget {
  const PayoutMethodTypeCard({
    super.key,
    required this.kind,
    required this.selected,
    required this.onTap,
    required this.icon,
    required this.description,
  });

  final ProviderPayoutKind kind;
  final bool selected;
  final VoidCallback onTap;
  final IconData icon;
  final String description;

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    return ShadScreenScope(
      builder: (_, theme) {
        return Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(14),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: selected ? c.primaryLight : c.glassBorder,
                  width: selected ? 2 : 1,
                ),
                color: selected ? c.primary.withValues(alpha: 0.08) : c.glassCard,
              ),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: selected ? c.primary.withValues(alpha: 0.15) : c.iconBgTertiary,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(icon, color: selected ? c.primaryLight : c.onSurfaceMuted, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          kind.label,
                          style: theme.textTheme.p.copyWith(
                            fontWeight: FontWeight.w800,
                            color: c.onSurface,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          description,
                          style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted, height: 1.3),
                        ),
                      ],
                    ),
                  ),
                  if (selected)
                    Icon(LucideIcons.circleCheck, color: c.primaryLight, size: 22)
                  else
                    Icon(LucideIcons.circle, color: c.onSurfaceMuted.withValues(alpha: 0.4), size: 22),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

Future<VietnamBank?> showBankPickerSheet(BuildContext context, VietnamBank? current) {
  final c = UniMoveColors.of(context);

  return showModalBottomSheet<VietnamBank>(
    context: context,
    backgroundColor: c.surface,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (ctx) {
      return ShadScreenScope(
        builder: (_, theme) {
          return DraggableScrollableSheet(
            expand: false,
            initialChildSize: 0.65,
            minChildSize: 0.4,
            maxChildSize: 0.9,
            builder: (_, scrollController) {
              return Column(
                children: [
                  const SizedBox(height: 12),
                  Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: c.onSurfaceMuted.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            'Chọn ngân hàng',
                            style: theme.textTheme.large.copyWith(fontWeight: FontWeight.w800, color: c.onSurface),
                          ),
                        ),
                        ShadIconButton.ghost(
                          icon: Icon(LucideIcons.x, color: c.onSurfaceMuted),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: ListView.builder(
                      controller: scrollController,
                      padding: const EdgeInsets.fromLTRB(12, 0, 12, 24),
                      itemCount: VietnamBanks.all.length,
                      itemBuilder: (_, i) {
                        final bank = VietnamBanks.all[i];
                        final selected = current?.shortName == bank.shortName;
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Material(
                            color: Colors.transparent,
                            child: InkWell(
                              borderRadius: BorderRadius.circular(12),
                              onTap: () => Navigator.pop(ctx, bank),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(12),
                                  color: selected ? c.primary.withValues(alpha: 0.1) : c.glassCard,
                                  border: Border.all(
                                    color: selected ? c.primaryLight : c.glassBorder,
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 40,
                                      height: 40,
                                      alignment: Alignment.center,
                                      decoration: BoxDecoration(
                                        color: c.iconBgTertiary,
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: Text(
                                        bank.payosCode,
                                        style: theme.textTheme.small.copyWith(
                                          fontWeight: FontWeight.w800,
                                          color: c.primaryLight,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            bank.shortName,
                                            style: theme.textTheme.p.copyWith(
                                              fontWeight: FontWeight.w700,
                                              color: c.onSurface,
                                            ),
                                          ),
                                          Text(
                                            'BIN ${bank.binCode}',
                                            style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted),
                                          ),
                                        ],
                                      ),
                                    ),
                                    if (selected) Icon(LucideIcons.check, color: c.primaryLight, size: 20),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              );
            },
          );
        },
      );
    },
  );
}
