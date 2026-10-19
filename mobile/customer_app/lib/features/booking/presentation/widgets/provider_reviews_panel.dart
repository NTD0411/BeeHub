import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../../core/theme/uni_move_colors.dart';
import '../../domain/booking_models.dart';

/// Thống kê đánh giá — dùng cho UI kiểu Google Maps.
class ProviderReviewStats {
  const ProviderReviewStats({
    required this.averageRating,
    required this.totalCount,
    required this.starCounts,
    required this.reviews,
  });

  final double averageRating;
  final int totalCount;
  final Map<int, int> starCounts;
  final List<ProviderReview> reviews;

  factory ProviderReviewStats.from({
    required double averageRating,
    required int totalCount,
    required List<ProviderReview> reviews,
  }) {
    return ProviderReviewStats(
      averageRating: averageRating,
      totalCount: totalCount,
      starCounts: _synthesizeDistribution(averageRating, totalCount),
      reviews: reviews,
    );
  }

  static Map<int, int> _synthesizeDistribution(double avg, int total) {
    if (total <= 0) {
      return {5: 0, 4: 0, 3: 0, 2: 0, 1: 0};
    }
    final five = (total * (avg >= 4.7 ? 0.78 : avg >= 4.3 ? 0.62 : 0.45)).round();
    final four = (total * 0.16).round();
    final three = (total * 0.05).round();
    var rest = total - five - four - three;
    final two = rest > 1 ? 1 : 0;
    rest -= two;
    final one = rest > 0 ? rest : 0;
    return {5: five, 4: four, 3: three, 2: two, 1: one};
  }
}

/// Tóm tắt điểm + biểu đồ sao (giống Google).
class GoogleStyleReviewSummary extends StatelessWidget {
  const GoogleStyleReviewSummary({super.key, required this.stats});

