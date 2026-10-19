"use client";

import Link from "next/link";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingWizardLayoutProps {
  steps: string[];
  currentStep: number;
  title: string;
  subtitle?: string;
  intro?: React.ReactNode;
  segmentProgress?: { current: number; total: number };
  compact?: boolean;
  hideSidebar?: boolean;
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  cancelHref?: string;
  onContinue: () => void;
  continueDisabled?: boolean;
  continueLabel?: string;
  contentWidth?: "default" | "wide";
  onSkip?: () => void;
  skipLabel?: string;
}

export function BookingWizardLayout({
  steps,
  currentStep,
  title,
  subtitle,
  intro,
  segmentProgress,
  compact,
  hideSidebar,
  children,
  sidebar,
  cancelHref = "/trang-chu",
  onContinue,
  continueDisabled,
  continueLabel = "Tiếp tục",
  contentWidth = "default",
  onSkip,
  skipLabel = "Bỏ qua",
}: BookingWizardLayoutProps) {
  const showSidebar = Boolean(sidebar) && !hideSidebar;
  const formMax = contentWidth === "wide" ? "max-w-4xl" : "max-w-2xl";
  const footerMax = showSidebar ? "max-w-6xl" : formMax;

  return (
    <div className="relative w-full px-4 pb-28 pt-4 lg:px-6 lg:pb-24 lg:pt-6">
      <div className="mx-auto w-full max-w-3xl">
        <nav
          className={cn(
            "flex flex-wrap items-center justify-center gap-2 lg:gap-4",
            compact ? "mb-4" : "mb-6"
          )}
        >
          {steps.map((label, i) => {
            const stepNum = i + 1;
            const active = stepNum === currentStep;
            const done = stepNum < currentStep;
            return (
              <div key={label} className="flex items-center gap-2 lg:gap-4">
                {i > 0 && <span className="hidden h-px w-6 bg-gray-200 sm:block lg:w-10" />}
                <span
                  className={cn(
                    "text-xs font-semibold sm:text-sm",
                    active ? "text-[#0047FF]" : done ? "text-gray-700" : "text-gray-400"
                  )}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </nav>

        <div className={cn("text-center", compact ? "mb-5" : "mb-6")}>
          <h1
            className={cn(
              "font-bold tracking-tight text-gray-900",
              compact ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl lg:text-4xl"
            )}
          >
            {title}
          </h1>
          {subtitle && !intro && (
            <p className="mx-auto mt-1.5 max-w-xl text-sm text-gray-500">{subtitle}</p>
          )}
          {intro && <div className="mt-4">{intro}</div>}
          {segmentProgress && (
            <div className="mx-auto mt-3 flex max-w-md gap-2">
              {Array.from({ length: segmentProgress.total }, (_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    i < segmentProgress.current ? "bg-[#0047FF]" : "bg-gray-200"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        className={cn(
          "mx-auto grid w-full gap-6",
          showSidebar
            ? "max-w-6xl lg:grid-cols-[minmax(0,1fr)_300px]"
            : formMax
        )}
      >
        <div className="min-w-0 space-y-4">{children}</div>
        {showSidebar && (
          <aside className="hidden min-w-0 lg:block lg:sticky lg:top-[84px] lg:self-start">
            {sidebar}
          </aside>
        )}
      </div>

      {showSidebar && (
        <div className="mx-auto mt-4 w-full max-w-6xl lg:hidden">{sidebar}</div>
      )}

      <div
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200/80 bg-white/95 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] backdrop-blur-md"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div
          className={cn(
            "mx-auto flex w-full flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-6",
            footerMax
          )}
        >
          <p className="hidden items-center gap-2 text-xs text-gray-500 sm:flex sm:text-sm">
            <Info size={15} className="shrink-0 text-[#0047FF]" />
            Tiết kiệm 20% khi đặt trước 2 ngày
          </p>
          <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-3">
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 sm:inline-flex"
              >
                {skipLabel}
              </button>
            )}
            <Link
              href={cancelHref}
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-center text-sm font-semibold text-gray-600 no-underline transition hover:bg-gray-50 sm:flex-none sm:px-5"
            >
              Hủy bỏ
            </Link>
            <button
              type="button"
              disabled={continueDisabled}
              onClick={onContinue}
              className="flex-[2] rounded-xl bg-[#0047FF] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0039CC] disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[200px] sm:flex-none"
            >
              {continueLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BookingInsuranceCard({ compact }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-gradient-to-br from-[#0047FF] to-[#0039CC] text-white shadow-lg",
        compact ? "p-4" : "p-6"
      )}
    >
      <div
        className={cn(
          "mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/15",
          compact && "h-9 w-9"
        )}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="rgba(255,255,255,0.12)"
          />
          <path
            d="M9 12l2 2 4-4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h3 className="text-base font-bold">Bảo hiểm 100%</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-blue-100 sm:text-sm">
        Mọi chuyến đi của UniMove đều được bảo hiểm trọn gói.
      </p>
    </div>
  );
}

export function BookingInsuranceBanner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-xl border border-blue-100 bg-blue-50/80 px-3 py-2.5 text-xs sm:text-sm",
        className
      )}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0047FF] text-white">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="rgba(255,255,255,0.2)"
          />
        </svg>
      </span>
      <p className="min-w-0 leading-snug text-gray-700">
        <span className="font-semibold text-[#0047FF]">Bảo hiểm 100%</span>
        <span className="text-gray-500"> — Đồ đạc được bảo vệ trọn gói.</span>
      </p>
    </div>
  );
}

export const QUOTE_WIZARD_STEPS = ["Vị trí & Mô tả", "Thời gian", "Báo giá"] as const;
export const COMBO_WIZARD_STEPS = ["Vị trí", "Mô tả trọ", "Thời gian", "Gói combo", "Nhà xe", "Thanh toán"] as const;

export function AddressSummaryCard({
  pickup,
  destination,
  className,
}: {
  pickup: string;
  destination: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2.5 text-xs shadow-sm sm:text-sm",
        className
      )}
    >
      <div className="flex min-w-0 items-start gap-2">
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#0047FF]" />
        <span className="min-w-0 flex-1 break-words text-gray-700">{pickup || "Điểm lấy đồ"}</span>
      </div>
      <div className="my-1.5 ml-1 border-l-2 border-dashed border-blue-200/80 pl-3" />
      <div className="flex min-w-0 items-start gap-2">
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-green-500" />
        <span className="min-w-0 flex-1 break-words font-medium text-gray-900">
          {destination || "Điểm giao"}
        </span>
      </div>
    </div>
  );
}

/** Thẻ điểm đi / điểm đến kiểu mockup (2 cột có sidebar) */
export function RoutePointsCard({
  pickup,
  destination,
  className,
}: {
  pickup: string;
  destination: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5",
        className
      )}
    >
      <div className="flex gap-3 sm:gap-4">
        <div className="flex flex-col items-center pt-1">
          <span className="h-3 w-3 shrink-0 rounded-full bg-[#0047FF]" />
          <div className="my-1 min-h-8 w-px flex-1 border-l-2 border-dashed border-gray-200" />
          <span className="h-3 w-3 shrink-0 rounded-full bg-green-500" />
        </div>
        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Điểm đi</p>
            <p className="mt-1 text-sm leading-snug text-gray-700 break-words">
              {pickup || "Chưa nhập điểm lấy đồ"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Điểm đến</p>
            <p className="mt-1 text-sm font-medium leading-snug text-gray-900 break-words">
              {destination || "Chưa nhập điểm giao"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
