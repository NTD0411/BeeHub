import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:shimmer/shimmer.dart';

import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/pressable_scale.dart';
import '../../domain/booking_models.dart';
import '../cubit/booking_flow_state.dart';

/// Danh sách báo giá khuân vác từ nhiều đối tác — chọn một bên.
class LaborQuotesSection extends StatelessWidget {
  const LaborQuotesSection({
    super.key,
    required this.state,
    required this.onSelect,
    this.compact = false,
  });

  final BookingFlowState state;
  final ValueChanged<String> onSelect;
  final bool compact;

  static String formatPrice(int v) {
    final s = v.toString();
    final buf = StringBuffer();
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buf.write('.');
      buf.write(s[i]);
    }
    return '${buf}đ';
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    if (state.loadingLaborQuotes) {
      return Shimmer.fromColors(
        baseColor: c.surfaceTint,
        highlightColor: c.surfaceHigh,
        child: Column(
          children: List.generate(
            compact ? 2 : 4,
            (_) => Container(
              height: compact ? 72.h : 96.h,
              margin: EdgeInsets.only(bottom: 10.h),
              decoration: BoxDecoration(
                color: c.surface,
                borderRadius: BorderRadius.circular(14.r),
              ),
            ),
          ),
        ),
      );
    }

    if (state.laborQuotes.isEmpty) {
      return Container(
        padding: EdgeInsets.all(16.w),
        decoration: BoxDecoration(
          color: c.surface,
          borderRadius: BorderRadius.circular(12.r),
          border: Border.all(color: c.border),
        ),
        child: Text(
          'Chưa có báo giá. Thử đổi số người hoặc thời gian rồi tải lại.',
          style: TextStyle(fontSize: 13.sp, color: c.onSurfaceMuted, height: 1.35),
        ),
      );
    }

    final minP = state.laborQuotes.first.price;
    final maxP = state.laborQuotes.last.price;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Icon(Icons.compare_arrows_rounded, color: c.primary, size: 20.sp),
            SizedBox(width: 6.w),
            Expanded(
              child: Text(
                '${state.laborQuotes.length} đối tác báo giá · ${formatPrice(minP)} – ${formatPrice(maxP)}',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.sp, color: c.onSurface),
              ),
            ),
          ],
        ),
        SizedBox(height: 6.h),
        Text(
          'UniMove là trung gian — chọn một đội phù hợp (có thể kết hợp nhà xe).',
          style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted, height: 1.3),
        ),
        SizedBox(height: 12.h),
        ...state.laborQuotes.map(
          (q) => _QuoteTile(
            quote: q,
            selected: state.selectedLaborProviderId == q.id,
            onTap: () => onSelect(q.id),
            compact: compact,
          ),
        ),
      ],
    );
  }
}

class _QuoteTile extends StatelessWidget {
  const _QuoteTile({
    required this.quote,
    required this.selected,
    required this.onTap,
    required this.compact,
  });

  final LaborProviderQuote quote;
  final bool selected;
  final VoidCallback onTap;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    return Padding(
      padding: EdgeInsets.only(bottom: 10.h),
      child: PressableScale(
        onTap: onTap,
        child: Container(
          padding: EdgeInsets.all(compact ? 12.w : 14.w),
          decoration: BoxDecoration(
            color: c.surface,
            borderRadius: BorderRadius.circular(14.r),
            border: Border.all(
              color: selected ? c.primary : c.border,
              width: selected ? 2 : 1,
            ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                selected ? Icons.radio_button_checked : Icons.radio_button_off,
                color: c.primary,
                size: 22.sp,
              ),
              SizedBox(width: 10.w),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      quote.name,
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: compact ? 14.sp : 15.sp,
                        color: c.onSurface,
                      ),
                    ),
                    Text(
                      quote.teamLabel,
                      style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted),
                    ),
                    if (!compact) ...[
                      SizedBox(height: 6.h),
                      Row(
                        children: [
                          Icon(Icons.star_rounded, color: const Color(0xFFFFB800), size: 14.sp),
                          Text(
                            ' ${quote.rating} · ~${quote.etaMinutes} phút',
                            style: TextStyle(fontSize: 11.sp, color: c.onSurfaceMuted),
                          ),
                        ],
                      ),
                    ],
                    if (quote.badge != null) ...[
                      SizedBox(height: 6.h),
                      _badge(quote.badge!, c),
                    ],
                  ],
                ),
              ),
              Text(
                LaborQuotesSection.formatPrice(quote.price),
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: compact ? 14.sp : 16.sp,
                  color: c.primary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _badge(String text, UniMoveColors c) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 3.h),
      decoration: BoxDecoration(
        color: c.primary.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(6.r),
      ),
      child: Text(
        text,
        style: TextStyle(fontSize: 10.sp, fontWeight: FontWeight.w700, color: c.primary),
      ),
    );
  }
}
