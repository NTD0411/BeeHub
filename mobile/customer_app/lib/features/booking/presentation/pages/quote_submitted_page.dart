import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/smooth_cta_button.dart';

/// Xác nhận đã gửi yêu cầu báo giá — chờ admin xử lý.
class QuoteSubmittedPage extends StatelessWidget {
  const QuoteSubmittedPage({
    super.key,
    required this.referenceId,
    this.photosUploadFailed = false,
  });

  final String referenceId;
  final bool photosUploadFailed;

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    return Scaffold(
      backgroundColor: c.background,
      appBar: AppBar(
        backgroundColor: c.surface,
        surfaceTintColor: Colors.transparent,
        automaticallyImplyLeading: false,
        title: Text('Yêu cầu đã gửi', style: TextStyle(color: c.onSurface, fontWeight: FontWeight.w700)),
        centerTitle: true,
      ),
      body: Padding(
        padding: EdgeInsets.fromLTRB(24.w, 24.h, 24.w, 24.h),
        child: Column(
          children: [
            Container(
              width: 80.w,
              height: 80.w,
              decoration: BoxDecoration(color: c.primaryContainer, shape: BoxShape.circle),
              child: Icon(Icons.check_circle_outline, size: 44.sp, color: c.primary),
            ),
            SizedBox(height: 20.h),
            Text(
              'Đã nhận yêu cầu báo giá!',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 22.sp, fontWeight: FontWeight.w800, color: c.onSurface),
            ),
            SizedBox(height: 8.h),
            Text(
              'Mã yêu cầu: $referenceId',
              style: TextStyle(fontSize: 14.sp, color: c.primary, fontWeight: FontWeight.w600),
            ),
            if (photosUploadFailed) ...[
              SizedBox(height: 14.h),
              Container(
                width: double.infinity,
                padding: EdgeInsets.all(12.w),
                decoration: BoxDecoration(
                  color: c.chipBg,
                  borderRadius: BorderRadius.circular(12.r),
                  border: Border.all(color: c.primary.withValues(alpha: 0.3)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.info_outline, size: 18.sp, color: c.primary),
                    SizedBox(width: 8.w),
                    Expanded(
                      child: Text(
                        'Ảnh chưa tải lên được. Bạn có thể gửi lại trong phần chat khi đơn bắt đầu.',
                        style: TextStyle(fontSize: 12.sp, color: c.onSurface, height: 1.35),
                      ),
                    ),
                  ],
                ),
              ),
            ],
            SizedBox(height: 24.h),
            _stepCard(c, '1', 'Đội UniMove xem thông tin trọ', 'Trong vòng ~24 giờ làm việc'),
            SizedBox(height: 10.h),
            _stepCard(c, '2', 'Nhận báo giá trên app', 'So sánh giá, đánh giá và bảng phụ phí'),
            SizedBox(height: 10.h),
            _stepCard(c, '3', 'Nhận báo giá + bảng phụ phí', 'Chốt giá rồi đặt cọc qua app'),
            const Spacer(),
            SmoothCtaButton(
              label: 'Về trang chủ',
              onPressed: () => context.go('/home'),
            ),
            SizedBox(height: 12.h),
            TextButton(
              onPressed: () => context.push('/booking/reference-prices'),
              child: Text('Xem bảng phụ phí tham khảo', style: TextStyle(color: c.primary)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _stepCard(UniMoveColors c, String step, String title, String subtitle) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(14.w),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(14.r),
        border: Border.all(color: c.border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 14.r,
            backgroundColor: c.primary,
            child: Text(step, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12)),
          ),
          SizedBox(width: 12.w),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14.sp)),
                SizedBox(height: 2.h),
                Text(subtitle, style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
