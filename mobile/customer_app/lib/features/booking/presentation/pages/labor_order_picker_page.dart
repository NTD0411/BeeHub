import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/booking_scaffold.dart';
import '../../../../core/widgets/order_status_chip.dart';
import '../../../../core/widgets/pressable_scale.dart';
import '../../../orders/data/customer_orders_repository.dart';
import '../../../orders/domain/order_models.dart';
import '../cubit/booking_flow_cubit.dart';

/// Chọn đơn chuyển trọ để thêm dịch vụ khuân vác.
class LaborOrderPickerPage extends StatefulWidget {
  const LaborOrderPickerPage({super.key});

  @override
  State<LaborOrderPickerPage> createState() => _LaborOrderPickerPageState();
}

class _LaborOrderPickerPageState extends State<LaborOrderPickerPage> {
  final _repo = CustomerOrdersRepository();
  List<CustomerOrder> _orders = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final all = await _repo.fetchOrders();
    final eligible = all.where((o) => o.status.isActive).toList();
    if (mounted) {
      setState(() {
        _orders = eligible;
        _loading = false;
      });
    }
  }

  void _selectOrder(CustomerOrder order) {
    context.read<BookingFlowCubit>().startLaborAddonFromOrder(order);
    context.push('/booking/labor/configure');
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    return BookingScaffold(
      title: 'Chọn đơn chuyển trọ',
      body: _loading
          ? Center(child: CircularProgressIndicator(color: c.primary))
          : _orders.isEmpty
              ? _empty(c)
              : ListView.separated(
                  padding: EdgeInsets.fromLTRB(20.w, 8.h, 20.w, 24.h),
                  itemCount: _orders.length,
                  separatorBuilder: (_, __) => SizedBox(height: 12.h),
                  itemBuilder: (context, i) {
                    final o = _orders[i];
                    return PressableScale(
                      onTap: () => _selectOrder(o),
                      child: Container(
                        padding: EdgeInsets.all(14.w),
                        decoration: BoxDecoration(
                          color: c.surface,
                          borderRadius: BorderRadius.circular(14.r),
                          border: Border.all(color: c.border),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(
                                  '#${o.orderNumber}',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w800,
                                    color: c.primary,
                                    fontSize: 14.sp,
                                  ),
                                ),
                                const Spacer(),
                                OrderStatusChip(status: o.status),
                              ],
                            ),
                            SizedBox(height: 8.h),
                            Text(
                              o.pickupAddress,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(fontSize: 13.sp, color: c.onSurface),
                            ),
                            Text(
                              '→ ${o.deliveryAddress}',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted),
                            ),
                            if (o.providerName != null) ...[
                              SizedBox(height: 6.h),
                              Text(
                                'Nhà xe: ${o.providerName}',
                                style: TextStyle(fontSize: 12.sp, color: c.primary),
                              ),
                            ],
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }

  Widget _empty(UniMoveColors c) {
    return Center(
      child: Padding(
        padding: EdgeInsets.all(32.w),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.inbox_outlined, size: 48.sp, color: c.onSurfaceMuted),
            SizedBox(height: 12.h),
            Text(
              'Chưa có đơn chuyển trọ đang chạy',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w700, color: c.onSurface),
            ),
            SizedBox(height: 8.h),
            Text(
              'Bạn có thể đặt khuân vác độc lập không cần đơn xe.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14.sp, color: c.onSurfaceMuted),
            ),
            SizedBox(height: 20.h),
            TextButton(
              onPressed: () {
                context.read<BookingFlowCubit>().startLaborOnlyBooking();
                context.push('/booking/location');
              },
              child: Text('Đặt khuân vác độc lập', style: TextStyle(color: c.primary)),
            ),
          ],
        ),
      ),
    );
  }
}
