import '../domain/quote_models.dart';

/// Lịch trống của nhà xe — Phase 1 mock theo providerId.
class ProviderAvailabilityRepository {
  ProviderAvailabilityRepository._();
  static final ProviderAvailabilityRepository instance = ProviderAvailabilityRepository._();

  Future<List<MoveDayAvailability>> fetchAvailability({
    required String providerId,
    int daysAhead = 14,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 280));
    final today = DateTime.now();
    final base = DateTime(today.year, today.month, today.day);
    final result = <MoveDayAvailability>[];

    for (var d = 1; d <= daysAhead; d++) {
      final date = base.add(Duration(days: d));
      final slots = _slotsFor(providerId, date);
      if (slots.any((s) => s.available)) {
        result.add(MoveDayAvailability(date: date, slots: slots));
      }
    }
    return result;
  }

  List<MoveTimeSlot> _slotsFor(String providerId, DateTime date) {
    final weekday = date.weekday;
    final seed = providerId.hashCode + date.day + date.month;

    // p1: T2–T6 sáng + chiều; p2: T7-CN; p3: xen kẽ
    final open = switch (providerId) {
      'p1' => weekday >= 1 && weekday <= 5,
      'p2' => weekday == 6 || weekday == 7,
      _ => weekday != 3 && (seed % 3 != 0),
    };

    if (!open) {
      return _daySlots(date, availableMask: [false, false, false, false]);
    }

    final mask = switch (providerId) {
      'p1' => [true, true, false, true],
      'p2' => [false, true, true, true],
      _ => [seed % 2 == 0, true, seed % 4 != 0, false],
    };
    return _daySlots(date, availableMask: mask);
  }

  List<MoveTimeSlot> _daySlots(DateTime date, {required List<bool> availableMask}) {
    const windows = [
      (8, 0, 10, 0),
      (10, 30, 12, 30),
      (14, 0, 16, 0),
      (16, 30, 18, 30),
    ];

    return List.generate(windows.length, (i) {
      final w = windows[i];
      final start = DateTime(date.year, date.month, date.day, w.$1, w.$2);
      final end = DateTime(date.year, date.month, date.day, w.$3, w.$4);
      final available = i < availableMask.length ? availableMask[i] : false;
      return MoveTimeSlot(
        id: '${date.toIso8601String()}-$i',
        start: start,
        end: end,
        available: available,
      );
    });
  }
}
