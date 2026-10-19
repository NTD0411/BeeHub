import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';

import '../../../../core/theme/uni_move_colors.dart';
import '../../data/customer_orders_repository.dart';
import '../../domain/order_models.dart';
import '../widgets/activity_history_filter_bar.dart';
import '../widgets/activity_history_item.dart';

/// Lịch sử hoạt động — layout Grab, dữ liệu `orders`.
class OrdersHistoryPage extends StatefulWidget {
  const OrdersHistoryPage({super.key});

  @override
  State<OrdersHistoryPage> createState() => _OrdersHistoryPageState();
}

class _OrdersHistoryPageState extends State<OrdersHistoryPage> {
  final _repo = CustomerOrdersRepository();
  static const _filters = ['Chuyển trọ', 'Đang chạy', 'Hoàn thành', 'Đã hủy'];

  List<CustomerOrder> _allOrders = [];
  List<CustomerOrder> _orders = [];
  int _filterIndex = 0;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final list = await _repo.fetchOrders();
    if (!mounted) return;
    setState(() {
      _allOrders = list;
      _loading = false;
      _applyFilter();
    });
  }

  void _applyFilter() {
    _orders = switch (_filterIndex) {
      1 => _allOrders.where((o) => o.status.isActive).toList(),
      2 => _allOrders.where((o) => o.status == OrderStatus.completed).toList(),
      3 => _allOrders.where((o) => o.status == OrderStatus.cancelled).toList(),
      _ => List<CustomerOrder>.from(_allOrders),
    };
  }

  void _onFilterChanged(int index) {
    if (_filterIndex == index) return;
    setState(() {
      _filterIndex = index;
      _applyFilter();
    });
  }

  void _onOrderTap(CustomerOrder order) {
    if (order.status.isActive) {
      context.push('/orders/${order.id}/tracking');
    } else if (order.status == OrderStatus.completed && !order.hasReview) {
      context.push('/orders/${order.id}/review');
    }
  }

  void _onReorder(CustomerOrder order) {
    context.push('/booking/location');
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);
    final bg = c.isLight(context) ? Colors.white : c.background;

    return Scaffold(
      backgroundColor: bg,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: EdgeInsets.fromLTRB(8.w, 8.h, 20.w, 4.h),
              child: Row(
                children: [
                  IconButton(
                    icon: Icon(Icons.arrow_back_ios_new, color: c.onSurface, size: 20),
                    onPressed: () => context.pop(),
                  ),
                  Expanded(
                    child: Text(
                      'Lịch sử hoạt động',
                      style: TextStyle(
                        fontSize: 22.sp,
                        fontWeight: FontWeight.w800,
                        color: c.onSurface,
                        decoration: TextDecoration.none,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(height: 8.h),
            ActivityHistoryFilterBar(
              labels: _filters,
              selectedIndex: _filterIndex,
              onSelected: _onFilterChanged,
            ),
            SizedBox(height: 8.h),
            Expanded(
              child: _loading ? _buildShimmer(c) : _buildList(c),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildShimmer(UniMoveColors c) {
    return Shimmer.fromColors(
      baseColor: c.surfaceTint,
      highlightColor: c.surfaceHigh,
      child: ListView.builder(
        padding: EdgeInsets.symmetric(horizontal: 20.w),
        itemCount: 6,
        itemBuilder: (_, __) => Padding(
          padding: EdgeInsets.symmetric(vertical: 14.h),
          child: Row(
            children: [
              Container(width: 24.w, height: 24.w, color: c.surface),
              SizedBox(width: 12.w),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(height: 14.h, width: double.infinity, color: c.surface),
                    SizedBox(height: 8.h),
                    Container(height: 12.h, width: 120.w, color: c.surface),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildList(UniMoveColors c) {
    if (_orders.isEmpty) {
      return Center(
        child: Padding(
          padding: EdgeInsets.all(32.w),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.inbox_outlined, size: 48.sp, color: c.onSurfaceMuted),
              SizedBox(height: 12.h),
              Text(
                'Chưa có hoạt động trong mục này',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 15.sp, color: c.onSurfaceMuted),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      color: c.primary,
      onRefresh: _load,
      child: ListView.separated(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        padding: EdgeInsets.fromLTRB(20.w, 0, 20.w, 24.h),
        itemCount: _orders.length + 1,
        separatorBuilder: (_, i) {
          if (i >= _orders.length - 1) return const SizedBox.shrink();
          return Divider(height: 1, color: c.border.withValues(alpha: 0.6));
        },
        itemBuilder: (context, i) {
          if (i == _orders.length) {
            return Padding(
              padding: EdgeInsets.symmetric(vertical: 28.h),
              child: Center(
                child: Text(
                  'Bạn đã xem hết lịch sử hoạt động',
                  style: TextStyle(fontSize: 13.sp, color: c.onSurfaceMuted),
                ),
              ),
            );
          }
          final order = _orders[i];
          return ActivityHistoryItem(
            order: order,
            index: i,
            onTap: () => _onOrderTap(order),
            onReorder: () => _onReorder(order),
          );
        },
      ),
    );
  }
}
