import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/smooth_cta_button.dart';
import '../../data/quote_progress_repository.dart';
import '../../domain/quote_models.dart';
import '../cubit/booking_flow_cubit.dart';
import '../widgets/provider_reviews_panel.dart';

/// Tiến trình báo giá — nhận báo giá, so sánh, chốt nhà xe trên app.
class QuoteProgressPage extends StatefulWidget {
  const QuoteProgressPage({
    super.key,
    required this.referenceId,
    this.photosUploadFailed = false,
  });

  final String referenceId;
  final bool photosUploadFailed;

  @override
  State<QuoteProgressPage> createState() => _QuoteProgressPageState();
}

class _QuoteProgressPageState extends State<QuoteProgressPage> {
  final _repo = QuoteProgressRepository.instance;
  QuoteRequestSnapshot? _snapshot;
  bool _loading = true;
  int _sortIndex = 0;
  int _quoteTabIndex = 0;
  String? _confirmingQuoteId;
  Timer? _statusPoll;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _statusPoll?.cancel();
    super.dispose();
  }

  Future<void> _load({bool silent = false}) async {
    if (!silent) setState(() => _loading = true);
    final snap = await _repo.fetch(widget.referenceId);
    if (!mounted) return;

    // Luồng cũ: chốt nhà xe nhưng chưa chọn giờ trước → sang màn chọn lịch nhà xe.
    if (snap?.status == QuoteProgressStatus.providerConfirmed &&
        !snap!.hasRequestedPickup) {
      context.go('/booking/quotes/${widget.referenceId}/schedule');
      return;
    }

    setState(() {
      _snapshot = snap;
      _loading = false;
    });
    _syncStatusPoll(snap);
  }

  void _syncStatusPoll(QuoteRequestSnapshot? snap) {
    _statusPoll?.cancel();
    if (snap == null) return;
    final shouldPoll = snap.status == QuoteProgressStatus.waitingQuotes ||
        snap.status == QuoteProgressStatus.scheduled ||
        (snap.status == QuoteProgressStatus.depositPaid && !snap.providerTripConfirmed);
    if (shouldPoll) {
      _statusPoll = Timer.periodic(const Duration(seconds: 3), (_) => _load(silent: true));
    }
  }

  List<ProviderQuoteResponse> _sortedQuotes(List<ProviderQuoteResponse> source) {
    final quotes = [...source];
    if (_sortIndex == 1) {
      quotes.sort((a, b) => b.rating.compareTo(a.rating));
    } else {
      quotes.sort((a, b) => a.totalPrice.compareTo(b.totalPrice));
    }
    return quotes;
  }

  List<ProviderQuoteResponse> get _exactQuotes =>
      _sortedQuotes(_snapshot?.quotes.where((q) => q.scheduleFit == QuoteScheduleFit.exactMatch).toList() ?? []);

  List<ProviderQuoteResponse> get _alternateQuotes => _sortedQuotes(
        _snapshot?.quotes.where((q) => q.scheduleFit == QuoteScheduleFit.alternateProposed).toList() ?? [],
      );

  List<ProviderQuoteResponse> get _unavailableQuotes => _sortedQuotes(
        _snapshot?.quotes.where((q) => q.scheduleFit == QuoteScheduleFit.unavailable).toList() ?? [],
      );

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    if (_loading) {
      return Scaffold(
        backgroundColor: c.background,
        body: Center(child: CircularProgressIndicator(color: c.primary)),
      );
    }

    final snap = _snapshot;
    if (snap == null) {
      return Scaffold(
        backgroundColor: c.background,
        appBar: AppBar(title: const Text('Tiến trình báo giá')),
        body: Center(child: Text('Không tìm thấy yêu cầu', style: TextStyle(color: c.onSurface))),
      );
    }

    return Scaffold(
      backgroundColor: c.background,
      appBar: AppBar(
        backgroundColor: c.surface,
        surfaceTintColor: Colors.transparent,
        title: Text('Tiến trình báo giá', style: TextStyle(color: c.onSurface, fontWeight: FontWeight.w700)),
        actions: [
          IconButton(icon: Icon(Icons.refresh, color: c.primary), onPressed: _load),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: EdgeInsets.fromLTRB(20.w, 12.h, 20.w, 120.h),
          children: [
            _refCard(c, snap),
            if (snap.hasScheduledMove) ...[
              SizedBox(height: 12.h),
              _scheduleHeroCard(c, snap),
            ],
            if (widget.photosUploadFailed) ...[
              SizedBox(height: 10.h),
              Container(
                padding: EdgeInsets.all(12.w),
                decoration: BoxDecoration(
                  color: c.chipBg,
                  borderRadius: BorderRadius.circular(12.r),
                  border: Border.all(color: c.primary.withValues(alpha: 0.25)),
                ),
                child: Text(
                  'Ảnh chưa tải lên được. Bạn có thể gửi ảnh qua chat khi đơn bắt đầu vận chuyển.',
                  style: TextStyle(fontSize: 12.sp, color: c.onSurface, height: 1.35),
                ),
              ),
            ],
            SizedBox(height: 16.h),
            _timeline(c, snap.status),
            SizedBox(height: 20.h),
            _statusContent(c, snap),
          ],
        ),
      ),
    );
  }

  Widget _refCard(UniMoveColors c, QuoteRequestSnapshot snap) {
    return Container(
      padding: EdgeInsets.all(14.w),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(16.r),
        border: Border.all(color: c.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Mã: ${snap.id}', style: TextStyle(fontWeight: FontWeight.w700, color: c.primary)),
          SizedBox(height: 8.h),
          Text('${snap.pickup} → ${snap.destination}', style: TextStyle(fontSize: 13.sp, color: c.onSurface)),
          if (snap.requestedPickupLabel != null) ...[
            SizedBox(height: 8.h),
            Row(
              children: [
                Icon(Icons.schedule, size: 16.sp, color: c.primary),
                SizedBox(width: 6.w),
                Expanded(
                  child: Text(
                    'Giờ mong muốn: ${snap.requestedPickupLabel}',
                    style: TextStyle(fontSize: 12.sp, fontWeight: FontWeight.w600, color: c.onSurface),
                  ),
                ),
              ],
            ),
          ],
          if (snap.wantsTransportLabor && snap.transportLaborLabel != null) ...[
            SizedBox(height: 8.h),
            Row(
              children: [
                Icon(Icons.groups_outlined, size: 16.sp, color: c.primary),
                SizedBox(width: 6.w),
                Expanded(
                  child: Text(
                    'Khuân vác: ${snap.transportLaborLabel}',
                    style: TextStyle(fontSize: 12.sp, fontWeight: FontWeight.w600, color: c.onSurface),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _scheduleHeroCard(UniMoveColors c, QuoteRequestSnapshot snap) {
    final countdown = snap.daysUntilMoveLabel;
    return Container(
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [c.primary.withValues(alpha: 0.9), c.primaryLight],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16.r),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.event_rounded, color: Colors.white, size: 22.sp),
              SizedBox(width: 8.w),
              Text(
                'Lịch chuyển trọ',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14.sp),
              ),
            ],
          ),
          SizedBox(height: 10.h),
          Text(
            snap.scheduledSlotLabel ?? '',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 17.sp),
          ),
          if (countdown != null) ...[
            SizedBox(height: 6.h),
            Text(
              countdown,
              style: TextStyle(color: Colors.white.withValues(alpha: 0.9), fontSize: 13.sp),
            ),
          ],
        ],
      ),
    );
  }

  Widget _timeline(UniMoveColors c, QuoteProgressStatus current) {
    final idx = quoteTimelineIndex(current);

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          for (var i = 0; i < quoteTimelineSteps.length; i++) ...[
            if (i > 0)
              Container(
                width: 20.w,
                height: 2,
                margin: EdgeInsets.only(bottom: 22.h),
                color: i <= idx ? c.primary : c.border,
              ),
            Column(
              children: [
                Container(
                  width: 28.w,
                  height: 28.w,
                  decoration: BoxDecoration(
                    color: i <= idx ? c.primary : c.surfaceTint,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    i < idx ? Icons.check : Icons.circle,
                    size: i < idx ? 16.sp : 8.sp,
                    color: i <= idx ? AppColors.onPrimary : c.onSurfaceMuted,
                  ),
                ),
                SizedBox(height: 4.h),
                SizedBox(
                  width: 58.w,
                  child: Text(
                    quoteTimelineSteps[i].label,
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 9.sp,
                      fontWeight: i == idx ? FontWeight.w700 : FontWeight.w500,
                      color: i == idx ? c.primary : c.onSurfaceMuted,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _statusContent(UniMoveColors c, QuoteRequestSnapshot snap) {
    return switch (snap.status) {
      QuoteProgressStatus.waitingQuotes => _waitingBox(c),
      QuoteProgressStatus.quotesReady => _quotesSection(c, snap),
      QuoteProgressStatus.providerConfirmed => snap.pendingAlternateSchedule
          ? _alternateScheduleSection(c, snap)
          : _pickScheduleSection(c, snap),
      QuoteProgressStatus.scheduled => _awaitingProviderSection(c, snap),
      QuoteProgressStatus.providerAccepted => _providerAcceptedSection(c, snap),
      QuoteProgressStatus.depositPaid => _depositPaidSection(c, snap),
      QuoteProgressStatus.inProgress => _inProgressSection(c, snap),
      QuoteProgressStatus.completed => _completedSection(c),
    };
  }

  Widget _waitingBox(UniMoveColors c) {
    return Container(
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(color: c.chipBg, borderRadius: BorderRadius.circular(14.r)),
      child: Column(
        children: [
          Icon(Icons.hourglass_top_rounded, size: 40.sp, color: c.primary),
          SizedBox(height: 10.h),
          Text(
            'Đang chờ nhà xe báo giá',
            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16.sp),
          ),
          SizedBox(height: 6.h),
          Text(
            'Yêu cầu đã gửi tới các nhà xe Đà Nẵng. '
            'Khi có nhà xe nhận đơn, báo giá sẽ hiện tại đây — thường trong vài phút.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted, height: 1.4),
          ),
        ],
      ),
    );
  }

  Widget _quotesSection(UniMoveColors c, QuoteRequestSnapshot snap) {
    final exact = _exactQuotes;
    final alternate = _alternateQuotes;
    final unavailable = _unavailableQuotes;
    final total = exact.length + alternate.length + unavailable.length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '$total nhà xe đã báo giá',
          style: TextStyle(fontSize: 18.sp, fontWeight: FontWeight.w800),
        ),
        SizedBox(height: 6.h),
        Text(
          'Chọn tab phù hợp: nhận đúng giờ bạn chọn hoặc đổi giờ theo đề xuất nhà xe.',
          style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted, height: 1.35),
        ),
        SizedBox(height: 12.h),
        Row(
          children: [
            Expanded(child: _quoteTabChip(c, 'Nhận đúng giờ', exact.length, 0)),
            SizedBox(width: 8.w),
            Expanded(child: _quoteTabChip(c, 'Đổi giờ để chốt', alternate.length, 1)),
          ],
        ),
        SizedBox(height: 12.h),
        Row(
          children: [
            _sortChip(c, 'Giá thấp nhất', 0),
            SizedBox(width: 8.w),
            _sortChip(c, 'Đánh giá cao', 1),
          ],
        ),
        SizedBox(height: 14.h),
        if (_quoteTabIndex == 0) ...[
          if (exact.isEmpty)
            _emptyTabHint(
              c,
              'Chưa có nhà xe nhận đúng giờ bạn chọn.',
              'Xem tab "Đổi giờ để chốt" để chọn giờ nhà xe đề xuất.',
            )
          else
            ...exact.map((q) => _exactQuoteCard(c, q)),
        ] else ...[
          if (alternate.isEmpty)
            _emptyTabHint(
              c,
              'Chưa có nhà xe đề xuất giờ thay thế.',
              'Quay lại tab "Nhận đúng giờ" nếu có nhà xe phù hợp.',
            )
          else
            ...alternate.map((q) => _alternateQuoteCard(c, q)),
          if (unavailable.isNotEmpty) ...[
            SizedBox(height: 16.h),
            Text(
              'Không có lịch phù hợp (${unavailable.length})',
              style: TextStyle(fontSize: 14.sp, fontWeight: FontWeight.w700, color: c.onSurfaceMuted),
            ),
            SizedBox(height: 8.h),
            ...unavailable.map((q) => _quoteCard(c, q, showAction: true, viewOnly: true)),
          ],
        ],
      ],
    );
  }

  Widget _quoteTabChip(UniMoveColors c, String label, int count, int index) {
    final active = _quoteTabIndex == index;
    return Material(
      color: active ? c.primary : c.surface,
      borderRadius: BorderRadius.circular(12.r),
      child: InkWell(
        onTap: () => setState(() => _quoteTabIndex = index),
        borderRadius: BorderRadius.circular(12.r),
        child: Container(
          padding: EdgeInsets.symmetric(vertical: 12.h, horizontal: 10.w),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12.r),
            border: Border.all(color: active ? c.primary : c.border),
          ),
          child: Column(
            children: [
              Text(
                label,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12.sp,
                  fontWeight: FontWeight.w700,
                  color: active ? Colors.white : c.onSurface,
                ),
              ),
              SizedBox(height: 2.h),
              Text(
                '$count nhà xe',
                style: TextStyle(
                  fontSize: 10.sp,
                  color: active ? Colors.white.withValues(alpha: 0.9) : c.onSurfaceMuted,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _emptyTabHint(UniMoveColors c, String title, String subtitle) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(color: c.chipBg, borderRadius: BorderRadius.circular(14.r)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14.sp)),
          SizedBox(height: 6.h),
          Text(subtitle, style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted, height: 1.35)),
        ],
      ),
    );
  }

  Widget _exactQuoteCard(UniMoveColors c, ProviderQuoteResponse q) {
    return _quoteCard(
      c,
      q,
      showAction: true,
      primaryActionLabel: 'Chốt ngay',
      onPrimaryAction: () => _confirmExactQuote(q),
      isConfirming: _confirmingQuoteId == q.id,
    );
  }

  Widget _alternateQuoteCard(UniMoveColors c, ProviderQuoteResponse q) {
    return _quoteCard(
      c,
      q,
      showAction: true,
      primaryActionLabel: 'Chọn giờ & chốt giá',
      onPrimaryAction: () => _confirmAlternateQuote(q),
      isConfirming: _confirmingQuoteId == q.id,
      showProposedTime: true,
    );
  }

  Widget _sortChip(UniMoveColors c, String label, int index) {
    final active = _sortIndex == index;
    return ChoiceChip(
      label: Text(label, style: TextStyle(fontSize: 12.sp)),
      selected: active,
      onSelected: (_) => setState(() => _sortIndex = index),
      selectedColor: c.primary,
      labelStyle: TextStyle(color: active ? Colors.white : c.onSurface, fontWeight: FontWeight.w600),
    );
  }

  Widget _quoteCard(
    UniMoveColors c,
    ProviderQuoteResponse q, {
    bool showAction = false,
    bool viewOnly = false,
    String? primaryActionLabel,
    VoidCallback? onPrimaryAction,
    bool isConfirming = false,
    bool showProposedTime = false,
  }) {
    return Container(
      margin: EdgeInsets.only(bottom: 12.h),
      padding: EdgeInsets.all(14.w),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(16.r),
        border: Border.all(color: c.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(q.providerName, style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15.sp)),
              ),
              Text(_money(q.totalPrice), style: TextStyle(fontWeight: FontWeight.w800, color: c.primary, fontSize: 16.sp)),
            ],
          ),
          SizedBox(height: 4.h),
          Row(
            children: [
              InkWell(
                onTap: () => _openReviews(context, q),
                borderRadius: BorderRadius.circular(8.r),
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 2.h),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.star_rounded, color: Colors.amber.shade700, size: 16.sp),
                      Text(
                        ' ${q.rating} (${q.reviewCount} đánh giá)',
                        style: TextStyle(fontSize: 12.sp, fontWeight: FontWeight.w600, color: c.primary),
                      ),
                      Icon(Icons.chevron_right, size: 16.sp, color: c.primary),
                    ],
                  ),
                ),
              ),
              SizedBox(width: 8.w),
              Expanded(
                child: Text(
                  q.vehicleLabel,
                  style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          SizedBox(height: 6.h),
          _scheduleFitChip(c, q),
          if (q.surcharges.isNotEmpty) ...[
            SizedBox(height: 8.h),
            ...q.surcharges.map(
              (s) => Padding(
                padding: EdgeInsets.only(bottom: 2.h),
                child: Text(
                  '· ${s.label}: ${_money(s.amount)}',
                  style: TextStyle(fontSize: 11.sp, color: c.onSurfaceMuted),
                ),
              ),
            ),
          ],
          if (showProposedTime && q.proposedPickupLabel != null) ...[
            SizedBox(height: 8.h),
            Container(
              width: double.infinity,
              padding: EdgeInsets.all(10.w),
              decoration: BoxDecoration(
                color: Colors.orange.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(10.r),
                border: Border.all(color: Colors.orange.withValues(alpha: 0.25)),
              ),
              child: Row(
                children: [
                  Icon(Icons.schedule, size: 18.sp, color: Colors.orange.shade800),
                  SizedBox(width: 8.w),
                  Expanded(
                    child: Text(
                      'Giờ đề xuất: ${q.proposedPickupLabel}',
                      style: TextStyle(fontSize: 12.sp, fontWeight: FontWeight.w600, color: Colors.orange.shade900),
                    ),
                  ),
                ],
              ),
            ),
          ],
          if (showAction) ...[
            SizedBox(height: 10.h),
            if (!viewOnly && onPrimaryAction != null && primaryActionLabel != null) ...[
              SmoothCtaButton(
                label: isConfirming ? 'Đang chốt...' : primaryActionLabel,
                isLoading: isConfirming,
                onPressed: isConfirming ? null : onPrimaryAction,
              ),
              SizedBox(height: 8.h),
            ],
            SmoothCtaButton(
              label: 'Xem chi tiết báo giá',
              showArrow: false,
              outlined: true,
              onPressed: () => _openQuoteDetail(q),
            ),
            if (viewOnly) ...[
              SizedBox(height: 6.h),
              Text(
                'Nhà xe này không có lịch phù hợp với giờ bạn chọn.',
                style: TextStyle(fontSize: 11.sp, color: Colors.red.shade700, height: 1.3),
              ),
            ],
          ],
        ],
      ),
    );
  }

  Widget _scheduleFitChip(UniMoveColors c, ProviderQuoteResponse q) {
    final (bg, fg) = switch (q.scheduleFit) {
      QuoteScheduleFit.exactMatch => (c.primary.withValues(alpha: 0.12), c.primary),
      QuoteScheduleFit.alternateProposed => (Colors.orange.withValues(alpha: 0.12), Colors.orange.shade800),
      QuoteScheduleFit.unavailable => (Colors.red.withValues(alpha: 0.1), Colors.red.shade700),
    };
    final detail = switch (q.scheduleFit) {
      QuoteScheduleFit.exactMatch => q.scheduleFit.label,
      QuoteScheduleFit.alternateProposed =>
        '${q.scheduleFit.label}${q.proposedPickupLabel != null ? ': ${q.proposedPickupLabel}' : ''}',
      QuoteScheduleFit.unavailable => q.scheduleFit.label,
    };
    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 8.h),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(10.r),
      ),
      child: Text(
        detail,
        style: TextStyle(fontSize: 11.sp, fontWeight: FontWeight.w600, color: fg),
      ),
    );
  }

  Widget _alternateScheduleSection(UniMoveColors c, QuoteRequestSnapshot snap) {
    final q = snap.confirmedQuote;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Nhà xe đề xuất giờ khác', style: TextStyle(fontSize: 18.sp, fontWeight: FontWeight.w800)),
        SizedBox(height: 12.h),
        if (q != null) _quoteCard(c, q),
        if (snap.requestedPickupLabel != null) ...[
          SizedBox(height: 10.h),
          _scheduleInfoCard(c, 'Bạn chọn: ${snap.requestedPickupLabel}'),
        ],
        if (q?.proposedPickupLabel != null) ...[
          SizedBox(height: 8.h),
          _scheduleInfoCard(c, 'Nhà xe đề xuất: ${q!.proposedPickupLabel}'),
        ],
        SizedBox(height: 12.h),
        Text(
          'Bạn có thể đồng ý giờ mới hoặc quay lại chọn nhà xe khác.',
          style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted, height: 1.35),
        ),
        SizedBox(height: 16.h),
        SmoothCtaButton(
          label: 'Đồng ý giờ đề xuất',
          onPressed: () async {
            try {
              await _repo.acceptAlternateSchedule(referenceId: widget.referenceId);
              if (!mounted) return;
              _load();
            } catch (e) {
              if (!mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
            }
          },
        ),
        SizedBox(height: 10.h),
        OutlinedButton(
          onPressed: () async {
            try {
              await _repo.declineAlternateSchedule(referenceId: widget.referenceId);
              if (!mounted) return;
              _load();
            } catch (e) {
              if (!mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
            }
          },
          child: const Text('Chọn nhà xe khác'),
        ),
      ],
    );
  }

  Widget _pickScheduleSection(UniMoveColors c, QuoteRequestSnapshot snap) {
    final q = snap.confirmedQuote;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Đã chốt nhà xe', style: TextStyle(fontSize: 18.sp, fontWeight: FontWeight.w800)),
        SizedBox(height: 12.h),
        if (q != null) _quoteCard(c, q),
        SizedBox(height: 8.h),
        Text(
          'Bước tiếp: chọn ngày chuyển trọ theo lịch trống của nhà xe.',
          style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted, height: 1.35),
        ),
        SizedBox(height: 16.h),
        SmoothCtaButton(
          label: 'Chọn ngày chuyển trọ',
          onPressed: () => context.go('/booking/quotes/${widget.referenceId}/schedule'),
        ),
      ],
    );
  }

  Widget _awaitingProviderSection(UniMoveColors c, QuoteRequestSnapshot snap) {
    final q = snap.confirmedQuote;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Đã gửi lịch chuyển trọ', style: TextStyle(fontSize: 18.sp, fontWeight: FontWeight.w800)),
        SizedBox(height: 12.h),
        if (q != null) _quoteCard(c, q),
        if (snap.scheduledSlotLabel != null) ...[
          SizedBox(height: 10.h),
          _scheduleInfoCard(c, snap.scheduledSlotLabel!),
        ],
        SizedBox(height: 16.h),
        Container(
          padding: EdgeInsets.all(16.w),
          decoration: BoxDecoration(color: c.chipBg, borderRadius: BorderRadius.circular(14.r)),
          child: Column(
            children: [
              Icon(Icons.hourglass_top_rounded, size: 40.sp, color: c.primary),
              SizedBox(height: 10.h),
              Text(
                'Đang chờ nhà xe xác nhận',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16.sp),
              ),
              SizedBox(height: 6.h),
              Text(
                'Nhà xe sẽ xem lịch bạn chọn và phản hồi trên app. '
                'Sau khi được xác nhận, bạn có thể nhắn tin và đặt cọc.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted, height: 1.4),
              ),
            ],
          ),
        ),
        SizedBox(height: 12.h),
        OutlinedButton.icon(
          onPressed: _load,
          icon: const Icon(Icons.refresh),
          label: const Text('Kiểm tra trạng thái'),
        ),
      ],
    );
  }

  Widget _providerAcceptedSection(UniMoveColors c, QuoteRequestSnapshot snap) {
    final q = snap.confirmedQuote;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          snap.orderId != null ? 'Đã chốt báo giá — đặt cọc giữ chỗ' : 'Nhà xe đã xác nhận lịch',
          style: TextStyle(fontSize: 18.sp, fontWeight: FontWeight.w800),
        ),
        SizedBox(height: 12.h),
        if (q != null) _quoteCard(c, q),
        if (snap.scheduledSlotLabel != null) ...[
          SizedBox(height: 10.h),
          _scheduleInfoCard(c, snap.scheduledSlotLabel!),
        ],
        SizedBox(height: 12.h),
        Text(
          'Trao đổi chi tiết qua chat. Đặt cọc để giữ chỗ — vận chuyển bắt đầu vào ngày đã hẹn.',
          style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted, height: 1.35),
        ),
        SizedBox(height: 16.h),
        OutlinedButton.icon(
          onPressed: () => _openChat(snap.conversationId),
          icon: const Icon(Icons.chat_bubble_outline),
          label: const Text('Nhắn tin với nhà xe'),
        ),
        SizedBox(height: 10.h),
        SmoothCtaButton(
          label: 'Đặt cọc giữ chỗ',
          onPressed: _payDeposit,
        ),
      ],
    );
  }

  Widget _depositPaidSection(UniMoveColors c, QuoteRequestSnapshot snap) {
    final q = snap.confirmedQuote;
    final confirmed = snap.providerTripConfirmed;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          confirmed ? 'Nhà xe đã nhận đơn' : 'Đã đặt cọc — chờ nhà xe xác nhận',
          style: TextStyle(fontSize: 18.sp, fontWeight: FontWeight.w800),
        ),
        SizedBox(height: 12.h),
        if (q != null) _quoteCard(c, q),
        if (snap.scheduledSlotLabel != null) ...[
          SizedBox(height: 10.h),
          _scheduleInfoCard(c, snap.scheduledSlotLabel!),
        ],
        SizedBox(height: 12.h),
        Container(
          padding: EdgeInsets.all(14.w),
          decoration: BoxDecoration(
            color: confirmed ? c.success.withValues(alpha: 0.12) : c.chipBg,
            borderRadius: BorderRadius.circular(14.r),
            border: confirmed ? Border.all(color: c.success.withValues(alpha: 0.3)) : null,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(
                    confirmed ? Icons.check_circle_rounded : Icons.hourglass_top_rounded,
                    color: confirmed ? c.success : c.primary,
                    size: 22.sp,
                  ),
                  SizedBox(width: 8.w),
                  Expanded(
                    child: Text(
                      confirmed ? 'Chuyến đã sẵn sàng' : 'Đang chờ nhà xe nhận đơn',
                      style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15.sp),
                    ),
                  ),
                ],
              ),
              SizedBox(height: 6.h),
              Text(
                confirmed
                    ? 'Nhà xe sẽ đến đúng khung giờ đã hẹn. Bạn có thể theo dõi chuyến trên màn Hoạt động.'
                    : 'Nhà xe sẽ xem đơn và nhận trên app. Trang tự cập nhật mỗi 3 giây.',
                style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted, height: 1.4),
              ),
            ],
          ),
        ),
        if (!confirmed) ...[
          SizedBox(height: 12.h),
          OutlinedButton.icon(
            onPressed: _load,
            icon: const Icon(Icons.refresh),
            label: const Text('Kiểm tra lại'),
          ),
        ],
        if (confirmed && snap.orderId != null) ...[
          SizedBox(height: 16.h),
          SmoothCtaButton(
            label: 'Theo dõi chuyến',
            onPressed: () => context.push('/orders/${snap.orderId}/tracking'),
          ),
        ],
        SizedBox(height: 10.h),
        OutlinedButton.icon(
          onPressed: () => _openChat(snap.conversationId),
          icon: const Icon(Icons.chat_bubble_outline),
          label: const Text('Nhắn tin với nhà xe'),
        ),
        SizedBox(height: 10.h),
        OutlinedButton.icon(
          onPressed: () => context.go('/home'),
          icon: const Icon(Icons.home_outlined),
          label: const Text('Về trang chủ'),
        ),
      ],
    );
  }

  Future<void> _payDeposit() async {
    final snap = _snapshot;
    if (snap == null || snap.confirmedQuote == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Chưa chốt nhà xe — không thể đặt cọc')),
      );
      return;
    }

    try {
      context.read<BookingFlowCubit>().prepareQuoteDepositPayment(snap);
      final paid = await context.push<bool>('/booking/payment');
      if (!mounted) return;
      if (paid == true) {
        await _load();
        if (!mounted) return;
        final refreshed = _snapshot;
        if (refreshed != null) await _showDepositSuccess(refreshed);
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  Future<void> _showDepositSuccess(QuoteRequestSnapshot snap) async {
    final c = UniMoveColors.of(context);
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: c.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20.r))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(24.w, 28.h, 24.w, 32.h),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.check_circle_rounded, color: c.primary, size: 56.sp),
            SizedBox(height: 16.h),
            Text(
              'Đặt cọc thành công!',
              style: TextStyle(fontSize: 20.sp, fontWeight: FontWeight.w800),
            ),
            SizedBox(height: 10.h),
            Text(
              'Chuyến chuyển ${snap.scheduledSlotLabel ?? ''} đã được giữ. '
              'Theo dõi tại tab Hoạt động — bạn sẽ được nhắc khi đến ngày chuyển.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13.sp, color: c.onSurfaceMuted, height: 1.45),
            ),
            SizedBox(height: 24.h),
            SmoothCtaButton(
              label: 'Về trang chủ',
              showArrow: false,
              onPressed: () {
                Navigator.pop(ctx);
                context.go('/home');
              },
            ),
            SizedBox(height: 10.h),
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Ở lại tiến trình'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _scheduleInfoCard(UniMoveColors c, String label) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(12.w),
      decoration: BoxDecoration(
        color: c.chipBg,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: c.primary.withValues(alpha: 0.25)),
      ),
      child: Row(
        children: [
          Icon(Icons.event_available, color: c.primary, size: 20.sp),
          SizedBox(width: 10.w),
          Expanded(
            child: Text(
              'Lịch chuyển: $label',
              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14.sp),
            ),
          ),
        ],
      ),
    );
  }

  Widget _inProgressSection(UniMoveColors c, QuoteRequestSnapshot snap) {
    final q = snap.confirmedQuote;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Hôm nay là ngày chuyển', style: TextStyle(fontSize: 18.sp, fontWeight: FontWeight.w800)),
        if (q != null) ...[
          SizedBox(height: 12.h),
          Text('${q.providerName} · ${_money(q.totalPrice)}', style: TextStyle(fontSize: 14.sp)),
        ],
        if (snap.scheduledSlotLabel != null) ...[
          SizedBox(height: 10.h),
          _scheduleInfoCard(c, snap.scheduledSlotLabel!),
        ],
        SizedBox(height: 16.h),
        if (snap.conversationId != null) ...[
          SmoothCtaButton(
            label: 'Nhắn tin với tài xế',
            onPressed: () => context.push('/chat/${snap.conversationId}'),
          ),
          SizedBox(height: 10.h),
        ],
        SmoothCtaButton(
          label: 'Theo dõi tiến trình',
          onPressed: () {
            if (snap.orderId != null) {
              context.push('/orders/${snap.orderId}/tracking');
            }
          },
        ),
      ],
    );
  }

  Widget _completedSection(UniMoveColors c) {
    return Container(
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(color: c.surface, borderRadius: BorderRadius.circular(14.r), border: Border.all(color: c.border)),
      child: Text(
        'Chuyến đã hoàn thành. Không thể nhắn tin thêm để giao dịch được bảo vệ trên app.',
        style: TextStyle(fontSize: 13.sp, color: c.onSurfaceMuted, height: 1.4),
      ),
    );
  }

  Future<void> _openChat(String? conversationId) async {
    var convId = conversationId;
    if (convId == null) {
      final refreshed = await _repo.fetch(widget.referenceId);
      convId = refreshed?.conversationId;
    }
    if (!mounted) return;
    if (convId != null) {
      context.push('/chat/$convId');
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Chat chưa sẵn sàng — kéo xuống để làm mới')),
    );
  }

  Future<void> _confirmExactQuote(ProviderQuoteResponse q) async {
    setState(() => _confirmingQuoteId = q.id);
    try {
      await _repo.confirmQuoteWithPickupTime(
        referenceId: widget.referenceId,
        quoteId: q.id,
      );
      if (!mounted) return;
      await _load();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Đã chốt ${q.providerName} — chờ nhà xe xác nhận lịch')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _confirmingQuoteId = null);
    }
  }

  Future<void> _confirmAlternateQuote(ProviderQuoteResponse q) async {
    final pickupAt = await _pickAlternateTime(q);
    if (pickupAt == null || !mounted) return;

    setState(() => _confirmingQuoteId = q.id);
    try {
      await _repo.confirmQuoteWithPickupTime(
        referenceId: widget.referenceId,
        quoteId: q.id,
        pickupAt: pickupAt,
      );
      if (!mounted) return;
      await _load();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Đã chốt ${q.providerName} lúc ${formatQuotePickupLabel(pickupAt)} — chờ nhà xe xác nhận',
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _confirmingQuoteId = null);
    }
  }

  Future<DateTime?> _pickAlternateTime(ProviderQuoteResponse q) async {
    final proposed = q.proposedPickupAt;
    if (proposed == null) return null;

    final options = <DateTime>{
      proposed,
      proposed.subtract(const Duration(minutes: 30)),
      proposed.add(const Duration(minutes: 30)),
      proposed.add(const Duration(hours: 1)),
    }.toList()
      ..sort();

    final c = UniMoveColors.of(context);
    return showModalBottomSheet<DateTime>(
      context: context,
      backgroundColor: c.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20.r))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(20.w, 20.h, 20.w, 28.h),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Chọn giờ chuyển', style: TextStyle(fontSize: 18.sp, fontWeight: FontWeight.w800)),
            SizedBox(height: 6.h),
            Text(
              'Giá ${_money(q.totalPrice)} áp dụng khi bạn chốt với một trong các khung giờ sau. '
              'Nhà xe sẽ xác nhận lại trên app.',
              style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted, height: 1.35),
            ),
            SizedBox(height: 14.h),
            ...options.map(
              (dt) => ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Icon(
                  dt == proposed ? Icons.recommend_outlined : Icons.schedule_outlined,
                  color: c.primary,
                ),
                title: Text(formatQuotePickupLabel(dt), style: TextStyle(fontWeight: FontWeight.w600)),
                subtitle: dt == proposed ? const Text('Giờ nhà xe đề xuất') : null,
                onTap: () => Navigator.pop(ctx, dt),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _openQuoteDetail(ProviderQuoteResponse q) async {
    final changed = await context.push<bool>(
      '/booking/quotes/${widget.referenceId}/offer/${q.id}',
    );
    if (changed == true && mounted) await _load();
  }

  void _openReviews(BuildContext context, ProviderQuoteResponse q) {
    showProviderReviewsSheet(
      context,
      providerName: q.providerName,
      subtitle: q.vehicleLabel,
      stats: ProviderReviewStats.from(
        averageRating: q.rating,
        totalCount: q.reviewCount,
        reviews: q.recentReviews,
      ),
    );
  }

  String _money(int v) {
    final s = v.toString();
    final buf = StringBuffer();
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buf.write('.');
      buf.write(s[i]);
    }
    return '$bufđ';
  }
}
