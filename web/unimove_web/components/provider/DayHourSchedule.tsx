"use client";

import Link from "next/link";
import { Clock, Zap, ArrowRight, CalendarClock, MapPin, Truck } from "lucide-react";
import { formatVND } from "@/lib/utils";
import {
  type DayHourEvent,
  type FreeSegment,
  DAY_START_HOUR,
  DAY_END_HOUR,
  HOUR_HEIGHT_PX,
  dayHourLabels,
  eventTopPx,
  eventHeightPx,
  formatHourLabel,
  formatTimeRangeFromTimes,
} from "@/lib/provider-schedule";

interface ScheduleOrder {
  id: string;
  status: string;
  pickup_address: string;
  delivery_address: string;
  scheduled_pickup_time: string;
  estimated_duration?: number;
  total_price?: number;
}

const STATUS_BADGE: Record<string, { label: string; bg: string; text: string; accent: string }> = {
  accepted:    { label: "Đã xác nhận",     bg: "#ecfdf5", text: "#047857", accent: "#10b981" },
  scheduled:   { label: "Đã xác nhận",     bg: "#ecfdf5", text: "#047857", accent: "#10b981" },
  picking_up:  { label: "Đang đến lấy",    bg: "#eff6ff", text: "#1d4ed8", accent: "#3b82f6" },
  picked_up:   { label: "Đã lấy hàng",     bg: "#eff6ff", text: "#1d4ed8", accent: "#3b82f6" },
  in_progress: { label: "Đang vận chuyển", bg: "#f5f3ff", text: "#6d28d9", accent: "#8b5cf6" },
  delivering:  { label: "Đang giao",       bg: "#f5f3ff", text: "#6d28d9", accent: "#8b5cf6" },
  completed:   { label: "Hoàn thành",      bg: "#f0fdf4", text: "#15803d", accent: "#22c55e" },
};

function formatTimeRange(iso: string, durationMin = 180) {
  const start = new Date(iso);
  const end = new Date(start.getTime() + durationMin * 60 * 1000);
  const fmt = (d: Date) => d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  return `${fmt(start)} – ${fmt(end)}`;
}

