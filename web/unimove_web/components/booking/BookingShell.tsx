"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingShellProps {
  title: string;
  subtitle?: string;
  step?: number;
  totalSteps?: number;
  backHref?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function BookingShell({
  title,
  subtitle,
  step,
  totalSteps,
  backHref,
  children,
  footer,
}: BookingShellProps) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-68px)] max-w-2xl flex-col pb-8 lg:max-w-3xl">
      <div className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 px-4 py-4 backdrop-blur-md lg:top-[68px]">
        <div className="flex items-start gap-3">
          {backHref && (
            <Link
              href={backHref}
              className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-white shadow-sm"
            >
              <ArrowLeft size={18} className="text-gray-700" />
            </Link>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-gray-900 lg:text-xl">{title}</h1>
            {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
            {step != null && totalSteps != null && (
              <div className="mt-3 flex items-center gap-2">
                {Array.from({ length: totalSteps }, (_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-colors",
                      i + 1 <= step ? "bg-[#0047FF]" : "bg-gray-200"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-5">{children}</div>

      {footer && (
        <div className="sticky bottom-0 border-t border-gray-100 bg-white/95 px-4 py-4 backdrop-blur-md">
          {footer}
        </div>
      )}
    </div>
  );
}

export function RouteSummary({ pickup, destination }: { pickup: string; destination: string }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-3 text-sm">
      <div className="flex items-center gap-2 text-gray-600">
        <span className="h-2 w-2 shrink-0 rounded-full bg-[#0047FF]" />
        <span className="line-clamp-1">{pickup || "Điểm lấy đồ"}</span>
      </div>
      <div className="my-1.5 ml-1 border-l-2 border-dashed border-blue-200 pl-3 text-xs text-gray-400">↓</div>
      <div className="flex items-center gap-2 font-medium text-gray-900">
        <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
        <span className="line-clamp-1">{destination || "Điểm đến"}</span>
      </div>
    </div>
  );
}
