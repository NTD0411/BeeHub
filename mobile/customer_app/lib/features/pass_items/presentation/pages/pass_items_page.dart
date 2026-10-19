import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/theme/uni_move_colors.dart';
import '../../data/pass_item_location_prefs.dart';
import '../../data/pass_item_repository.dart';
import '../../domain/pass_extras.dart';
import '../../domain/pass_item.dart';
import '../../domain/pass_item_provinces.dart';
import '../pass_item_format.dart';
import '../widgets/listing_fee_payment_sheet.dart';
import '../widgets/pass_item_image.dart';
import '../widgets/pass_item_province_picker_sheet.dart';

class PassItemsPage extends StatefulWidget {
  const PassItemsPage({super.key});

  @override
  State<PassItemsPage> createState() => _PassItemsPageState();
}

class _PassItemsPageState extends State<PassItemsPage> with SingleTickerProviderStateMixin {
  final _repo = PassItemRepository();
  late final TabController _tab = TabController(length: 3, vsync: this);
  final _searchCtrl = TextEditingController();
  final _categoryScrollCtrl = ScrollController();

  String _category = 'Tất cả';
  String _provinceId = PassItemProvince.defaultId;
  String _keyword = '';
  bool _loading = true;
  List<PassItemPost> _browse = const [];
  List<PassItemPost> _mine = const [];
  List<PassItemPost> _favorites = const [];

  PassItemProvince get _province => PassItemProvince.resolve(_provinceId);

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  @override
  void dispose() {
    _tab.dispose();
    _searchCtrl.dispose();
    _categoryScrollCtrl.dispose();
    super.dispose();
  }

  Future<void> _bootstrap() async {
    final saved = await loadPassItemsProvinceId();
    if (!mounted) return;
    setState(() => _provinceId = saved);
    await _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final results = await Future.wait([
      _repo.browse(keyword: _keyword, category: _category, provinceId: _provinceId),
      _repo.myPosts(),
      _repo.myInterests(),
    ]);
    if (!mounted) return;
    setState(() {
      _browse     = results[0];
      _mine       = results[1];
      _favorites  = results[2];
      _loading    = false;
    });
  }

  Future<void> _pickProvince() async {
    final picked = await showPassItemProvincePicker(context, selectedId: _provinceId);
    if (picked == null || picked == _provinceId) return;
    await savePassItemsProvinceId(picked);
    if (!mounted) return;
    setState(() => _provinceId = picked);
    _load();
  }

