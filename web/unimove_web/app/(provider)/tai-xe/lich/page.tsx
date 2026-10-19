"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, Calendar, RefreshCw, CalendarCheck, Pencil, Zap,
} from "lucide-react";
import { ordersApi, providerApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { AvailabilityEditorDialog } from "@/components/provider/AvailabilityEditorDialog";
import { DayHourSchedule } from "@/components/provider/DayHourSchedule";
import {
  type ScheduleDay,
  getFreeSegmentsForDay,
  buildAllSlots,
  buildDayHourEvents,
  slotsForWeekday,
} from "@/lib/provider-schedule";

interface ScheduleOrder {
  id: string;
  order_number: string;
  status: string;
  pickup_address: string;
  delivery_address: string;
  scheduled_pickup_time: string;
  estimated_duration?: number;
  total_price?: number;
  customer?: { full_name: string; phone: string };
}

const TERTIARY = "#004f35";

const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const WEEKDAY_FULL   = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number) {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
}

function getCalendarDays(month: Date): (Date | null)[] {
  const first = startOfMonth(month);
  const last  = endOfMonth(month);
  const startPad = first.getDay() === 0 ? 6 : first.getDay() - 1;
  const days: (Date | null)[] = Array.from({ length: startPad }, () => null);
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(month.getFullYear(), month.getMonth(), d));
  }
  return days;
}

function formatSelectedDayHeader(day: Date, today: Date) {
  const label = `${WEEKDAY_FULL[day.getDay()]}, ${day.toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  })}`;
  if (sameDay(day, today)) return { title: "HÔM NAY", sub: label };
  return { title: label, sub: null };
}

function orderDotColor(dayOrders: ScheduleOrder[], hasFree: boolean): string | null {
  if (dayOrders.length) {
    if (dayOrders.some((o) => ["accepted", "scheduled", "picking_up", "in_progress", "delivering"].includes(o.status)))
      return "bg-amber-500";
    if (dayOrders.some((o) => o.status === "completed")) return "bg-emerald-700";
    return "bg-blue-600";
  }
  if (hasFree) return "bg-sky-400";
  return null;
}

