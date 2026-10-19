export interface AvailSlot {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available?: boolean;
}

export interface ScheduleDay {
  day_of_week: number;
  day_name: string;
  slots: AvailSlot[];
}

export interface ScheduleOrderLike {
  scheduled_pickup_time: string;
  estimated_duration?: number;
}

export interface FreeSegment {
  start: Date;
  end: Date;
  start_time: string;
  end_time: string;
}

export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.slice(0, 5).split(":").map(Number);
  return h * 60 + (m || 0);
}

export function normalizeTime(t: string): string {
  if (!t) return "08:00:00";
  if (t.length === 5) return `${t}:00`;
  return t;
}

export function formatTimeHHMM(d: Date): string {
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export function formatTimeRangeFromTimes(startTime: string, endTime: string): string {
  const fmt = (t: string) => {
    const mins = parseTimeToMinutes(t);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };
  return `${fmt(startTime)} - ${fmt(endTime)}`;
}

function parseTimeOnDay(day: Date, timeStr: string): Date {
  const mins = parseTimeToMinutes(timeStr);
  const d = new Date(day);
  d.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
  return d;
}

function splitRangeAround(
  range: { start: Date; end: Date },
  blockStart: Date,
  blockEnd: Date,
): { start: Date; end: Date }[] {
  if (blockEnd <= range.start || blockStart >= range.end) return [range];
  const out: { start: Date; end: Date }[] = [];
  if (blockStart > range.start) out.push({ start: range.start, end: blockStart });
  if (blockEnd < range.end) out.push({ start: blockEnd, end: range.end });
  return out;
}

export function getFreeSegmentsForDay(
  day: Date,
  slots: AvailSlot[],
  orders: ScheduleOrderLike[],
): FreeSegment[] {
  const available = slots.filter((s) => s.is_available !== false);
  const segments: FreeSegment[] = [];

  for (const slot of available) {
    let freeRanges = [{
      start: parseTimeOnDay(day, slot.start_time),
      end: parseTimeOnDay(day, slot.end_time),
    }];

    for (const order of orders) {
      if (!order.scheduled_pickup_time) continue;
      const oStart = new Date(order.scheduled_pickup_time);
      const oEnd = new Date(oStart.getTime() + (order.estimated_duration || 180) * 60 * 1000);
      freeRanges = freeRanges.flatMap((r) => splitRangeAround(r, oStart, oEnd));
    }

    for (const range of freeRanges) {
      if (range.end.getTime() - range.start.getTime() < 15 * 60 * 1000) continue;
      segments.push({
        start: range.start,
        end: range.end,
        start_time: normalizeTime(formatTimeHHMM(range.start)),
        end_time: normalizeTime(formatTimeHHMM(range.end)),
      });
    }
  }

  return segments.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export function buildAllSlots(
  scheduleDays: ScheduleDay[],
  targetDow: number,
  newDaySlots: { start_time: string; end_time: string }[],
): Record<string, unknown>[] {
  const others = scheduleDays.flatMap((d) =>
    d.day_of_week === targetDow
      ? []
      : d.slots.map((s) => ({
          day_of_week: d.day_of_week,
          start_time: normalizeTime(s.start_time),
          end_time: normalizeTime(s.end_time),
          is_available: s.is_available !== false,
        })),
  );
  const updated = newDaySlots.map((s) => ({
    day_of_week: targetDow,
    start_time: normalizeTime(s.start_time),
    end_time: normalizeTime(s.end_time),
    is_available: true,
  }));
  return [...others, ...updated];
}

export function validateDaySlots(
  slots: { start_time: string; end_time: string }[],
): string | null {
  if (!slots.length) return null;
  for (const s of slots) {
    if (parseTimeToMinutes(s.start_time) >= parseTimeToMinutes(s.end_time)) {
      return "Giờ kết thúc phải sau giờ bắt đầu";
    }
  }
  const sorted = [...slots].sort(
    (a, b) => parseTimeToMinutes(a.start_time) - parseTimeToMinutes(b.start_time),
  );
  for (let i = 1; i < sorted.length; i++) {
    if (parseTimeToMinutes(sorted[i].start_time) < parseTimeToMinutes(sorted[i - 1].end_time)) {
      return "Các khung giờ không được trùng nhau";
    }
  }
  return null;
}

export function slotsForWeekday(scheduleDays: ScheduleDay[], day: Date): AvailSlot[] {
  const dow = day.getDay();
  return scheduleDays.find((d) => d.day_of_week === dow)?.slots ?? [];
}

export const DAY_START_HOUR = 6;
export const DAY_END_HOUR = 22;
export const HOUR_HEIGHT_PX = 64;

export interface DayHourEvent {
  id: string;
  type: "order" | "free";
  start: Date;
  end: Date;
  order?: ScheduleOrderLike & {
    id: string;
    status?: string;
    pickup_address?: string;
    delivery_address?: string;
    total_price?: number;
  };
  segment?: FreeSegment;
}

export function buildDayHourEvents(
  day: Date,
  orders: (ScheduleOrderLike & { id: string; status?: string })[],
  freeSegments: FreeSegment[],
): DayHourEvent[] {
  const events: DayHourEvent[] = [
    ...orders.map((o) => {
      const start = new Date(o.scheduled_pickup_time);
      const end = new Date(start.getTime() + (o.estimated_duration || 180) * 60 * 1000);
      return { id: `order-${o.id}`, type: "order" as const, start, end, order: o };
    }),
    ...freeSegments.map((s, i) => ({
      id: `free-${i}-${s.start_time}`,
      type: "free" as const,
      start: s.start,
      end: s.end,
      segment: s,
    })),
  ];
  return events.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export function dayHourLabels(): number[] {
  return Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i);
}

export function eventTopPx(start: Date, day: Date): number {
  const dayStart = new Date(day);
  dayStart.setHours(DAY_START_HOUR, 0, 0, 0);
  const mins = (start.getTime() - dayStart.getTime()) / 60000;
  return Math.max(0, (mins / 60) * HOUR_HEIGHT_PX);
}

export function eventHeightPx(start: Date, end: Date): number {
  const mins = (end.getTime() - start.getTime()) / 60000;
  return Math.max(HOUR_HEIGHT_PX * 0.45, (mins / 60) * HOUR_HEIGHT_PX);
}

export function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}
