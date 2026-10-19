import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/mock/mock_orders_data.dart';
import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/smooth_cta_button.dart';
import '../../../../core/widgets/uni_surface_card.dart';
import '../../../orders/data/customer_orders_repository.dart';
import '../../../orders/domain/order_models.dart';

class ReviewTripPage extends StatefulWidget {
  const ReviewTripPage({super.key, required this.orderId});

  final String orderId;

  @override
  State<ReviewTripPage> createState() => _ReviewTripPageState();
}

class _ReviewTripPageState extends State<ReviewTripPage> {
  final _ordersRepo = CustomerOrdersRepository();
  final _comment = TextEditingController();
  int _rating = 0;
  final Set<String> _tags = {};
  bool _submitting = false;
  CustomerOrder? _order;
  bool _loadingOrder = true;

  static const _tagOptions = [
    'Đúng giờ',
    'Nhiệt tình',
    'Cẩn thận',
    'Giá hợp lý',
    'Tài xế thân thiện',
  ];

  @override
  void initState() {
    super.initState();
    _loadOrder();
  }

  @override
  void dispose() {
    _comment.dispose();
    super.dispose();
  }

  Future<void> _loadOrder() async {
    final order = await _ordersRepo.fetchById(widget.orderId);
    if (!mounted) return;
    setState(() {
      _order = order;
      _loadingOrder = false;
    });
  }

