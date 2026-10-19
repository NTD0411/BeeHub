import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/smooth_cta_button.dart';
import '../../data/provider_availability_repository.dart';
import '../../data/quote_progress_repository.dart';
import '../../domain/quote_models.dart';

/// Chọn ngày chuyển trọ — chỉ hiện slot còn trống của nhà xe đã chốt.
class QuoteMoveSchedulePage extends StatefulWidget {
  const QuoteMoveSchedulePage({super.key, required this.referenceId});

  final String referenceId;

  @override
  State<QuoteMoveSchedulePage> createState() => _QuoteMoveSchedulePageState();
}

class _QuoteMoveSchedulePageState extends State<QuoteMoveSchedulePage> {
  final _quoteRepo = QuoteProgressRepository.instance;
  final _availabilityRepo = ProviderAvailabilityRepository.instance;

  QuoteRequestSnapshot? _snapshot;
  List<MoveDayAvailability> _days = [];
  MoveDayAvailability? _selectedDay;
  MoveTimeSlot? _selectedSlot;
  bool _loading = true;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final snap = await _quoteRepo.fetch(widget.referenceId);
    if (snap == null || snap.confirmedQuote == null) {
      if (!mounted) return;
      setState(() => _loading = false);
      return;
    }

    final days = await _availabilityRepo.fetchAvailability(
      providerId: snap.confirmedQuote!.providerId,
    );

    if (!mounted) return;
    setState(() {
      _snapshot = snap;
      _days = days;
      _selectedDay = days.isNotEmpty ? days.first : null;
      _selectedSlot = null;
      _loading = false;
    });
  }

  Future<void> _confirmSlot() async {
    final slot = _selectedSlot;
    if (slot == null) return;

    setState(() => _submitting = true);
    try {
      await _quoteRepo.selectMoveSlot(referenceId: widget.referenceId, slot: slot);
      if (!mounted) return;
      context.go('/booking/quotes/${widget.referenceId}/progress');
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    if (_loading) {
      return Scaffold(
        body: Center(child: CircularProgressIndicator(color: c.primary)),
      );
    }

    final snap = _snapshot;
    final quote = snap?.confirmedQuote;
    if (snap == null || quote == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Chọn lịch chuyển trọ')),
        body: Center(
          child: Text('Chưa chốt nhà xe', style: TextStyle(color: c.onSurfaceMuted)),
        ),
      );
    }

    final daySlots = _selectedDay?.slots ?? [];

    return Scaffold(
      backgroundColor: c.background,
      appBar: AppBar(
        backgroundColor: c.surface,
        surfaceTintColor: Colors.transparent,
        title: Text(
          'Chọn ngày chuyển trọ',
          style: TextStyle(fontWeight: FontWeight.w700, color: c.onSurface),
        ),
      ),
      body: ListView(
        padding: EdgeInsets.fromLTRB(20.w, 12.h, 20.w, 120.h),
        children: [
          Container(
            padding: EdgeInsets.all(14.w),
            decoration: BoxDecoration(
              color: c.surface,
              borderRadius: BorderRadius.circular(14.r),
              border: Border.all(color: c.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Nhà xe: ${quote.providerName}',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15.sp),
                ),
                SizedBox(height: 4.h),
                Text(
                  'Lịch hiển thị theo khung giờ còn trống của nhà xe này',
                  style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted),
                ),
              ],
            ),
          ),
          SizedBox(height: 20.h),
          Text('Chọn ngày', style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w800)),
          SizedBox(height: 4.h),
          Text(
            'Ngày xám = nhà xe không có slot trống',
            style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted),
          ),
          SizedBox(height: 12.h),
          if (_days.isEmpty)
            Text(
              'Nhà xe chưa mở lịch trong 14 ngày tới',
              style: TextStyle(color: c.onSurfaceMuted),
            )
          else
            SizedBox(
              height: 88.h,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _days.length,
                separatorBuilder: (_, __) => SizedBox(width: 8.w),
                itemBuilder: (_, i) {
                  final day = _days[i];
                  final selected = _selectedDay?.date == day.date;
                  return _dayChip(c, day, selected);
                },
              ),
            ),
          SizedBox(height: 24.h),
          Text('Khung giờ', style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w800)),
          SizedBox(height: 4.h),
          Text(
            'Chỉ chọn được slot còn trống (màu xanh)',
            style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted),
          ),
          SizedBox(height: 12.h),
          Wrap(
            spacing: 8.w,
            runSpacing: 8.h,
            children: daySlots.map((slot) => _slotChip(c, slot)).toList(),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: EdgeInsets.fromLTRB(20.w, 8.h, 20.w, 16.h),
          child: SmoothCtaButton(
            label: _submitting
                ? 'Đang lưu...'
                : (_selectedSlot == null ? 'Chọn khung giờ' : 'Xác nhận lịch chuyển trọ'),
            onPressed: _selectedSlot == null || _submitting ? null : _confirmSlot,
          ),
        ),
      ),
    );
  }

  Widget _dayChip(UniMoveColors c, MoveDayAvailability day, bool selected) {
    final label = _formatDayLabel(day.date);

    return Material(
      color: selected ? c.primary : c.surface,
      borderRadius: BorderRadius.circular(14.r),
      child: InkWell(
        borderRadius: BorderRadius.circular(14.r),
        onTap: () => setState(() {
          _selectedDay = day;
          _selectedSlot = null;
        }),
        child: Container(
          width: 72.w,
          padding: EdgeInsets.symmetric(vertical: 10.h, horizontal: 8.w),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14.r),
            border: Border.all(color: selected ? c.primary : c.border),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 11.sp,
              fontWeight: FontWeight.w700,
              color: selected ? Colors.white : c.onSurface,
              height: 1.3,
            ),
          ),
        ),
      ),
    );
  }

  String _formatDayLabel(DateTime date) {
    const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    final wd = weekdays[(date.weekday - 1).clamp(0, 6)];
    final dd = date.day.toString().padLeft(2, '0');
    final mm = date.month.toString().padLeft(2, '0');
    return '$wd\n$dd/$mm';
  }

  Widget _slotChip(UniMoveColors c, MoveTimeSlot slot) {
    final available = slot.available;
    final selected = _selectedSlot?.id == slot.id;

    return ChoiceChip(
      label: Text(slot.label, style: TextStyle(fontSize: 12.sp)),
      selected: selected,
      onSelected: available ? (_) => setState(() => _selectedSlot = slot) : null,
      selectedColor: c.primary,
      disabledColor: c.surfaceTint,
      labelStyle: TextStyle(
        color: !available ? c.onSurfaceMuted : (selected ? Colors.white : c.onSurface),
        fontWeight: FontWeight.w600,
        decoration: !available ? TextDecoration.lineThrough : null,
      ),
    );
  }
}
