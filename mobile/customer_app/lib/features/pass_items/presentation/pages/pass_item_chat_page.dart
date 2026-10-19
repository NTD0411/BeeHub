import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/theme/uni_move_colors.dart';
import '../../../booking/presentation/cubit/booking_flow_cubit.dart';
import '../../data/pass_item_repository.dart';
import '../../domain/pass_extras.dart';
import '../../domain/pass_item.dart';
import '../pass_item_format.dart';
import '../widgets/pass_item_image.dart';
import '../widgets/pass_interested_buyer_tile.dart';

class PassItemChatPage extends StatefulWidget {
  const PassItemChatPage({super.key, required this.id, this.buyerId});

  final String id;

  /// Người bán chọn khách để chat; null = danh sách khách quan tâm.
  final String? buyerId;

  @override
  State<PassItemChatPage> createState() => _PassItemChatPageState();
}

class _PassItemChatPageState extends State<PassItemChatPage> {
  final _repo = PassItemRepository();
  final _inputCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();

  PassItemPost? _post;
  PassInterestedBuyer? _activeBuyer;
  List<PassInterestedBuyer> _interested = const [];
  List<PassChatMessage> _messages = const [];
  bool _loading = true;
  String? _myUserId;

  bool get _isSellerInbox => _post?.isMine == true && widget.buyerId == null;

  String? get _threadBuyerId => _post?.isMine == true ? widget.buyerId : _myUserId;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _inputCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final myUserId = await _repo.currentUserId();
    final post = await _repo.byId(widget.id);
    if (!mounted) return;
    if (post == null) {
      setState(() {
        _post = null;
        _loading = false;
      });
      return;
    }

    if (post.isMine && widget.buyerId == null) {
      final interested = await _repo.interestedBuyers(widget.id);
      if (!mounted) return;
      setState(() {
        _post = post;
        _myUserId = myUserId;
        _interested = interested;
        _loading = false;
      });
      return;
    }

