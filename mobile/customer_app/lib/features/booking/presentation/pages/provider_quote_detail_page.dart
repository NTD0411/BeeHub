import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/cached_hero_image.dart';
import '../../../../core/widgets/smooth_cta_button.dart';
import '../../data/quote_progress_repository.dart';
import '../../domain/quote_models.dart';
import '../widgets/provider_reviews_panel.dart';

/// Chi tiết một báo giá — giá, phụ phí, đánh giá, chốt nhà xe.
class ProviderQuoteDetailPage extends StatefulWidget {
  const ProviderQuoteDetailPage({
    super.key,
    required this.referenceId,
    required this.quoteId,
  });

  final String referenceId;
  final String quoteId;

  @override
  State<ProviderQuoteDetailPage> createState() => _ProviderQuoteDetailPageState();
}

class _ProviderQuoteDetailPageState extends State<ProviderQuoteDetailPage> {
  final _repo = QuoteProgressRepository.instance;
  ProviderQuoteResponse? _quote;
  bool _loading = true;
  bool _confirming = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final snap = await _repo.fetch(widget.referenceId);
    ProviderQuoteResponse? found;
    if (snap != null) {
      for (final q in snap.quotes) {
        if (q.id == widget.quoteId) {
          found = q;
          break;
        }
      }
    }
    if (!mounted) return;

    if (snap?.status == QuoteProgressStatus.providerConfirmed &&
        !snap!.hasRequestedPickup) {
      setState(() => _loading = false);
      context.go('/booking/quotes/${widget.referenceId}/schedule');
      return;
    }
    if (snap?.status == QuoteProgressStatus.scheduled ||
        snap?.status == QuoteProgressStatus.providerAccepted ||
        snap?.status == QuoteProgressStatus.depositPaid ||
        snap?.status == QuoteProgressStatus.inProgress ||
        snap?.status == QuoteProgressStatus.completed) {
      setState(() => _loading = false);
      context.go('/booking/quotes/${widget.referenceId}/progress');
      return;
    }

