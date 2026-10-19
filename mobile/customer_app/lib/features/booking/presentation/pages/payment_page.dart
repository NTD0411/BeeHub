import 'dart:async';
import 'dart:convert';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../../../core/network/api_client.dart';
import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/booking_scaffold.dart';
import '../../../../core/widgets/smooth_cta_button.dart';
import '../../../orders/domain/checkout_models.dart';
import '../../../payments/data/payments_repository.dart';
import '../../../payments/domain/payment_models.dart';
import '../../domain/booking_models.dart';
import '../cubit/booking_flow_cubit.dart';
import '../cubit/booking_flow_state.dart';

class PaymentPage extends StatefulWidget {
  const PaymentPage({super.key});

  @override
  State<PaymentPage> createState() => _PaymentPageState();
}

class _PaymentPageState extends State<PaymentPage> {
  final _discountCtrl = TextEditingController();
  final _paymentsRepo = PaymentsRepository();
  bool _submitting = false;
  bool _paymentCompleted = false;
  bool _pollingPayment = false;
  bool _checkingPayment = false;
  DepositPaymentInfo? _depositInfo;
  String? _pendingOrderId;
  Timer? _paymentPoll;

  @override
  void initState() {
    super.initState();
    final cubit = context.read<BookingFlowCubit>();
    final s = cubit.state;
    if (!s.isLaborService && !s.isQuoteBooking) {
      cubit.loadInsurancePlans();
    }
  }

  @override
  void dispose() {
    _paymentPoll?.cancel();
    _discountCtrl.dispose();
    super.dispose();
  }

  void _startPaymentPolling(String paymentId) {
    _paymentPoll?.cancel();
    setState(() {
      _paymentCompleted = false;
      _pollingPayment = true;
    });

    Future<void> check() async {
      if (_checkingPayment) return;
      _checkingPayment = true;
      try {
        final detail = await _paymentsRepo.fetchDetail(paymentId);
        if (!mounted) return;
        if (detail?.payment.status == PaymentStatus.completed) {
          _paymentPoll?.cancel();
          setState(() {
            _paymentCompleted = true;
            _pollingPayment = false;
          });
        }
      } finally {
        _checkingPayment = false;
      }
    }

    check();
    _paymentPoll = Timer.periodic(const Duration(seconds: 3), (_) => check());
  }

