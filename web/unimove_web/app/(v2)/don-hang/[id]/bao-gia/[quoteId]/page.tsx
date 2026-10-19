"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Ban,
  AlertCircle,
  Share2,
  BadgeCheck,
  Star,
  Headphones,
  MapPin,
  Circle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ordersApi, quotesApi, providersApi } from "@/lib/api";
import { formatVND, cn } from "@/lib/utils";
import { useUIStore } from "@/lib/stores";
import {
  ProviderReviewSummary,
  type ProviderReviewItem,
  type ReviewsSummary,
} from "@/components/booking/ProviderReviewsSection";
import {
  ProviderIntroBlock,
  ProviderVehicleBlock,
  ProviderPackagesBlock,
  ProviderReviewsBlock,
  type ProviderIntroData,
  type ServicePackageItem,
} from "@/components/booking/ProviderIntroSection";

const NAVY = "#0F1E3D";

interface OrderBrief {
  status: string;
  pickup_address: string;
  dropoff_address: string;
}

interface Quote {
  id: string;
  provider_id: string;
  base_price: number;
  total_price: number;
  surcharges?: { label: string; amount: number }[];
  note?: string;
  status: string;
  schedule_fit?: string;
  proposed_pickup_at?: string;
  provider_name?: string;
  provider_avatar_url?: string | null;
  provider_rating?: number;
  provider_review_count?: number;
  provider_completed_trips?: number;
  vehicle_label?: string;
}

interface ProviderDetail {
  id: string;
  name: string;
  business_name?: string;
  full_name?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  vehicle_type?: string;
  vehicle_plate?: string | null;
  service_area?: string[];
  base_price?: number | null;
  price_per_km?: number | null;
  price_per_floor?: number | null;
  rating: number;
  total_reviews: number;
  completed_trips?: number;
  is_verified?: boolean;
  is_available?: boolean;
  packages?: ServicePackageItem[];
  reviews_summary?: ReviewsSummary | null;
  reviews?: ProviderReviewItem[];
}

function parseQuotes(data: unknown): Quote[] {
  if (Array.isArray(data)) return data as Quote[];
  if (data && typeof data === "object" && Array.isArray((data as { quotes?: Quote[] }).quotes)) {
    return (data as { quotes: Quote[] }).quotes;
  }
  return [];
}

function vehicleLabel(v?: string) {
  const map: Record<string, string> = {
    small_truck: "Xe tải nhỏ",
    medium_truck: "Xe tải 1 tấn",
    large_truck: "Xe tải lớn",
    van: "Xe van",
  };
  return (v && map[v]) || v || "Xe tải";
}

