import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shadcn_ui/shadcn_ui.dart';

import '../../../../core/network/api_client.dart';
import '../../../../core/theme/uni_move_colors.dart';
import '../../../../core/widgets/shad_screen_scope.dart';

class SchedulePage extends ConsumerStatefulWidget {
  const SchedulePage({super.key});

  @override
  ConsumerState<SchedulePage> createState() => _SchedulePageState();
}

class _SchedulePageState extends ConsumerState<SchedulePage> {
  static const _dayLabels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
  static const _districts = ['Quận 1', 'Quận 3', 'Quận 7', 'Quận Bình Thạnh', 'Quận Tân Bình', 'TP. Thủ Đức'];

  // UI index 0 = Thứ 2 (Mon), 6 = CN (Sun)
  // API day_of_week: 0 = Sun, 1 = Mon … 6 = Sat
  static int _toApiDay(int uiIndex) => (uiIndex + 1) % 7;
  static int _toUiIndex(int apiDay) => (apiDay + 6) % 7;

  bool _online = true;
  bool _loading = true;
  bool _saving = false;
  int _selectedDay = 0;
  late Map<int, _DaySchedule> _daySchedules = {
    for (var i = 0; i < _dayLabels.length; i++)
      i: _DaySchedule(
        enabled: i <= 4,
        start: const TimeOfDay(hour: 8, minute: 0),
        end: const TimeOfDay(hour: 17, minute: 0),
      ),
  };
  final Set<String> _areas = {'Quận 1', 'Quận 7', 'Quận Bình Thạnh'};

  @override
  void initState() {
    super.initState();
    _loadSchedule();
  }