  Future<void> _recheckPayment() async {
    final paymentId = _depositInfo?.paymentId;
    if (paymentId == null || paymentId.isEmpty) return;
    setState(() => _checkingPayment = true);
    try {
      final detail = await _paymentsRepo.fetchDetail(paymentId);
      if (!mounted) return;
      if (detail?.payment.status == PaymentStatus.completed) {
        _paymentPoll?.cancel();
        setState(() {
          _paymentCompleted = true;
          _pollingPayment = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đã xác nhận thanh toán thành công')),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Chưa nhận được xác nhận từ ngân hàng — thử lại sau vài giây')),
        );
      }
    } finally {
      if (mounted) setState(() => _checkingPayment = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    return BlocBuilder<BookingFlowCubit, BookingFlowState>(
      builder: (context, state) {
        final partner = state.selectedPartner;
        final labor = state.selectedLaborProvider;
        final deposit = _depositAmount(state.total);

        return BookingScaffold(
          title: 'Thanh toán',
          body: ListView(
            padding: EdgeInsets.fromLTRB(20.w, 8.h, 20.w, 24.h),
            children: [
              if (state.isLaborAddon)
                Padding(
                  padding: EdgeInsets.only(bottom: 12.h),
                  child: Container(
                    padding: EdgeInsets.all(12.w),
                    decoration: BoxDecoration(
                      color: c.chipBg,
                      borderRadius: BorderRadius.circular(10.r),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.link_rounded, color: c.primary, size: 20.sp),
                        SizedBox(width: 8.w),
                        Expanded(
                          child: Text(
                            'Dịch vụ bổ sung cho đơn #${state.linkedOrderNumber}',
                            style: TextStyle(fontSize: 13.sp, fontWeight: FontWeight.w600, color: c.onSurface),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              _sectionCard(
                c,
                title: state.isLaborService ? 'Chi tiết dịch vụ' : 'Chi tiết chuyến đi',
                child: Column(
                  children: [
                    _tripRow(Icons.trip_origin, c.primary, state.pickup, c),
                    SizedBox(height: 12.h),
                    _tripRow(
                      Icons.location_on,
                      Colors.red,
                      state.destination.isEmpty ? 'Căn hộ Landmark 81' : state.destination,
                      c,
                    ),
                    if (!state.isLaborService && state.hasScheduledPickup) ...[
                      SizedBox(height: 12.h),
                      _tripRow(Icons.schedule, c.primary, 'Lấy đồ: ${state.scheduledPickupLabel}', c),
                    ],
                    SizedBox(height: 12.h),
                    if (!state.isLaborService && (state.isComboBooking || state.isQuoteBooking)) ...[
                      SizedBox(height: 12.h),
                      _dormDetailsCard(c, state),
                    ],
                    SizedBox(height: 12.h),
                    Wrap(
                      spacing: 8.w,
                      runSpacing: 8.h,
                      children: [
                        if (!state.isLaborService) ...[
                          if (state.isComboBooking)
                            _chip(
                              'Combo: ${state.selectedPackage?.label ?? 'Chưa chọn'}',
                              Icons.inventory_2_outlined,
                              c,
                            )
                          else if (state.isQuoteBooking)
                            _chip('Báo giá đã chốt', Icons.request_quote_outlined, c)
                          else
                            _chip('Chuyến linh hoạt', Icons.tune_rounded, c),
                          if (state.isComboBooking && state.effectiveComboLaborCount > 0)
                            _chip(
                              '${state.effectiveComboLaborCount} người khuân vác (combo)',
                              Icons.groups_outlined,
                              c,
                            ),
                          if (state.hasScheduledPickup)
                            _chip(state.scheduledPickupLabel, Icons.event_outlined, c),
                          if (!state.isQuoteBooking)
                            _chip(
                              state.hasInsuranceCoverage
                                  ? 'BH: ${state.selectedInsurancePlan?.name ?? ''}'
                                  : 'Không bảo hiểm đồ',
                              Icons.shield_outlined,
                              c,
                            ),
                        ],
                        if (state.isLaborService)
                          _chip(
                            '${state.helperCount} người · ${state.laborHours}h',
                            Icons.groups_outlined,
                            c,
                          ),
                        if (state.isLaborService && labor != null)
                          _chip(labor.name, Icons.handyman_outlined, c)
                        else if (!state.isLaborService && state.isQuoteBooking && state.quoteProviderName != null)
                          _chip('Nhà xe: ${state.quoteProviderName}', Icons.local_shipping_outlined, c)
                        else if (!state.isLaborService && partner != null)
                          _chip('Nhà xe: ${partner.name}', Icons.local_shipping_outlined, c)
                        else if (!state.isLaborService)
                          _chip('Chưa chọn nhà xe', Icons.local_shipping_outlined, c),
                        if (state.isLaborAddon &&
                            (state.linkedProviderName != null || partner != null))
                          _chip(
                            'Nhà xe: ${state.linkedProviderName ?? partner!.name}',
                            Icons.local_shipping_outlined,
                            c,
                          ),
                      ],
                    ),
                  ],
                ),
              ),
              if (!state.isLaborService && !state.isQuoteBooking && partner != null) ...[
                SizedBox(height: 12.h),
                _marketplaceNote(c, partnerName: partner.name, isCombo: state.isComboBooking),
              ],
              if (state.isQuoteBooking) ...[
                SizedBox(height: 12.h),
                Container(
                  padding: EdgeInsets.all(12.w),
                  decoration: BoxDecoration(
                    color: c.chipBg,
                    borderRadius: BorderRadius.circular(12.r),
                    border: Border.all(color: c.primary.withValues(alpha: 0.2)),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(Icons.verified_outlined, color: c.primary, size: 20.sp),
                      SizedBox(width: 10.w),
                      Expanded(
                        child: Text(
                          'Giá đã chốt với ${state.quoteProviderName ?? 'nhà xe'}. '
                          'Đặt cọc 30% để giữ chỗ — phần còn lại thanh toán sau khi hoàn thành chuyến.',
                          style: TextStyle(fontSize: 12.sp, color: c.onSurface, height: 1.35),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              SizedBox(height: 16.h),
              _escrowTrustCard(c, deposit: deposit),
              if (_depositInfo != null) ...[
                SizedBox(height: 16.h),
                _payosQrCard(c, _depositInfo!, paymentCompleted: _paymentCompleted, polling: _pollingPayment),
              ],
              SizedBox(height: 16.h),
              Text(
                'Phương thức thanh toán',
                style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w700, color: c.onSurface),
              ),
              SizedBox(height: 10.h),
              _payMethod(
                context,
                state,
                PaymentMethod.payos,
                'PayOS - Chuyển khoản qua QR',
                'Thanh toán nhanh, an toàn',
                c,
                selected: state.paymentMethod == PaymentMethod.payos,
              ),
              _payMethod(context, state, PaymentMethod.momo, 'Ví MoMo', null, c,
                  selected: state.paymentMethod == PaymentMethod.momo),
              _payMethod(context, state, PaymentMethod.otherWallet, 'Ví điện tử khác', null, c,
                  selected: state.paymentMethod == PaymentMethod.otherWallet),
              if (!state.isQuoteBooking) ...[
                SizedBox(height: 16.h),
                Text(
                  'MÃ GIẢM GIÁ',
                  style: TextStyle(
                    fontSize: 12.sp,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.5,
                    color: c.onSurfaceMuted,
                  ),
                ),
                SizedBox(height: 8.h),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _discountCtrl,
                        decoration: InputDecoration(
                          hintText: 'Nhập mã ưu đãi',
                          prefixIcon: const Icon(Icons.confirmation_number_outlined),
                          filled: true,
                          fillColor: c.surface,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12.r)),
                        ),
                        onChanged: (v) => context.read<BookingFlowCubit>().setDiscountCode(v),
                      ),
                    ),
                    SizedBox(width: 8.w),
                    ElevatedButton(
                      onPressed: () => context.read<BookingFlowCubit>().applyDiscount(),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: c.onSurface,
                        foregroundColor: c.surface,
                        padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 16.h),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12.r)),
                      ),
                      child: const Text('Áp dụng'),
                    ),
                  ],
                ),
                SizedBox(height: 16.h),
              ],
              _sectionCard(
                c,
                title: 'Chi tiết thanh toán',
                child: Column(
                  children: [
                    if (!state.isLaborService) ...[
                      if (state.isQuoteBooking) ...[
                        _priceRow(
                          'Giá cơ bản · ${state.quoteProviderName ?? 'Nhà xe'}',
                          _formatPrice(state.quoteBasePrice),
                          c,
                        ),
                        ...state.quoteSurcharges.map(
                          (s) => _priceRow(s.label, _formatPrice(s.amount), c),
                        ),
                        Padding(
                          padding: EdgeInsets.only(bottom: 8.h),
                          child: Align(
                            alignment: Alignment.centerLeft,
                            child: Text(
                              'Mã báo giá: ${state.quoteReferenceId ?? ''}',
                              style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted, height: 1.3),
                            ),
                          ),
                        ),
                      ] else if (state.isComboBooking) ...[
                        _priceRow(
                          'Xe+km niêm yết · ${state.selectedPackage?.label ?? 'Combo'}',
                          _formatPrice(state.movePackagePrice),
                          c,
                        ),
                        if (state.effectiveComboLaborCount > 0) ...[
                          _priceRow(
                            'Khuân vác combo · ${state.effectiveComboLaborCount} người',
                            _formatPrice(state.comboLaborFee),
                            c,
                          ),
                          Padding(
                            padding: EdgeInsets.only(bottom: 8.h),
                            child: Align(
                              alignment: Alignment.centerLeft,
                              child: Text(
                                'Giá khuân vác do ${partner?.name ?? 'nhà xe'} đặt · Xe+km theo niêm yết app',
                                style: TextStyle(
                                  fontSize: 12.sp,
                                  color: c.onSurfaceMuted,
                                  fontWeight: FontWeight.w600,
                                  height: 1.3,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ] else ...[
                        _priceRow(
                          partner != null
                              ? 'Vận chuyển · ${partner.name}'
                              : 'Vận chuyển (báo giá nhà xe)',
                          _formatPrice(state.partnerTransportPrice),
                          c,
                        ),
                        Padding(
                          padding: EdgeInsets.only(bottom: 8.h),
                          child: Align(
                            alignment: Alignment.centerLeft,
                            child: Text(
                              'Giá do nhà xe báo theo km & tuyến — linh hoạt hơn combo',
                              style: TextStyle(
                                fontSize: 12.sp,
                                color: c.onSurfaceMuted,
                                height: 1.3,
                              ),
                            ),
                          ),
                        ),
                      ],
                      if (state.isComboBooking && partner != null)
                        _priceRow('Nhà xe combo', partner.name, c),
                      if (!state.isQuoteBooking)
                        _priceRow(
                          state.hasInsuranceCoverage
                              ? 'Bảo hiểm đồ đạc (${state.selectedInsurancePlan?.name})'
                              : 'Bảo hiểm đồ đạc',
                          state.hasInsuranceCoverage
                              ? _formatPrice(state.insuranceFee)
                              : 'Không mua',
                          c,
                        ),
                      if (!state.isQuoteBooking)
                        Align(
                        alignment: Alignment.centerLeft,
                        child: TextButton.icon(
                          onPressed: () => context.push('/booking/insurance'),
                          icon: Icon(Icons.edit_outlined, size: 16.sp, color: c.primary),
                          label: Text(
                            'Đổi gói bảo hiểm',
                            style: TextStyle(fontSize: 12.sp, color: c.primary),
                          ),
                        ),
                      ),
                    ],
                    if (state.isLaborService) ...[
                      _priceRow(
                        state.isLaborAddon
                            ? 'Khuân vác · ${state.linkedProviderName ?? labor?.name ?? 'Nhà xe'} (${state.helperCount}×${state.laborHours}h)'
                            : labor != null
                                ? '${labor.name} (${state.helperCount}×${state.laborHours}h)'
                                : 'Khuân vác (${state.helperCount}×${state.laborHours}h)',
                        _formatPrice(state.laborQuotedPrice),
                        c,
                      ),
                      if (state.isLaborAddon)
                        Padding(
                          padding: EdgeInsets.only(bottom: 8.h),
                          child: Align(
                            alignment: Alignment.centerLeft,
                            child: Text(
                              'Giá do nhà xe vận chuyển đã đặt — không dùng đối tác khác',
                              style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted, height: 1.3),
                            ),
                          ),
                        ),
                      if (state.floorFee > 0 && labor == null)
                        _priceRow('Phụ phí tầng', _formatPrice(state.floorFee), c),
                    ],
                    if (state.discountApplied)
                      _priceRow('Khuyến mãi', '-${_formatPrice(state.discount)}', c, highlight: true),
                    _priceRow('Phí dịch vụ', _formatPrice(state.serviceFee), c),
                    Divider(height: 24.h, color: c.border),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Tổng chuyến',
                          style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w700, color: c.onSurface),
                        ),
                        Text(
                          _formatPrice(state.total),
                          style: TextStyle(fontSize: 24.sp, fontWeight: FontWeight.w800, color: c.primary),
                        ),
                      ],
                    ),
                    SizedBox(height: 8.h),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Đặt cọc hôm nay (30%)',
                          style: TextStyle(fontSize: 14.sp, fontWeight: FontWeight.w600, color: c.onSurface),
                        ),
                        Text(
                          _formatPrice(deposit),
                          style: TextStyle(fontSize: 18.sp, fontWeight: FontWeight.w800, color: c.success),
                        ),
                      ],
                    ),
                    SizedBox(height: 4.h),
                    Text(
                      'Phần còn lại thanh toán khi bạn xác nhận hoàn thành chuyến.',
                      style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted, height: 1.35),
                    ),
                  ],
                ),
              ),
            ],
          ),
          bottom: SafeArea(
            child: Padding(
              padding: EdgeInsets.fromLTRB(20.w, 8.h, 20.w, 16.h),
              child: SmoothCtaButton(
                label: _submitting
                    ? 'Đang xử lý...'
                    : _depositInfo != null
                        ? (_paymentCompleted
                            ? (state.isQuoteBooking ? 'Đã thanh toán — hoàn tất' : 'Theo dõi đơn hàng')
                            : 'Đang chờ xác nhận thanh toán...')
                        : state.isLaborService
                            ? (state.isLaborAddon
                                ? 'Đặt cọc thêm khuân vác · ${_formatPrice(deposit)}'
                                : 'Đặt cọc khuân vác · ${_formatPrice(deposit)}')
                            : 'Đặt cọc · ${_formatPrice(deposit)}',
                onPressed: _submitting || (_depositInfo != null && !_paymentCompleted)
                    ? null
                    : _depositInfo != null
                        ? () async {
                            if (state.isQuoteBooking) {
                              setState(() => _submitting = true);
                              try {
                                await context.read<BookingFlowCubit>().completeQuoteDeposit();
                                if (!context.mounted) return;
                                context.pop(true);
                              } catch (e) {
                                if (!context.mounted) return;
                                setState(() => _submitting = false);
                                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
                              }
                              return;
                            }
                            context.go('/orders/$_pendingOrderId/tracking');
                          }
                        : () => _confirmDeposit(context, state, labor?.name),
              ),
            ),
          ),
        );
      },
    );
  }

  int _depositAmount(int total) => (total * 0.3).round();

  Future<void> _confirmDeposit(BuildContext context, BookingFlowState state, String? teamName) async {
    setState(() => _submitting = true);
    try {
      final cubit = context.read<BookingFlowCubit>();

      if (state.isQuoteBooking) {
        final checkout = await cubit.payQuoteDeposit();
        if (!context.mounted) return;

        if (checkout?.deposit != null) {
          setState(() {
            _depositInfo = checkout!.deposit;
            _pendingOrderId = checkout.orderId;
          });
          _startPaymentPolling(checkout!.deposit!.paymentId);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Quét mã QR — hệ thống tự xác nhận khi chuyển khoản thành công')),
          );
          return;
        }

        await cubit.completeQuoteDeposit();
        if (!context.mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đặt cọc thành công — chuyến đã được giữ chỗ')),
        );
        context.pop(true);
        return;
      }

      if (state.isLaborAddon && state.linkedOrderId != null) {
        final orderId = state.linkedOrderId!;
        if (!context.mounted) return;
        final helpers = state.helperCount;
        final team = teamName ?? 'đối tác';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Đã thêm $helpers người ($team) vào đơn #${state.linkedOrderNumber ?? orderId}')),
        );
        context.go('/orders/$orderId/tracking');
        return;
      }

      final result = await cubit.checkout();
      if (!context.mounted) return;

      if (result.deposit != null) {
        setState(() {
          _depositInfo = result.deposit;
          _pendingOrderId = result.orderId;
        });
        _startPaymentPolling(result.deposit!.paymentId);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đơn đã tạo — quét mã QR, chờ xác nhận thanh toán')),
        );
        return;
      }

      final helpers = state.helperCount;
      final team = teamName ?? 'đối tác';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            state.isLaborOnly
                ? 'Đã đặt $helpers người ($team) — đơn đã ghi nhận'
                : 'Đặt cọc thành công — đơn đã tạo trên hệ thống',
          ),
        ),
      );
      context.go('/orders/${result.orderId}/tracking');
    } on ApiException catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message), backgroundColor: Colors.red.shade700),
        );
      }
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Không tạo được đơn. Kiểm tra backend và đăng nhập.')),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Widget _marketplaceNote(UniMoveColors c, {required String partnerName, required bool isCombo}) {
    return Container(
      padding: EdgeInsets.all(12.w),
      decoration: BoxDecoration(
        color: c.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: c.primary.withValues(alpha: 0.2)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.storefront_outlined, color: c.primary, size: 20.sp),
          SizedBox(width: 10.w),
          Expanded(
            child: Text(
              isCombo
                  ? 'Combo niêm yết — $partnerName thực hiện theo giá app. UniMove giữ cọc an toàn.'
                  : 'Chuyến linh hoạt — $partnerName báo giá theo tuyến của bạn. UniMove giữ cọc an toàn.',
              style: TextStyle(fontSize: 12.sp, height: 1.4, color: c.onSurface),
            ),
          ),
        ],
      ),
    );
  }

  Widget _dormDetailsCard(UniMoveColors c, BookingFlowState state) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(12.w),
      decoration: BoxDecoration(
        color: c.surfaceTint,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: c.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.apartment_outlined, size: 16.sp, color: c.primary),
              SizedBox(width: 6.w),
              Text(
                'Mô tả trọ gửi nhà xe',
                style: TextStyle(fontSize: 12.sp, fontWeight: FontWeight.w700, color: c.onSurface),
              ),
            ],
          ),
          SizedBox(height: 8.h),
          Text(
            'Trọ cũ: ${state.pickupAccessSummary}',
            style: TextStyle(fontSize: 11.sp, color: c.onSurfaceMuted, height: 1.35),
          ),
          SizedBox(height: 4.h),
          Text(
            'Trọ mới: ${state.destinationAccessSummary}',
            style: TextStyle(fontSize: 11.sp, color: c.onSurfaceMuted, height: 1.35),
          ),
          SizedBox(height: 4.h),
          Text(
            'Đồ: ${state.cargoVolume.label}',
            style: TextStyle(fontSize: 11.sp, color: c.onSurfaceMuted, height: 1.35),
          ),
          if (state.dormNote.trim().isNotEmpty) ...[
            SizedBox(height: 4.h),
            Text(
              state.dormNote.trim(),
              style: TextStyle(fontSize: 11.sp, color: c.onSurface, height: 1.35),
            ),
          ],
          if (state.dormImageCount > 0) ...[
            SizedBox(height: 4.h),
            Text(
              '${state.dormImageCount} ảnh đính kèm',
              style: TextStyle(fontSize: 11.sp, color: c.primary, fontWeight: FontWeight.w600),
            ),
          ],
        ],
      ),
    );
  }

  Widget _payosQrCard(
    UniMoveColors c,
    DepositPaymentInfo info, {
    required bool paymentCompleted,
    required bool polling,
  }) {
    return Container(
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(16.r),
        border: Border.all(color: c.primary.withValues(alpha: 0.35), width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.qr_code_2, color: c.primary, size: 22.sp),
              SizedBox(width: 8.w),
              Expanded(
                child: Text(
                  'Quét mã QR để đặt cọc ${_formatPrice(info.amount)}',
                  style: TextStyle(fontSize: 14.sp, fontWeight: FontWeight.w800, color: c.onSurface),
                ),
              ),
            ],
          ),
          if (info.paymentCode.isNotEmpty) ...[
            SizedBox(height: 6.h),
            Text(
              'Mã: ${info.paymentCode}',
              style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted),
            ),
          ],
          if (info.qrCode != null && info.qrCode!.startsWith('data:image')) ...[
            SizedBox(height: 14.h),
            Center(child: _qrDataImage(info.qrCode!, c, size: 220.w)),
          ] else if (info.hasQrImage) ...[
            SizedBox(height: 14.h),
            Center(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12.r),
                child: CachedNetworkImage(
                  imageUrl: info.qrCode!,
                  width: 220.w,
                  height: 220.w,
                  fit: BoxFit.contain,
                  placeholder: (_, __) => SizedBox(
                    width: 220.w,
                    height: 220.w,
                    child: Center(child: CircularProgressIndicator(color: c.primary, strokeWidth: 2)),
                  ),
                  errorWidget: (_, __, ___) => _vietQrWidget(info.qrCode!, size: 220.w),
                ),
              ),
            ),
          ] else if (info.hasVietQrPayload) ...[
            SizedBox(height: 14.h),
            Center(child: _vietQrWidget(info.qrCode!, size: 220.w)),
          ],
          if (info.bankAccountNumber != null) ...[
            SizedBox(height: 12.h),
            Text(
              'STK: ${info.bankAccountNumber}',
              style: TextStyle(fontSize: 13.sp, fontWeight: FontWeight.w600, color: c.onSurface),
            ),
          ],
          if (info.bankAccountName != null) ...[
            SizedBox(height: 4.h),
            Text(
              info.bankAccountName!,
              style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted),
            ),
          ],
          if (info.checkoutUrl != null && info.checkoutUrl!.isNotEmpty) ...[
            SizedBox(height: 12.h),
            TextButton.icon(
              onPressed: () {
                Clipboard.setData(ClipboardData(text: info.checkoutUrl!));
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Đã sao chép link thanh toán')),
                );
              },
              icon: Icon(Icons.link, size: 18.sp, color: c.primary),
              label: Text(
                'Sao chép link thanh toán',
                style: TextStyle(fontSize: 13.sp, color: c.primary, fontWeight: FontWeight.w600),
              ),
            ),
          ],
          SizedBox(height: 10.h),
          if (paymentCompleted)
            Row(
              children: [
                Icon(Icons.check_circle, color: c.success, size: 18.sp),
                SizedBox(width: 8.w),
                Expanded(
                  child: Text(
                    'Thanh toán đã xác nhận — bạn có thể tiếp tục bước sau.',
                    style: TextStyle(fontSize: 12.sp, color: c.success, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            )
          else if (polling) ...[
            Row(
              children: [
                SizedBox(
                  width: 16.w,
                  height: 16.w,
                  child: CircularProgressIndicator(strokeWidth: 2, color: c.primary),
                ),
                SizedBox(width: 8.w),
                Expanded(
                  child: Text(
                    'Đang chờ ngân hàng xác nhận. Sau khi chuyển khoản, hệ thống tự kiểm tra mỗi 3 giây.',
                    style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted, height: 1.35),
                  ),
                ),
              ],
            ),
            SizedBox(height: 8.h),
            TextButton.icon(
              onPressed: _checkingPayment ? null : _recheckPayment,
              icon: Icon(Icons.refresh, size: 18.sp, color: c.primary),
              label: Text(
                _checkingPayment ? 'Đang kiểm tra...' : 'Tôi đã chuyển khoản — kiểm tra lại',
                style: TextStyle(fontSize: 13.sp, color: c.primary, fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _vietQrWidget(String data, {required double size}) {
    return Container(
      padding: EdgeInsets.all(10.w),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12.r),
      ),
      child: QrImageView(
        data: data,
        size: size,
        backgroundColor: Colors.white,
        errorCorrectionLevel: QrErrorCorrectLevel.M,
      ),
    );
  }

  Widget _qrDataImage(String dataUrl, UniMoveColors c, {required double size}) {
    try {
      final base64 = dataUrl.contains(',') ? dataUrl.split(',').last : dataUrl;
      final bytes = base64Decode(base64);
      return ClipRRect(
        borderRadius: BorderRadius.circular(12.r),
        child: Image.memory(bytes, width: size, height: size, fit: BoxFit.contain),
      );
    } catch (_) {
      return Icon(Icons.qr_code_2, size: 120.sp, color: c.onSurfaceMuted);
    }
  }

  Widget _escrowTrustCard(UniMoveColors c, {required int deposit}) {
    return Container(
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        color: c.chipBg,
        borderRadius: BorderRadius.circular(14.r),
        border: Border.all(color: c.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.account_balance_wallet_outlined, color: c.primary, size: 22.sp),
              SizedBox(width: 8.w),
              Text(
                'Cam kết UniMove (trung gian)',
                style: TextStyle(fontSize: 14.sp, fontWeight: FontWeight.w800, color: c.onSurface),
              ),
            ],
          ),
          SizedBox(height: 10.h),
          _trustLine(Icons.lock_outline, 'Cọc ${_formatPrice(deposit)} giữ an toàn — chuyển cho nhà xe khi bạn xác nhận xong', c),
          SizedBox(height: 6.h),
          _trustLine(Icons.replay_outlined, 'Hủy trước khi nhà xe nhận: hoàn 100% cọc', c),
          SizedBox(height: 6.h),
          _trustLine(Icons.info_outline, 'Hủy sau khi nhà xe nhận: hoàn 50% cọc (theo chính sách)', c),
        ],
      ),
    );
  }

  Widget _trustLine(IconData icon, String text, UniMoveColors c) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16.sp, color: c.primary),
        SizedBox(width: 8.w),
        Expanded(
          child: Text(text, style: TextStyle(fontSize: 12.sp, height: 1.35, color: c.onSurfaceMuted)),
        ),
      ],
    );
  }

  Widget _sectionCard(UniMoveColors c, {required String title, required Widget child}) {
    return Container(
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(16.r),
        border: Border.all(color: c.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w700, color: c.onSurface)),
          SizedBox(height: 12.h),
          child,
        ],
      ),
    );
  }

  Widget _tripRow(IconData icon, Color color, String text, UniMoveColors c) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: color, size: 20.sp),
        SizedBox(width: 10.w),
        Expanded(
          child: Text(text, style: TextStyle(fontSize: 14.sp, height: 1.35, color: c.onSurface)),
        ),
      ],
    );
  }

  Widget _chip(String text, IconData icon, UniMoveColors c) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 6.h),
      decoration: BoxDecoration(
        color: c.surfaceTint,
        borderRadius: BorderRadius.circular(8.r),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14.sp, color: c.primary),
          SizedBox(width: 6.w),
          Text(text, style: TextStyle(fontSize: 12.sp, fontWeight: FontWeight.w600, color: c.onSurface)),
        ],
      ),
    );
  }

  Widget _payMethod(
    BuildContext context,
    BookingFlowState state,
    PaymentMethod method,
    String title,
    String? subtitle,
    UniMoveColors c, {
    required bool selected,
  }) {
    return Padding(
      padding: EdgeInsets.only(bottom: 10.h),
      child: Material(
        color: selected ? c.chipBg : c.surface,
        borderRadius: BorderRadius.circular(14.r),
        child: InkWell(
          borderRadius: BorderRadius.circular(14.r),
          onTap: () => context.read<BookingFlowCubit>().selectPayment(method),
          child: Container(
            padding: EdgeInsets.all(14.w),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14.r),
              border: Border.all(color: selected ? c.primary : c.border, width: selected ? 2 : 1),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14.sp, color: c.onSurface),
                      ),
                      if (subtitle != null)
                        Text(subtitle, style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted)),
                    ],
                  ),
                ),
                Icon(
                  selected ? Icons.radio_button_checked : Icons.radio_button_off,
                  color: c.primary,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _priceRow(String label, String value, UniMoveColors c, {bool highlight = false}) {
    return Padding(
      padding: EdgeInsets.only(bottom: 8.h),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Text(
              label,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(fontSize: 14.sp, color: c.onSurfaceMuted, height: 1.25),
            ),
          ),
          SizedBox(width: 10.w),
          Text(
            value,
            style: TextStyle(
              fontSize: 14.sp,
              fontWeight: FontWeight.w600,
              color: highlight ? c.success : c.onSurface,
            ),
          ),
        ],
      ),
    );
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
}
