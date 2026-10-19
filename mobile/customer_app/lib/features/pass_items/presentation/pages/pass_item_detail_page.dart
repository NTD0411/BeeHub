import 'package:flutter/material.dart';
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
import 'pass_item_seller_page.dart';

class PassItemDetailPage extends StatefulWidget {
  const PassItemDetailPage({super.key, required this.id});

  final String id;

  @override
  State<PassItemDetailPage> createState() => _PassItemDetailPageState();
}

class _PassItemDetailPageState extends State<PassItemDetailPage> {
  final _repo = PassItemRepository();
  PassItemPost? _post;
  List<PassInterestedBuyer> _interestedBuyers = const [];
  bool _loading = true;
  bool _interested = false;
  final _pageController = PageController();
  int _currentPage = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final post = await _repo.byId(widget.id);
    var buyers = const <PassInterestedBuyer>[];
    if (post?.isMine == true) {
      buyers = await _repo.interestedBuyers(widget.id);
    }
    if (!mounted) return;
    setState(() {
      _post = post;
      _interestedBuyers = buyers;
      _interested = post?.isInterested ?? false;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    if (_loading) {
      return Scaffold(
        backgroundColor: c.background,
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    final post = _post;
    if (post == null) {
      return Scaffold(
        backgroundColor: c.background,
        appBar: AppBar(backgroundColor: c.background, elevation: 0),
        body: Center(child: Text('Không tìm thấy tin', style: TextStyle(color: c.onSurface))),
      );
    }

    return Scaffold(
      backgroundColor: c.background,
      body: Stack(
        children: [
          ListView(
            padding: EdgeInsets.zero,
            children: [
              _imageCarousel(c, post),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          post.title,
                          style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: c.onSurface),
                        ),
                      ),
                      _statusBadge(c, post.status),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      Text(
                        passItemPriceLabel(post),
                        style: TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.w800,
                          color: post.isFree ? c.success : c.primary,
                        ),
                      ),
                      if (post.isNegotiable)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(color: c.chipBg, borderRadius: BorderRadius.circular(999)),
                          child: Text('Có thể thương lượng',
                              style: TextStyle(fontSize: 12, color: c.primary, fontWeight: FontWeight.w600)),
                        ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text('Đăng ${passItemTimeAgo(post.createdAt)} · ${post.interestedCount} người quan tâm',
                      style: TextStyle(fontSize: 12, color: c.onSurfaceMuted)),
                  const SizedBox(height: 18),
                  _infoGrid(c, post),
                  const SizedBox(height: 18),
                  Text('Mô tả', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: c.onSurface)),
                  const SizedBox(height: 6),
                  Text(post.description, style: TextStyle(fontSize: 14, height: 1.5, color: c.onSurface)),
                  const SizedBox(height: 18),
                  if (post.isMine) ...[
                    _ownerTipsCard(c, post),
                    const SizedBox(height: 14),
                    _interestedBuyersSection(c, post),
                    const SizedBox(height: 14),
                    _sellerLogisticsInfoCard(c, post),
                  ] else ...[
                    _buyerFlowSteps(c, post),
                    const SizedBox(height: 14),
                    if (post.dealConfirmed)
                      _buyerTransportCard(c, post)
                    else
                      _buyerAwaitDealCard(c),
                    if (post.buyerTransportBooked && post.status == PassItemStatus.reserved) ...[
                      const SizedBox(height: 12),
                      _confirmReceivedCard(c, post),
                    ],
                    if (post.status == PassItemStatus.completed && !post.isRated) ...[
                      const SizedBox(height: 12),
                      _ratingCard(c, post),
                    ],
                    if (post.status == PassItemStatus.completed && post.isRated) ...[
                      const SizedBox(height: 12),
                      _ratedDoneCard(c),
                    ],
                    const SizedBox(height: 18),
                    _sellerCard(c, post),
                  ],
                ],
              ),
            ),
          ],
        ),
          // Nút back floating phía trên ảnh
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.only(left: 8, top: 4),
              child: Material(
                color: Colors.black45,
                shape: const CircleBorder(),
                child: InkWell(
                  customBorder: const CircleBorder(),
                  onTap: () => context.pop(),
                  child: const Padding(
                    padding: EdgeInsets.all(8),
                    child: Icon(Icons.arrow_back, color: Colors.white, size: 22),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: post.isMine ? _sellerManageBar(c, post) : _buyerBottomBar(c, post),
    );
  }

  Widget _imageCarousel(UniMoveColors c, PassItemPost post) {
    final imgs = post.images.isNotEmpty
        ? post.images
        : (post.imageUrl.isNotEmpty ? [post.imageUrl] : <String>[]);

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // ── Ảnh chính ─────────────────────────────────────────────────────────
        AspectRatio(
          aspectRatio: 1,
          child: Stack(
            fit: StackFit.expand,
            children: [
              // nền tối khớp dark theme
              Container(color: c.surface),
              if (imgs.isEmpty)
                Center(child: Icon(Icons.inventory_2_outlined, size: 60, color: c.onSurfaceMuted))
              else
                PageView.builder(
                  controller: _pageController,
                  itemCount: imgs.length,
                  onPageChanged: (i) => setState(() => _currentPage = i),
                  itemBuilder: (_, i) => GestureDetector(
                    onTap: () => _openFullScreen(context, imgs, i),
                    child: PassItemImage(
                      imageUrl: imgs[i],
                      fit: BoxFit.contain,
                      errorPlaceholder: Center(
                        child: Icon(Icons.inventory_2_outlined, size: 60, color: c.onSurfaceMuted),
                      ),
                    ),
                  ),
                ),
              // counter "1/n" góc dưới phải
              if (imgs.length > 1)
                Positioned(
                  bottom: 10, right: 10,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.black54,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${_currentPage + 1}/${imgs.length}',
                      style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
            ],
          ),
        ),
        // ── Thumbnail strip ────────────────────────────────────────────────────
        if (imgs.length > 1)
          Container(
            color: c.surface,
            height: 74,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              itemCount: imgs.length,
              itemBuilder: (_, i) => GestureDetector(
                onTap: () {
                  _pageController.animateToPage(
                    i,
                    duration: const Duration(milliseconds: 200),
                    curve: Curves.easeOut,
                  );
                  setState(() => _currentPage = i);
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  width: 52,
                  height: 52,
                  margin: const EdgeInsets.only(right: 8),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: _currentPage == i ? c.primary : c.border,
                      width: _currentPage == i ? 2.5 : 1,
                    ),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: PassItemImage(imageUrl: imgs[i], fit: BoxFit.cover),
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }

  void _openFullScreen(BuildContext context, List<String> imgs, int initialIndex) {
    Navigator.of(context).push(PageRouteBuilder(
      opaque: false,
      barrierColor: Colors.black,
      barrierDismissible: true,
      pageBuilder: (ctx, _, __) => _FullScreenImageViewer(
        images: imgs,
        initialIndex: initialIndex,
      ),
    ));
  }

  Widget _infoGrid(UniMoveColors c, PassItemPost post) {
    final items = [
      (Icons.fact_check_outlined, 'Tình trạng', post.condition.label),
      (Icons.category_outlined, 'Danh mục', post.category),
      (Icons.timelapse_outlined, 'Đã dùng', post.usageDuration),
      (Icons.place_outlined, 'Khu vực', post.area),
    ];
    return Container(
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: c.border),
      ),
      child: Column(
        children: [
          for (var i = 0; i < items.length; i++) ...[
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              child: Row(
                children: [
                  Icon(items[i].$1, size: 18, color: c.primary),
                  const SizedBox(width: 12),
                  Text(items[i].$2, style: TextStyle(color: c.onSurfaceMuted, fontSize: 13)),
                  const Spacer(),
                  Flexible(
                    child: Text(
                      items[i].$3,
                      textAlign: TextAlign.right,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(color: c.onSurface, fontWeight: FontWeight.w600, fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
            if (i != items.length - 1) Divider(height: 1, color: c.border),
          ],
        ],
      ),
    );
  }

  Widget _buyerFlowSteps(UniMoveColors c, PassItemPost post) {
    final steps = [
      (Icons.chat_bubble_outline, 'Chat thỏa giá đồ'),
      (Icons.handshake_outlined, 'Người bán chốt đơn trong chat'),
      (Icons.local_shipping_outlined, 'Bạn đặt xe lấy hàng'),
      (Icons.inventory_2_outlined, 'Nhận đồ tại nhà'),
    ];
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: c.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Quy trình nhận đồ', style: TextStyle(fontWeight: FontWeight.w700, color: c.onSurface)),
          const SizedBox(height: 10),
          for (var i = 0; i < steps.length; i++) ...[
            Row(
              children: [
                CircleAvatar(
                  radius: 12,
                  backgroundColor: (post.dealConfirmed && i >= 2) || (i == 1 && post.dealConfirmed)
                      ? c.success
                      : (i == 1 && !post.dealConfirmed ? c.onSurfaceMuted : c.primary),
                  child: Text('${i + 1}', style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800)),
                ),
                const SizedBox(width: 10),
                Icon(steps[i].$1, size: 16, color: c.primaryLight),
                const SizedBox(width: 8),
                Expanded(child: Text(steps[i].$2, style: TextStyle(fontSize: 13, color: c.onSurface))),
              ],
            ),
            if (i < steps.length - 1) const SizedBox(height: 8),
          ],
        ],
      ),
    );
  }

  Widget _buyerTransportCard(UniMoveColors c, PassItemPost post) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [c.primaryContainer, c.surfaceTint],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: c.primary.withValues(alpha: 0.2)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(color: c.surface, borderRadius: BorderRadius.circular(12)),
            child: Icon(Icons.local_shipping_outlined, color: c.primary),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(LucideIcons.circleCheck, size: 14, color: c.success),
                    const SizedBox(width: 6),
                    Text('Đã chốt đơn — sẵn sàng đặt xe',
                        style: TextStyle(fontWeight: FontWeight.w800, color: c.onSurface, fontSize: 14)),
                  ],
                ),
                const SizedBox(height: 4),
                Text('Lấy tại: ${post.area}',
                    style: TextStyle(fontSize: 12, color: c.onSurfaceMuted, height: 1.35)),
                const SizedBox(height: 2),
                Text('Nhập địa chỉ nhận → xem km → chọn combo hoặc chuyến thường.',
                    style: TextStyle(fontSize: 11, color: c.onSurfaceMuted, height: 1.35)),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 260.ms).slideY(begin: 0.12, end: 0, curve: Curves.easeOut);
  }

  Widget _buyerAwaitDealCard(UniMoveColors c) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: c.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Icon(LucideIcons.lock, size: 20, color: c.onSurfaceMuted),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Chưa thể đặt xe',
                  style: TextStyle(fontWeight: FontWeight.w800, color: c.onSurface, fontSize: 15),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Nhắn tin thương lượng giá. Sau khi người bán bấm Chốt đơn trong chat, nút đặt chuyển đồ sẽ được mở cho bạn.',
            style: TextStyle(fontSize: 12, color: c.onSurfaceMuted, height: 1.4),
          ),
          const SizedBox(height: 12),
          ShadButton.outline(
            width: double.infinity,
            onPressed: () async {
              await context.push('/pass-items/${widget.id}/chat');
              _load();
            },
            leading: const Icon(LucideIcons.messageCircle, size: 18),
            child: const Text('Vào chat thương lượng'),
          ),
        ],
      ),
    );
  }

  Widget _sellerLogisticsInfoCard(UniMoveColors c, PassItemPost post) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: c.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(LucideIcons.info, size: 20, color: c.primaryLight),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Vận chuyển do khách đặt',
                        style: TextStyle(fontWeight: FontWeight.w700, color: c.onSurface)),
                    const SizedBox(height: 4),
                    Text(
                      post.buyerTransportBooked
                          ? 'Khách đã đặt xe — không thể huỷ chốt đơn.'
                          : post.dealConfirmed
                              ? 'Đã chốt đơn — khách có thể đặt xe tại ${post.area}. Có thể huỷ chốt nếu đổi ý.'
                              : 'Thỏa giá trong chat rồi bấm Chốt đơn để khách được đặt xe lấy đồ tại ${post.area}.',
                      style: TextStyle(fontSize: 12, color: c.onSurfaceMuted, height: 1.4),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (post.sellerCanCancelDeal) ...[
            const SizedBox(height: 12),
            ShadButton.outline(
              width: double.infinity,
              onPressed: () => _cancelDealConfirmation(post),
              leading: Icon(LucideIcons.undo2, size: 18, color: c.accentGreen),
              child: Text('Huỷ chốt đơn', style: TextStyle(color: c.accentGreen)),
            ),
          ],
        ],
      ),
    );
  }

  Widget _interestedBuyersSection(UniMoveColors c, PassItemPost post) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Text('Người quan tâm',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: c.onSurface)),
            const Spacer(),
            TextButton(
              onPressed: () async {
                await context.push('/pass-items/${post.id}/chat');
                _load();
              },
              child: Text('Xem tất cả', style: TextStyle(color: c.primary, fontWeight: FontWeight.w600)),
            ),
          ],
        ),
        const SizedBox(height: 8),
        if (_interestedBuyers.isEmpty)
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: c.surface,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: c.border),
            ),
            child: Text(
              'Chưa có khách quan tâm. Họ sẽ hiện ở đây sau khi bấm "Tôi muốn nhận".',
              style: TextStyle(fontSize: 12, color: c.onSurfaceMuted, height: 1.4),
            ),
          )
        else
          ..._interestedBuyers.take(3).map(
            (b) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: PassInterestedBuyerTile(
                buyer: b,
                onTap: () async {
                  await context.push('/pass-items/${post.id}/chat?buyer=${b.id}');
                  _load();
                },
              ),
            ),
          ),
        if (_interestedBuyers.length > 3)
          Align(
            alignment: Alignment.center,
            child: TextButton.icon(
              onPressed: () async {
                await context.push('/pass-items/${post.id}/chat');
                _load();
              },
              icon: Icon(LucideIcons.users, size: 16, color: c.primary),
              label: Text('${_interestedBuyers.length} khách — mở danh sách chat',
                  style: TextStyle(color: c.primary)),
            ),
          ),
      ],
    );
  }

  Widget _ownerTipsCard(UniMoveColors c, PassItemPost post) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: c.chipBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: c.primary.withValues(alpha: 0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(LucideIcons.userCheck, size: 18, color: c.primary),
              const SizedBox(width: 8),
              Text('Tin của bạn', style: TextStyle(fontWeight: FontWeight.w800, color: c.primary)),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            post.buyerTransportBooked
                ? 'Khách đã đặt xe — không huỷ chốt được.'
                : post.dealConfirmed
                    ? 'Đã chốt đơn · Khách có thể đặt xe (huỷ chốt nếu đổi ý).'
                    : '${post.interestedCount} người quan tâm · Chốt đơn trong chat sau khi thỏa giá.',
            style: TextStyle(fontSize: 12, color: c.onSurface, height: 1.35),
          ),
        ],
      ),
    );
  }

  Future<void> _startDelivery(PassItemPost post) async {
    if (!post.dealConfirmed) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Chờ người bán chốt đơn trong chat')),
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

  Future<void> _cancelDealConfirmation(PassItemPost post) async {
    if (!post.sellerCanCancelDeal) {
      if (post.buyerTransportBooked) {
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
          'Khách sẽ không đặt được xe cho đến khi bạn chốt đơn lại.',
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
    final ok = await _repo.cancelDealConfirmation(post.id);

    if (!mounted) return;
    if (ok) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Đã huỷ chốt đơn')));
      _load();
    }
  }

  Widget _confirmReceivedCard(UniMoveColors c, PassItemPost post) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: c.primary.withValues(alpha: 0.4)),
      ),
      child: Row(
        children: [
          Icon(Icons.inventory_2_outlined, color: c.primary, size: 26),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Xe đang trên đường',
                    style: TextStyle(fontWeight: FontWeight.w800, color: c.onSurface)),
                const SizedBox(height: 2),
                Text('Nhấn khi bạn đã nhận được đồ để hoàn tất giao dịch',
                    style: TextStyle(fontSize: 12, color: c.onSurfaceMuted)),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: () => _confirmReceived(post),
            style: ElevatedButton.styleFrom(
              backgroundColor: c.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Đã nhận đồ', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmReceived(PassItemPost post) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Xác nhận đã nhận đồ?'),
        content: const Text('Thao tác này sẽ hoàn tất giao dịch và thông báo cho người bán. Không thể hoàn tác.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Huỷ')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Xác nhận'),
          ),
        ],
      ),
    );
    if (confirm != true || !mounted) return;
    try {
      await _repo.confirmReceived(post.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('✅ Giao dịch hoàn tất! Hãy để lại đánh giá cho người bán.')),
        );
        _load();
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Không thể xác nhận — thử lại sau')),
        );
      }
    }
  }

  Widget _ratingCard(UniMoveColors c, PassItemPost post) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: c.success.withValues(alpha: 0.5)),
      ),
      child: Row(
        children: [
          Icon(Icons.star_rounded, color: Colors.amber, size: 28),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Giao dịch hoàn tất!',
                    style: TextStyle(fontWeight: FontWeight.w800, color: c.onSurface)),
                const SizedBox(height: 2),
                Text('Đánh giá trải nghiệm với ${post.posterName}',
                    style: TextStyle(fontSize: 12, color: c.onSurfaceMuted)),
              ],
            ),
          ),
          TextButton(
            onPressed: () => _showRatingDialog(post),
            child: Text('Đánh giá', style: TextStyle(color: c.primary, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  Widget _ratedDoneCard(UniMoveColors c) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: c.success.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: c.success.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Icon(Icons.check_circle_rounded, color: c.success, size: 20),
          const SizedBox(width: 10),
          Text('Bạn đã đánh giá giao dịch này',
              style: TextStyle(fontSize: 13, color: c.success, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Future<void> _showRatingDialog(PassItemPost post) async {
    int stars = 0;
    final commentCtrl = TextEditingController();

    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setS) => AlertDialog(
          title: Text('Đánh giá ${post.posterName}'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Chọn số sao:', style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (i) => GestureDetector(
                  onTap: () => setS(() => stars = i + 1),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: Icon(
                      i < stars ? Icons.star_rounded : Icons.star_outline_rounded,
                      color: Colors.amber, size: 36,
                    ),
                  ),
                )),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: commentCtrl,
                maxLines: 3,
                decoration: const InputDecoration(
                  hintText: 'Nhận xét (tuỳ chọn)...',
                  border: OutlineInputBorder(),
                  contentPadding: EdgeInsets.all(10),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Bỏ qua'),
            ),
            ElevatedButton(
              onPressed: stars == 0 ? null : () async {
                Navigator.pop(ctx);
                try {
                  await _repo.rateTransaction(post.id, stars, commentCtrl.text);
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('✅ Cảm ơn bạn đã đánh giá!')),
                    );
                    _load();
                  }
                } catch (_) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Không thể gửi đánh giá')),
                    );
                  }
                }
              },
              child: const Text('Gửi đánh giá'),
            ),
          ],
        ),
      ),
    );
    commentCtrl.dispose();
  }

  Widget _sellerCard(UniMoveColors c, PassItemPost post) {
    final hasAvatar = post.posterAvatarUrl != null && post.posterAvatarUrl!.isNotEmpty;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: c.border),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 22,
            backgroundColor: c.iconBgSecondary,
            backgroundImage: hasAvatar ? NetworkImage(post.posterAvatarUrl!) : null,
            child: hasAvatar
                ? null
                : Text(
                    post.posterName.isEmpty ? '?' : post.posterName.substring(0, 1).toUpperCase(),
                    style: TextStyle(color: c.primary, fontWeight: FontWeight.w800),
                  ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(post.posterName, style: TextStyle(fontWeight: FontWeight.w700, color: c.onSurface)),
                const SizedBox(height: 2),
                Text('Người đăng · ${post.posterContact}',
                    style: TextStyle(fontSize: 12, color: c.onSurfaceMuted)),
              ],
            ),
          ),
          if (!post.isMine && post.posterId.isNotEmpty)
            GestureDetector(
              onTap: () => Navigator.of(context, rootNavigator: true).push(
                MaterialPageRoute(
                  builder: (_) => PassItemSellerPage(
                    sellerId: post.posterId,
                    sellerName: post.posterName,
                  ),
                ),
              ),
              child: Text(
                'Xem trang →',
                style: TextStyle(fontSize: 13, color: c.primary, fontWeight: FontWeight.w700),
              ),
            )
          else
            Icon(Icons.verified, color: c.primary, size: 20),
        ],
      ),
    );
  }

  Widget _statusBadge(UniMoveColors c, PassItemStatus status) {
    final tint = switch (status) {
      PassItemStatus.open => c.primary,
      PassItemStatus.reserved => c.primaryLight,
      PassItemStatus.completed => c.success,
      PassItemStatus.hidden => c.onSurfaceMuted,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(color: tint.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(999)),
      child: Text(status.label, style: TextStyle(color: tint, fontWeight: FontWeight.w700, fontSize: 12)),
    );
  }

  Widget _sellerManageBar(UniMoveColors c, PassItemPost post) {
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
        decoration: BoxDecoration(
          color: c.surface,
          border: Border(top: BorderSide(color: c.border)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              post.buyerTransportBooked
                  ? 'Khách đã đặt xe — không huỷ chốt'
                  : post.dealConfirmed
                      ? 'Đã chốt — huỷ chốt trong chat nếu đổi ý (trước khi khách đặt xe)'
                      : 'Thỏa giá trong chat → bấm Chốt đơn để mở đặt xe cho khách',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 11, color: c.onSurfaceMuted),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: SizedBox(
                    height: 44,
                    child: OutlinedButton.icon(
                      onPressed: () async {
                        await context.push('/pass-items/${post.id}/chat');
                        _load();
                      },
                      icon: const Icon(LucideIcons.users, size: 18),
                      label: Text('Khách (${_interestedBuyers.length})'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: c.primary,
                        side: BorderSide(color: c.primary.withValues(alpha: 0.4)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: SizedBox(
                    height: 44,
                    child: OutlinedButton.icon(
                      onPressed: () => context.pop(),
                      icon: const Icon(Icons.arrow_back, size: 18),
                      label: const Text('Quay lại'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: c.onSurface,
                        side: BorderSide(color: c.border),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buyerBottomBar(UniMoveColors c, PassItemPost post) {
    // Đã chốt đơn → ưu tiên CTA "Đặt chuyển đồ"
    if (post.dealConfirmed) {
      return SafeArea(
        top: false,
        child: Container(
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
          decoration: BoxDecoration(
            color: c.surface,
            border: Border(top: BorderSide(color: c.border)),
          ),
          child: Row(
            children: [
              _compactIconBtn(c, LucideIcons.messageCircle, onTap: () async {
                await context.push('/pass-items/${post.id}/chat');
                _load();
              }),
              const SizedBox(width: 8),
              Expanded(
                child: SizedBox(
                  height: 44,
                  child: ElevatedButton.icon(
                    onPressed: () => _startDelivery(post),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: c.primary,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    icon: const Icon(LucideIcons.truck, size: 16),
                    label: const Text('Đặt chuyển đồ', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    final available = post.status == PassItemStatus.open || post.status == PassItemStatus.reserved;

    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
        decoration: BoxDecoration(
          color: c.surface,
          border: Border(top: BorderSide(color: c.border)),
        ),
        child: Row(
          children: [
            _compactIconBtn(
              c,
              LucideIcons.phone,
              onTap: () => ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Đang gọi ${post.posterContact}...')),
              ),
            ),
            const SizedBox(width: 8),
            _compactIconBtn(
              c,
              LucideIcons.messageCircle,
              onTap: () async {
                await context.push('/pass-items/${post.id}/chat');
                _load();
              },
            ),
            const SizedBox(width: 8),
            Expanded(
              child: SizedBox(
                height: 44,
                child: _interested
                    ? OutlinedButton.icon(
                        onPressed: () => _toggleInterest(post, remove: true),
                        icon: Icon(Icons.favorite_rounded, size: 16, color: c.primary),
                        label: const Text('Đã quan tâm', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: c.primary,
                          side: BorderSide(color: c.primary),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      )
                    : ElevatedButton(
                        onPressed: available ? () => _toggleInterest(post, remove: false) : null,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: c.primary,
                          foregroundColor: Colors.white,
                          disabledBackgroundColor: c.border,
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(horizontal: 10),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.favorite_border_rounded, size: 16, color: Colors.white),
                            const SizedBox(width: 6),
                            Flexible(
                              child: Text(
                                'Tôi muốn nhận',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                              ),
                            ),
                          ],
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _toggleInterest(PassItemPost post, {required bool remove}) async {
    try {
      if (remove) {
        await _repo.removeInterest(post.id);
        if (!mounted) return;
        setState(() => _interested = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đã bỏ quan tâm')),
        );
      } else {
        await _repo.expressInterest(post.id);
        if (!mounted) return;
        setState(() => _interested = true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đã gửi quan tâm — người đăng sẽ liên hệ bạn')),
        );
      }
      _load();
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Thao tác thất bại — thử lại sau')),
        );
      }
    }
  }

  Widget _compactIconBtn(UniMoveColors c, IconData icon, {required VoidCallback onTap}) {
    return SizedBox(
      width: 44,
      height: 44,
      child: OutlinedButton(
        onPressed: onTap,
        style: OutlinedButton.styleFrom(
          padding: EdgeInsets.zero,
          side: BorderSide(color: c.border),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        child: Icon(icon, size: 18, color: c.onSurface),
      ),
    );
  }
}

// ── Full-screen image viewer ──────────────────────────────────────────────────

class _FullScreenImageViewer extends StatefulWidget {
  const _FullScreenImageViewer({required this.images, required this.initialIndex});
  final List<String> images;
  final int initialIndex;

  @override
  State<_FullScreenImageViewer> createState() => _FullScreenImageViewerState();
}

class _FullScreenImageViewerState extends State<_FullScreenImageViewer> {
  late final PageController _ctrl;
  late int _current;

  @override
  void initState() {
    super.initState();
    _current = widget.initialIndex;
    _ctrl = PageController(initialPage: widget.initialIndex);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          PageView.builder(
            controller: _ctrl,
            itemCount: widget.images.length,
            onPageChanged: (i) => setState(() => _current = i),
            itemBuilder: (_, i) => InteractiveViewer(
              minScale: 0.8,
              maxScale: 4.0,
              child: Center(
                child: PassItemImage(
                  imageUrl: widget.images[i],
                  fit: BoxFit.contain,
                  errorPlaceholder: const Icon(Icons.broken_image_outlined, color: Colors.white38, size: 60),
                ),
              ),
            ),
          ),
          SafeArea(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close, color: Colors.white, size: 26),
                ),
                if (widget.images.length > 1)
                  Padding(
                    padding: const EdgeInsets.only(right: 16),
                    child: Text(
                      '${_current + 1} / ${widget.images.length}',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
