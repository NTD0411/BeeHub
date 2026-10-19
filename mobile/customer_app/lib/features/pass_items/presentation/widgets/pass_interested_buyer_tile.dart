import 'package:flutter/material.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/theme/uni_move_colors.dart';
import '../../domain/pass_extras.dart';
import '../pass_item_format.dart';

class PassInterestedBuyerTile extends StatelessWidget {
  const PassInterestedBuyerTile({
    super.key,
    required this.buyer,
    required this.onTap,
  });

  final PassInterestedBuyer buyer;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: c.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: c.border),
          ),
          child: Row(
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  CircleAvatar(
                    radius: 24,
                    backgroundColor: c.iconBgSecondary,
                    child: Text(
                      buyer.name.substring(0, 1).toUpperCase(),
                      style: TextStyle(color: c.primary, fontWeight: FontWeight.w800, fontSize: 16),
                    ),
                  ),
                  if (buyer.unreadForSeller > 0)
                    Positioned(
                      right: -2,
                      top: -2,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(color: c.accentGreen, shape: BoxShape.circle),
                        constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
                        child: Text(
                          '${buyer.unreadForSeller}',
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            buyer.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: c.onSurface),
                          ),
                        ),
                        Text(
                          passItemTimeAgo(buyer.interestedAt),
                          style: TextStyle(fontSize: 11, color: c.onSurfaceMuted),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Icon(Icons.phone_outlined, size: 12, color: c.onSurfaceMuted),
                        const SizedBox(width: 4),
                        Text(buyer.contact, style: TextStyle(fontSize: 12, color: c.onSurfaceMuted)),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Icon(Icons.place_outlined, size: 12, color: c.onSurfaceMuted),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            buyer.area,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(fontSize: 12, color: c.onSurfaceMuted),
                          ),
                        ),
                      ],
                    ),
                    if (buyer.note != null && buyer.note!.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        buyer.note!,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 11, color: c.primary, fontWeight: FontWeight.w600),
                      ),
                    ],
                    if (buyer.lastMessage != null && buyer.lastMessage!.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Text(
                        buyer.lastMessage!,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 12, color: c.onSurface, height: 1.3),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Icon(LucideIcons.chevronRight, size: 18, color: c.onSurfaceMuted),
            ],
          ),
        ),
      ),
    );
  }
}