    setState(() {
      _quote = found;
      _loading = false;
    });
  }

  Future<void> _confirm() async {
    final q = _quote;
    if (q != null && !q.canConfirmSchedule) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Nhà xe này không nhận khung giờ bạn chọn. Hãy chọn nhà xe khác.'),
        ),
      );
      return;
    }

    DateTime? pickupAt;
    if (q?.scheduleFit == QuoteScheduleFit.alternateProposed) {
      pickupAt = await _pickAlternateTime(q!);
      if (pickupAt == null || !mounted) return;
    }

    setState(() => _confirming = true);
    try {
      final updated = await _repo.confirmProvider(
        referenceId: widget.referenceId,
        quoteId: widget.quoteId,
        pickupAt: pickupAt,
      );
      if (!mounted) return;
      if (!updated.hasRequestedPickup) {
        context.go('/booking/quotes/${widget.referenceId}/schedule');
        return;
      }
      context.pop(true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Không chốt được: $e')));
      setState(() => _confirming = false);
    }
  }

  Future<DateTime?> _pickAlternateTime(ProviderQuoteResponse q) async {
    final proposed = q.proposedPickupAt;
    if (proposed == null) return null;

    final options = <DateTime>{
      proposed,
      proposed.subtract(const Duration(minutes: 30)),
      proposed.add(const Duration(minutes: 30)),
      proposed.add(const Duration(hours: 1)),
    }.toList()
      ..sort();

    final c = UniMoveColors.of(context);
    return showModalBottomSheet<DateTime>(
      context: context,
      backgroundColor: c.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20.r))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(20.w, 20.h, 20.w, 28.h),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Chọn giờ chuyển', style: TextStyle(fontSize: 18.sp, fontWeight: FontWeight.w800)),
            SizedBox(height: 6.h),
            Text(
              'Nhà xe đề xuất ${q.proposedPickupLabel ?? formatQuotePickupLabel(proposed)}. '
              'Bạn có thể chọn giờ gần nhất để chốt giá.',
              style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted, height: 1.35),
            ),
            SizedBox(height: 14.h),
            ...options.map(
              (dt) => ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Icon(
                  dt == proposed ? Icons.recommend_outlined : Icons.schedule_outlined,
                  color: c.primary,
                ),
                title: Text(formatQuotePickupLabel(dt), style: TextStyle(fontWeight: FontWeight.w600)),
                subtitle: dt == proposed ? const Text('Giờ nhà xe đề xuất') : null,
                onTap: () => Navigator.pop(ctx, dt),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    if (_loading) {
      return Scaffold(body: Center(child: CircularProgressIndicator(color: c.primary)));
    }

    final q = _quote;
    if (q == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Báo giá')),
        body: const Center(child: Text('Không tìm thấy báo giá')),
      );
    }

    return Scaffold(
      backgroundColor: c.background,
      appBar: AppBar(
        backgroundColor: c.surface,
        surfaceTintColor: Colors.transparent,
        title: Text(q.providerName, style: TextStyle(fontWeight: FontWeight.w700)),
      ),
      body: ListView(
        padding: EdgeInsets.fromLTRB(20.w, 12.h, 20.w, 120.h),
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(16.r),
            child: CachedHeroImage(url: q.imageUrl, height: 160.h, borderRadius: BorderRadius.zero),
          ),
          SizedBox(height: 16.h),
          GestureDetector(
            onTap: () => _openAllReviews(context, q),
            child: GoogleStyleReviewSummary(
              stats: ProviderReviewStats.from(
                averageRating: q.rating,
                totalCount: q.reviewCount,
                reviews: q.recentReviews,
              ),
            ),
          ),
          SizedBox(height: 6.h),
          Text(
            '${q.completedTrips} chuyến · ${q.vehicleLabel} · ${q.distanceKm} km',
            style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted),
          ),
          SizedBox(height: 20.h),
          _scheduleFitBanner(c, q),
          SizedBox(height: 16.h),
          Text('Bảng giá minh bạch', style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w800)),
          SizedBox(height: 10.h),
          _priceRow(c, 'Giá cơ bản', q.basePrice),
          ...q.surcharges.map((s) => _priceRow(c, s.label, s.amount)),
          Divider(height: 24.h),
          _priceRow(c, 'Tổng cộng', q.totalPrice, bold: true, highlight: true),
          if (q.note.isNotEmpty) ...[
            SizedBox(height: 12.h),
            Text(q.note, style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted)),
          ],
          SizedBox(height: 24.h),
          Row(
            children: [
              Text('Đánh giá', style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w800)),
              const Spacer(),
              if (q.recentReviews.isNotEmpty)
                TextButton(
                  onPressed: () => _openAllReviews(context, q),
                  child: const Text('Xem tất cả'),
                ),
            ],
          ),
          if (q.recentReviews.isEmpty)
            Text('Chưa có đánh giá', style: TextStyle(color: c.onSurfaceMuted))
          else ...[
            ...q.recentReviews.take(3).map((r) => GoogleStyleReviewCard(review: r)),
          ],
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: EdgeInsets.fromLTRB(20.w, 8.h, 20.w, 16.h),
          child: SmoothCtaButton(
            label: _confirming
                ? 'Đang xác nhận...'
                : switch (q.scheduleFit) {
                    QuoteScheduleFit.exactMatch => 'Chốt với giờ bạn chọn',
                    QuoteScheduleFit.alternateProposed => 'Chọn giờ & chốt giá',
                    QuoteScheduleFit.unavailable => 'Không thể chốt nhà xe này',
                  },
            isLoading: _confirming,
            outlined: !q.canConfirmSchedule,
            showArrow: q.canConfirmSchedule,
            onPressed: _confirming
                ? null
                : q.canConfirmSchedule
                    ? _confirm
                    : () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text(
                              'Nhà xe không nhận khung giờ bạn chọn. Hãy quay lại và chọn nhà xe khác.',
                            ),
                          ),
                        );
                      },
          ),
        ),
      ),
    );
  }

  Widget _scheduleFitBanner(UniMoveColors c, ProviderQuoteResponse q) {
    final (bg, fg, icon) = switch (q.scheduleFit) {
      QuoteScheduleFit.exactMatch => (c.primary.withValues(alpha: 0.12), c.primary, Icons.check_circle_outline),
      QuoteScheduleFit.alternateProposed =>
        (Colors.orange.withValues(alpha: 0.12), Colors.orange.shade800, Icons.schedule_outlined),
      QuoteScheduleFit.unavailable =>
        (Colors.red.withValues(alpha: 0.1), Colors.red.shade700, Icons.block_outlined),
    };
    final text = switch (q.scheduleFit) {
      QuoteScheduleFit.exactMatch => 'Nhà xe nhận đúng giờ bạn đã chọn.',
      QuoteScheduleFit.alternateProposed =>
        'Đề xuất giờ khác${q.proposedPickupLabel != null ? ': ${q.proposedPickupLabel}' : ''}. '
            'Bạn sẽ xác nhận sau khi chốt.',
      QuoteScheduleFit.unavailable => 'Nhà xe không nhận khung giờ bạn chọn.',
    };
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(12.w),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(12.r)),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20.sp, color: fg),
          SizedBox(width: 8.w),
          Expanded(
            child: Text(text, style: TextStyle(fontSize: 12.sp, fontWeight: FontWeight.w600, color: fg)),
          ),
        ],
      ),
    );
  }

  Widget _priceRow(UniMoveColors c, String label, int amount, {bool bold = false, bool highlight = false}) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 6.h),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 14.sp,
                fontWeight: bold ? FontWeight.w700 : FontWeight.w500,
                color: highlight ? c.primary : c.onSurface,
              ),
            ),
          ),
          Text(
            _money(amount),
            style: TextStyle(
              fontSize: highlight ? 18.sp : 14.sp,
              fontWeight: bold ? FontWeight.w800 : FontWeight.w600,
              color: highlight ? c.primary : c.onSurface,
            ),
          ),
        ],
      ),
    );
  }

  void _openAllReviews(BuildContext context, ProviderQuoteResponse q) {
    showProviderReviewsSheet(
      context,
      providerName: q.providerName,
      subtitle: '${q.vehicleLabel} · ${q.completedTrips} chuyến hoàn thành',
      stats: ProviderReviewStats.from(
        averageRating: q.rating,
        totalCount: q.reviewCount,
        reviews: q.recentReviews,
      ),
    );
  }

  String _money(int v) {
    final s = v.toString();
    final buf = StringBuffer();
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buf.write('.');
      buf.write(s[i]);
    }
    return '$bufđ';
  }
}
