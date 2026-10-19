import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/uni_move_colors.dart';

/// Bảng phụ phí tham khảo — minh bạch, admin áp dụng khi báo giá.
class ReferencePricesPage extends StatelessWidget {
  const ReferencePricesPage({super.key});

  static const _rows = [
    ('Hẻm hẹp — chỉ xe máy', '50.000 – 150.000', 'Khuân bộ hoặc xe nhỏ'),
    ('Không thang máy (mỗi tầng)', '30.000 – 50.000', 'Tính theo tầng lên/xuống'),
    ('Đồ cồng kềnh thêm', '50.000 – 200.000', 'Tủ lớn, máy giặt, bàn ghế'),
    ('Km vượt gói (nếu có)', '5.000 – 8.000/km', 'Theo báo giá nhà xe'),
    ('Thêm người khuân vác', '80.000 – 120.000/giờ', 'Theo giờ, báo trước'),
  ];

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    return Scaffold(
      backgroundColor: c.background,
      appBar: AppBar(
        backgroundColor: c.surface,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: c.onSurface, size: 20.sp),
          onPressed: () => context.pop(),
        ),
        title: Text('Bảng phụ phí tham khảo', style: TextStyle(color: c.onSurface, fontWeight: FontWeight.w700)),
      ),
      body: ListView(
        padding: EdgeInsets.fromLTRB(20.w, 16.h, 20.w, 32.h),
        children: [
          Container(
            padding: EdgeInsets.all(14.w),
            decoration: BoxDecoration(
              color: c.chipBg,
              borderRadius: BorderRadius.circular(14.r),
              border: Border.all(color: c.primary.withValues(alpha: 0.2)),
            ),
            child: Text(
              'Đây là mức tham khảo — giá cuối do admin/nhà xe báo kèm chi tiết từng khoản. '
              'Không có phí ẩn sau khi chốt.',
              style: TextStyle(fontSize: 13.sp, color: c.onSurface, height: 1.4),
            ),
          ),
          SizedBox(height: 20.h),
          ..._rows.map((r) => _priceRow(c, r.$1, r.$2, r.$3)),
          SizedBox(height: 24.h),
          Text(
            'Giá cuối do nhà xe báo trên app kèm từng khoản phụ phí — '
            'bạn so sánh và xác nhận trước khi đặt cọc.',
            style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted, height: 1.4),
          ),
        ],
      ),
    );
  }

  Widget _priceRow(UniMoveColors c, String title, String price, String note) {
    return Container(
      margin: EdgeInsets.only(bottom: 10.h),
      padding: EdgeInsets.all(14.w),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(14.r),
        border: Border.all(color: c.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14.sp)),
          SizedBox(height: 6.h),
          Text(price, style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w800, color: c.primary)),
          SizedBox(height: 4.h),
          Text(note, style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted)),
        ],
      ),
    );
  }
}
