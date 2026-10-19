import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/uni_move_colors.dart';
import '../../data/pass_item_repository.dart';
import '../../domain/pass_item.dart';
import '../pass_item_format.dart';
import '../widgets/pass_item_image.dart';

class PassItemSellerPage extends StatefulWidget {
  const PassItemSellerPage({super.key, required this.sellerId, this.sellerName});

  final String sellerId;
  final String? sellerName;

  @override
  State<PassItemSellerPage> createState() => _PassItemSellerPageState();
}

class _PassItemSellerPageState extends State<PassItemSellerPage> {
  final _repo = PassItemRepository();
  List<PassItemPost> _posts = [];
  double? _avgRating;
  int _reviewCount = 0;
  bool _loading = true;

  String get _name => _posts.isNotEmpty ? _posts.first.posterName : (widget.sellerName ?? '');
  String? get _avatarUrl => _posts.isNotEmpty ? _posts.first.posterAvatarUrl : null;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final postsF = _repo.browseByOwner(widget.sellerId);
    final statsF = _repo.sellerStats(widget.sellerId);
    final posts = await postsF;
    final stats = await statsF;
    if (!mounted) return;
    setState(() {
      _posts = posts;
      _avgRating = (stats['avg_rating'] as num?)?.toDouble();
      _reviewCount = (stats['review_count'] as num?)?.toInt() ?? 0;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    return Scaffold(
      backgroundColor: c.background,
      appBar: AppBar(
        backgroundColor: c.background,
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        iconTheme: IconThemeData(color: c.onSurface),
        title: Text('Trang cá nhân', style: TextStyle(color: c.onSurface, fontWeight: FontWeight.w700)),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: CustomScrollView(
                slivers: [
                  SliverToBoxAdapter(child: _profileHeader(c)),
                  if (_posts.isEmpty)
                    SliverFillRemaining(child: _empty(c))
                  else ...[
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                        child: Text(
                          'Tin đăng của $_name',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: c.onSurface),
                        ),
                      ),
                    ),
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 96),
                      sliver: SliverGrid(
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                          childAspectRatio: 0.56,
                        ),
                        delegate: SliverChildBuilderDelegate(
                          (_, i) => _sellerGridCard(c, _posts[i]),
                          childCount: _posts.length,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
    );
  }

  Widget _profileHeader(UniMoveColors c) {
    final hasAvatar = _avatarUrl != null && _avatarUrl!.isNotEmpty;
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: c.border),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 32,
            backgroundColor: c.iconBgSecondary,
            backgroundImage: hasAvatar ? NetworkImage(_avatarUrl!) : null,
            child: hasAvatar
                ? null
                : Text(
                    _name.isEmpty ? '?' : _name.substring(0, 1).toUpperCase(),
                    style: TextStyle(fontSize: 22, color: c.primary, fontWeight: FontWeight.w800),
                  ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(_name,
                    style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: c.onSurface)),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(Icons.storefront_outlined, size: 14, color: c.onSurfaceMuted),
                    const SizedBox(width: 4),
                    Text(
                      '${_posts.length} tin đăng',
                      style: TextStyle(fontSize: 13, color: c.onSurfaceMuted),
                    ),
                  ],
                ),
                if (_avgRating != null && _reviewCount > 0) ...[
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.star_rounded, size: 14, color: Colors.amber),
                      const SizedBox(width: 3),
                      Text(
                        '${_avgRating!.toStringAsFixed(1)} ($_reviewCount đánh giá)',
                        style: TextStyle(fontSize: 13, color: c.onSurfaceMuted),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
          Icon(Icons.verified, color: c.primary, size: 22),
        ],
      ),
    );
  }

  Widget _sellerGridCard(UniMoveColors c, PassItemPost post) {
    final isReserved = post.status == PassItemStatus.reserved;
    return Material(
      color: c.surface,
      borderRadius: BorderRadius.circular(14),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () async {
          await context.push('/pass-items/${post.id}');
          _load();
        },
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Ảnh + badge trạng thái
            AspectRatio(
              aspectRatio: 1,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  PassItemImage(
                    imageUrl: post.imageUrl,
                    fit: BoxFit.cover,
                    errorPlaceholder: Container(
                      color: c.surfaceTint,
                      child: Icon(Icons.inventory_2_outlined, color: c.onSurfaceMuted, size: 32),
                    ),
                  ),
                  Positioned(
                    top: 8, left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: isReserved ? Colors.orange.shade700 : Colors.green.shade600,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        isReserved ? 'Đang giữ' : 'Còn hàng',
                        style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    post.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: c.onSurface, height: 1.3),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    passItemPriceLabel(post),
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 14,
                      color: post.isFree ? c.success : c.primary,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Row(
                    children: [
                      Icon(Icons.place_outlined, size: 11, color: c.onSurfaceMuted),
                      const SizedBox(width: 2),
                      Expanded(
                        child: Text(
                          post.area,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(fontSize: 11, color: c.onSurfaceMuted),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  Row(
                    children: [
                      Icon(Icons.access_time_rounded, size: 11, color: c.onSurfaceMuted),
                      const SizedBox(width: 2),
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
    );
  }

  Widget _empty(UniMoveColors c) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.inventory_2_outlined, size: 48, color: c.onSurfaceMuted),
          const SizedBox(height: 12),
          Text('Người dùng chưa có tin đăng',
              style: TextStyle(color: c.onSurface, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
