"use client";

import { Package, Route, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type BookingIntroMode = "combo" | "quote";

const COPY: Record<
  BookingIntroMode,
  { badge: string; title: string; description: string; icon: typeof Package; tint: string; color: string }
> = {
  combo: {
    badge: "Gói combo",
    title: "Giá niêm yết — biết trước, đặt nhanh",
    description:
      "Bắt đầu bằng địa điểm lấy và giao đồ. UniMove sẽ dẫn bạn qua mô tả trọ, chọn giờ và chọn gói phù hợp.",
    icon: Package,
    tint: "#EFF6FF",
    color: "#0047FF",
  },
  quote: {
    badge: "Chuyến thông thường",
    title: "Gửi yêu cầu — nhà xe sẽ báo giá",
    description:
      "Cho chúng tôi biết bạn chuyển từ đâu đến đâu. Sau đó mô tả trọ và chọn giờ để nhận báo giá từ nhiều nhà xe.",
    icon: Route,
    tint: "#FFFBEB",
    color: "#D97706",
  },
};

export function BookingModeIntro({
  mode,
  className,
}: {
  mode: BookingIntroMode;
  className?: string;
}) {
  const c = COPY[mode];
  const Icon = c.icon;

  return (
    <div
      className={cn(
        "mx-auto flex max-w-xl items-start gap-3 rounded-2xl border px-4 py-3.5 text-left sm:gap-4 sm:px-5 sm:py-4",
        mode === "combo"
          ? "border-blue-100 bg-gradient-to-br from-[#EFF6FF] to-white"
          : "border-amber-100 bg-gradient-to-br from-amber-50/80 to-white",
        className,
      )}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11"
        style={{ backgroundColor: c.tint, color: c.color }}
      >
        <Icon size={20} strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            style={{ backgroundColor: c.tint, color: c.color }}
          >
            {mode === "combo" && <Sparkles size={10} />}
            {c.badge}
          </span>
        </div>
        <p className="mt-1.5 text-sm font-semibold text-gray-900">{c.title}</p>
        <p className="mt-1 text-xs leading-relaxed text-gray-500 sm:text-sm">{c.description}</p>
      </div>
    </div>
  );
}