function OrderBlock({ order, compact }: { order: ScheduleOrder; compact?: boolean }) {
  const badge = STATUS_BADGE[order.status] ?? STATUS_BADGE.accepted;
  const duration = order.estimated_duration || 180;
  const timeRange = formatTimeRange(order.scheduled_pickup_time, duration);

  return (
    <Link href={`/orders/${order.id}`} className="block h-full group">
      <div
        className="h-full rounded-xl overflow-hidden flex shadow-md hover:shadow-lg transition-all duration-200 group-hover:-translate-y-px border border-amber-200/60"
        style={{ background: "linear-gradient(135deg, #fffbeb 0%, #ffffff 55%)" }}
      >
        <div className="w-1.5 shrink-0 bg-gradient-to-b from-amber-400 to-orange-500" />
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="px-3 py-1.5 flex items-center justify-between gap-2 border-b border-amber-100/80 bg-amber-50/50">
            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-800 uppercase tracking-wider">
              <Truck size={11} />
              Chuyến đặt xe
            </span>
            <span
              className="px-2 py-0.5 text-[9px] font-bold rounded-full"
              style={{ backgroundColor: badge.bg, color: badge.text }}
            >
              {badge.label}
            </span>
          </div>
          <div className={`flex-1 px-3 py-2 flex flex-col justify-center min-h-0 ${compact ? "gap-0.5" : "gap-1.5"}`}>
            <div className="flex items-center gap-1.5 text-[#1d4ed8]">
              <Clock size={compact ? 12 : 14} className="shrink-0" />
              <span className={`font-extrabold tracking-tight ${compact ? "text-xs" : "text-sm"}`}>{timeRange}</span>
            </div>
            {!compact && (
              <>
                <div className="flex items-start gap-1.5 mt-0.5">
                  <MapPin size={11} className="text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-medium text-gray-800 line-clamp-1">{order.pickup_address}</p>
                </div>
                <div className="flex items-start gap-1.5">
                  <MapPin size={11} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-gray-500 line-clamp-1">{order.delivery_address}</p>
                </div>
              </>
            )}
            {compact && (
              <p className="text-[10px] text-gray-600 truncate">{order.delivery_address}</p>
            )}
            {order.total_price && !compact && (
              <p className="text-xs font-bold text-gray-900 mt-1">{formatVND(order.total_price)}</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function FreeBlock({ segment, compact }: { segment: FreeSegment; compact?: boolean }) {
  return (
    <Link href="/orders" className="block h-full group">
      <div
        className="h-full rounded-xl overflow-hidden flex shadow-sm hover:shadow-md transition-all duration-200 group-hover:-translate-y-px border border-emerald-200/50"
        style={{ background: "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 40%, #ffffff 100%)" }}
      >
        <div className="w-1.5 shrink-0 bg-gradient-to-b from-emerald-400 to-teal-500" />
        <div className="flex-1 flex flex-col justify-center px-3 py-2 min-w-0">
          <div className="flex items-center gap-1.5 text-emerald-700">
            <div className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center shrink-0">
              <Zap size={compact ? 10 : 12} className="text-emerald-600" />
            </div>
            <span className={`font-bold ${compact ? "text-xs" : "text-sm"}`}>Giờ rảnh</span>
          </div>
          <p className={`text-emerald-600 font-semibold pl-6 ${compact ? "text-[10px]" : "text-xs"} mt-0.5`}>
            {formatTimeRangeFromTimes(segment.start_time, segment.end_time)}
          </p>
          {!compact && (
            <p className="text-[10px] text-emerald-600/70 mt-1.5 pl-6 flex items-center gap-1 font-medium">
              Sẵn sàng nhận đơn
              <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

interface DayHourScheduleProps {
  day: Date;
  events: DayHourEvent[];
  hasConfiguredSlots: boolean;
  isToday?: boolean;
  onAddAvailability: () => void;
}

function getNowLineTop(day: Date, isToday: boolean): number | null {
  if (!isToday) return null;
  const now = new Date();
  const dayStart = new Date(day);
  dayStart.setHours(DAY_START_HOUR, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(DAY_END_HOUR, 0, 0, 0);
  if (now < dayStart || now > dayEnd) return null;
  const mins = (now.getTime() - dayStart.getTime()) / 60000;
  return (mins / 60) * HOUR_HEIGHT_PX;
}

export function DayHourSchedule({
  day,
  events,
  hasConfiguredSlots,
  isToday = false,
  onAddAvailability,
}: DayHourScheduleProps) {
  const hours = dayHourLabels();
  const gridHeight = hours.length * HOUR_HEIGHT_PX;
  const nowTop = getNowLineTop(day, isToday);

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white shadow-[0_4px_24px_-4px_rgba(29,78,216,0.08)] overflow-hidden">
      {/* Grid header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-[#f8f9ff] to-white flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Khung giờ trong ngày
        </span>
        <span className="text-xs text-gray-400 font-medium">
          {formatHourLabel(DAY_START_HOUR)} – {formatHourLabel(DAY_END_HOUR)}
        </span>
      </div>

      <div className="flex bg-[#fafbff]">
        {/* Hour labels */}
        <div className="w-[4.5rem] shrink-0 border-r border-gray-200/70 bg-white/80">
          {hours.map((h, i) => (
            <div
              key={h}
              className={`relative flex items-start justify-end pr-3 ${i % 2 === 0 ? "bg-white/50" : "bg-gray-50/30"}`}
              style={{ height: HOUR_HEIGHT_PX }}
            >
              <span className="text-[11px] font-semibold text-gray-400 -mt-2 tabular-nums">
                {formatHourLabel(h)}
              </span>
            </div>
          ))}
        </div>

        {/* Grid + events */}
        <div className="flex-1 relative" style={{ height: gridHeight }}>
          {hours.map((h, i) => (
            <div key={h} className="absolute left-0 right-0" style={{ top: (h - DAY_START_HOUR) * HOUR_HEIGHT_PX, height: HOUR_HEIGHT_PX }}>
              <div className={`absolute inset-0 ${i % 2 === 0 ? "bg-white/40" : "bg-gray-50/20"}`} />
              <div className="absolute left-0 right-0 top-0 border-t border-gray-200/90" />
              <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-gray-100" />
            </div>
          ))}

          {/* Current time indicator */}
          {nowTop != null && (
            <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: nowTop }}>
              <div className="flex items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[#1d4ed8] -ml-1 shadow-md ring-2 ring-white" />
                <div className="flex-1 h-0.5 bg-gradient-to-r from-[#1d4ed8] to-[#1d4ed8]/20" />
              </div>
            </div>
          )}

          {events.map((ev) => {
            const top = eventTopPx(ev.start, day);
            const height = eventHeightPx(ev.start, ev.end);
            const compact = height < HOUR_HEIGHT_PX * 0.9;

            return (
              <div
                key={ev.id}
                className="absolute left-3 right-3 z-10"
                style={{ top: top + 3, height: Math.max(height - 6, 28) }}
              >
                {ev.type === "order" && ev.order ? (
                  <OrderBlock order={ev.order as ScheduleOrder} compact={compact} />
                ) : ev.segment ? (
                  <FreeBlock segment={ev.segment} compact={compact} />
                ) : null}
              </div>
            );
          })}

          {events.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
              <div className="pointer-events-auto text-center max-w-sm rounded-2xl border border-gray-200/80 bg-white/95 backdrop-blur-sm shadow-xl px-8 py-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#eff6ff] to-[#dbeafe] flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <CalendarClock size={26} className="text-[#1d4ed8]" />
                </div>
                <p className="font-bold text-gray-900">Chưa có lịch trong ngày</p>
                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                  {hasConfiguredSlots
                    ? "Khung giờ rảnh đã hết hoặc trùng với chuyến đã đặt"
                    : "Đặt giờ rảnh để khách biết khi nào bạn có thể nhận đơn"}
                </p>
                <button
                  type="button"
                  onClick={onAddAvailability}
                  className="mt-5 inline-flex items-center gap-2 bg-gradient-to-r from-[#1d4ed8] to-[#2563eb] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:brightness-105 transition-all active:scale-[0.98]"
                >
                  <Zap size={15} />
                  Thêm giờ rảnh
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="flex items-center gap-2 text-xs text-gray-600">
          <span className="w-3 h-3 rounded-md bg-gradient-to-br from-amber-100 to-amber-200 border border-amber-300/50 shadow-sm" />
          Chuyến đặt xe
        </span>
        <span className="flex items-center gap-2 text-xs text-gray-600">
          <span className="w-3 h-3 rounded-md bg-gradient-to-br from-emerald-100 to-emerald-200 border border-emerald-300/50 shadow-sm" />
          Giờ rảnh
        </span>
        {isToday && nowTop != null && (
          <span className="flex items-center gap-2 text-xs text-gray-600">
            <span className="w-3 h-0.5 bg-[#1d4ed8] rounded-full" />
            Giờ hiện tại
          </span>
        )}
      </div>
    </div>
  );
}