  final ProviderReviewStats stats;

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);
    final maxBar = stats.starCounts.values.fold<int>(0, (m, v) => v > m ? v : m);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Text(
              stats.averageRating.toStringAsFixed(1),
              style: TextStyle(fontSize: 44.sp, fontWeight: FontWeight.w300, color: c.onSurface),
            ),
            _starRow(stats.averageRating, size: 16.sp),
            SizedBox(height: 4.h),
            Text(
              '${stats.totalCount} đánh giá',
              style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted),
            ),
          ],
        ),
        SizedBox(width: 20.w),
        Expanded(
          child: Column(
            children: [
              for (var star = 5; star >= 1; star--)
                _barRow(c, star: star, count: stats.starCounts[star] ?? 0, max: maxBar),
            ],
          ),
        ),
      ],
    );
  }

  Widget _barRow(UniMoveColors c, {required int star, required int count, required int max}) {
    final ratio = max == 0 ? 0.0 : count / max;
    return Padding(
      padding: EdgeInsets.only(bottom: 4.h),
      child: Row(
        children: [
          SizedBox(
            width: 10.w,
            child: Text('$star', style: TextStyle(fontSize: 11.sp, color: c.onSurfaceMuted)),
          ),
          SizedBox(width: 4.w),
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(4.r),
              child: LinearProgressIndicator(
                value: ratio,
                minHeight: 6.h,
                backgroundColor: c.surfaceTint,
                color: Colors.amber.shade600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Một đánh giá — avatar, sao, thời gian, nội dung (có thể mở rộng).
class GoogleStyleReviewCard extends StatefulWidget {
  const GoogleStyleReviewCard({
    super.key,
    required this.review,
    this.initiallyExpanded = false,
  });

  final ProviderReview review;
  final bool initiallyExpanded;

  @override
  State<GoogleStyleReviewCard> createState() => _GoogleStyleReviewCardState();
}

class _GoogleStyleReviewCardState extends State<GoogleStyleReviewCard> {
  late bool _expanded = widget.initiallyExpanded;

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);
    final r = widget.review;
    final isLong = r.comment.length > 120;

    return InkWell(
      onTap: isLong ? () => setState(() => _expanded = !_expanded) : null,
      borderRadius: BorderRadius.circular(12.r),
      child: Padding(
        padding: EdgeInsets.symmetric(vertical: 12.h),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  radius: 18.r,
                  backgroundColor: c.primaryContainer,
                  child: Text(
                    r.author.isNotEmpty ? r.author[0].toUpperCase() : '?',
                    style: TextStyle(fontWeight: FontWeight.w700, color: c.primary, fontSize: 14.sp),
                  ),
                ),
                SizedBox(width: 12.w),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(r.author, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14.sp)),
                      SizedBox(height: 4.h),
                      Row(
                        children: [
                          _starRow(r.rating, size: 14.sp),
                          SizedBox(width: 8.w),
                          Text(r.timeAgoLabel, style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted)),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            SizedBox(height: 10.h),
            Text(
              r.comment,
              maxLines: _expanded ? null : 4,
              overflow: _expanded ? TextOverflow.visible : TextOverflow.ellipsis,
              style: TextStyle(fontSize: 14.sp, height: 1.45, color: c.onSurface),
            ),
            if (isLong)
              Padding(
                padding: EdgeInsets.only(top: 4.h),
                child: Text(
                  _expanded ? 'Thu gọn' : 'Xem thêm',
                  style: TextStyle(fontSize: 13.sp, fontWeight: FontWeight.w600, color: c.primary),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// Danh sách đánh giá đầy đủ trong trang / bottom sheet.
class GoogleStyleReviewsList extends StatelessWidget {
  const GoogleStyleReviewsList({
    super.key,
    required this.stats,
    this.showSummary = true,
  });

  final ProviderReviewStats stats;
  final bool showSummary;

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    if (stats.reviews.isEmpty) {
      return Padding(
        padding: EdgeInsets.symmetric(vertical: 24.h),
        child: Center(
          child: Text('Chưa có đánh giá', style: TextStyle(color: c.onSurfaceMuted)),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (showSummary) ...[
          GoogleStyleReviewSummary(stats: stats),
          SizedBox(height: 20.h),
          Divider(color: c.border),
          SizedBox(height: 8.h),
          Text(
            'Đánh giá',
            style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w700, color: c.onSurface),
          ),
          SizedBox(height: 4.h),
        ],
        ...stats.reviews.map(
          (r) => Column(
            children: [
              GoogleStyleReviewCard(review: r),
              Divider(height: 1, color: c.border),
            ],
          ),
        ),
      ],
    );
  }
}

/// Mở bottom sheet xem toàn bộ đánh giá (Google-style).
Future<void> showProviderReviewsSheet(
  BuildContext context, {
  required String providerName,
  required ProviderReviewStats stats,
  String? subtitle,
}) {
  final c = UniMoveColors.of(context);

  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: c.surface,
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20.r))),
    builder: (ctx) {
      final maxH = MediaQuery.of(ctx).size.height * 0.88;
      return SafeArea(
        child: SizedBox(
          height: maxH,
          child: Column(
            children: [
              SizedBox(height: 10.h),
              Container(
                width: 44.w,
                height: 5.h,
                decoration: BoxDecoration(color: c.border, borderRadius: BorderRadius.circular(99.r)),
              ),
              Padding(
                padding: EdgeInsets.fromLTRB(20.w, 16.h, 20.w, 8.h),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(providerName, style: TextStyle(fontSize: 20.sp, fontWeight: FontWeight.w800)),
                    if (subtitle != null) ...[
                      SizedBox(height: 4.h),
                      Text(subtitle, style: TextStyle(fontSize: 13.sp, color: c.onSurfaceMuted)),
                    ],
                  ],
                ),
              ),
              Expanded(
                child: ListView(
                  padding: EdgeInsets.fromLTRB(20.w, 0, 20.w, 24.h),
                  children: [GoogleStyleReviewsList(stats: stats)],
                ),
              ),
            ],
          ),
        ),
      );
    },
  );
}

Widget _starRow(double rating, {required double size}) {
  return Row(
    mainAxisSize: MainAxisSize.min,
    children: List.generate(5, (i) {
      final filled = rating >= i + 1;
      final half = !filled && rating > i && rating < i + 1;
      return Icon(
        filled ? Icons.star_rounded : (half ? Icons.star_half_rounded : Icons.star_outline_rounded),
        size: size,
        color: Colors.amber.shade700,
      );
    }),
  );
}
