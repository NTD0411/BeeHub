import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';

import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/booking_scaffold.dart';
import '../../../../core/widgets/smooth_cta_button.dart';
import '../../data/labor_repository.dart';
import '../../domain/booking_models.dart';

/// Thêm khuân vác vào đơn chuyển trọ đã đặt — chỉ qua nhà xe vận chuyển.
class LaborServicePage extends StatefulWidget {
  const LaborServicePage({super.key});

  @override
  State<LaborServicePage> createState() => _LaborServicePageState();
}

class _LaborServicePageState extends State<LaborServicePage> {
  final _repo = LaborRepository();
  LaborServiceInfo? _info;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final info = await _repo.fetchServiceInfo();
    if (mounted) {
      setState(() {
        _info = info;
        _loading = false;
      });
    }
  }

  String _formatPrice(int v) {
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

    return BookingScaffold(
      title: 'Thêm khuân vác',
      body: _loading ? _buildShimmer(c) : _buildContent(c),
      bottom: _loading
          ? null
          : SafeArea(
              child: Padding(
                padding: EdgeInsets.fromLTRB(20.w, 8.h, 20.w, 16.h),
                child: SmoothCtaButton(
                  label: 'Chọn đơn chuyển trọ',
                  showArrow: false,
                  onPressed: () => context.push('/booking/labor/orders'),
                ),
              ),
            ),
    );
  }

  Widget _buildShimmer(UniMoveColors c) {
    return Shimmer.fromColors(
      baseColor: c.surfaceTint,
      highlightColor: c.surfaceHigh,
      child: ListView(
        padding: EdgeInsets.all(20.w),
        children: [
          Container(
            height: 120.h,
            decoration: BoxDecoration(color: c.surface, borderRadius: BorderRadius.circular(16.r)),
          ),
          SizedBox(height: 16.h),
          Container(
            height: 80.h,
            decoration: BoxDecoration(color: c.surface, borderRadius: BorderRadius.circular(12.r)),
          ),
        ],
      ),
    );
  }

  Widget _buildContent(UniMoveColors c) {
    final info = _info!;

    return ListView(
      padding: EdgeInsets.fromLTRB(20.w, 8.h, 20.w, 120.h),
      children: [
        Container(
          padding: EdgeInsets.all(20.w),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [c.accentGreen.withValues(alpha: 0.25), c.primaryContainer],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16.r),
            border: Border.all(color: c.glassBorder),
          ),
          child: Row(
            children: [
              Container(
                width: 56.w,
                height: 56.w,
                decoration: BoxDecoration(
                  color: c.success.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.groups_rounded, color: c.success, size: 30.sp),
              ),
              SizedBox(width: 14.w),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      info.title,
                      style: TextStyle(fontSize: 20.sp, fontWeight: FontWeight.w800, color: c.onSurface),
                    ),
                    SizedBox(height: 4.h),
                    Text(
                      'Từ ${_formatPrice(info.minPrice)}/người/giờ',
                      style: TextStyle(fontSize: 13.sp, fontWeight: FontWeight.w600, color: c.primary),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ).animate().fadeIn(duration: 300.ms).slideY(begin: 0.04, end: 0),
        SizedBox(height: 16.h),
        _infoBanner(c),
        SizedBox(height: 16.h),
        Text(
          info.description,
          style: TextStyle(fontSize: 14.sp, height: 1.5, color: c.onSurfaceMuted),
        ).animate().fadeIn(duration: 300.ms, delay: 80.ms),
        SizedBox(height: 20.h),
        Text(
          'Cách hoạt động',
          style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w700, color: c.onSurface),
        ),
        SizedBox(height: 12.h),
        ...info.benefits.asMap().entries.map(
          (e) => Padding(
            padding: EdgeInsets.only(bottom: 10.h),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.check_circle_rounded, color: c.success, size: 20.sp),
                SizedBox(width: 10.w),
                Expanded(
                  child: Text(
                    e.value,
                    style: TextStyle(fontSize: 14.sp, color: c.onSurface, height: 1.35),
                  ),
                ),
              ],
            ),
          )
              .animate()
              .fadeIn(duration: 260.ms, delay: (100 + 60 * e.key).ms),
        ),
        SizedBox(height: 16.h),
        _infoTile(
          c,
          icon: Icons.stairs_outlined,
          title: 'Phụ phí tầng',
          subtitle: '${_formatPrice(LaborPricing.perFloorNoElevator)}/tầng nếu không có thang máy',
        ),
      ],
    );
  }

  Widget _infoBanner(UniMoveColors c) {
    return Container(
      padding: EdgeInsets.all(14.w),
      decoration: BoxDecoration(
        color: c.chipBg,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: c.primary.withValues(alpha: 0.2)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.info_outline, color: c.primary, size: 20.sp),
          SizedBox(width: 10.w),
          Expanded(
            child: Text(
              'Bạn không thể thuê khuân vác riêng khi đang đặt xe. '
              'Chỉ sau khi đã có đơn vận chuyển, bạn mới thêm khuân vác — và chỉ từ nhà xe đó.',
              style: TextStyle(fontSize: 12.sp, color: c.onSurface, height: 1.4),
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoTile(
    UniMoveColors c, {
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Container(
      padding: EdgeInsets.all(14.w),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: c.border),
      ),
      child: Row(
        children: [
          Icon(icon, color: c.primary, size: 22.sp),
          SizedBox(width: 12.w),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14.sp, color: c.onSurface)),
                SizedBox(height: 2.h),
                Text(subtitle, style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted, height: 1.35)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
