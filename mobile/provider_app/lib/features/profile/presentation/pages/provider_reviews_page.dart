import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/mock/mock_provider_reviews.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/shad_screen_scope.dart';
import '../../data/reviews_repository.dart';
import '../../domain/provider_review.dart';

// ── Providers ─────────────────────────────────────────────────────────────────

final _reviewsRepoProvider = Provider<ReviewsRepository>((ref) {
  return ReviewsRepository(ref.watch(apiClientProvider));
});

final _reviewsProvider = FutureProvider.autoDispose<List<ProviderReview>>((ref) async {
  try {
    return await ref.watch(_reviewsRepoProvider).fetchMyReviews();
  } catch (_) {
    return MockProviderReviews.reviews;
  }
});

// ── Page ──────────────────────────────────────────────────────────────────────

class ProviderReviewsPage extends ConsumerWidget {
  const ProviderReviewsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = UniMoveColors.of(context);
    final summary = MockProviderReviews.summary;
    final reviewsAsync = ref.watch(_reviewsProvider);

    return ShadScreenScope(
      builder: (_, theme) {
        return Scaffold(
          backgroundColor: c.background,
          appBar: AppBar(
            backgroundColor: c.background,
            surfaceTintColor: Colors.transparent,
            elevation: 0,
            title: Text('Đánh giá của khách',
                style: TextStyle(color: c.onSurface, fontWeight: FontWeight.w800)),
            iconTheme: IconThemeData(color: c.onSurface),
          ),
          body: RefreshIndicator(
            onRefresh: () async => ref.invalidate(_reviewsProvider),
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
              children: [
                _summaryHero(theme, c, summary),
                const SizedBox(height: 20),
                _detailScores(theme, c, summary),
                const SizedBox(height: 24),
                Text('Nhận xét gần đây',
                    style: theme.textTheme.large
                        .copyWith(fontWeight: FontWeight.w800, color: c.onSurface)),
                const SizedBox(height: 12),
                reviewsAsync.when(
                  loading: () => const Center(
                      child: Padding(
                          padding: EdgeInsets.symmetric(vertical: 32),
                          child: CircularProgressIndicator())),
                  error: (e, _) => Center(
                      child: Text('Lỗi: $e',
                          style: TextStyle(color: Colors.red.shade400))),
                  data: (reviews) => reviews.isEmpty
                      ? Center(
                          child: Text('Chưa có đánh giá nào.',
                              style: theme.textTheme.p.copyWith(color: c.onSurfaceMuted)),
                        )
                      : Column(
                          children: reviews
                              .map((r) => _ReviewCard(
                                    review: r,
                                    theme: theme,
                                    c: c,
                                    repo: ref.read(_reviewsRepoProvider),
                                    onRefresh: () => ref.invalidate(_reviewsProvider),
                                  ))
                              .toList(),
                        ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _summaryHero(ShadThemeData theme, UniMoveColors c, ProviderReviewSummary s) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [c.primary, c.primaryLight]),
        borderRadius: BorderRadius.circular(22),
      ),
      child: Row(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(s.averageRating.toStringAsFixed(1),
                  style: theme.textTheme.h1
                      .copyWith(color: Colors.white, fontWeight: FontWeight.w800)),
              Row(
                children: List.generate(
                  5,
                  (i) => Icon(
                    i < s.averageRating.round()
                        ? Icons.star_rounded
                        : Icons.star_outline_rounded,
                    color: Colors.amber.shade200,
                    size: 20,
                  ),
                ),
              ),
              const SizedBox(height: 6),
              Text('${s.totalReviews} đánh giá',
                  style: theme.textTheme.small.copyWith(color: Colors.white70)),
            ],
          ),
          const Spacer(),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('Tỷ lệ phản hồi',
                  style: theme.textTheme.small.copyWith(color: Colors.white70)),
              Text('${s.responseRate.toStringAsFixed(0)}%',
                  style: theme.textTheme.h3
                      .copyWith(color: Colors.white, fontWeight: FontWeight.w800)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _detailScores(ShadThemeData theme, UniMoveColors c, ProviderReviewSummary s) {
    final rows = [
      ('Chất lượng dịch vụ', s.avgServiceQuality),
      ('Đúng giờ', s.avgPunctuality),
      ('Chuyên nghiệp', s.avgProfessionalism),
      ('Giá trị tiền', s.avgValueForMoney),
    ];

    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          for (var star = 5; star >= 1; star--) ...[
            Row(
              children: [
                Text('$star',
                    style: TextStyle(fontWeight: FontWeight.w700, color: c.onSurface)),
                const SizedBox(width: 4),
                Icon(Icons.star_rounded, size: 14, color: Colors.amber.shade700),
                const SizedBox(width: 8),
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: s.fractionForStar(star),
                      minHeight: 6,
                      backgroundColor: c.chipBg,
                      color: c.primary,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Text('${s.countForStar(star)}',
                    style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted)),
              ],
            ),
            if (star > 1) const SizedBox(height: 8),
          ],
          const Divider(height: 24),
          ...rows.map(
            (r) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(r.$1,
                      style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted)),
                  Text(r.$2.toStringAsFixed(1),
                      style: theme.textTheme.p
                          .copyWith(fontWeight: FontWeight.w800, color: c.onSurface)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Review Card ───────────────────────────────────────────────────────────────

class _ReviewCard extends StatefulWidget {
  const _ReviewCard({
    required this.review,
    required this.theme,
    required this.c,
    required this.repo,
    required this.onRefresh,
  });

  final ProviderReview review;
  final ShadThemeData theme;
  final UniMoveColors c;
  final ReviewsRepository repo;
  final VoidCallback onRefresh;

  @override
  State<_ReviewCard> createState() => _ReviewCardState();
}

class _ReviewCardState extends State<_ReviewCard> {
  bool _showReplyInput = false;
  bool _submitting = false;
  late final TextEditingController _ctrl;
  late String? _currentResponse;

  @override
  void initState() {
    super.initState();
    _currentResponse = widget.review.providerResponse;
    _ctrl = TextEditingController(text: _currentResponse ?? '');
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_ctrl.text.trim().isEmpty) return;
    setState(() => _submitting = true);
    try {
      final saved = await widget.repo.respond(widget.review.id, _ctrl.text.trim());
      setState(() {
        _currentResponse = saved;
        _showReplyInput = false;
        _submitting = false;
      });
      widget.onRefresh();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Lỗi: $e')));
        setState(() => _submitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final review = widget.review;
    final theme = widget.theme;
    final c = widget.c;
    final d = review.createdAt;
    final dateStr = '${d.day}/${d.month}/${d.year}';
    final hasResponse = (_currentResponse ?? '').isNotEmpty;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: GlassCard(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: c.iconBgSecondary,
                  child: Text(
                    review.customerName.isNotEmpty ? review.customerName[0] : 'K',
                    style: TextStyle(color: c.primary, fontWeight: FontWeight.w800),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(review.customerName,
                          style: theme.textTheme.p
                              .copyWith(fontWeight: FontWeight.w700, color: c.onSurface)),
                      Text('#${review.orderNumber} · $dateStr',
                          style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted)),
                    ],
                  ),
                ),
                Row(
                  children: [
                    Text('${review.rating}',
                        style: TextStyle(fontWeight: FontWeight.w800, color: c.onSurface)),
                    Icon(Icons.star_rounded, size: 18, color: Colors.amber.shade700),
                  ],
                ),
              ],
            ),

            if ((review.title ?? '').isNotEmpty) ...[
              const SizedBox(height: 10),
              Text(review.title!,
                  style: theme.textTheme.p
                      .copyWith(fontWeight: FontWeight.w700, color: c.onSurface)),
            ],
            const SizedBox(height: 8),
            Text(review.comment,
                style: theme.textTheme.small.copyWith(color: c.onSurface, height: 1.45)),

            if (review.tags.isNotEmpty) ...[
              const SizedBox(height: 10),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: review.tags
                    .map((t) => Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                              color: c.chipBg, borderRadius: BorderRadius.circular(8)),
                          child: Text(t,
                              style: theme.textTheme.small
                                  .copyWith(color: c.primaryLight, fontSize: 11)),
                        ))
                    .toList(),
              ),
            ],

            // Existing response
            if (hasResponse && !_showReplyInput) ...[
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: c.iconBgTertiary,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: c.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text('Phản hồi của bạn',
                            style: theme.textTheme.small
                                .copyWith(fontWeight: FontWeight.w700, color: c.primary)),
                        const Spacer(),
                        GestureDetector(
                          onTap: () => setState(() {
                            _ctrl.text = _currentResponse ?? '';
                            _showReplyInput = true;
                          }),
                          child: Text('Chỉnh sửa',
                              style: theme.textTheme.small
                                  .copyWith(color: c.primaryLight, fontWeight: FontWeight.w600)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(_currentResponse!,
                        style: theme.textTheme.small.copyWith(color: c.onSurface, height: 1.4)),
                  ],
                ),
              ),
            ],

            // Reply input
            if (_showReplyInput) ...[
              const SizedBox(height: 12),
              ShadInput(
                controller: _ctrl,
                placeholder: const Text('Viết phản hồi lịch sự, chuyên nghiệp...'),
                maxLines: 3,
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: _submitting
                        ? null
                        : () => setState(() => _showReplyInput = false),
                    child: const Text('Hủy'),
                  ),
                  const SizedBox(width: 8),
                  ShadButton(
                    onPressed: _submitting ? null : _submit,
                    child: _submitting
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: Colors.white))
                        : const Text('Gửi phản hồi'),
                  ),
                ],
              ),
            ],

            // Reply button (no response yet)
            if (!hasResponse && !_showReplyInput) ...[
              const SizedBox(height: 12),
              ShadButton.outline(
                size: ShadButtonSize.sm,
                onPressed: () => setState(() => _showReplyInput = true),
                leading: const Icon(LucideIcons.messageCircleReply, size: 15),
                child: const Text('Phản hồi đánh giá'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
