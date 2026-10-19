"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { quotesApi } from "@/lib/api";
import { formatVND, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

interface MyQuote {
  total_price?: number;
  schedule_fit?: string;
  status?: string;
}

interface QuoteRequestSectionProps {
  orderId: string;
  scheduledPickupTime?: string | null;
  onSubmitted?: () => void;
  redirectTo?: string;
  compact?: boolean;
}

const inputCls =
  "w-full h-9 rounded-lg border px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30";
const inputStyle = {
  backgroundColor: "var(--surface, #f9fafb)",
  borderColor: "var(--border, #e5e7eb)",
  color: "var(--text, #111827)",
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-semibold text-gray-600 block mb-1">{children}</label>;
}

export function QuoteRequestSection({
  orderId,
  scheduledPickupTime,
  onSubmitted,
  redirectTo = "/orders?tab=quoted",
  compact = true,
}: QuoteRequestSectionProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [myQuote, setMyQuote] = useState<MyQuote | null>(null);

  const [basePrice, setBasePrice] = useState("");
  const [surchargeLabel, setSurchargeLabel] = useState("Phụ phí tầng / hẻm");
  const [surchargeAmount, setSurchargeAmount] = useState("");
  const [scheduleFit, setScheduleFit] = useState<"exact_match" | "alternate_proposed">("exact_match");
  const [note, setNote] = useState("");

  const loadMyQuote = useCallback(async () => {
    setLoadingQuote(true);
    try {
      const res = await quotesApi.list(orderId);
      const quotes = (res.data ?? []) as MyQuote[];
      setMyQuote(quotes.length > 0 ? quotes[0] : null);
    } catch {
      setMyQuote(null);
    } finally {
      setLoadingQuote(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadMyQuote();
  }, [loadMyQuote]);

  const submitQuote = async () => {
    const base = parseInt(basePrice.replace(/\D/g, ""), 10);
    if (!base || base <= 0) {
      toast("Nhập giá cơ bản hợp lệ", "error");
      return;
    }

    const surcharges: { label: string; amount: number }[] = [];
    const surAmount = parseInt(surchargeAmount.replace(/\D/g, ""), 10);
    if (surAmount > 0) {
      surcharges.push({
        label: surchargeLabel.trim() || "Phụ phí",
        amount: surAmount,
      });
    }

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        base_price: base,
        surcharges,
        schedule_fit: scheduleFit,
        note: note.trim() || undefined,
      };
      if (scheduleFit === "alternate_proposed" && scheduledPickupTime) {
        body.proposed_pickup_at = scheduledPickupTime;
      }
      const res = await quotesApi.submit(orderId, body);
      setMyQuote((res.data as MyQuote) ?? { total_price: base + surAmount, schedule_fit: scheduleFit, status: "submitted" });
      toast("Đã gửi báo giá — chờ khách chốt", "success");
      onSubmitted?.();
      if (redirectTo) router.push(redirectTo);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gửi báo giá thất bại", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const cardPad = compact ? "p-4" : "p-5";
  const apptLabel = scheduledPickupTime
    ? new Date(scheduledPickupTime).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  if (loadingQuote) {
    return (
      <Card className={cardPad}>
        <Skeleton className="h-5 w-28 mb-3" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-9" />
          <Skeleton className="h-9" />
        </div>
      </Card>
    );
  }

  if (myQuote) {
    const total = Math.round(Number(myQuote.total_price ?? 0));
    const fit = myQuote.schedule_fit ?? "exact_match";
    const quoteStatus = myQuote.status ?? "submitted";

    if (quoteStatus === "expired") {
      return (
        <Card className={cardPad}>
          <p className="font-bold text-gray-900 text-sm">Khách chọn nhà xe khác</p>
          <p className="text-xs text-gray-500 mt-1">Báo giá {formatVND(total)} không được chọn.</p>
        </Card>
      );
    }

    return (
      <Card className={cn(cardPad, "border-green-200 bg-green-50/40")}>
        <p className="font-bold text-gray-900 text-sm">Báo giá đã gửi</p>
        <p className="text-xs text-gray-600 mt-1">
          {formatVND(total)} · {fit === "alternate_proposed" ? "Đề xuất giờ khác" : "Nhận đúng giờ"}
          {" · "}Chờ khách chốt.
        </p>
      </Card>
    );
  }

  return (
    <Card className={cn(cardPad, "border-blue-100 shadow-sm")}>
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="font-bold text-gray-900 text-sm">Gửi báo giá</h3>
          {!compact && (
            <p className="text-xs text-gray-500 mt-0.5">Nhập giá và khung giờ bạn nhận.</p>
          )}
        </div>
        {apptLabel && (
          <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded-md font-medium">
            <Clock size={12} /> {apptLabel}
          </span>
        )}
      </div>

      <div className="space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <FieldLabel>Giá cơ bản (VNĐ) *</FieldLabel>
            <input
              type="number"
              placeholder="VD: 1500000"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              className={inputCls}
              style={inputStyle}
            />
          </div>
          <div>
            <FieldLabel>Phụ phí (VNĐ)</FieldLabel>
            <input
              type="number"
              placeholder="50000"
              value={surchargeAmount}
              onChange={(e) => setSurchargeAmount(e.target.value)}
              className={inputCls}
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <FieldLabel>Loại phụ phí</FieldLabel>
          <input
            placeholder="Tầng / hẻm / khuân vác"
            value={surchargeLabel}
            onChange={(e) => setSurchargeLabel(e.target.value)}
            className={inputCls}
            style={inputStyle}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <FieldLabel>Khung giờ</FieldLabel>
          <div className="flex gap-1.5 sm:ml-auto">
            {(
              [
                ["exact_match", "Đúng giờ"],
                ["alternate_proposed", "Giờ khác"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setScheduleFit(value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
                  scheduleFit === value
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <FieldLabel>Ghi chú (tuỳ chọn)</FieldLabel>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="VD: 2 người khuân, xe 1 tấn..."
            className={inputCls}
            style={inputStyle}
          />
        </div>

        <Button size="sm" className="w-full gap-1.5 h-10" loading={submitting} onClick={submitQuote}>
          <DollarSign size={16} /> Gửi báo giá
        </Button>
      </div>
    </Card>
  );
}