  Future<void> _openCreate() async {
    final created = await context.push<bool>('/pass-items/new');
    if (created == true) {
      _tab.animateTo(2);
      _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    return Scaffold(
      backgroundColor: c.background,
      appBar: AppBar(
        backgroundColor: c.background,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        iconTheme: IconThemeData(color: c.onSurface),
        title: Text('Chợ sinh viên', style: TextStyle(color: c.onSurface, fontWeight: FontWeight.w800)),
        bottom: TabBar(
          controller: _tab,
          labelColor: c.primary,
          unselectedLabelColor: c.onSurfaceMuted,
          indicatorColor: c.primary,
          indicatorWeight: 2.5,
          labelStyle: const TextStyle(fontWeight: FontWeight.w700),
          tabs: const [
            Tab(text: 'Khám phá'),
            Tab(text: 'Yêu thích'),
            Tab(text: 'Tin của tôi'),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openCreate,
        backgroundColor: c.primary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Đăng tin'),
      ),
      body: TabBarView(
        controller: _tab,
        physics: const NeverScrollableScrollPhysics(),
        children: [
          _browseTab(c),
          _favoritesTab(c),
          _myTab(c),
        ],
      ),
    );
  }

  Widget _browseTab(UniMoveColors c) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 6),
          child: Row(
            children: [
              _provinceSelector(c),
              const Spacer(),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
          child: ShadInput(
            controller: _searchCtrl,
            placeholder: const Text('Tìm tủ, bàn, tủ lạnh, sách...'),
            leading: Icon(LucideIcons.search, size: 18, color: c.primary),
            onChanged: (v) {
              _keyword = v;
              _load();
            },
          ),
        ),
        _filterLabel(c, 'Danh mục'),
        SizedBox(
          height: 44,
          child: ListView.separated(
            controller: _categoryScrollCtrl,
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.only(left: 16, right: 16, bottom: 8),
            itemCount: PassItemCategories.all.length + 1,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (_, i) {
              final label = i == 0 ? 'Tất cả' : PassItemCategories.all[i - 1];
              return _categoryChip(c, label);
            },
          ),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : _browse.isEmpty
                  ? _emptyBrowse(c)
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: GridView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 4, 16, 96),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 14,
                          mainAxisExtent: 236,
                        ),
                        itemCount: _browse.length,
                        itemBuilder: (_, i) => _gridCard(c, _browse[i]),
                      ),
                    ),
        ),
      ],
    );
  }

  Widget _provinceSelector(UniMoveColors c) {
    return GestureDetector(
      onTap: _pickProvince,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: c.surface,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: c.border),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.location_on, color: c.primary, size: 16),
            const SizedBox(width: 6),
            Text(
              _province.label,
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: c.onSurface),
            ),
            const SizedBox(width: 4),
            Icon(Icons.keyboard_arrow_down, color: c.primary, size: 18),
          ],
        ),
      ),
    );
  }

  Widget _filterLabel(UniMoveColors c, String text) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 6),
      child: Align(
        alignment: Alignment.centerLeft,
        child: Text(
          text,
          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: c.onSurfaceMuted),
        ),
      ),
    );
  }

  Widget _categoryChip(UniMoveColors c, String label) {
    final active = _category == label;
    return GestureDetector(
      onTap: () {
        setState(() => _category = label);
        _load();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: active ? c.primary : c.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: active ? c.primary : c.border),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: active ? Colors.white : c.onSurface,
            fontWeight: FontWeight.w600,
            fontSize: 13,
          ),
        ),
      ),
    );
  }

  Widget _listingCard(UniMoveColors c, PassItemPost post) {
    final provinceLabel = PassItemProvince.resolve(PassItemProvince.provinceIdOf(post)).label;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: c.surface,
        borderRadius: BorderRadius.circular(16),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () async {
            await context.push('/pass-items/${post.id}');
            _load();
          },
          child: Padding(
            padding: const EdgeInsets.all(10),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                PassItemImage(
                  imageUrl: post.imageUrl,
                  width: 96,
                  height: 96,
                  borderRadius: BorderRadius.circular(12),
                  errorPlaceholder: Container(
                    width: 96,
                    height: 96,
                    color: c.surfaceTint,
                    child: Icon(Icons.inventory_2_outlined, color: c.onSurfaceMuted),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        post.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: c.onSurface),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Text(
                            passItemPriceLabel(post),
                            style: TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 16,
                              color: post.isFree ? c.success : c.primary,
                            ),
                          ),
                          if (post.isNegotiable) ...[
                            const SizedBox(width: 6),
                            Text('· có thương lượng',
                                style: TextStyle(fontSize: 11, color: c.onSurfaceMuted)),
                          ],
                        ],
                      ),
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: [
                          _tag(c, post.condition.label),
                          _tag(c, post.category),
                          _tag(c, provinceLabel, accent: true),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Icon(Icons.place_outlined, size: 13, color: c.onSurfaceMuted),
                          const SizedBox(width: 3),
                          Expanded(
                            child: Text(
                              post.area,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(fontSize: 12, color: c.onSurfaceMuted),
                            ),
                          ),
                          Text(passItemTimeAgo(post.createdAt),
                              style: TextStyle(fontSize: 11, color: c.onSurfaceMuted)),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _gridCard(UniMoveColors c, PassItemPost post) {
    const textHeight = TextHeightBehavior(
      applyHeightToFirstAscent: false,
      applyHeightToLastDescent: false,
    );

    return DecoratedBox(
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: c.border.withValues(alpha: 0.55)),
        boxShadow: [
          BoxShadow(
            color: c.navBarShadow.withValues(alpha: 0.2),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        clipBehavior: Clip.hardEdge,
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () async {
              await context.push('/pass-items/${post.id}');
              _load();
            },
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(
                  flex: 13,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      PassItemImage(
                        imageUrl: post.imageUrl,
                        fit: BoxFit.cover,
                        width: double.infinity,
                        height: double.infinity,
                        errorPlaceholder: DecoratedBox(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [
                                c.surfaceTint,
                                c.primary.withValues(alpha: 0.08),
                              ],
                            ),
                          ),
                          child: Icon(
                            Icons.photo_outlined,
                            color: c.onSurfaceMuted.withValues(alpha: 0.5),
                            size: 36,
                          ),
                        ),
                      ),
                      Positioned(
                        top: 8,
                        left: 8,
                        child: _imageBadge(c, post.condition.label),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  flex: 11,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(8, 6, 8, 5),
                    child: Align(
                      alignment: Alignment.topLeft,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            post.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            textHeightBehavior: textHeight,
                            style: TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 13,
                              height: 1.15,
                              color: c.onSurface,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            passItemPriceLabel(post),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            textHeightBehavior: textHeight,
                            style: TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 14,
                              height: 1.1,
                              color: post.isFree ? c.success : c.primary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          _tag(c, post.category),
                          const SizedBox(height: 2),
                          Text(
                            '${post.area} · ${passItemTimeAgo(post.createdAt)}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            textHeightBehavior: textHeight,
                            style: TextStyle(
                              fontSize: 10,
                              height: 1.1,
                              color: c.onSurfaceMuted,
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
        ),
      ),
    );
  }

  Widget _imageBadge(UniMoveColors c, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.55),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        text,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 10,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }

  Widget _tag(UniMoveColors c, String text, {bool accent = false}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 1),
      decoration: BoxDecoration(
        color: accent ? c.primary.withValues(alpha: 0.12) : c.surfaceTint,
        borderRadius: BorderRadius.circular(6),
        border: accent ? Border.all(color: c.primary.withValues(alpha: 0.35)) : null,
      ),
      child: Text(
        text,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: TextStyle(
          fontSize: 10,
          color: accent ? c.primary : c.onSurface,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _emptyBrowse(UniMoveColors c) {
    return ListView(
      children: [
        const SizedBox(height: 64),
        Icon(Icons.location_city_outlined, size: 40, color: c.onSurfaceMuted),
        const SizedBox(height: 12),
        Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Text(
              'Chưa có tin tại ${_province.label}.\nThử đổi tỉnh/thành phố hoặc đăng tin mới.',
              textAlign: TextAlign.center,
              style: TextStyle(color: c.onSurface, fontWeight: FontWeight.w600, height: 1.4),
            ),
          ),
        ),
        const SizedBox(height: 16),
        Center(
          child: TextButton(onPressed: _pickProvince, child: const Text('Chọn tỉnh / thành phố khác')),
        ),
      ],
    );
  }

  // ---------------- Yêu thích ----------------

  Widget _favoritesTab(UniMoveColors c) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_favorites.isEmpty) return _emptyFavorites(c);
    return RefreshIndicator(
      onRefresh: _load,
      child: GridView.builder(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          mainAxisExtent: 236,
        ),
        itemCount: _favorites.length,
        itemBuilder: (_, i) => _favoriteCard(c, _favorites[i]),
      ),
    );
  }

  Widget _favoriteCard(UniMoveColors c, PassItemPost post) {
    final isSold = post.status == PassItemStatus.completed || post.status == PassItemStatus.hidden;
    return Stack(
      clipBehavior: Clip.antiAlias,
      children: [
        Opacity(
          opacity: isSold ? 0.55 : 1.0,
          child: _gridCard(c, post),
        ),
        if (isSold)
          Positioned(
            top: 8, left: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: Colors.black54,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text('Đã bán', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)),
            ),
          ),
        Positioned(
          top: 6, right: 6,
          child: GestureDetector(
            onTap: () => _removeFavorite(post),
            child: Container(
              padding: const EdgeInsets.all(6),
              decoration: const BoxDecoration(color: Colors.black45, shape: BoxShape.circle),
              child: const Icon(Icons.favorite, color: Colors.redAccent, size: 16),
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _removeFavorite(PassItemPost post) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Bỏ yêu thích?'),
        content: Text('Bỏ quan tâm "${post.title}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Không')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Bỏ yêu thích', style: TextStyle(color: Colors.redAccent)),
          ),
        ],
      ),
    );
    if (confirmed == true && mounted) {
      await _repo.removeInterest(post.id);
      _load();
    }
  }

  Widget _emptyFavorites(UniMoveColors c) {
    return ListView(
      children: [
        const SizedBox(height: 80),
        Icon(Icons.favorite_border, size: 48, color: c.onSurfaceMuted),
        const SizedBox(height: 12),
        Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Text(
              'Chưa có tin yêu thích.\nNhấn "Tôi muốn nhận" trên bất kỳ tin nào để thêm vào đây.',
              textAlign: TextAlign.center,
              style: TextStyle(color: c.onSurface, fontWeight: FontWeight.w600, height: 1.5),
            ),
          ),
        ),
      ],
    );
  }

  // ---------------- Tin của tôi ----------------
  Widget _myTab(UniMoveColors c) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_mine.isEmpty) return _empty(c, 'Bạn chưa đăng tin nào');
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 96),
        itemCount: _mine.length,
        itemBuilder: (_, i) => _myCard(c, _mine[i]),
      ),
    );
  }

  Widget _myCard(UniMoveColors c, PassItemPost post) {
    final needsListingFee = !post.feePaid && !post.isFree;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: c.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _listingCardInner(c, post),
          Divider(height: 1, color: c.border),
          Padding(
            padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.favorite_border, size: 15, color: c.onSurfaceMuted),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Wrap(
                        spacing: 6,
                        runSpacing: 4,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          InkWell(
                            onTap: () => context.push('/pass-items/${post.id}/chat'),
                            child: Text(
                              '${post.interestedCount} khách quan tâm',
                              style: TextStyle(fontSize: 12, color: c.primary, fontWeight: FontWeight.w600),
                            ),
                          ),
                          if (post.buyerTransportBooked)
                            _miniBadge(c, 'Khách đã đặt xe', c.primary, c.primaryContainer)
                          else if (post.dealConfirmed)
                            _miniBadge(c, 'Đã chốt', c.success, c.success.withValues(alpha: 0.14))
                          else
                            Text('chốt đơn trong chat', style: TextStyle(fontSize: 11, color: c.onSurfaceMuted)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    _statusBadge(c, post, needsListingFee: needsListingFee),
                    const Spacer(),
                    if (needsListingFee)
                      TextButton(
                        onPressed: () => _payPendingListingFee(post),
                        style: TextButton.styleFrom(
                          foregroundColor: c.primary,
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: const Text('Thanh toán phí', style: TextStyle(fontWeight: FontWeight.w700)),
                      ),
                    PopupMenuButton<PassItemStatus>(
                      icon: Icon(Icons.more_horiz, color: c.onSurfaceMuted),
                      onSelected: (s) async {
                        await _repo.updateStatus(post.id, s);
                        _load();
                      },
                      itemBuilder: (_) => const [
                        PopupMenuItem(value: PassItemStatus.reserved, child: Text('Đang chờ chốt đơn')),
                        PopupMenuItem(value: PassItemStatus.completed, child: Text('Đã hoàn tất giao dịch')),
                        PopupMenuItem(value: PassItemStatus.hidden, child: Text('Ẩn tin đăng')),
                        PopupMenuItem(value: PassItemStatus.open, child: Text('Đăng lại tin')),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _listingCardInner(UniMoveColors c, PassItemPost post) {
    return InkWell(
      onTap: () async {
        await context.push('/pass-items/${post.id}');
        _load();
      },
      child: Padding(
        padding: const EdgeInsets.all(10),
        child: Row(
          children: [
            PassItemImage(
              imageUrl: post.imageUrl,
              width: 72,
              height: 72,
              borderRadius: BorderRadius.circular(12),
              errorPlaceholder: Container(
                width: 72,
                height: 72,
                color: c.surfaceTint,
                child: Icon(Icons.inventory_2_outlined, color: c.onSurfaceMuted),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(post.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontWeight: FontWeight.w700, color: c.onSurface)),
                  const SizedBox(height: 4),
                  Text(passItemPriceLabel(post),
                      style: TextStyle(
                          fontWeight: FontWeight.w800,
                          color: post.isFree ? c.success : c.primary)),
                  const SizedBox(height: 4),
                  Text('${post.category} · ${passItemTimeAgo(post.createdAt)}',
                      style: TextStyle(fontSize: 12, color: c.onSurfaceMuted)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _miniBadge(UniMoveColors c, String label, Color textColor, Color bgColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(6)),
      child: Text(label, style: TextStyle(fontSize: 10, color: textColor, fontWeight: FontWeight.w700)),
    );
  }

  Future<void> _payPendingListingFee(PassItemPost post) async {
    final fee = PassListingFee.compute(price: post.price, isFree: post.isFree);
    if (fee <= 0) return;
    final paid = await ListingFeePaymentSheet.show(
      context,
      listingId: post.id,
      fee: fee,
    );
    if (!mounted) return;
    if (paid) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Đã thanh toán phí đăng tin')),
      );
      _load();
    }
  }

  Widget _statusBadge(UniMoveColors c, PassItemPost post, {bool needsListingFee = false}) {
    if (needsListingFee || post.pendingListingFee) {
      return _miniBadge(c, 'Chờ thanh toán', Colors.orange, Colors.orange.withValues(alpha: 0.14));
    }
    final status = post.status;
    final tint = switch (status) {
      PassItemStatus.open => c.primary,
      PassItemStatus.reserved => c.primaryLight,
      PassItemStatus.completed => c.success,
      PassItemStatus.hidden => c.onSurfaceMuted,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: tint.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(999)),
      child: Text(status.label, style: TextStyle(color: tint, fontWeight: FontWeight.w700, fontSize: 12)),
    );
  }

  Widget _empty(UniMoveColors c, String text) {
    return ListView(
      children: [
        const SizedBox(height: 80),
        Icon(Icons.inventory_2_outlined, size: 40, color: c.onSurfaceMuted),
        const SizedBox(height: 12),
        Center(child: Text(text, style: TextStyle(color: c.onSurface, fontWeight: FontWeight.w600))),
      ],
    );
  }
}