export default function LichGiaoHangPage() {
  const { toast } = useToast();
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [viewMonth, setViewMonth]         = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay]     = useState(() => new Date());
  const [orders, setOrders]               = useState<ScheduleOrder[]>([]);
  const [scheduleDays, setScheduleDays]   = useState<ScheduleDay[]>([]);
  const [loading, setLoading]             = useState(true);
  const [savingAvail, setSavingAvail]     = useState(false);
  const [editDay, setEditDay]             = useState<Date | null>(null);

  const calendarDays = useMemo(() => getCalendarDays(viewMonth), [viewMonth]);
  const weekStart    = useMemo(() => startOfWeek(selectedDay), [selectedDay]);
  const weekDays     = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const from = startOfMonth(viewMonth).toISOString();
      const to   = addDays(endOfMonth(viewMonth), 7).toISOString();
      const [orderRes, scheduleRes] = await Promise.all([
        ordersApi.mySchedule(from, to),
        providerApi.getSchedule(),
      ]);
      if (orderRes.success && Array.isArray(orderRes.data)) {
        setOrders(orderRes.data as ScheduleOrder[]);
      }
      if (scheduleRes.success && Array.isArray(scheduleRes.data)) {
        setScheduleDays(scheduleRes.data as ScheduleDay[]);
      }
    } finally {
      setLoading(false);
    }
  }, [viewMonth]);

  useEffect(() => { load(); }, [load]);

  const ordersOnDay = useCallback(
    (day: Date) =>
      orders.filter((o) => o.scheduled_pickup_time && sameDay(new Date(o.scheduled_pickup_time), day)),
    [orders],
  );

  const freeOnDay = useCallback(
    (day: Date) => {
      const dayOrders = ordersOnDay(day);
      const weekdaySlots = slotsForWeekday(scheduleDays, day);
      return getFreeSegmentsForDay(day, weekdaySlots, dayOrders);
    },
    [ordersOnDay, scheduleDays],
  );

  const selectedOrders   = useMemo(() => ordersOnDay(selectedDay), [ordersOnDay, selectedDay]);
  const selectedFree     = useMemo(() => freeOnDay(selectedDay), [freeOnDay, selectedDay]);
  const selectedEvents   = useMemo(
    () => buildDayHourEvents(selectedDay, selectedOrders, selectedFree),
    [selectedDay, selectedOrders, selectedFree],
  );
  const weekdaySlots     = useMemo(() => slotsForWeekday(scheduleDays, selectedDay), [scheduleDays, selectedDay]);
  const dayHeader        = formatSelectedDayHeader(selectedDay, today);

  const handleSaveAvailability = async (slots: { start_time: string; end_time: string }[]) => {
    if (!editDay) return;
    setSavingAvail(true);
    try {
      const dow = editDay.getDay();
      const merged = buildAllSlots(scheduleDays, dow, slots);
      const res = await providerApi.updateSchedule(merged);
      if (res.success && res.data) {
        setScheduleDays(res.data as ScheduleDay[]);
        setEditDay(null);
        toast("Đã cập nhật lịch rảnh", "success");
      } else {
        toast(res.message || "Không lưu được lịch rảnh", "error");
      }
    } catch {
      toast("Không lưu được lịch rảnh", "error");
    } finally {
      setSavingAvail(false);
    }
  };

  const weekEnd = addDays(weekStart, 7);
  const totalThisWeek = orders.filter((o) => {
    if (!o.scheduled_pickup_time) return false;
    const d = new Date(o.scheduled_pickup_time);
    return d >= weekStart && d < weekEnd;
  }).length;

  const freeSlotsThisWeek = weekDays.reduce((n, day) => n + freeOnDay(day).length, 0);

  const prevMonth = () => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const nextMonth = () => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  const selectDay = (day: Date) => {
    const d = new Date(day);
    d.setHours(0, 0, 0, 0);
    setSelectedDay(d);
    if (day.getMonth() !== viewMonth.getMonth()) {
      setViewMonth(startOfMonth(day));
    }
  };

  return (
    <div className="-m-6 flex flex-col lg:flex-row h-[calc(100vh-3.5rem)] overflow-hidden bg-[#f8f9ff]">
      {/* Mini calendar */}
      <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-[#c4c5d7]/60 bg-[#eff4ff]/30 p-6 overflow-y-auto shrink-0">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 capitalize">
            {viewMonth.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
          </h3>
          <div className="flex gap-1">
            <button type="button" onClick={prevMonth} className="p-1 rounded-md hover:bg-[#dee9fc] text-gray-500 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <button type="button" onClick={nextMonth} className="p-1 rounded-md hover:bg-[#dee9fc] text-gray-500 transition-colors">
              <ChevronRight size={18} />
            </button>
            <button type="button" onClick={load} className="p-1 rounded-md hover:bg-[#dee9fc] text-gray-500 transition-colors ml-1" title="Làm mới">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 text-center mb-8">
          {WEEKDAY_LABELS.map((d) => (
            <div key={d} className="text-[10px] font-bold text-gray-500 py-2 uppercase">{d}</div>
          ))}
          {calendarDays.map((day, i) => {
            if (!day) return <div key={`pad-${i}`} className="py-2" />;

            const isToday     = sameDay(day, today);
            const isSelected  = sameDay(day, selectedDay);
            const inMonth     = day.getMonth() === viewMonth.getMonth();
            const dayOrders   = ordersOnDay(day);
            const dayFree     = freeOnDay(day);
            const dot         = orderDotColor(dayOrders, dayFree.length > 0);

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => selectDay(day)}
                className={`py-2 relative transition-colors rounded-lg ${
                  isSelected ? "ring-2 ring-[#1d4ed8] ring-offset-1 bg-[#1d4ed8]/10" : "hover:bg-[#dee9fc]/50"
                }`}
              >
                {isToday ? (
                  <span className={`w-8 h-8 flex items-center justify-center mx-auto rounded-full text-xs font-bold ${
                    isSelected ? "bg-[#1d4ed8] text-white" : "bg-[#1d4ed8]/80 text-white"
                  }`}>
                    {day.getDate()}
                  </span>
                ) : (
                  <span className={`text-xs font-medium ${inMonth ? "text-gray-900" : "text-gray-300"}`}>
                    {day.getDate()}
                  </span>
                )}
                {dot && (
                  <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${dot}`} />
                )}
              </button>
            );
          })}
        </div>

        <div className="space-y-4 pt-6 border-t border-[#c4c5d7]/60">
          <div className="flex items-center justify-between px-3 py-2 bg-[#1d4ed8]/5 rounded-lg border border-[#1d4ed8]/10">
            <span className="text-xs font-bold text-[#1d4ed8]">Tổng chuyến tuần này</span>
            <span className="text-sm font-bold text-[#1d4ed8]">{String(totalThisWeek).padStart(2, "0")}</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-100">
            <span className="text-xs font-bold text-emerald-700">Giờ rảnh tuần này</span>
            <span className="text-sm font-bold text-emerald-700">{String(freeSlotsThisWeek).padStart(2, "0")}</span>
          </div>
          <div className="flex items-center gap-3 px-3">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-xs text-gray-500">Chuyến đặt xe</span>
          </div>
          <div className="flex items-center gap-3 px-3">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TERTIARY }} />
            <span className="text-xs text-gray-500">Hoàn thành</span>
          </div>
          <div className="flex items-center gap-3 px-3">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span className="text-xs text-gray-500">Giờ rảnh</span>
          </div>
        </div>
      </aside>

      {/* Selected day — hourly grid */}
      <section className="flex-1 overflow-y-auto bg-white p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                sameDay(selectedDay, today) ? "bg-[#1d4ed8] text-white" : "bg-[#dee9fc] text-gray-500"
              }`}>
                {sameDay(selectedDay, today) ? <CalendarCheck size={18} /> : <Calendar size={18} />}
              </div>
              <div>
                <h2 className={`text-base font-bold ${sameDay(selectedDay, today) ? "text-[#1d4ed8]" : "text-gray-900"}`}>
                  {dayHeader.title}
                  {dayHeader.sub && (
                    <span className="text-gray-500 font-normal text-sm ml-2">{dayHeader.sub}</span>
                  )}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {selectedOrders.length > 0
                    ? `${selectedOrders.length} chuyến · ${selectedFree.length} khung giờ rảnh`
                    : selectedFree.length > 0
                      ? `${selectedFree.length} khung giờ rảnh`
                      : "Chọn khung giờ rảnh hoặc chờ đơn mới"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEditDay(selectedDay)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-[#1d4ed8] border border-[#1d4ed8]/20 hover:bg-[#eff4ff] transition-colors"
            >
              <Pencil size={14} />
              Chỉnh giờ rảnh
            </button>
          </div>

          {loading ? (
            <Skeleton className="h-[600px] w-full rounded-2xl" />
          ) : (
            <DayHourSchedule
              day={selectedDay}
              events={selectedEvents}
              hasConfiguredSlots={weekdaySlots.length > 0}
              isToday={sameDay(selectedDay, today)}
              onAddAvailability={() => setEditDay(selectedDay)}
            />
          )}

          {!loading && selectedEvents.length > 0 && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => setEditDay(selectedDay)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#1d4ed8] hover:underline"
              >
                <Zap size={14} />
                Thêm / chỉnh khung giờ rảnh
              </button>
            </div>
          )}
        </div>
      </section>

      <AvailabilityEditorDialog
        open={!!editDay}
        onOpenChange={(open) => { if (!open) setEditDay(null); }}
        dayLabel={editDay ? WEEKDAY_FULL[editDay.getDay()] : ""}
        initialSlots={editDay ? slotsForWeekday(scheduleDays, editDay).map((s) => ({
          start_time: s.start_time,
          end_time: s.end_time,
        })) : []}
        saving={savingAvail}
        onSave={handleSaveAvailability}
      />
    </div>
  );
}