function shortPlace(addr: string) {
  const parts = addr.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]}, ${parts[1]}`;
  return addr.length > 48 ? `${addr.slice(0, 48)}…` : addr;
}

function ScheduleBanner({ fit, proposedAt }: { fit?: string; proposedAt?: string }) {
  const proposedLabel = proposedAt
    ? new Date(proposedAt).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  if (fit === "alternate_proposed") {
    return (
      <div className="flex gap-2.5 p-3 rounded-xl bg-orange-50 border border-orange-100">
        <Clock size={16} className="text-orange-700 shrink-0 mt-0.5" />
        <p className="text-xs font-medium text-orange-900 leading-snug">
          Nhà xe đề xuất giờ khác{proposedLabel ? `: ${proposedLabel}` : ""}.
        </p>
      </div>
    );
  }
  if (fit === "unavailable") {
    return (
      <div className="flex gap-2.5 p-3 rounded-xl bg-red-50 border border-red-100">
        <Ban size={16} className="text-red-600 shrink-0 mt-0.5" />
        <p className="text-xs font-medium text-red-800">Không nhận khung giờ bạn chọn.</p>
      </div>
    );
  }
  return (
    <div className="flex gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
      <CheckCircle size={16} className="text-emerald-600 shrink-0 mt-0.5" />
      <p className="text-xs font-medium text-emerald-800">Nhà xe nhận đúng giờ bạn đã chọn.</p>
    </div>
  );
}

function PricingBlock({ quote }: { quote: Quote }) {
  const total = quote.total_price ?? quote.base_price;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between gap-3">
        <h3 className="font-bold text-base" style={{ color: NAVY }}>
          Bảng giá minh bạch
        </h3>
        <span className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
          Không phát sinh
        </span>
      </div>
      <div className="p-5 space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-gray-600">Giá cơ bản</span>
          <span className="font-semibold text-gray-900 shrink-0">{formatVND(quote.base_price)}</span>
        </div>
        {(quote.surcharges ?? []).map((s, i) => (
          <div key={i} className="flex justify-between gap-4">
            <span className="text-gray-600">{s.label || "Phụ phí"}</span>
            <span className="font-semibold text-gray-900 shrink-0">{formatVND(s.amount)}</span>
          </div>
        ))}
        <div className="border-t border-dashed border-gray-200 pt-4 mt-2">
          <div className="flex justify-between items-end gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Ước tính tổng cộng
            </span>
            <span className="text-2xl font-extrabold text-[#2563EB]">{formatVND(total)}</span>
          </div>
        </div>
        {quote.note && (
          <p className="text-xs text-gray-400 leading-relaxed pt-1 border-t border-gray-50">
            * {quote.note}
          </p>
        )}
        {!quote.note && (
          <p className="text-xs text-gray-400 leading-relaxed">
            * Giá cuối cùng có thể thay đổi tùy theo điều kiện thực tế khi vận chuyển.
          </p>
        )}
      </div>
    </div>
  );
}

function OrderSummarySidebar({
  quote,
  order,
  canConfirm,
  confirming,
  confirmLabel,
  onConfirm,
}: {
  quote: Quote;
  order: OrderBrief | null;
  canConfirm: boolean;
  confirming: boolean;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  const total = quote.total_price ?? quote.base_price;
  const isSelected = quote.status === "selected";

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-sm mb-4" style={{ color: NAVY }}>
          Tóm tắt đơn hàng
        </h3>
        <ScheduleBanner fit={quote.schedule_fit} proposedAt={quote.proposed_pickup_at} />
        <div className="space-y-2.5 text-sm mt-4">
          <div className="flex justify-between gap-3">
            <span className="text-gray-500">Giá cơ bản</span>
            <span className="font-medium">{formatVND(quote.base_price)}</span>
          </div>
          {(quote.surcharges ?? []).map((s, i) => (
            <div key={i} className="flex justify-between gap-3">
              <span className="text-gray-500">{s.label || "Phụ phí"}</span>
              <span className="font-medium">{formatVND(s.amount)}</span>
            </div>
          ))}
          <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
            <span className="font-bold text-gray-900">Tổng cộng</span>
            <span className="text-xl font-extrabold text-[#2563EB]">{formatVND(total)}</span>
          </div>
        </div>

        {isSelected ? (
          <button
            type="button"
            disabled
            className="w-full mt-5 py-3.5 rounded-xl font-bold text-sm bg-green-600 text-white"
          >
            Đã chọn nhà xe này
          </button>
        ) : canConfirm ? (
          <button
            type="button"
            disabled={confirming || quote.schedule_fit === "unavailable"}
            onClick={onConfirm}
            className={cn(
              "w-full mt-5 py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50",
              quote.schedule_fit === "unavailable"
                ? "bg-gray-200 text-gray-500"
                : "bg-[#2563EB] text-white hover:bg-blue-700 shadow-lg shadow-blue-200/60",
            )}
          >
            {confirming ? "Đang xác nhận..." : confirmLabel}
          </button>
        ) : null}
      </div>

      {order && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-24 bg-gradient-to-br from-blue-100 to-blue-50 relative">
            <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiMyNTYzRUIiLz48L3N2Zz4=')]" />
            <div className="absolute bottom-3 left-4 right-4 flex items-center gap-2">
              <MapPin size={14} className="text-[#2563EB]" />
              <span className="text-xs font-semibold text-gray-700">Lộ trình chuyến đi</span>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex gap-3">
              <div className="flex flex-col items-center pt-1">
                <Circle size={10} className="text-[#2563EB] fill-[#2563EB]" />
                <div className="w-px flex-1 min-h-[28px] bg-gray-200 my-1" />
                <Circle size={10} className="text-red-500 fill-red-500" />
              </div>
              <div className="flex-1 space-y-4 min-w-0">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Điểm đi</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{shortPlace(order.pickup_address)}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{order.pickup_address}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Điểm đến</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{shortPlace(order.dropoff_address)}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{order.dropoff_address}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-gradient-to-br from-[#0F1E3D] to-[#2563EB] p-5 text-white">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Headphones size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">Cần hỗ trợ?</p>
            <p className="text-sm font-semibold mt-1 leading-snug">
              Chat ngay với đội ngũ UniMove
            </p>
            <Link
              href="/ho-tro"
              className="inline-block mt-2 text-xs font-semibold text-white/90 underline underline-offset-2"
            >
              Liên hệ hỗ trợ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QuoteProviderDetailPage() {
  const { id: orderId, quoteId } = useParams<{ id: string; quoteId: string }>();
  const router = useRouter();
  const { showSuccess, showError } = useUIStore();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [provider, setProvider] = useState<ProviderDetail | null>(null);
  const [order, setOrder] = useState<OrderBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  const load = useCallback(async () => {
    const [orderRes, quotesRes] = await Promise.all([
      ordersApi.get(orderId),
      quotesApi.list(orderId),
    ]);

    if (orderRes.success && orderRes.data) {
      const o = orderRes.data as OrderBrief & { dropoff_address?: string; delivery_address?: string };
      setOrder({
        status: o.status,
        pickup_address: o.pickup_address ?? "",
        dropoff_address: o.dropoff_address ?? o.delivery_address ?? "",
      });
    }

    const quotes = quotesRes.success ? parseQuotes(quotesRes.data) : [];
    const found = quotes.find((q) => q.id === quoteId) ?? null;
    setQuote(found);

    if (found?.provider_id) {
      try {
        const pRes = await providersApi.getById(found.provider_id, { reviews_limit: 20 });
        if (pRes.success && pRes.data) setProvider(pRes.data as ProviderDetail);
      } catch {
        setProvider(null);
      }
    }
  }, [orderId, quoteId]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const canConfirm =
    quote?.status === "submitted" &&
    order?.status === "pending" &&
    quote.schedule_fit !== "unavailable";

  const confirmQuote = async () => {
    if (!quote || !canConfirm) return;
    setConfirming(true);
    try {
      await quotesApi.select(orderId, quote.id);
      showSuccess("Đã chọn nhà xe — vui lòng đặt cọc");
      router.push(`/don-hang/${orderId}`);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Không chốt được báo giá");
    } finally {
      setConfirming(false);
    }
  };

  const name = quote?.provider_name ?? provider?.name ?? "Nhà xe";
  const avatar = quote?.provider_avatar_url ?? provider?.avatar_url;
  const rating = provider?.reviews_summary?.average_rating ?? provider?.rating ?? quote?.provider_rating ?? 0;
  const reviewCount =
    provider?.reviews_summary?.total_reviews ?? provider?.total_reviews ?? quote?.provider_review_count ?? 0;
  const trips = quote?.provider_completed_trips ?? provider?.completed_trips ?? 0;
  const vehicle = vehicleLabel(quote?.vehicle_label ?? provider?.vehicle_type);
  const responseRate = Math.round(provider?.reviews_summary?.response_rate ?? 0);

  const introData: ProviderIntroData | null = provider
    ? {
        ...provider,
        name: provider.name || name,
        completed_trips: trips,
        rating,
        total_reviews: reviewCount,
        reviews: provider.reviews,
      }
    : quote
      ? {
          name,
          vehicle_type: quote.vehicle_label,
          completed_trips: trips,
          rating,
          total_reviews: reviewCount,
          is_verified: false,
          reviews: [],
        }
      : null;

  const confirmLabel =
    quote?.schedule_fit === "alternate_proposed"
      ? "Chọn giờ & chốt giá"
      : quote?.schedule_fit === "unavailable"
        ? "Không thể chốt nhà xe này"
        : "Chốt với giờ bạn chọn";

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: name, url });
      } catch {
        /* cancelled */
      }
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <div
      className={cn(
        "min-h-screen bg-[#EEF1F6]",
        (canConfirm || quote?.status === "selected") && !loading ? "pb-32 lg:pb-10" : "pb-10",
      )}
    >
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href={`/don-hang/${orderId}`}
            className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={18} style={{ color: NAVY }} />
          </Link>
          <span className="text-sm text-gray-500 hidden sm:inline">Hồ sơ nhà xe</span>
          <h1 className="text-base font-bold truncate flex-1 sm:text-right" style={{ color: NAVY }}>
            {loading ? "Đang tải..." : name}
          </h1>
        </div>
      </div>

      {loading ? (
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-56 rounded-2xl" />
          <div className="grid lg:grid-cols-[1fr_340px] gap-4">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      ) : !quote ? (
        <div className="max-w-lg mx-auto p-12 text-center text-gray-500">
          <AlertCircle size={40} className="mx-auto mb-3 opacity-40" />
          <p>Không tìm thấy báo giá</p>
          <Link href={`/don-hang/${orderId}`} className="text-[#2563EB] text-sm font-semibold mt-3 inline-block">
            Quay lại đơn hàng
          </Link>
        </div>
      ) : (
        <>
          {/* Hero banner */}
          <div className="relative">
            <div className="h-52 sm:h-60 lg:h-64 relative overflow-hidden">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="" className="absolute inset-0 w-full h-full object-cover scale-105 blur-[2px]" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#0F1E3D] via-[#1a3270] to-[#2563EB]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0F1E3D]/95 via-[#0F1E3D]/80 to-[#2563EB]/60" />
            </div>

            <div className="max-w-6xl mx-auto px-4 relative -mt-36 sm:-mt-40 pb-2">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                <div className="flex-1 min-w-0">
                  {provider?.is_verified && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-400 text-amber-950 mb-3">
                      <BadgeCheck size={14} /> Đã xác minh
                    </span>
                  )}
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
                    {name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-sm text-white/85">
                    <span className="inline-flex items-center gap-1">
                      <Star size={14} className="text-amber-400 fill-amber-400" />
                      <span className="font-semibold">{rating > 0 ? rating.toFixed(1) : "—"}</span>
                      <span className="text-white/70">({reviewCount} đánh giá)</span>
                    </span>
                    <span className="text-white/40 hidden sm:inline">·</span>
                    <span>{trips > 0 ? `${trips} chuyến thành công` : "Nhà xe mới"}</span>
                    <span className="text-white/40 hidden sm:inline">·</span>
                    <span>{vehicle}</span>
                    {responseRate > 0 && (
                      <>
                        <span className="text-white/40 hidden sm:inline">·</span>
                        <span>{responseRate}% phản hồi</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-end gap-3 shrink-0">
                  {/* Glass rating card */}
                  <div className="hidden sm:block bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-4 min-w-[200px]">
                    <ProviderReviewSummary
                      averageRating={rating}
                      totalCount={reviewCount}
                      summary={provider?.reviews_summary}
                      variant="hero"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 backdrop-blur border border-white/25 text-white text-sm font-semibold hover:bg-white/25 transition-colors"
                  >
                    <Share2 size={16} />
                    <span className="hidden sm:inline">Chia sẻ hồ sơ</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main grid */}
          <div className="max-w-6xl mx-auto px-4 pt-6">
            <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
              {/* Left column */}
              <div className="space-y-5 min-w-0">
                {introData && (
                  <>
                    <ProviderIntroBlock provider={introData} />
                    <ProviderVehicleBlock provider={introData} />
                    <ProviderPackagesBlock packages={introData.packages ?? []} />
                  </>
                )}
                <PricingBlock quote={quote} />
                {introData && (
                  <ProviderReviewsBlock provider={introData} vehicle={vehicle} trips={trips} />
                )}
              </div>

              {/* Right sidebar — sticky on desktop */}
              <div className="lg:sticky lg:top-[72px] space-y-4">
                <OrderSummarySidebar
                  quote={quote}
                  order={order}
                  canConfirm={!!canConfirm}
                  confirming={confirming}
                  confirmLabel={confirmLabel}
                  onConfirm={confirmQuote}
                />
              </div>
            </div>
          </div>

          {/* Mobile sticky CTA */}
          {(canConfirm || quote.status === "selected") && (
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-lg z-20">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                  <p className="text-xs text-gray-500">Tổng cộng</p>
                  <p className="text-xl font-extrabold text-[#2563EB]">
                    {formatVND(quote.total_price ?? quote.base_price)}
                  </p>
                </div>
              </div>
              {quote.status === "selected" ? (
                <button type="button" disabled className="w-full py-3.5 rounded-xl font-bold text-sm bg-green-600 text-white">
                  Đã chọn nhà xe này
                </button>
              ) : (
                <button
                  type="button"
                  disabled={confirming || quote.schedule_fit === "unavailable"}
                  onClick={confirmQuote}
                  className={cn(
                    "w-full py-3.5 rounded-xl font-bold text-sm",
                    quote.schedule_fit === "unavailable"
                      ? "bg-gray-200 text-gray-500"
                      : "bg-[#2563EB] text-white",
                  )}
                >
                  {confirming ? "Đang xác nhận..." : confirmLabel}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
