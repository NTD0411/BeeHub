import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/theme/uni_move_colors.dart';
import '../../../orders/domain/checkout_models.dart';
import '../../../payments/data/payments_repository.dart';
import '../../../payments/domain/payment_models.dart';
import '../../data/pass_item_repository.dart';

/// Trang thanh toán phí đăng tin — quét mã QR PayOS.
class ListingFeePayPage extends StatefulWidget {
  const ListingFeePayPage({
    super.key,
    required this.listingId,
    required this.fee,
  });

  final String listingId;
  final int fee;

  @override
  State<ListingFeePayPage> createState() => _ListingFeePayPageState();
}

class _ListingFeePayPageState extends State<ListingFeePayPage> {
  final _repo = PassItemRepository();
  final _paymentsRepo = PaymentsRepository();

  bool _busy = false;
  bool _paymentCompleted = false;
  bool _polling = false;
  String? _error;
  DepositPaymentInfo? _payosInfo;
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _createQrPayment());
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  String _money(int amount) {
    final s = amount.toString();
    final buf = StringBuffer();
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buf.write('.');
      buf.write(s[i]);
    }
    return '$bufđ';
  }

  void _startPolling(String paymentId) {
    _pollTimer?.cancel();
    setState(() {
      _paymentCompleted = false;
      _polling = true;
    });

    Future<void> check() async {
      final detail = await _paymentsRepo.fetchDetail(paymentId);
      if (!mounted) return;
      if (detail?.payment.status == PaymentStatus.completed) {
        _pollTimer?.cancel();
        setState(() {
          _paymentCompleted = true;
          _polling = false;
        });
      }
    }

    check();
    _pollTimer = Timer.periodic(const Duration(seconds: 3), (_) => check());
  }

  Future<void> _createQrPayment() async {
    if (_busy || _payosInfo != null) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final result = await _repo.payListingFee(widget.listingId, paymentMethod: 'payos');
      if (!mounted) return;
      final info = result.payosPayment;
      if (info == null || info.paymentId.isEmpty) {
        throw Exception('API không trả về mã QR. Kiểm tra PayOS trong .env và migration database.');
      }
      setState(() {
        _payosInfo = info;
        _busy = false;
      });
      _startPolling(info.paymentId);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _busy = false;
        _error = e.toString();
      });
    }
  }

  Future<void> _recheckPayment() async {
    final paymentId = _payosInfo?.paymentId;
    if (paymentId == null || paymentId.isEmpty) return;
    setState(() => _busy = true);
    try {
      final detail = await _paymentsRepo.fetchDetail(paymentId);
      if (!mounted) return;
      if (detail?.payment.status == PaymentStatus.completed) {
        _pollTimer?.cancel();
        context.pop(true);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Chưa nhận được xác nhận — thử lại sau vài giây')),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Widget _qrSection(UniMoveColors c) {
    if (_busy && _payosInfo == null) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 48),
        child: Center(
          child: Column(
            children: [
              CircularProgressIndicator(color: c.primary),
              const SizedBox(height: 16),
              Text('Đang tạo mã QR thanh toán...', style: TextStyle(color: c.onSurfaceMuted)),
            ],
          ),
        ),
      );
    }

    if (_error != null && _payosInfo == null) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.redAccent.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.redAccent.withValues(alpha: 0.35)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Không tạo được mã QR',
                style: TextStyle(fontWeight: FontWeight.w700, color: Colors.redAccent)),
            const SizedBox(height: 6),
            Text(_error!, style: TextStyle(fontSize: 12, color: c.onSurface, height: 1.4)),
            const SizedBox(height: 12),
            ShadButton(
              width: double.infinity,
              onPressed: _createQrPayment,
              child: const Text('Thử lại'),
            ),
          ],
        ),
      );
    }

    final info = _payosInfo;
    if (info == null) {
      return ShadButton(
        width: double.infinity,
        size: ShadButtonSize.lg,
        onPressed: _createQrPayment,
        leading: const Icon(Icons.qr_code_2, size: 18),
        child: const Text('Tạo mã QR thanh toán'),
      );
    }

    return Column(
      children: [
        if (info.paymentCode.isNotEmpty)
          Text('Mã thanh toán: ${info.paymentCode}',
              style: TextStyle(fontSize: 13, color: c.onSurfaceMuted)),
        const SizedBox(height: 16),
        _qrWidget(info, c),
        const SizedBox(height: 12),
        Text('Quét mã bằng app ngân hàng để chuyển ${_money(widget.fee)}',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 13, color: c.onSurface, fontWeight: FontWeight.w600)),
        if (info.bankAccountNumber != null) ...[
          const SizedBox(height: 10),
          Text('STK: ${info.bankAccountNumber}',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: c.onSurface)),
        ],
        if (info.bankAccountName != null)
          Text(info.bankAccountName!, style: TextStyle(fontSize: 12, color: c.onSurfaceMuted)),
        if (info.checkoutUrl != null && info.checkoutUrl!.isNotEmpty) ...[
          const SizedBox(height: 8),
          TextButton.icon(
            onPressed: () {
              Clipboard.setData(ClipboardData(text: info.checkoutUrl!));
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Đã sao chép link thanh toán')),
              );
            },
            icon: Icon(Icons.link, size: 18, color: c.primary),
            label: Text('Sao chép link thanh toán',
                style: TextStyle(color: c.primary, fontWeight: FontWeight.w600)),
          ),
        ],
        const SizedBox(height: 16),
        if (_paymentCompleted)
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.check_circle, color: c.success, size: 20),
              const SizedBox(width: 8),
              Text('Thanh toán đã xác nhận',
                  style: TextStyle(color: c.success, fontWeight: FontWeight.w700)),
            ],
          )
        else if (_polling)
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(strokeWidth: 2, color: c.primary),
              ),
              const SizedBox(width: 8),
              Text('Đang chờ xác nhận thanh toán...',
                  style: TextStyle(fontSize: 12, color: c.onSurfaceMuted)),
            ],
          ),
        const SizedBox(height: 16),
        ShadButton(
          width: double.infinity,
          size: ShadButtonSize.lg,
          enabled: !_busy,
          onPressed: _paymentCompleted
              ? () => context.pop(true)
              : (_busy ? null : _recheckPayment),
          child: Text(_paymentCompleted ? 'Hoàn tất — đăng tin' : 'Tôi đã thanh toán'),
        ),
      ],
    );
  }

  Widget _qrWidget(DepositPaymentInfo info, UniMoveColors c) {
    final qr = info.qrCode;
    if (qr == null || qr.isEmpty) {
      return Container(
        width: 260,
        height: 260,
        alignment: Alignment.center,
        decoration: BoxDecoration(color: c.chipBg, borderRadius: BorderRadius.circular(16)),
        child: Text('Không có dữ liệu QR', style: TextStyle(color: c.onSurfaceMuted)),
      );
    }
    if (qr.startsWith('data:image') || qr.startsWith('http')) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: CachedNetworkImage(
          imageUrl: qr,
          width: 260,
          height: 260,
          fit: BoxFit.contain,
          errorWidget: (_, __, ___) => _vietQr(qr, 260),
        ),
      );
    }
    return _vietQr(qr, 260);
  }

  Widget _vietQr(String data, double size) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 8)],
      ),
      child: QrImageView(data: data, size: size - 24, backgroundColor: Colors.white),
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    return Scaffold(
      backgroundColor: c.background,
      appBar: AppBar(
        backgroundColor: c.background,
        surfaceTintColor: Colors.transparent,
        iconTheme: IconThemeData(color: c.onSurface),
        title: Text('Thanh toán phí đăng tin',
            style: TextStyle(color: c.onSurface, fontWeight: FontWeight.w800)),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
        children: [
          Text('Tin sẽ hiển thị công khai sau khi thanh toán thành công.',
              style: TextStyle(fontSize: 13, color: c.onSurfaceMuted, height: 1.35)),
          const SizedBox(height: 16),
          _feeRow(c, 'Phí đăng tin', _money(widget.fee)),
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(Icons.qr_code_2, size: 14, color: c.onSurfaceMuted),
              const SizedBox(width: 6),
              Text('Thanh toán qua QR PayOS', style: TextStyle(fontSize: 12, color: c.onSurfaceMuted)),
            ],
          ),
          const SizedBox(height: 24),
          _qrSection(c),
          const SizedBox(height: 16),
          Center(
            child: TextButton(
              onPressed: _busy ? null : () => context.pop(false),
              child: const Text('Thanh toán sau'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _feeRow(UniMoveColors c, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Text(label, style: TextStyle(color: c.onSurfaceMuted, fontSize: 14)),
          const Spacer(),
          Text(value, style: TextStyle(color: c.onSurface, fontWeight: FontWeight.w700, fontSize: 15)),
        ],
      ),
    );
  }
}