  Future<void> _submit() async {
    if (_rating < 1) {
      ShadToaster.of(context).show(
        const ShadToast(
          title: Text('Vui lòng chọn số sao'),
          description: Text('Đánh giá từ 1 đến 5 sao.'),
        ),
      );
      return;
    }
    setState(() => _submitting = true);
    await Future<void>.delayed(const Duration(milliseconds: 600));
    if (mounted) {
      ShadToaster.of(context).show(
        const ShadToast(
          title: Text('Cảm ơn bạn!'),
          description: Text('Đánh giá đã được ghi nhận (mock).'),
        ),
      );
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);
    final theme = ShadTheme.of(context);

    if (_loadingOrder) {
      return Scaffold(
        backgroundColor: c.background,
        body: Center(child: CircularProgressIndicator(color: c.primary)),
      );
    }

    final order = _order;
    if (order == null) {
      return Scaffold(
        backgroundColor: c.background,
        appBar: AppBar(
          backgroundColor: c.surface,
          leading: IconButton(
            icon: Icon(Icons.arrow_back_ios_new_rounded, color: c.onSurface, size: 20.sp),
            onPressed: () => context.pop(),
          ),
        ),
        body: Center(
          child: Text('Không tìm thấy đơn hàng', style: TextStyle(color: c.onSurfaceMuted)),
        ),
      );
    }

    return Scaffold(
      backgroundColor: c.background,
      appBar: AppBar(
        backgroundColor: c.surface,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: c.onSurface, size: 20.sp),
          onPressed: () => context.pop(),
        ),
        title: Text('Review Trip', style: TextStyle(color: c.primary, fontWeight: FontWeight.w800)),
        centerTitle: true,
        actions: [
          IconButton(
            icon: Icon(Icons.help_outline, color: c.primary),
            onPressed: () {},
          ),
        ],
      ),
      body: ListView(
        padding: EdgeInsets.fromLTRB(20.w, 12.h, 20.w, 100.h),
        children: [
          UniSurfaceCard(
            child: Row(
              children: [
                Stack(
                  children: [
                    CircleAvatar(
                      radius: 28.r,
                      backgroundImage: order.providerAvatarUrl != null
                          ? CachedNetworkImageProvider(order.providerAvatarUrl!)
                          : null,
                    ),
                    Positioned(
                      right: 0,
                      bottom: 0,
                      child: Icon(Icons.verified, color: c.primary, size: 16.sp),
                    ),
                  ],
                ),
                SizedBox(width: 12.w),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        order.providerName ?? MockOrdersData.providerName,
                        style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16.sp),
                      ),
                      Text(
                        '${order.vehicleLabel} • BKS ${order.providerPlate ?? MockOrdersData.providerPlate}',
                        style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          SizedBox(height: 16.h),
          UniSurfaceCard(
            child: Column(
              children: [
                Text(
                  'TRẢI NGHIỆM CỦA BẠN?',
                  style: TextStyle(
                    fontSize: 11.sp,
                    fontWeight: FontWeight.w700,
                    color: c.onSurfaceMuted,
                    letterSpacing: 0.5,
                  ),
                ),
                SizedBox(height: 12.h),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(5, (i) {
                    final filled = i < _rating;
                    return GestureDetector(
                      onTap: () => setState(() => _rating = i + 1),
                      child: Padding(
                        padding: EdgeInsets.symmetric(horizontal: 4.w),
                        child: Icon(
                          filled ? Icons.star_rounded : Icons.star_outline_rounded,
                          color: filled ? Colors.amber : c.border,
                          size: 36.sp,
                        ),
                      ),
                    );
                  }),
                ),
                SizedBox(height: 8.h),
                Text(
                  _rating == 0 ? 'Vui lòng đánh giá' : '$_rating / 5 sao',
                  style: TextStyle(color: c.primary, fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
          SizedBox(height: 16.h),
          Text(
            'ƯU ĐIỂM NỔI BẬT',
            style: TextStyle(fontSize: 11.sp, fontWeight: FontWeight.w700, color: c.onSurfaceMuted),
          ),
          SizedBox(height: 10.h),
          Wrap(
            spacing: 8.w,
            runSpacing: 8.h,
            children: _tagOptions.map((t) {
              final on = _tags.contains(t);
              return GestureDetector(
                onTap: () => setState(() {
                  if (on) {
                    _tags.remove(t);
                  } else {
                    _tags.add(t);
                  }
                }),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  curve: Curves.easeOutCubic,
                  padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 8.h),
                  decoration: BoxDecoration(
                    color: on ? c.chipBg : c.surface,
                    borderRadius: BorderRadius.circular(99.r),
                    border: Border.all(color: on ? c.primary : c.border),
                  ),
                  child: Text(
                    t,
                    style: TextStyle(
                      fontSize: 13.sp,
                      fontWeight: FontWeight.w600,
                      color: on ? c.primary : c.onSurface,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          SizedBox(height: 16.h),
          Text(
            'NHẬN XÉT CHI TIẾT',
            style: TextStyle(fontSize: 11.sp, fontWeight: FontWeight.w700, color: c.onSurfaceMuted),
          ),
          SizedBox(height: 8.h),
          ShadInput(
            controller: _comment,
            placeholder: const Text('Chia sẻ thêm trải nghiệm của bạn (không bắt buộc)'),
            maxLines: 4,
          ),
          SizedBox(height: 16.h),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'HÌNH ẢNH THỰC TẾ',
                style: TextStyle(fontSize: 11.sp, fontWeight: FontWeight.w700, color: c.onSurfaceMuted),
              ),
              Text('TỐI ĐA 4 ẢNH', style: theme.textTheme.small),
            ],
          ),
          SizedBox(height: 10.h),
          Row(
            children: [
              Container(
                width: 80.w,
                height: 80.w,
                decoration: BoxDecoration(
                  color: c.chipBg,
                  borderRadius: BorderRadius.circular(12.r),
                  border: Border.all(color: c.primary, width: 1, style: BorderStyle.solid),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.add_a_photo_outlined, color: c.primary),
                    Text('THÊM ẢNH', style: TextStyle(fontSize: 9.sp, color: c.primary, fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
              SizedBox(width: 10.w),
              Container(
                width: 80.w,
                height: 80.w,
                decoration: BoxDecoration(
                  color: c.surfaceTint,
                  borderRadius: BorderRadius.circular(12.r),
                ),
                child: Icon(Icons.image_outlined, color: c.onSurfaceMuted),
              ),
            ],
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: EdgeInsets.fromLTRB(20.w, 8.h, 20.w, 16.h),
          child: SmoothCtaButton(
            label: 'Gửi đánh giá',
            isLoading: _submitting,
            onPressed: _submitting ? null : _submit,
          ),
        ),
      ),
    );
  }
}
