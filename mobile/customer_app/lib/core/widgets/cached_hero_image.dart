import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:shimmer/shimmer.dart';

import '../theme/uni_move_colors.dart';

class CachedHeroImage extends StatelessWidget {
  const CachedHeroImage({
    super.key,
    required this.url,
    required this.height,
    this.borderRadius,
  });

  final String url;
  final double height;
  final BorderRadius? borderRadius;

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);
    final radius = borderRadius ?? BorderRadius.circular(16.r);

    return ClipRRect(
      borderRadius: radius,
      child: SizedBox(
        height: height,
        width: double.infinity,
        child: CachedNetworkImage(
          imageUrl: url,
          fit: BoxFit.cover,
          memCacheWidth: 800,
          fadeInDuration: const Duration(milliseconds: 200),
          placeholder: (_, __) => Shimmer.fromColors(
            baseColor: c.surfaceTint,
            highlightColor: c.surface,
            child: Container(color: c.surfaceTint),
          ),
          errorWidget: (_, __, ___) => Container(
            color: c.surfaceTint,
            alignment: Alignment.center,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.image_outlined, color: c.onSurfaceMuted, size: 28.sp),
                SizedBox(height: 6.h),
                Text(
                  'Hình ảnh minh hoạ',
                  style: TextStyle(fontSize: 11.sp, color: c.onSurfaceMuted),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
