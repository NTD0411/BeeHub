import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import 'dart:io';

import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../core/mock/mock_provider_data.dart';
import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/shad_screen_scope.dart';
import '../../../auth/data/auth_repository.dart';
import '../../domain/provider_order.dart';
import '../providers/orders_providers.dart';

class OrderDetailPage extends ConsumerStatefulWidget {
  const OrderDetailPage({super.key, required this.orderId});

  final String orderId;

  @override
  ConsumerState<OrderDetailPage> createState() => _OrderDetailPageState();
}

class _OrderDetailPageState extends ConsumerState<OrderDetailPage> {
  final _declineReasonCtrl = TextEditingController();
  final _basePriceCtrl = TextEditingController();
  final _surchargeLabelCtrl = TextEditingController(text: 'Phụ phí tầng / hẻm');
  final _surchargeAmountCtrl = TextEditingController();
  final _quoteNoteCtrl = TextEditingController();
  bool _submitting = false;
  bool _loadingQuote = false;
  Map<String, dynamic>? _myQuote;
  String _scheduleFit = 'exact_match';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadMyQuote());
  }

  Future<void> _loadMyQuote() async {
    setState(() => _loadingQuote = true);
    try {
      final quotes = await ref.read(providerOrdersRepositoryProvider).fetchQuotes(widget.orderId);
      if (!mounted) return;
      setState(() {
        _myQuote = quotes.isNotEmpty ? quotes.first : null;
        _loadingQuote = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loadingQuote = false);
    }
  }

  Future<void> _submitQuote(ProviderOrder order) async {
    final base = int.tryParse(_basePriceCtrl.text.replaceAll(RegExp(r'[^0-9]'), ''));
    if (base == null || base <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Nhập giá cơ bản hợp lệ')),
      );
      return;
    }

    final surcharges = <Map<String, dynamic>>[];
    final surchargeAmount = int.tryParse(_surchargeAmountCtrl.text.replaceAll(RegExp(r'[^0-9]'), ''));
    if (surchargeAmount != null && surchargeAmount > 0) {
      surcharges.add({
        'label': _surchargeLabelCtrl.text.trim().isEmpty ? 'Phụ phí' : _surchargeLabelCtrl.text.trim(),
        'amount': surchargeAmount,
      });
    }

    setState(() => _submitting = true);
    try {
      final result = await ref.read(providerOrdersRepositoryProvider).submitQuote(
            orderId: widget.orderId,
            basePrice: base,
            surcharges: surcharges,
            scheduleFit: _scheduleFit,
            proposedPickupAt: _scheduleFit == 'alternate_proposed' ? order.scheduledPickupTime : null,
            note: _quoteNoteCtrl.text.trim(),
          );
      ref.invalidate(providerOrdersListProvider);
      ref.invalidate(providerOrderDetailProvider(widget.orderId));
      if (!mounted) return;
      setState(() {
        _myQuote = result;
        _submitting = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Đã gửi báo giá — chờ khách chốt')),
      );
    } catch (e) {
      if (mounted) {
        setState(() => _submitting = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    }
  }

  @override
  void dispose() {
    _declineReasonCtrl.dispose();
    _basePriceCtrl.dispose();
    _surchargeLabelCtrl.dispose();
    _surchargeAmountCtrl.dispose();
    _quoteNoteCtrl.dispose();
    super.dispose();
  }

  Future<void> _accept() async {
    setState(() => _submitting = true);
    try {
      await ref.read(providerOrdersRepositoryProvider).accept(widget.orderId);
      ref.invalidate(providerOrdersListProvider);
      ref.invalidate(providerOrderDetailProvider(widget.orderId));
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Đã nhận đơn — bấm "Bắt đầu lấy hàng" khi sẵn sàng')),
      );
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _start() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Bắt đầu lấy hàng?'),
        content: const Text('Xác nhận bạn đang trên đường đến lấy hàng. Khách sẽ được thông báo.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Chưa')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Bắt đầu')),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    setState(() => _submitting = true);
    try {
      await ref.read(providerOrdersRepositoryProvider).start(widget.orderId);
      ref.invalidate(providerOrdersListProvider);
      ref.invalidate(providerOrderDetailProvider(widget.orderId));
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Đã bắt đầu — đang trên đường lấy hàng')),
      );
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _decline() async {
    setState(() => _submitting = true);
    try {
      await ref.read(providerOrdersRepositoryProvider).decline(
            widget.orderId,
            reason: _declineReasonCtrl.text.trim(),
          );
      ref.invalidate(providerOrdersListProvider);
      ref.invalidate(providerOrderDetailProvider(widget.orderId));
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Đã từ chối đơn')),
      );
      context.pop();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _complete() async {
    // Chọn nguồn ảnh
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Chụp ảnh xác nhận giao hàng',
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
              const SizedBox(height: 4),
              const Text('Ảnh là bằng chứng khi có tranh chấp.',
                  style: TextStyle(color: Colors.grey, fontSize: 13)),
              const SizedBox(height: 16),
              ListTile(
                leading: const Icon(Icons.camera_alt_outlined),
                title: const Text('Chụp ảnh'),
                onTap: () => Navigator.pop(ctx, ImageSource.camera),
              ),
              ListTile(
                leading: const Icon(Icons.photo_library_outlined),
                title: const Text('Chọn từ thư viện'),
                onTap: () => Navigator.pop(ctx, ImageSource.gallery),
              ),
            ],
          ),
        ),
      ),
    );
    if (source == null || !mounted) return;

    final picked = await ImagePicker().pickImage(
      source: source,
      imageQuality: 80,
      maxWidth: 1280,
    );
    if (picked == null || !mounted) return;

    setState(() => _submitting = true);
    try {
      // Upload ảnh
      final api = ref.read(providerOrdersRepositoryProvider);
      final file = File(picked.path);
      final formData = FormData.fromMap({
        'photo': await MultipartFile.fromFile(
          file.path,
          filename: 'delivery.jpg',
          contentType: DioMediaType('image', 'jpeg'),
        ),
      });
      await ref.read(providerOrdersRepositoryProvider).uploadDeliveryPhoto(
            widget.orderId,
            formData,
          );

      // Hoàn thành đơn
      await api.complete(widget.orderId);
      ref.invalidate(providerOrdersListProvider);
      ref.invalidate(providerOrderDetailProvider(widget.orderId));
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Đơn hoàn thành! Ảnh đã được lưu.')),
      );
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _cancel() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Hủy đơn?'),
        content: const Text('Bạn có chắc muốn hủy đơn hàng này không?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Không')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Hủy đơn', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    setState(() => _submitting = true);
    try {
      await ref.read(providerOrdersRepositoryProvider).cancel(widget.orderId);
      ref.invalidate(providerOrdersListProvider);
      ref.invalidate(providerOrderDetailProvider(widget.orderId));
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Đã hủy đơn')));
      context.pop();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }


  @override
  Widget build(BuildContext context) {
    final orderAsync = ref.watch(providerOrderDetailProvider(widget.orderId));
    final c = UniMoveColors.of(context);

    return ShadScreenScope(
      builder: (_, theme) {
        return Scaffold(
          backgroundColor: c.background,
          body: orderAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(child: Text('Lỗi: $e', style: TextStyle(color: c.onSurface))),
            data: (order) {
              final myId = ref.watch(providerProfileProvider).asData?.value?.id;
              final customer = order.pickupPoint.contactName.isNotEmpty
                  ? order.pickupPoint.contactName
                  : 'Khách hàng';
              final showQuoteFlow = order.isOpenQuoteRequest ||
                  (order.quoteRequest && !order.isAssignedTo(myId) && order.status == 'pending');
              final showConfirmedPricing = order.isAssignedTo(myId) && order.totalPrice > 0;
              return CustomScrollView(
                slivers: [
                  SliverAppBar(
                    pinned: true,
                    expandedHeight: 168,
                    backgroundColor: c.primary,
                    foregroundColor: Colors.white,
                    iconTheme: const IconThemeData(color: Colors.white),
                    flexibleSpace: FlexibleSpaceBar(
                      background: Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [c.primary, c.primaryLight],
                          ),
                        ),
                        padding: const EdgeInsets.fromLTRB(20, 56, 20, 20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.2),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    order.statusLabelFor(myId),
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                                const Spacer(),
                                if (order.createdAt != null)
                                  Text(
                                    ProviderOrder.timeAgo(order.createdAt),
                                    style: TextStyle(
                                      color: Colors.white.withValues(alpha: 0.85),
                                      fontSize: 12,
                                    ),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            Text(
                              '#${order.orderNumber ?? order.id.substring(0, 8)}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 26,
                                fontWeight: FontWeight.w800,
                                letterSpacing: -0.5,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              ProviderOrder.formatDateTime(order.createdAt),
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.8),
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
                    sliver: SliverList(
                      delegate: SliverChildListDelegate([
                        _quickStats(c, order, myId: myId, myQuoteTotal: _quoteTotal(_myQuote)),
                        const SizedBox(height: 16),
                        _sectionTitle(c, 'Hành trình'),
                        const SizedBox(height: 10),
                        _routeCard(c, order),
                        const SizedBox(height: 20),
                        _sectionTitle(c, 'Khách hàng'),
                        const SizedBox(height: 10),
                        _customerCard(c, theme, customer, order),
                        const SizedBox(height: 20),
                        _sectionTitle(c, 'Dịch vụ & phương tiện'),
                        const SizedBox(height: 10),
                        _serviceCard(c, theme, order),
                        if (order.items.isNotEmpty || (order.itemsDescription?.isNotEmpty ?? false)) ...[
                          const SizedBox(height: 20),
                          _sectionTitle(c, 'Hàng hóa'),
                          const SizedBox(height: 10),
                          _itemsCard(c, theme, order),
                        ],
                        const SizedBox(height: 20),
                        if (showQuoteFlow) ...[
                          _sectionTitle(c, 'Báo giá'),
                          const SizedBox(height: 10),
                          _quoteRequestSection(c, theme, order, myId),
                        ] else if (showConfirmedPricing) ...[
                          _sectionTitle(c, 'Giá đã chốt'),
                          const SizedBox(height: 10),
                          _confirmedPricingCard(c, theme, order, myId),
                        ] else if (!order.quoteRequest) ...[
                          _sectionTitle(c, 'Chi phí'),
                          const SizedBox(height: 10),
                          _pricingCard(c, theme, order),
                        ],
                        if (order.isAssignedTo(myId) &&
                            (order.isAwaitingDeposit(myId) || order.isDepositConfirmed(myId))) ...[
                          const SizedBox(height: 20),
                          _sectionTitle(c, 'Trạng thái'),
                          const SizedBox(height: 10),
                          _bookingStatusCard(c, theme, order, myId),
                        ],
                        if (order.scheduledPickupTime != null ||
                            order.actualPickupTime != null ||
                            order.completedAt != null) ...[
                          const SizedBox(height: 20),
                          _sectionTitle(c, 'Thời gian'),
                          const SizedBox(height: 10),
                          _timingCard(c, theme, order),
                        ],
                        if (order.status == 'in_progress') ...[
                          const SizedBox(height: 20),
                          ShadButton(
                            width: double.infinity,
                            onPressed: () => context.push('/orders/${order.id}/tracking'),
                            leading: const Icon(LucideIcons.navigation, size: 18),
                            child: const Text('Theo dõi hành trình · chia sẻ vị trí'),
                          ),
                          const SizedBox(height: 10),
                          ShadButton.outline(
                            width: double.infinity,
                            onPressed: () => context.push('/chat/order-${order.id}'),
                            leading: const Icon(LucideIcons.messageCircle, size: 18),
                            child: const Text('Nhắn tin cho khách'),
                          ),
                        ],
                        if (order.isReadyToAccept(myId)) ...[
                          const SizedBox(height: 24),
                          ShadButton(
                            width: double.infinity,
                            onPressed: _submitting ? null : () => _respond('accepted'),
                            child: _submitting
                                ? const SizedBox(
                                    width: 22,
                                    height: 22,
                                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                  )
                                : const Text('Nhận đơn — bắt đầu chuẩn bị'),
                          ),
                          const SizedBox(height: 10),
                          Text(
                            'Khách đã đặt cọc qua UniMove. Nhận đơn để bắt đầu chuẩn bị lấy hàng.',
                            style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted, height: 1.35),
                          ),
                        ] else if (order.isPending && !order.quoteRequest) ...[
                          const SizedBox(height: 24),
                          ShadButton(
                            width: double.infinity,
                            onPressed: _submitting ? null : _accept,
                            child: _submitting
                                ? const SizedBox(
                                    width: 22,
                                    height: 22,
                                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                  )
                                : const Text('Nhận đơn'),
                          ),
                          const SizedBox(height: 16),
                          GlassCard(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                Text(
                                  'Lý do từ chối (tuỳ chọn)',
                                  style: theme.textTheme.small.copyWith(fontWeight: FontWeight.w600),
                                ),
                                const SizedBox(height: 8),
                                ShadInput(
                                  controller: _declineReasonCtrl,
                                  placeholder: const Text('Ví dụ: không còn slot trong khung giờ...'),
                                  maxLines: 2,
                                ),
                                const SizedBox(height: 12),
                                ShadButton.outline(
                                  width: double.infinity,
                                  onPressed: _submitting ? null : _decline,
                                  child: const Text('Từ chối đơn'),
                                ),
                              ],
                            ),
                          ),
                        ],
                        if (order.status == 'accepted') ...[
                          const SizedBox(height: 12),
                          ShadButton(
                            width: double.infinity,
                            backgroundColor: Colors.orange.shade600,
                            onPressed: _submitting ? null : _start,
                            leading: const Icon(LucideIcons.truck, size: 18),
                            child: const Text('Bắt đầu lấy hàng'),
                          ),
                          const SizedBox(height: 8),
                          ShadButton.outline(
                            width: double.infinity,
                            onPressed: _submitting ? null : _cancel,
                            leading: const Icon(LucideIcons.x, size: 18, color: Color(0xFFEF4444)),
                            child: const Text('Hủy đơn', style: TextStyle(color: Color(0xFFEF4444))),
                          ),
                        ],
                        if (order.status == 'in_progress') ...[
                          const SizedBox(height: 12),
                          ShadButton(
                            width: double.infinity,
                            backgroundColor: Colors.green.shade600,
                            onPressed: _submitting ? null : _complete,
                            leading: const Icon(LucideIcons.circleCheck, size: 18),
                            child: const Text('Hoàn thành đơn'),
                          ),
                          const SizedBox(height: 8),
                          ShadButton.outline(
                            width: double.infinity,
                            onPressed: _submitting ? null : _cancel,
                            leading: const Icon(LucideIcons.x, size: 18, color: Color(0xFFEF4444)),
                            child: const Text('Hủy đơn', style: TextStyle(color: Color(0xFFEF4444))),
                          ),
                        ],
                      ]),
                    ),
                  ),
                ],
              );
            },
          ),
        );
      },
    );
  }

  Widget _quoteRequestSection(UniMoveColors c, ShadThemeData theme, ProviderOrder order, String? myId) {
    if (_loadingQuote) {
      return const Center(child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator()));
    }

    if (_myQuote != null) {
      final total = ((_myQuote!['total_price'] as num?) ?? 0).round();
      final fit = _myQuote!['schedule_fit'] as String? ?? 'exact_match';
      final quoteStatus = _myQuote!['status'] as String? ?? 'submitted';

      if (quoteStatus == 'expired') {
        return GlassCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Khách chọn nhà xe khác', style: theme.textTheme.large.copyWith(fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              Text(
                'Báo giá ${ProviderOrder.formatMoney(total)} không được chọn lần này.',
                style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted),
              ),
            ],
          ),
        );
      }

      return GlassCard(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Báo giá đã gửi', style: theme.textTheme.large.copyWith(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Text(
              '${ProviderOrder.formatMoney(total)} · '
              '${fit == 'alternate_proposed' ? 'Đề xuất giờ khác' : 'Nhận đúng giờ khách chọn'}',
              style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted),
            ),
            const SizedBox(height: 12),
            Text(
              'Chờ khách so sánh và chốt. Bạn sẽ nhận thông báo khi được chọn.',
              style: theme.textTheme.small.copyWith(height: 1.4),
            ),
          ],
        ),
      );
    }

    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Gửi báo giá', style: theme.textTheme.large.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 6),
          Text(
            'Khách đang chờ nhiều nhà xe báo giá — nhập giá và khung giờ bạn nhận.',
            style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted, height: 1.35),
          ),
          const SizedBox(height: 16),
          Text('Giá cơ bản (VNĐ)', style: theme.textTheme.small.copyWith(fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          ShadInput(
            controller: _basePriceCtrl,
            keyboardType: TextInputType.number,
            placeholder: const Text('Nhập giá của bạn (VNĐ)'),
          ),
          const SizedBox(height: 12),
          Text('Phụ phí (tuỳ chọn)', style: theme.textTheme.small.copyWith(fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          ShadInput(controller: _surchargeLabelCtrl, placeholder: const Text('Tầng / hẻm / khuân vác')),
          const SizedBox(height: 8),
          ShadInput(
            controller: _surchargeAmountCtrl,
            keyboardType: TextInputType.number,
            placeholder: const Text('50000'),
          ),
          const SizedBox(height: 12),
          Text('Khung giờ', style: theme.textTheme.small.copyWith(fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: [
              ChoiceChip(
                label: const Text('Nhận đúng giờ'),
                selected: _scheduleFit == 'exact_match',
                onSelected: (_) => setState(() => _scheduleFit = 'exact_match'),
              ),
              ChoiceChip(
                label: const Text('Đề xuất giờ khác'),
                selected: _scheduleFit == 'alternate_proposed',
                onSelected: (_) => setState(() => _scheduleFit = 'alternate_proposed'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ShadInput(
            controller: _quoteNoteCtrl,
            maxLines: 2,
            placeholder: const Text('Ghi chú cho khách (tuỳ chọn)'),
          ),
          const SizedBox(height: 16),
          ShadButton(
            width: double.infinity,
            onPressed: _submitting ? null : () => _submitQuote(order),
            child: _submitting
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Text('Gửi báo giá'),
          ),
        ],
      ),
    );
  }

  Widget _confirmedPricingCard(
    UniMoveColors c,
    ShadThemeData theme,
    ProviderOrder order,
    String? myId,
  ) {
    final deposit = order.depositAmount > 0
        ? order.depositAmount
        : (order.totalPrice * 0.3).round();
    final remaining = order.remainingAmount > 0 ? order.remainingAmount : order.totalPrice - deposit;

    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _priceRow(c, theme, 'Giá chốt với khách', order.totalPrice, highlight: true),
          if (order.depositPaid) ...[
            _priceRow(c, theme, 'Khách đã cọc (UniMove giữ)', deposit, valueColor: c.success),
            _priceRow(c, theme, 'Còn lại sau chuyến', remaining),
          ],
          const Padding(padding: EdgeInsets.symmetric(vertical: 12), child: Divider(height: 1)),
          Row(
            children: [
              Text('Thu nhập dự kiến', style: theme.textTheme.p.copyWith(fontWeight: FontWeight.w800)),
              const Spacer(),
              Text(
                ProviderOrder.formatMoney(order.netEarnings),
                style: theme.textTheme.h3.copyWith(fontWeight: FontWeight.w800, color: c.primaryLight),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'Sau phí nền tảng ~15%. Tiền cọc chuyển cho bạn khi khách xác nhận hoàn thành.',
            style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted, height: 1.35),
          ),
        ],
      ),
    );
  }

  Widget _bookingStatusCard(UniMoveColors c, ShadThemeData theme, ProviderOrder order, String? myId) {
    final steps = <({String title, String subtitle, bool done})>[
      (
        title: 'Khách chốt báo giá của bạn',
        subtitle: order.quoteReferenceCode != null ? 'Mã ${order.quoteReferenceCode}' : 'Đã gán đơn cho bạn',
        done: true,
      ),
      (
        title: 'Khách đặt cọc qua UniMove',
        subtitle: order.depositPaid
            ? 'Đã cọc ${ProviderOrder.formatMoney(order.depositAmount > 0 ? order.depositAmount : (order.totalPrice * 0.3).round())}'
            : 'Chờ khách quét QR đặt cọc 30%',
        done: order.depositPaid,
      ),
      (
        title: 'Bạn nhận đơn & chuẩn bị chuyến',
        subtitle: order.status == 'accepted' ? 'Đã nhận — sẵn sàng lấy hàng' : 'Nhấn "Nhận đơn" sau khi khách cọc',
        done: order.status == 'accepted' || order.isActive,
      ),
    ];

    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          for (var i = 0; i < steps.length; i++) ...[
            if (i > 0) const SizedBox(height: 12),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  steps[i].done ? Icons.check_circle : Icons.radio_button_unchecked,
                  size: 20,
                  color: steps[i].done ? c.success : c.onSurfaceMuted,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        steps[i].title,
                        style: theme.textTheme.p.copyWith(
                          fontWeight: FontWeight.w700,
                          color: steps[i].done ? c.onSurface : c.onSurfaceMuted,
                        ),
                      ),
                      Text(
                        steps[i].subtitle,
                        style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted, height: 1.3),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _sectionTitle(UniMoveColors c, String text) {
    return Text(
      text,
      style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: c.onSurface),
    );
  }

  int? _quoteTotal(Map<String, dynamic>? quote) {
    if (quote == null) return null;
    final total = (quote['total_price'] as num?)?.round();
    return total != null && total > 0 ? total : null;
  }

  String _revenueLabel(ProviderOrder order, {int? myQuoteTotal}) {
    if (order.quoteRequest && order.isPending) {
      if (myQuoteTotal != null) return ProviderOrder.formatMoney(myQuoteTotal);
      return 'Chờ báo giá';
    }
    if (order.totalPrice > 0) return ProviderOrder.formatMoney(order.totalPrice);
    return '—';
  }

  Widget _quickStats(UniMoveColors c, ProviderOrder order, {String? myId, int? myQuoteTotal}) {
    final revenueLabel = order.isAssignedTo(myId) && order.totalPrice > 0
        ? ProviderOrder.formatMoney(order.totalPrice)
        : _revenueLabel(order, myQuoteTotal: myQuoteTotal);
    final revenueTitle = order.isDepositConfirmed(myId)
        ? 'Giá chốt'
        : (order.quoteRequest && order.isOpenQuoteRequest ? 'Báo giá' : 'Tổng thu');

    return Row(
      children: [
        Expanded(child: _statTile(c, Icons.route_outlined, 'Quãng đường', '${order.distanceKm?.toStringAsFixed(1) ?? '—'} km')),
        const SizedBox(width: 10),
        Expanded(
          child: _statTile(
            c,
            Icons.schedule_outlined,
            'Hẹn lấy',
            order.scheduledPickupTime != null
                ? ProviderOrder.formatDateTime(order.scheduledPickupTime).split(' · ').last
                : '—',
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _statTile(
            c,
            Icons.payments_outlined,
            revenueTitle,
            revenueLabel,
            highlight: order.isAssignedTo(myId) || myQuoteTotal != null,
          ),
        ),
      ],
    );
  }

  Widget _statTile(
    UniMoveColors c,
    IconData icon,
    String label,
    String value, {
    bool highlight = false,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
      decoration: BoxDecoration(
        color: highlight ? c.primary.withValues(alpha: 0.1) : c.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: highlight ? c.primary.withValues(alpha: 0.35) : c.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: highlight ? c.primary : c.onSurfaceMuted),
          const SizedBox(height: 8),
          Text(label, style: TextStyle(fontSize: 10, color: c.onSurfaceMuted, fontWeight: FontWeight.w600)),
          const SizedBox(height: 2),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w800,
              color: highlight ? c.primary : c.onSurface,
            ),
          ),
        ],
      ),
    );
  }

  Widget _routeCard(UniMoveColors c, ProviderOrder order) {
    final pickup = order.pickupPoint;
    final delivery = order.deliveryPoint;

    return GlassCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        children: [
          _routeStop(
            c,
            color: c.primary,
            icon: Icons.trip_origin,
            title: 'Điểm lấy',
            address: pickup.address,
            meta: _locationMeta(pickup),
            notes: pickup.notes != null ? _formatCustomerNotes(pickup.notes!) : null,
          ),
          Padding(
            padding: const EdgeInsets.only(left: 15),
            child: Row(
              children: [
                Container(width: 2, height: 28, color: c.border),
                const SizedBox(width: 12),
                if (order.distanceKm != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: c.chipBg,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      '${order.distanceKm!.toStringAsFixed(1)} km',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: c.primary),
                    ),
                  ),
              ],
            ),
          ),
          _routeStop(
            c,
            color: c.success,
            icon: Icons.location_on,
            title: 'Điểm giao',
            address: delivery.address,
            meta: _locationMeta(delivery),
            notes: delivery.notes,
          ),
        ],
      ),
    );
  }

  String _formatCustomerNotes(String raw) {
    return raw.replaceAll(RegExp(r'\s*·\s*Mã báo giá:\s*\S+'), '').trim();
  }

  String _locationMeta(OrderLocationPoint p) {
    final parts = <String>[
      if (p.districtLine.isNotEmpty) p.districtLine,
      'Tầng ${p.floor}',
      p.hasElevator ? 'Có thang máy' : 'Không thang máy',
    ];
    return parts.join(' · ');
  }

  Widget _routeStop(
    UniMoveColors c, {
    required Color color,
    required IconData icon,
    required String title,
    required String address,
    required String meta,
    String? notes,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(color: color.withValues(alpha: 0.15), shape: BoxShape.circle),
          child: Icon(icon, size: 16, color: color),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: c.onSurfaceMuted)),
              const SizedBox(height: 4),
              Text(address, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: c.onSurface, height: 1.35)),
              const SizedBox(height: 4),
              Text(meta, style: TextStyle(fontSize: 12, color: c.onSurfaceMuted, height: 1.3)),
              if (notes != null && notes.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(notes, style: TextStyle(fontSize: 12, color: c.onSurface, height: 1.35)),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _customerCard(UniMoveColors c, ShadThemeData theme, String name, ProviderOrder order) {
    final phone = order.pickupPoint.contactPhone;
    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          CircleAvatar(
            radius: 26,
            backgroundColor: c.primary.withValues(alpha: 0.12),
            child: Text(
              name.isNotEmpty ? name[0].toUpperCase() : 'K',
              style: TextStyle(fontWeight: FontWeight.w800, color: c.primary, fontSize: 18),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: theme.textTheme.p.copyWith(fontWeight: FontWeight.w700, color: c.onSurface)),
                const SizedBox(height: 4),
                Text(
                  phone.isNotEmpty ? phone : 'Chưa có SĐT',
                  style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted),
                ),
                if (order.quoteReferenceCode != null) ...[
                  const SizedBox(height: 6),
                  Text(
                    'Mã báo giá: ${order.quoteReferenceCode}',
                    style: theme.textTheme.small.copyWith(color: c.primary, fontWeight: FontWeight.w600),
                  ),
                ],
                if (order.pickupPoint.notes != null && order.pickupPoint.notes!.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    _formatCustomerNotes(order.pickupPoint.notes!),
                    style: theme.textTheme.small.copyWith(color: c.onSurface, fontStyle: FontStyle.italic, height: 1.35),
                  ),
                ],
              ],
            ),
          ),
          if (phone.isNotEmpty)
            IconButton(
              onPressed: () {
                Clipboard.setData(ClipboardData(text: phone));
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Đã sao chép số điện thoại')));
              },
              icon: Icon(Icons.phone_in_talk_outlined, color: c.primary),
              tooltip: 'Sao chép SĐT',
            ),
        ],
      ),
    );
  }

  Widget _serviceCard(UniMoveColors c, ShadThemeData theme, ProviderOrder order) {
    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _infoRow(c, theme, LucideIcons.sparkles, 'Gói dịch vụ', order.serviceLabel),
          const SizedBox(height: 12),
          _infoRow(c, theme, LucideIcons.truck, 'Phương tiện', order.vehicleLabel),
          const SizedBox(height: 14),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              if (order.hasInsurance) _badge(c, 'Có bảo hiểm', c.success),
              if (order.hasPackingService) _badge(c, 'Đóng gói', c.primary),
              if (order.requiresHelpers) _badge(c, '${order.numberOfHelpers} người bốc xếp', c.primaryLight),
              if (order.hasFragileItems) _badge(c, 'Đồ dễ vỡ', Colors.orange),
              if (order.estimatedWeightKg != null)
                _badge(c, '~${order.estimatedWeightKg!.round()} kg', c.onSurfaceMuted),
            ],
          ),
        ],
      ),
    );
  }

  Widget _itemsCard(UniMoveColors c, ShadThemeData theme, ProviderOrder order) {
    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (order.itemsDescription != null && order.itemsDescription!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(
                order.itemsDescription!,
                style: theme.textTheme.p.copyWith(color: c.onSurface, height: 1.4),
              ),
            ),
          ...order.items.map(
            (item) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: c.surfaceTint,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(LucideIcons.package, size: 18, color: c.primary),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(item.name, style: TextStyle(fontWeight: FontWeight.w600, color: c.onSurface)),
                        Text(
                          [
                            'SL: ${item.qty}',
                            if (item.weightKg != null) '${item.weightKg!.round()} kg',
                            if (item.fragile) 'Dễ vỡ',
                          ].join(' · '),
                          style: TextStyle(fontSize: 12, color: c.onSurfaceMuted),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _pricingCard(UniMoveColors c, ShadThemeData theme, ProviderOrder order) {
    final p = order.priceBreakdown;
    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _priceRow(c, theme, 'Giá cơ bản', p.basePrice),
          _priceRow(c, theme, 'Theo km', p.distancePrice),
          _priceRow(c, theme, 'Phí tầng / bốc xếp', p.floorPrice),
          if (p.serviceFee > 0) _priceRow(c, theme, 'Phí dịch vụ', p.serviceFee),
          if (p.discountAmount > 0)
            _priceRow(c, theme, 'Giảm giá', -p.discountAmount, valueColor: c.success),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Divider(height: 1),
          ),
          Row(
            children: [
              Text('Tổng cộng', style: theme.textTheme.p.copyWith(fontWeight: FontWeight.w800, color: c.onSurface)),
              const Spacer(),
              Text(
                ProviderOrder.formatMoney(p.totalPrice),
                style: theme.textTheme.h3.copyWith(fontWeight: FontWeight.w800, color: c.primaryLight),
              ),
            ],
          ),
          if (order.depositAmount > 0) ...[
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 10),
              child: Divider(height: 1),
            ),
            Row(
              children: [
                Icon(LucideIcons.shieldCheck, size: 15, color: c.success),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    'Đặt cọc đã thanh toán',
                    style: theme.textTheme.small.copyWith(color: c.success, fontWeight: FontWeight.w600),
                  ),
                ),
                Text(
                  ProviderOrder.formatMoney(order.depositAmount),
                  style: theme.textTheme.small.copyWith(color: c.success, fontWeight: FontWeight.w700),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(LucideIcons.wallet, size: 15, color: c.primaryLight),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    'Thu khi giao xong',
                    style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted),
                  ),
                ),
                Text(
                  ProviderOrder.formatMoney(order.remainingAmount > 0 ? order.remainingAmount : (order.totalPrice - order.depositAmount)),
                  style: theme.textTheme.p.copyWith(color: c.primaryLight, fontWeight: FontWeight.w800),
                ),
              ],
            ),
          ],
          if (order.hasInsurance && order.insuranceValue != null) ...[
            const SizedBox(height: 10),
            Text(
              'Giá trị bảo hiểm: ${ProviderOrder.formatMoney(order.insuranceValue!)}',
              style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted),
            ),
          ],
        ],
      ),
    );
  }

  Widget _timingCard(UniMoveColors c, ShadThemeData theme, ProviderOrder order) {
    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          if (order.scheduledPickupTime != null)
            _infoRow(c, theme, LucideIcons.calendar, 'Hẹn lấy hàng', ProviderOrder.formatDateTime(order.scheduledPickupTime)),
          if (order.actualPickupTime != null) ...[
            const SizedBox(height: 10),
            _infoRow(c, theme, LucideIcons.packageCheck, 'Đã lấy hàng', ProviderOrder.formatDateTime(order.actualPickupTime)),
          ],
          if (order.actualDeliveryTime != null) ...[
            const SizedBox(height: 10),
            _infoRow(c, theme, LucideIcons.mapPinCheck, 'Đã giao', ProviderOrder.formatDateTime(order.actualDeliveryTime)),
          ],
          if (order.completedAt != null) ...[
            const SizedBox(height: 10),
            _infoRow(c, theme, LucideIcons.badgeCheck, 'Hoàn tất', ProviderOrder.formatDateTime(order.completedAt)),
          ],
        ],
      ),
    );
  }

  Widget _infoRow(UniMoveColors c, ShadThemeData theme, IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: c.primary),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted, fontWeight: FontWeight.w600)),
              const SizedBox(height: 2),
              Text(value, style: theme.textTheme.p.copyWith(color: c.onSurface)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _priceRow(
    UniMoveColors c,
    ShadThemeData theme,
    String label,
    int amount, {
    Color? valueColor,
    bool highlight = false,
  }) {
    if (amount == 0 && label != 'Giá cơ bản' && !highlight) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Text(label, style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted)),
          const Spacer(),
          Text(
            amount < 0 ? '-${ProviderOrder.formatMoney(-amount)}' : ProviderOrder.formatMoney(amount),
            style: theme.textTheme.small.copyWith(
              fontWeight: FontWeight.w600,
              color: valueColor ?? c.onSurface,
            ),
          ),
        ],
      ),
    );
  }

  Widget _badge(UniMoveColors c, String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Text(text, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color)),
    );
  }
}
