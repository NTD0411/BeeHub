import 'package:flutter/material.dart';

import '../../../../core/theme/uni_move_colors.dart';
import '../../domain/pass_item_provinces.dart';

/// Bottom sheet chọn tỉnh / thành phố.
Future<String?> showPassItemProvincePicker(
  BuildContext context, {
  required String selectedId,
}) {
  return showModalBottomSheet<String>(
    context: context,
    isScrollControlled: true,
    backgroundColor: UniMoveColors.of(context).surface,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (ctx) {
      final c = UniMoveColors.of(ctx);
      return DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.55,
        minChildSize: 0.35,
        maxChildSize: 0.85,
        builder: (_, scroll) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 10),
              Center(
                child: Container(
                  width: 44,
                  height: 5,
                  decoration: BoxDecoration(color: c.border, borderRadius: BorderRadius.circular(999)),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                child: Text(
                  'Chọn tỉnh / thành phố',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: c.onSurface),
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Text(
                  'Hiển thị tin pass đồ tại nơi bạn đang ở',
                  style: TextStyle(fontSize: 13, color: c.onSurfaceMuted),
                ),
              ),
              const SizedBox(height: 8),
              Expanded(
                child: ListView.builder(
                  controller: scroll,
                  padding: EdgeInsets.fromLTRB(12, 4, 12, 16 + MediaQuery.of(ctx).padding.bottom),
                  itemCount: PassItemProvince.all.length,
                  itemBuilder: (_, i) {
                    final p = PassItemProvince.all[i];
                    final selected = p.id == selectedId;
                    return ListTile(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      tileColor: selected ? c.primary.withValues(alpha: 0.1) : null,
                      leading: Icon(
                        Icons.location_city_outlined,
                        color: selected ? c.primary : c.onSurfaceMuted,
                      ),
                      title: Text(
                        p.label,
                        style: TextStyle(
                          fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                          color: c.onSurface,
                        ),
                      ),
                      trailing: selected ? Icon(Icons.check_circle, color: c.primary) : null,
                      onTap: () => Navigator.of(ctx).pop(p.id),
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
}