  Future<void> _loadSchedule() async {
    try {
      final api = ref.read(apiClientProvider);
      final envelope = await api.guard(() => api.get('/providers/me/schedule'));
      final days = envelope['data'] as List<dynamic>? ?? [];
      final Map<int, _DaySchedule> loaded = {
        for (var i = 0; i < _dayLabels.length; i++)
          i: _DaySchedule(
            enabled: false,
            start: const TimeOfDay(hour: 8, minute: 0),
            end: const TimeOfDay(hour: 17, minute: 0),
          ),
      };
      for (final day in days) {
        final d = Map<String, dynamic>.from(day as Map);
        final apiDay = (d['day_of_week'] as num?)?.toInt() ?? 0;
        final uiIdx = _toUiIndex(apiDay);
        final slots = d['slots'] as List<dynamic>? ?? [];
        if (slots.isNotEmpty) {
          final slot = Map<String, dynamic>.from(slots.last as Map);
          final start = _parseTime(slot['start_time'] as String? ?? '08:00');
          final end = _parseTime(slot['end_time'] as String? ?? '17:00');
          final isAvailable = slot['is_available'] as bool? ?? true;
          loaded[uiIdx] = _DaySchedule(enabled: isAvailable, start: start, end: end);
        }
      }
      if (mounted) setState(() { _daySchedules = loaded; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _saveSchedule() async {
    setState(() => _saving = true);
    try {
      final slots = <Map<String, dynamic>>[];
      for (var i = 0; i < _dayLabels.length; i++) {
        final s = _daySchedules[i]!;
        slots.add({
          'day_of_week': _toApiDay(i),
          'start_time': _timeText(s.start),
          'end_time': _timeText(s.end),
          'is_available': s.enabled,
        });
      }
      final api = ref.read(apiClientProvider);
      await api.guard(() => api.patch('/providers/me/schedule', body: {'slots': slots}));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đã lưu lịch làm việc')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi: $e')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  static TimeOfDay _parseTime(String s) {
    final parts = s.split(':');
    if (parts.length < 2) return const TimeOfDay(hour: 8, minute: 0);
    return TimeOfDay(hour: int.tryParse(parts[0]) ?? 8, minute: int.tryParse(parts[1]) ?? 0);
  }

  @override
  Widget build(BuildContext context) {
    final c = UniMoveColors.of(context);
    final monday = DateTime.now().subtract(Duration(days: DateTime.now().weekday - 1));
    final today = DateTime.now().weekday - 1;
    final todayHours = _hoursLabel(_daySchedules[today] ?? _daySchedules[0]!);

    return ShadScreenScope(
      builder: (_, theme) {
        return Scaffold(
          backgroundColor: c.background,
          appBar: AppBar(
            backgroundColor: c.background,
            surfaceTintColor: Colors.transparent,
            scrolledUnderElevation: 0,
            elevation: 0,
            iconTheme: IconThemeData(color: c.onSurface),
            title: Text('Lịch làm việc', style: TextStyle(color: c.onSurface, fontWeight: FontWeight.w700)),
          ),
          body: ListView(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
            children: [
              _statusCard(theme, c),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(child: _statCard(theme, c, LucideIcons.clock, todayHours, 'GIỜ LÀM VIỆC HÔM NAY')),
                  const SizedBox(width: 12),
                  Expanded(child: _statCard(theme, c, LucideIcons.calendarCheck, _loading ? '...' : 'OK', 'LỊCH ĐÃ ĐỒNG BỘ')),
                ],
              ),
              const SizedBox(height: 24),
              _sectionRow(theme, c, 'Lịch làm việc hàng tuần', 'Thiết lập thời gian bạn sẵn sàng nhận đơn.'),
              const SizedBox(height: 12),
              SizedBox(
                height: 144,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: _dayLabels.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 10),
                  itemBuilder: (_, i) => _dayCard(theme, c, i, monday.add(Duration(days: i))),
                ),
              ),
              const SizedBox(height: 12),
              _dayEditor(theme, c),
              const SizedBox(height: 24),
              _sectionRow(theme, c, 'Khu vực hoạt động ưu tiên',
                  'Chọn các quận bạn muốn tối ưu lộ trình và nhận đơn gần nhất.'),
              const SizedBox(height: 12),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  ..._districts.map((d) => _areaChip(theme, c, d)),
                  _addAreaChip(theme, c),
                ],
              ),
              const SizedBox(height: 20),
              _mapPreview(theme, c),
            ],
          ),
        );
      },
    );
  }

  // ---------- Status ----------
  Widget _statusCard(ShadThemeData theme, UniMoveColors c) {
    return _card(
      c,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Trạng thái hiện tại',
              style: theme.textTheme.p.copyWith(fontWeight: FontWeight.w800, color: c.onSurface)),
          const SizedBox(height: 4),
          Text('Bật để bắt đầu nhận đơn vận chuyển mới.',
              style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted)),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: _online ? c.iconBgTertiary : c.surfaceHigh,
              borderRadius: BorderRadius.circular(30),
              border: Border.all(color: _online ? c.success : c.border),
            ),
            child: Row(
              children: [
                Icon(_online ? LucideIcons.circleCheck : LucideIcons.circleDashed,
                    size: 16, color: _online ? c.success : c.onSurfaceMuted),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(_online ? 'Đang hoạt động' : 'Đang nghỉ',
                      style: theme.textTheme.p.copyWith(
                          fontWeight: FontWeight.w700, color: _online ? c.success : c.onSurfaceMuted)),
                ),
                Switch.adaptive(
                  value: _online,
                  activeThumbColor: c.primary,
                  onChanged: (v) => setState(() => _online = v),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _statCard(ShadThemeData theme, UniMoveColors c, IconData icon, String value, String label) {
    return _card(
      c,
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Icon(icon, color: c.primary, size: 22),
          const SizedBox(height: 8),
          Text(value, style: theme.textTheme.h2.copyWith(fontWeight: FontWeight.w800, color: c.onSurface)),
          const SizedBox(height: 2),
          Text(label,
              textAlign: TextAlign.center,
              style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted, fontSize: 10, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _sectionRow(ShadThemeData theme, UniMoveColors c, String title, String subtitle) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: theme.textTheme.large.copyWith(fontWeight: FontWeight.w800, color: c.onSurface)),
              const SizedBox(height: 4),
              Text(subtitle, style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted, height: 1.35)),
            ],
          ),
        ),
        const SizedBox(width: 8),
        if (title.startsWith('Lịch'))
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: c.primary,
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: _saving ? null : _saveSchedule,
            icon: _saving
                ? const SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Icon(LucideIcons.save, size: 15),
            label: const Text('Lưu lịch'),
          ),
      ],
    );
  }

  Widget _dayCard(ShadThemeData theme, UniMoveColors c, int i, DateTime date) {
    final schedule = _daySchedules[i]!;
    final working = schedule.enabled;
    final selected = _selectedDay == i;
    return GestureDetector(
      onTap: () => setState(() => _selectedDay = i),
      onLongPress: () => setState(() => _daySchedules[i] = schedule.copyWith(enabled: !working)),
      child: Container(
        width: 92,
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: working ? c.surface : c.surfaceHigh,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: selected ? c.primary : (working ? c.primary.withValues(alpha: 0.4) : c.border),
            width: selected ? 1.6 : 1,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(_dayLabels[i], style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted, fontWeight: FontWeight.w600)),
            const SizedBox(height: 6),
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: working ? c.primary : c.border,
                shape: BoxShape.circle,
              ),
              alignment: Alignment.center,
              child: Text('${date.day}',
                  style: theme.textTheme.p.copyWith(
                      color: working ? Colors.white : c.onSurfaceMuted, fontWeight: FontWeight.w800)),
            ),
            const SizedBox(height: 6),
            Text(
              working ? '${_timeText(schedule.start)}\n${_timeText(schedule.end)}' : 'Nghỉ',
              textAlign: TextAlign.center,
              style: theme.textTheme.small.copyWith(
                color: working ? c.onSurface : c.onSurfaceMuted,
                fontWeight: FontWeight.w600,
                height: 1.15,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _dayEditor(ShadThemeData theme, UniMoveColors c) {
    final schedule = _daySchedules[_selectedDay]!;
    return _card(
      c,
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                'Thiết lập ${_dayLabels[_selectedDay]}',
                style: theme.textTheme.p.copyWith(fontWeight: FontWeight.w800, color: c.onSurface),
              ),
              const Spacer(),
              Switch.adaptive(
                value: schedule.enabled,
                activeThumbColor: c.primary,
                onChanged: (v) => setState(() => _daySchedules[_selectedDay] = schedule.copyWith(enabled: v)),
              ),
            ],
          ),
          Text(
            schedule.enabled ? 'Bạn có thể chỉnh giờ làm riêng cho ngày này.' : 'Ngày này đang tắt nhận đơn.',
            style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _timeButton(
                  theme,
                  c,
                  label: 'Bắt đầu',
                  value: _timeText(schedule.start),
                  enabled: schedule.enabled,
                  onTap: () => _pickTime(_selectedDay, isStart: true),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _timeButton(
                  theme,
                  c,
                  label: 'Kết thúc',
                  value: _timeText(schedule.end),
                  enabled: schedule.enabled,
                  onTap: () => _pickTime(_selectedDay, isStart: false),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _timeButton(
    ShadThemeData theme,
    UniMoveColors c, {
    required String label,
    required String value,
    required bool enabled,
    required VoidCallback onTap,
  }) {
    final tint = enabled ? c.primary : c.onSurfaceMuted;
    return OutlinedButton(
      onPressed: enabled ? onTap : null,
      style: OutlinedButton.styleFrom(
        side: BorderSide(color: enabled ? c.primary.withValues(alpha: 0.45) : c.border),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: theme.textTheme.small.copyWith(color: c.onSurfaceMuted)),
          const SizedBox(height: 2),
          Text(value, style: theme.textTheme.p.copyWith(color: tint, fontWeight: FontWeight.w800)),
        ],
      ),
    );
  }

  Future<void> _pickTime(int day, {required bool isStart}) async {
    final schedule = _daySchedules[day]!;
    final initial = isStart ? schedule.start : schedule.end;
    final picked = await showTimePicker(
      context: context,
      initialTime: initial,
      helpText: isStart ? 'Giờ bắt đầu' : 'Giờ kết thúc',
    );
    if (!mounted || picked == null) return;

    final next = isStart ? schedule.copyWith(start: picked) : schedule.copyWith(end: picked);
    if (_toMinutes(next.end) <= _toMinutes(next.start)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Giờ kết thúc phải lớn hơn giờ bắt đầu')),
      );
      return;
    }
    setState(() => _daySchedules[day] = next);
  }

  Widget _areaChip(ShadThemeData theme, UniMoveColors c, String label) {
    final selected = _areas.contains(label);
    return GestureDetector(
      onTap: () => setState(() {
        if (selected) {
          _areas.remove(label);
        } else {
          _areas.add(label);
        }
      }),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
        decoration: BoxDecoration(
          color: selected ? c.primary : c.surface,
          borderRadius: BorderRadius.circular(30),
          border: Border.all(color: selected ? c.primary : c.border),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(label,
                style: theme.textTheme.small.copyWith(
                    color: selected ? Colors.white : c.onSurface, fontWeight: FontWeight.w700)),
            if (selected) ...[
              const SizedBox(width: 6),
              const Icon(LucideIcons.circleCheck, size: 15, color: Colors.white),
            ],
          ],
        ),
      ),
    );
  }

  Widget _addAreaChip(ShadThemeData theme, UniMoveColors c) {
    return GestureDetector(
      onTap: () => ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Thêm khu vực — chọn trên bản đồ (sắp có)')),
      ),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(30),
          border: Border.all(color: c.primaryLight, style: BorderStyle.solid),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(LucideIcons.plus, size: 15, color: c.primaryLight),
            const SizedBox(width: 6),
            Text('Thêm khu vực',
                style: theme.textTheme.small.copyWith(color: c.primaryLight, fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    );
  }

  Widget _mapPreview(ShadThemeData theme, UniMoveColors c) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(18),
      child: Container(
        height: 170,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [c.surfaceTint, c.surfaceHigh],
          ),
          border: Border.all(color: c.border),
        ),
        child: Stack(
          children: [
            Positioned.fill(child: CustomPaint(painter: _MapGridPainter(c.border))),
            const Positioned(top: 36, left: 50, child: Icon(LucideIcons.mapPin, color: Color(0xFF2563EB), size: 26)),
            const Positioned(top: 80, left: 140, child: Icon(LucideIcons.mapPin, color: Color(0xFF2563EB), size: 22)),
            const Positioned(top: 54, right: 60, child: Icon(LucideIcons.mapPin, color: Color(0xFF2563EB), size: 24)),
            Positioned(
              left: 12,
              bottom: 12,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(color: c.surface, borderRadius: BorderRadius.circular(20)),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(LucideIcons.map, size: 14, color: c.primary),
                    const SizedBox(width: 6),
                    Text('Bản đồ khu vực ưu tiên',
                        style: theme.textTheme.small.copyWith(color: c.onSurface, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
            ),
            Positioned(
              right: 12,
              bottom: 12,
              child: Material(
                color: c.primary,
                shape: const CircleBorder(),
                child: InkWell(
                  customBorder: const CircleBorder(),
                  onTap: () => ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Mở bản đồ chọn khu vực (sắp có)')),
                  ),
                  child: const Padding(
                    padding: EdgeInsets.all(10),
                    child: Icon(LucideIcons.plus, color: Colors.white, size: 22),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _card(UniMoveColors c, {required Widget child, EdgeInsetsGeometry? padding}) {
    return Container(
      padding: padding ?? const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: c.border),
      ),
      child: child,
    );
  }

  static int _toMinutes(TimeOfDay t) => t.hour * 60 + t.minute;

  static String _timeText(TimeOfDay t) {
    final hh = t.hour.toString().padLeft(2, '0');
    final mm = t.minute.toString().padLeft(2, '0');
    return '$hh:$mm';
  }

  static String _hoursLabel(_DaySchedule s) {
    if (!s.enabled) return '0';
    final mins = _toMinutes(s.end) - _toMinutes(s.start);
    if (mins <= 0) return '0';
    final h = mins / 60;
    return h == h.roundToDouble() ? h.toInt().toString() : h.toStringAsFixed(1);
  }
}

class _DaySchedule {
  const _DaySchedule({
    required this.enabled,
    required this.start,
    required this.end,
  });

  final bool enabled;
  final TimeOfDay start;
  final TimeOfDay end;

  _DaySchedule copyWith({
    bool? enabled,
    TimeOfDay? start,
    TimeOfDay? end,
  }) {
    return _DaySchedule(
      enabled: enabled ?? this.enabled,
      start: start ?? this.start,
      end: end ?? this.end,
    );
  }
}

class _MapGridPainter extends CustomPainter {
  _MapGridPainter(this.color);
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color.withValues(alpha: 0.6)
      ..strokeWidth = 1;
    const step = 34.0;
    for (var x = 0.0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (var y = 0.0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant _MapGridPainter oldDelegate) => oldDelegate.color != color;
}
