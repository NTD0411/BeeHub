import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/booking_scaffold.dart';
import '../../../../core/widgets/smooth_cta_button.dart';
import '../cubit/booking_flow_cubit.dart';
import '../cubit/booking_flow_state.dart';

/// Chọn ngày giờ lấy đồ — nhà xe chỉ bắt đầu vận chuyển đúng khung đã đặt.
class MoveSchedulePage extends StatefulWidget {
  const MoveSchedulePage({super.key});

  @override
  State<MoveSchedulePage> createState() => _MoveSchedulePageState();
}

class _MoveSchedulePageState extends State<MoveSchedulePage> {
  static const _slotHours = [7, 8, 9, 13, 14, 15, 16];

  late DateTime _selectedDay;
  late TimeOfDay _selectedTime;
  String? _error;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    final cubit = context.read<BookingFlowCubit>();
    final existing = cubit.state.scheduledPickupAt;
    if (existing != null) {
      _selectedDay = DateTime(existing.year, existing.month, existing.day);
      _selectedTime = TimeOfDay(hour: existing.hour, minute: existing.minute);
    } else {
      final suggested = BookingFlowCubit.defaultPickupSuggestion();
      _selectedDay = DateTime(suggested.year, suggested.month, suggested.day);
      _selectedTime = TimeOfDay(hour: suggested.hour, minute: suggested.minute);
      cubit.setScheduledPickup(suggested);
    }
  }

  DateTime get _combined =>
      DateTime(_selectedDay.year, _selectedDay.month, _selectedDay.day, _selectedTime.hour, _selectedTime.minute);

  void _continueCombo(BookingFlowCubit cubit) {
    _applySchedule(cubit);
    if (!BookingFlowCubit.isValidPickupTime(_combined) || !mounted) return;
    context.push('/booking/packages');
  }

  Future<void> _submitQuote(BookingFlowCubit cubit) async {
    _applySchedule(cubit);
    if (!BookingFlowCubit.isValidPickupTime(_combined)) return;

    setState(() => _submitting = true);
    try {
      final result = await cubit.submitQuoteRequest();
      if (!mounted) return;
      final photosParam = result.photoUploadFailed ? '?photos=failed' : '';
      context.go('/booking/quotes/${result.referenceId}/progress$photosParam');
    } catch (e) {
      if (!mounted) return;
      setState(() => _submitting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Không gửi được yêu cầu: $e')),
      );
    }
  }

  void _applySchedule(BookingFlowCubit cubit) {
    final value = _combined;
    if (!BookingFlowCubit.isValidPickupTime(value)) {
      setState(() => _error = 'Chọn thời gian sau ít nhất 2 giờ nữa');
      return;
    }
    setState(() => _error = null);
    cubit.setScheduledPickup(value);
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final first = DateTime(now.year, now.month, now.day);
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDay.isBefore(first) ? first : _selectedDay,
      firstDate: first,
      lastDate: first.add(const Duration(days: 30)),
      helpText: 'Chọn ngày lấy đồ',
    );
    if (picked == null || !mounted) return;
    setState(() => _selectedDay = picked);
    _applySchedule(context.read<BookingFlowCubit>());
  }

  Future<void> _pickCustomTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: _selectedTime,
      helpText: 'Chọn giờ lấy đồ',
    );
    if (picked == null || !mounted) return;
    setState(() => _selectedTime = picked);
    _applySchedule(context.read<BookingFlowCubit>());
  }

  void _selectSlot(int hour) {
    setState(() => _selectedTime = TimeOfDay(hour: hour, minute: 0));
    _applySchedule(context.read<BookingFlowCubit>());
  }

  String _dayLabel(DateTime day) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final picked = DateTime(day.year, day.month, day.day);
    if (picked == today) return 'Hôm nay';
    if (picked == today.add(const Duration(days: 1))) return 'Ngày mai';
    return '${day.day.toString().padLeft(2, '0')}/${day.month.toString().padLeft(2, '0')}/${day.year}';
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);

    return BlocBuilder<BookingFlowCubit, BookingFlowState>(
      builder: (context, state) {
        final cubit = context.read<BookingFlowCubit>();

        return BookingScaffold(
          title: 'Chọn ngày giờ',
          body: ListView(
            padding: EdgeInsets.fromLTRB(20.w, 8.h, 20.w, 120.h),
            children: [
              _infoBanner(c, state),
              SizedBox(height: 16.h),
              _routeSummary(c, state),
              SizedBox(height: 20.h),
              Text(
                'Ngày lấy đồ',
                style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w700, color: c.onSurface),
              ),
              SizedBox(height: 10.h),
              Material(
                color: c.surface,
                borderRadius: BorderRadius.circular(14.r),
                child: InkWell(
                  borderRadius: BorderRadius.circular(14.r),
                  onTap: _pickDate,
                  child: Container(
                    width: double.infinity,
                    padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 14.h),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(14.r),
                      border: Border.all(color: c.border),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.calendar_month_outlined, color: c.primary, size: 22.sp),
                        SizedBox(width: 10.w),
                        Expanded(
                          child: Text(
                            _dayLabel(_selectedDay),
                            style: TextStyle(fontSize: 15.sp, fontWeight: FontWeight.w600, color: c.onSurface),
                          ),
                        ),
                        Icon(Icons.chevron_right, color: c.onSurfaceMuted),
                      ],
                    ),
                  ),
                ),
              ),
              SizedBox(height: 20.h),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Giờ lấy đồ',
                      style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.w700, color: c.onSurface),
                    ),
                  ),
                  TextButton(
                    onPressed: _pickCustomTime,
                    child: Text('Chọn giờ khác', style: TextStyle(color: c.primary, fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
              SizedBox(height: 8.h),
              Wrap(
                spacing: 8.w,
                runSpacing: 8.h,
                children: _slotHours.map((h) {
                  final selected = _selectedTime.hour == h && _selectedTime.minute == 0;
                  return ChoiceChip(
                    label: Text('${h.toString().padLeft(2, '0')}:00'),
                    selected: selected,
                    onSelected: (_) => _selectSlot(h),
                    selectedColor: c.primary,
                    labelStyle: TextStyle(
                      color: selected ? Colors.white : c.onSurface,
                      fontWeight: FontWeight.w600,
                    ),
                  );
                }).toList(),
              ),
              SizedBox(height: 12.h),
              Container(
                width: double.infinity,
                padding: EdgeInsets.all(14.w),
                decoration: BoxDecoration(
                  color: c.primaryContainer,
                  borderRadius: BorderRadius.circular(14.r),
                  border: Border.all(color: c.primary.withValues(alpha: 0.25)),
                ),
                child: Row(
                  children: [
                    Icon(Icons.schedule, color: c.primary, size: 22.sp),
                    SizedBox(width: 10.w),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Dự kiến bắt đầu: ${state.scheduledPickupLabel}',
                            style: TextStyle(fontSize: 14.sp, fontWeight: FontWeight.w700, color: c.onSurface),
                          ),
                          SizedBox(height: 4.h),
                          Text(
                            state.isComboBooking
                                ? 'Nhà xe chỉ đến lấy đồ đúng khung giờ — không chạy sớm.'
                                : 'Khung giờ lấy đồ — nhà xe sẽ đến đúng lịch sau khi bạn chọn đối tác.',
                            style: TextStyle(fontSize: 12.sp, color: c.onSurfaceMuted, height: 1.35),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              if (_error != null) ...[
                SizedBox(height: 10.h),
                Text(_error!, style: TextStyle(fontSize: 12.sp, color: Colors.red.shade700)),
              ],
            ],
          ),
          bottom: SafeArea(
            child: Padding(
              padding: EdgeInsets.fromLTRB(20.w, 8.h, 20.w, 16.h),
              child: SmoothCtaButton(
                label: _submitting
                    ? 'Đang gửi...'
                    : (state.isComboBooking ? 'Tiếp tục chọn combo' : 'Gửi yêu cầu báo giá'),
                onPressed: _submitting
                    ? null
                    : () {
                        if (state.isComboBooking) {
                          _continueCombo(cubit);
                        } else {
                          _submitQuote(cubit);
                        }
                      },
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _infoBanner(UniMoveColors c, BookingFlowState state) {
    return Container(
      padding: EdgeInsets.all(14.w),
      decoration: BoxDecoration(
        color: c.chipBg,
        borderRadius: BorderRadius.circular(14.r),
        border: Border.all(color: c.primary.withValues(alpha: 0.25)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.event_available_outlined, size: 20.sp, color: c.primary),
          SizedBox(width: 10.w),
          Expanded(
            child: Text(
              state.isComboBooking
                  ? 'Combo niêm yết — giá cố định, nhà xe đến đúng khung giờ bạn chọn.'
                  : 'Bước sau: gửi yêu cầu — các nhà xe Đà Nẵng sẽ báo giá theo khung giờ này.',
              style: TextStyle(fontSize: 12.sp, color: c.onSurface, height: 1.35),
            ),
          ),
        ],
      ),
    );
  }

  Widget _routeSummary(UniMoveColors c, BookingFlowState state) {
    return Container(
      padding: EdgeInsets.all(14.w),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(16.r),
        border: Border.all(color: c.border),
      ),
      child: Column(
        children: [
          _routeLine(Icons.trip_origin, c.primary, state.pickup),
          Padding(
            padding: EdgeInsets.only(left: 11.w),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Container(width: 2, height: 20.h, color: c.border),
            ),
          ),
          _routeLine(Icons.location_on, c.accentGreen, state.destination),
        ],
      ),
    );
  }

  Widget _routeLine(IconData icon, Color color, String text) {
    return Row(
      children: [
        Icon(icon, size: 18.sp, color: color),
        SizedBox(width: 10.w),
        Expanded(
          child: Text(text, style: TextStyle(fontSize: 14.sp, fontWeight: FontWeight.w600)),
        ),
      ],
    );
  }
}