    final buyerId = post.isMine ? widget.buyerId! : myUserId;
    if (buyerId == null) {
      if (!mounted) return;
      setState(() {
        _post = post;
        _myUserId = myUserId;
        _loading = false;
      });
      return;
    }
    final interested = post.isMine ? await _repo.interestedBuyers(widget.id) : <PassInterestedBuyer>[];
    PassInterestedBuyer? buyer;
    if (post.isMine) {
      for (final b in interested) {
        if (b.id == buyerId) {
          buyer = b;
          break;
        }
      }
    }
    final msgs = await _repo.messages(widget.id, buyerId, markRead: post.isMine);
    if (!mounted) return;
    setState(() {
      _post = post;
      _myUserId = myUserId;
      _activeBuyer = buyer;
      _messages = msgs;
      _loading = false;
    });
    _scrollToEnd();
  }

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent + 120,
          duration: const Duration(milliseconds: 280),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _send({String? text, int? offer}) {
    final post = _post;
    final buyerId = _threadBuyerId;
    if (post == null || buyerId == null) return;

    final value = text?.trim() ?? '';
    if (offer == null && value.isEmpty) return;
    final msg = offer != null
        ? PassChatMessage(
            text: 'Mình đề nghị giá ${_money(offer)}',
            fromBuyer: true,
            time: _nowLabel(),
            isOffer: true,
            offerAmount: offer,
          )
        : PassChatMessage(text: value, fromBuyer: true, time: _nowLabel());
    _repo.sendMessage(widget.id, buyerId, msg, sentBySeller: post.isMine);
    _inputCtrl.clear();
    _refreshMessages();
  }

  Future<void> _refreshMessages() async {
    final post = await _repo.byId(widget.id);
    final buyerId = _threadBuyerId;
    if (post == null || buyerId == null) return;
    final msgs = await _repo.messages(widget.id, buyerId, markRead: post.isMine);
    if (!mounted) return;
    setState(() {
      _post = post;
      _messages = msgs;
    });
    _scrollToEnd();
  }

  bool _messageIsMine(PassChatMessage m, PassItemPost post) =>
      post.isMine ? !m.fromBuyer : m.fromBuyer;

  Future<void> _openConfirmDealSheet() async {
    final post = _post;
    if (post == null || !post.isMine || post.dealConfirmed) return;

    final ctrl = TextEditingController(
      text: post.isFree ? '' : post.price.toString(),
    );
    final c = UniMoveColors.of(context);
    final agreed = await showModalBottomSheet<int?>(
      context: context,
      isScrollControlled: true,
      backgroundColor: c.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(20, 18, 20, MediaQuery.of(ctx).viewInsets.bottom + 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Chốt đơn', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: c.onSurface)),
            const SizedBox(height: 6),
            Text(
              'Xác nhận thỏa thuận với khách. Sau khi chốt, khách mới được đặt xe lấy đồ.',
              style: TextStyle(fontSize: 12, color: c.onSurfaceMuted, height: 1.35),
            ),
            if (!post.isFree) ...[
              const SizedBox(height: 12),
              ShadInput(
                controller: ctrl,
                placeholder: const Text('Giá đã thỏa (đ) — để trống = giá đăng tin'),
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                leading: Icon(LucideIcons.banknote, size: 18, color: c.primary),
              ),
            ],
            const SizedBox(height: 14),
            ShadButton(
              width: double.infinity,
              size: ShadButtonSize.lg,
              onPressed: () {
                final raw = ctrl.text.trim();
                final v = raw.isEmpty ? null : int.tryParse(raw);
                if (raw.isNotEmpty && (v == null || v <= 0)) return;
                Navigator.pop(ctx, v ?? -1);
              },
              leading: const Icon(LucideIcons.circleCheck, size: 18),
              child: const Text('Chốt đơn — cho phép đặt xe'),
            ),
          ],
        ),
      ),
    );
    ctrl.dispose();
    if (agreed == null || !mounted) return;

    final price = agreed == -1 ? null : agreed;
    final ok = await _repo.confirmDeal(widget.id, agreedPrice: price, buyerId: widget.buyerId);
    if (!mounted) return;
    if (ok) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Đã chốt đơn — khách có thể đặt xe lấy đồ')),
      );
      await _refreshMessages();
    }
  }

  Future<void> _openOfferSheet() async {
    final ctrl = TextEditingController(
      text: _post != null && !_post!.isFree ? _post!.price.toString() : '',
    );
    final c = UniMoveColors.of(context);
    final amount = await showModalBottomSheet<int>(
      context: context,
      isScrollControlled: true,
      backgroundColor: c.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(20, 18, 20, MediaQuery.of(ctx).viewInsets.bottom + 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Đề nghị giá', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: c.onSurface)),
            const SizedBox(height: 12),
            ShadInput(
              controller: ctrl,
              placeholder: const Text('Nhập mức giá bạn muốn (đ)'),
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              leading: Icon(LucideIcons.banknote, size: 18, color: c.primary),
            ),
            const SizedBox(height: 14),
            ShadButton(
              width: double.infinity,
              size: ShadButtonSize.lg,
              onPressed: () {
                final v = int.tryParse(ctrl.text.trim()) ?? 0;
                if (v > 0) Navigator.pop(ctx, v);
              },
              child: const Text('Gửi đề nghị'),
            ),
          ],
        ),
      ),
    );
    if (amount != null) _send(offer: amount);
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);
    final post = _post;

    if (_isSellerInbox) {
      return Scaffold(
        backgroundColor: c.background,
        appBar: AppBar(
          backgroundColor: c.surface,
          surfaceTintColor: Colors.transparent,
          elevation: 0,
          title: Text('Khách quan tâm (${_interested.length})',
              style: TextStyle(color: c.onSurface, fontWeight: FontWeight.w700)),
        ),
        body: _loading
            ? const Center(child: CircularProgressIndicator())
            : _interested.isEmpty
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Text(
                        'Chưa có ai quan tâm.\nKhách bấm "Tôi muốn nhận" sẽ hiện ở đây.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: c.onSurfaceMuted, height: 1.4),
                      ),
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: _load,
                    child: ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                      itemCount: _interested.length + 1,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (_, i) {
                        if (i == 0) {
                          return Text(
                            'Chọn khách để chat, thỏa giá và chốt đơn.',
                            style: TextStyle(fontSize: 13, color: c.onSurfaceMuted, height: 1.35),
                          );
                        }
                        final buyer = _interested[i - 1];
                        return PassInterestedBuyerTile(
                          buyer: buyer,
                          onTap: () async {
                            await context.push('/pass-items/${widget.id}/chat?buyer=${buyer.id}');
                            _load();
                          },
                        );
                      },
                    ),
                  ),
      );
    }

    final chatTitle = post?.isMine == true
        ? (_activeBuyer?.name ?? 'Khách')
        : (post?.posterName ?? 'Người đăng');
    final chatInitial = chatTitle.substring(0, 1).toUpperCase();

    return Scaffold(
      backgroundColor: c.background,
      appBar: AppBar(
        backgroundColor: c.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        iconTheme: IconThemeData(color: c.onSurface),
        titleSpacing: 0,
        title: Row(
          children: [
            CircleAvatar(
              radius: 18,
              backgroundColor: c.iconBgSecondary,
              child: Text(chatInitial, style: TextStyle(color: c.primary, fontWeight: FontWeight.w800)),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(chatTitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(color: c.onSurface, fontWeight: FontWeight.w700, fontSize: 15)),
                  if (post?.isMine == true && _activeBuyer != null)
                    Text(
                      '${_activeBuyer!.contact} · ${_activeBuyer!.area}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(color: c.onSurfaceMuted, fontSize: 11),
                    )
                  else
                    Text(_chatSubtitle(post), style: TextStyle(color: c.onSurfaceMuted, fontSize: 11)),
                ],
              ),
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          if (post != null) ...[
            _itemBanner(c, post),
            _logisticsBanner(c, post),
          ],
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
                    controller: _scrollCtrl,
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                    itemCount: _messages.length,
                    itemBuilder: (_, i) => _bubble(c, _messages[i], post),
                  ),
          ),
          if (post != null && post.isMine) _sellerDealBar(c, post),
          _quickOffers(c, post),
          _composer(c, post),
        ],
      ),
    );
  }

  Future<void> _startDelivery(PassItemPost post) async {
    if (!post.dealConfirmed) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Chờ người bán chốt đơn trong chat trước khi đặt xe')),
      );
      return;
    }
    await context.read<BookingFlowCubit>().preparePassItemDelivery(
          pickup: post.area,
          passItemId: post.id,
        );
    if (!mounted) return;
    context.push('/booking/pass-item/transport');
  }

  Future<void> _cancelDealConfirmation() async {
    final post = _post;
    if (post == null || !post.sellerCanCancelDeal) {
      if (post?.buyerTransportBooked == true && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Khách đã đặt xe — không thể huỷ chốt đơn')),
        );
      }
      return;
    }

    final c = UniMoveColors.of(context);
    final yes = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: c.surface,
        title: Text('Huỷ chốt đơn?', style: TextStyle(color: c.onSurface, fontWeight: FontWeight.w800)),
        content: Text(
          'Khách sẽ không đặt được xe cho đến khi bạn chốt đơn lại. Chỉ huỷ được khi khách chưa đặt xe.',
          style: TextStyle(color: c.onSurfaceMuted, height: 1.4),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Không')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text('Huỷ chốt', style: TextStyle(color: c.accentGreen)),
          ),
        ],
      ),
    );
    if (yes != true || !mounted) return;

    final ok = await _repo.cancelDealConfirmation(widget.id);
    if (!mounted) return;
    if (ok) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Đã huỷ chốt đơn')),
      );
      await _refreshMessages();
    }
  }

  String _chatSubtitle(PassItemPost? post) {
    if (post == null) return 'Thường phản hồi trong vài phút';
    if (post.isMine) {
      if (post.buyerTransportBooked) return 'Khách đã đặt xe — không huỷ chốt';
      if (post.dealConfirmed) return 'Đã chốt — có thể huỷ nếu khách chưa đặt xe';
      return 'Chốt đơn sau khi thỏa giá';
    }
    if (post.buyerTransportBooked) return 'Bạn đã đặt xe lấy đồ';
    if (post.dealConfirmed) return 'Đã chốt — có thể đặt xe';
    return 'Chờ người bán chốt đơn';
  }

  Widget _logisticsBanner(UniMoveColors c, PassItemPost post) {
    if (post.isMine) {
      if (post.buyerTransportBooked) {
        return Container(
          margin: const EdgeInsets.fromLTRB(12, 8, 12, 0),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: c.primaryContainer,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: c.primary.withValues(alpha: 0.25)),
          ),
          child: Row(
            children: [
              Icon(LucideIcons.lock, size: 16, color: c.primary),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Khách đã đặt xe — bạn không thể huỷ chốt đơn.',
                  style: TextStyle(fontSize: 11, color: c.onSurface, height: 1.35),
                ),
              ),
            ],
          ),
        );
      }
      if (post.dealConfirmed) {
        return Container(
          margin: const EdgeInsets.fromLTRB(12, 8, 12, 0),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: c.success.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: c.success.withValues(alpha: 0.35)),
          ),
          child: Row(
            children: [
              Icon(LucideIcons.circleCheck, size: 16, color: c.success),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Đã chốt đơn — khách có thể đặt xe tại ${post.area}. Huỷ chốt nếu đổi ý (trước khi khách đặt xe).',
                  style: TextStyle(fontSize: 11, color: c.onSurface, height: 1.35),
                ),
              ),
            ],
          ),
        );
      }
      return const SizedBox.shrink();
    }

    if (!post.dealConfirmed) {
      return Container(
        margin: const EdgeInsets.fromLTRB(12, 8, 12, 0),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: c.surfaceTint,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: c.border),
        ),
        child: Row(
          children: [
            Icon(LucideIcons.lock, size: 16, color: c.onSurfaceMuted),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'Chờ người bán chốt đơn trong chat — sau đó bạn mới đặt được xe.',
                style: TextStyle(fontSize: 11, color: c.onSurfaceMuted, height: 1.35),
              ),
            ),
          ],
        ),
      );
    }

    if (post.buyerTransportBooked) {
      return Container(
        margin: const EdgeInsets.fromLTRB(12, 8, 12, 0),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: c.primaryContainer,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: c.primary.withValues(alpha: 0.2)),
        ),
        child: Row(
          children: [
            Icon(LucideIcons.truck, size: 16, color: c.primary),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'Bạn đã tiếp tục đặt xe — người bán không thể huỷ chốt đơn.',
                style: TextStyle(fontSize: 11, color: c.onSurface, height: 1.35),
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      margin: const EdgeInsets.fromLTRB(12, 8, 12, 0),
      padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
      decoration: BoxDecoration(
        color: c.primaryContainer,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: c.primary.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Đã chốt đơn — đặt xe lấy đồ',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: c.onSurface)),
                Text('Lấy tại ${post.area} → giao về nhà bạn',
                    style: TextStyle(fontSize: 11, color: c.onSurfaceMuted)),
              ],
            ),
          ),
          const SizedBox(width: 8),
          ShadButton(
            size: ShadButtonSize.sm,
            onPressed: () => _startDelivery(post),
            leading: const Icon(LucideIcons.truck, size: 14),
            child: const Text('Đặt xe'),
          ),
        ],
      ),
    );
  }

  Widget _sellerDealBar(UniMoveColors c, PassItemPost post) {
    if (post.buyerTransportBooked) return const SizedBox.shrink();

    if (post.dealConfirmed) {
      return Padding(
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
        child: ShadButton.outline(
          width: double.infinity,
          size: ShadButtonSize.lg,
          onPressed: _cancelDealConfirmation,
          leading: Icon(LucideIcons.undo2, size: 18, color: c.accentGreen),
          child: Text('Huỷ chốt đơn', style: TextStyle(color: c.accentGreen)),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
      child: ShadButton(
        width: double.infinity,
        size: ShadButtonSize.lg,
        onPressed: _openConfirmDealSheet,
        leading: const Icon(LucideIcons.circleCheck, size: 18),
        child: const Text('Chốt đơn — cho phép khách đặt xe'),
      ),
    );
  }

  Widget _itemBanner(UniMoveColors c, PassItemPost post) {
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 10, 12, 0),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: c.border),
      ),
      child: Row(
        children: [
          PassItemImage(
            imageUrl: post.imageUrl,
            width: 46,
            height: 46,
            borderRadius: BorderRadius.circular(10),
            errorPlaceholder: Container(width: 46, height: 46, color: c.surfaceTint),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(post.title, maxLines: 1, overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontWeight: FontWeight.w700, color: c.onSurface)),
                Text(passItemPriceLabel(post),
                    style: TextStyle(fontWeight: FontWeight.w800, color: post.isFree ? c.success : c.primary)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _bubble(UniMoveColors c, PassChatMessage m, PassItemPost? post) {
    if (m.isDealCancel) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Center(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            constraints: const BoxConstraints(maxWidth: 300),
            decoration: BoxDecoration(
              color: c.accentGreen.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: c.accentGreen.withValues(alpha: 0.35)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(LucideIcons.undo2, size: 16, color: c.accentGreen),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    m.text,
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 12, color: c.onSurface, height: 1.35, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (m.isDealConfirm) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Center(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            constraints: const BoxConstraints(maxWidth: 300),
            decoration: BoxDecoration(
              color: c.success.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: c.success.withValues(alpha: 0.35)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(LucideIcons.circleCheck, size: 16, color: c.success),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    m.text,
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 12, color: c.onSurface, height: 1.35, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final mine = post != null ? _messageIsMine(m, post) : m.fromBuyer;
    final bubble = Container(
      margin: const EdgeInsets.symmetric(vertical: 4),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      constraints: const BoxConstraints(maxWidth: 280),
      decoration: BoxDecoration(
        color: m.isOffer
            ? (mine ? c.primary : c.chipBg)
            : (mine ? c.primary : c.surface),
        borderRadius: BorderRadius.only(
          topLeft: const Radius.circular(16),
          topRight: const Radius.circular(16),
          bottomLeft: Radius.circular(mine ? 16 : 4),
          bottomRight: Radius.circular(mine ? 4 : 16),
        ),
        border: mine ? null : Border.all(color: c.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (m.isOffer)
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(LucideIcons.tag, size: 13, color: mine ? Colors.white : c.primary),
                const SizedBox(width: 4),
                Text('Đề nghị giá',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: mine ? Colors.white70 : c.primary)),
              ],
            ),
          Text(m.text,
              style: TextStyle(color: mine ? Colors.white : c.onSurface, height: 1.3, fontSize: 14)),
          const SizedBox(height: 2),
          Text(m.time,
              style: TextStyle(fontSize: 10, color: mine ? Colors.white70 : c.onSurfaceMuted)),
        ],
      ),
    );

    return Align(
      alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
      child: bubble,
    ).animate().fadeIn(duration: 220.ms).slideY(begin: 0.18, end: 0, curve: Curves.easeOut);
  }

  Widget _quickOffers(UniMoveColors c, PassItemPost? post) {
    final isSeller = post?.isMine ?? false;
    final chips = isSeller
        ? ['OK giá đó', 'Bạn đến lấy nhé', 'Còn hàng']
        : ['Còn không bạn?', 'Bớt chút nhé', 'Khi nào lấy được?'];
    return SizedBox(
      height: 42,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        children: [
          if (!isSeller) ...[
            _quickChip(c, LucideIcons.banknote, 'Đề nghị giá', _openOfferSheet),
            if (post?.dealConfirmed == true)
              _quickChip(c, LucideIcons.truck, 'Đặt xe lấy đồ', () {
                if (post != null) _startDelivery(post);
              }),
          ],
          for (final t in chips) _quickChip(c, null, t, () => _send(text: t)),
        ],
      ),
    );
  }

  Widget _quickChip(UniMoveColors c, IconData? icon, String label, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.only(right: 8, top: 4, bottom: 4),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: c.surface,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: c.border),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[Icon(icon, size: 14, color: c.primary), const SizedBox(width: 5)],
              Text(label, style: TextStyle(fontSize: 12, color: c.onSurface, fontWeight: FontWeight.w600)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _composer(UniMoveColors c, PassItemPost? post) {
    if (post == null || _threadBuyerId == null) return const SizedBox.shrink();
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
        decoration: BoxDecoration(
          color: c.surface,
          border: Border(top: BorderSide(color: c.border)),
        ),
        child: Row(
          children: [
            Expanded(
              child: ShadInput(
                controller: _inputCtrl,
                placeholder: const Text('Nhắn tin thương lượng...'),
                onSubmitted: (v) => _send(text: v),
              ),
            ),
            const SizedBox(width: 8),
            ShadButton(
              size: ShadButtonSize.lg,
              onPressed: () => _send(text: _inputCtrl.text),
              child: const Icon(LucideIcons.send, size: 18),
            ),
          ],
        ),
      ),
    );
  }

  String _nowLabel() {
    final n = DateTime.now();
    return '${n.hour.toString().padLeft(2, '0')}:${n.minute.toString().padLeft(2, '0')}';
  }

  String _money(int amount) {
    final s = amount.toString();
    final buf = StringBuffer();
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buf.write('.');
      buf.write(s[i]);
    }
    return '$buf' 'đ';
  }
}
