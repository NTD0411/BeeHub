"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Info,
  RefreshCw,
  Star,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/Container";
import { ordersApi, quotesApi } from "@/lib/api";
import { formatVND, cn } from "@/lib/utils";
import { useUIStore } from "@/lib/stores";

interface Quote {
  id: string;
  provider_id: string;
  total_price: number;
  base_price: number;
  note?: string;
  provider_name?: string;
  provider_rating?: number;
  status: string;
}

function QuoteSkeletonCard() {
  return (
    <div className="pointer-events-none opacity-40">
      <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-dashed border-gray-200 bg-white p-5 md:flex-row">
        <div className="flex w-full gap-3 md:w-1/2">
          <div className="h-12 w-12 shrink-0 animate-pulse rounded-lg bg-[#EFF4FF]" />
          <div className="flex-grow space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-[#EFF4FF]" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-[#EFF4FF]" />
          </div>
        </div>
        <div className="h-12 w-32 animate-pulse rounded-lg bg-[#EFF4FF]" />
      </div>
    </div>
  );
}

export default function BaoGiaPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const { showSuccess, showError } = useUIStore();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [orderStatus, setOrderStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acting, setActing] = useState(false);

  const orderLabel = orderId.slice(0, 8).toUpperCase();

  const load = useCallback(async () => {
    const [orderRes, quotesRes] = await Promise.all([
      ordersApi.get(orderId),
      quotesApi.list(orderId),
    ]);
    if (orderRes.success && orderRes.data) {
      setOrderStatus((orderRes.data as { status: string }).status);
    }
    if (quotesRes.success) {
      const d = quotesRes.data as { quotes?: Quote[] };
      setQuotes(d?.quotes ?? (Array.isArray(quotesRes.data) ? (quotesRes.data as Quote[]) : []));
    }
  }, [orderId]);

  useEffect(() => {
    load().finally(() => setLoading(false));
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const selectQuote = async (quoteId: string) => {
    setActing(true);
    try {
      await quotesApi.select(orderId, quoteId);
      showSuccess("Đã chốt nhà xe");
      router.push(`/don-hang/${orderId}`);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Không chọn được báo giá");
    } finally {
      setActing(false);
    }
  };

  const canSelect = orderStatus === "pending";

  return (
    <div className="min-h-screen bg-[#F8F9FF] pb-16 pt-6">
      <Container className="max-w-4xl">
        {/* Top bar */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="group flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-[#0047FF]"
          >
            <ArrowLeft
              size={18}
              className="transition-transform group-hover:-translate-x-0.5"
            />
            Quay lại
          </button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">Mã đơn #{orderLabel}</span>
            <button
              type="button"
              onClick={handleRefresh}
              className="flex items-center gap-1 text-sm font-medium text-[#0047FF] hover:underline"
            >
              <RefreshCw
                size={16}
                className={cn(refreshing && "animate-spin")}
              />
              Làm mới
            </button>
          </div>
        </div>

        {/* Status hero */}
        <div className="mb-6 flex flex-col items-center gap-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md md:flex-row md:items-center">
          <div className="relative h-24 w-24 shrink-0">
            <div className="absolute inset-0 rounded-full border-[3px] border-[#E5EEFF]" />
            <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-[#0047FF] border-t-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Clock size={28} className="text-[#0047FF]" />
            </div>
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-xl font-semibold tracking-tight text-gray-900">
              Chờ báo giá
            </h1>
            <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-gray-500">
              Các nhà xe đang xem yêu cầu của bạn. Thông tin báo giá thường sẽ được phản hồi
              trong vòng khoảng{" "}
              <span className="font-bold text-[#0047FF]">~30 phút</span>.
            </p>
          </div>
        </div>

        {/* Quotes list */}
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-gray-900">
              {loading ? "Báo giá hiện có" : `Báo giá hiện có (${quotes.length})`}
            </h2>
            {orderStatus === "pending" && (
              <span className="shrink-0 rounded-full bg-[#DBE1FF] px-3 py-1 text-xs font-medium text-[#00174B]">
                Đang cập nhật
              </span>
            )}
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="h-40 animate-pulse rounded-xl border border-gray-100 bg-white" />
              <QuoteSkeletonCard />
            </div>
          ) : quotes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-[#EFF4FF]">
                <Truck size={32} className="text-[#0047FF]/40" />
              </div>
              <p className="font-semibold text-gray-900">Chưa có báo giá</p>
              <p className="mt-1 text-sm text-gray-500">
                Hệ thống đang gửi yêu cầu đến nhà xe phù hợp…
              </p>
              <Link
                href={`/don-hang/${orderId}`}
                className="mt-5 inline-block text-sm font-semibold text-[#0047FF] hover:underline"
              >
                Xem chi tiết đơn →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {quotes.map((q) => {
                const price = q.total_price ?? q.base_price;
                const rating = q.provider_rating ?? 4.5;
                const detailHref = `/don-hang/${orderId}/bao-gia/${q.id}`;

                return (
                  <div
                    key={q.id}
                    className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#E5EEFF] text-[#0047FF]">
                          <Truck size={22} />
                        </div>
                        <div>
                          <div className="mb-0.5 flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold text-gray-900">
                              {q.provider_name ?? "Nhà xe"}
                            </h3>
                            <div className="flex items-center gap-1 rounded bg-[#DCE9FF] px-2 py-0.5 text-xs font-medium text-gray-600">
                              <Star size={14} className="fill-amber-400 text-amber-400" />
                              {rating.toFixed(1)}
                            </div>
                          </div>
                          <Link
                            href={detailHref}
                            className="inline-flex items-center gap-1 text-xs font-medium text-[#0047FF] hover:underline"
                          >
                            Xem đánh giá &amp; chi tiết
                            <ArrowRight size={14} />
                          </Link>
                          {q.note && (
                            <p className="mt-2 line-clamp-2 text-xs text-gray-500">{q.note}</p>
                          )}
                        </div>
                      </div>
                      <div className="md:text-right">
                        <span className="text-[11px] text-gray-400">Giá đề xuất</span>
                        <p className="text-lg font-bold text-[#2563EB]">{formatVND(price)}</p>
                      </div>
                    </div>

                    {q.status === "submitted" && canSelect && (
                      <div className="flex flex-col justify-end gap-2 border-t border-gray-100 bg-[#EFF4FF]/60 px-5 py-3 sm:flex-row">
                        <Button variant="outline" size="sm" className="sm:min-w-[100px]" asChild>
                          <Link href={detailHref}>Chi tiết</Link>
                        </Button>
                        <Button
                          size="sm"
                          className="bg-[#0047FF] px-6 hover:bg-[#2563EB] sm:min-w-[130px]"
                          loading={acting}
                          onClick={() => selectQuote(q.id)}
                        >
                          Chốt ngay
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}

              {orderStatus === "pending" && <QuoteSkeletonCard />}
            </div>
          )}

          {/* Tip */}
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-gray-200 bg-[#DCE9FF]/50 p-4">
            <Info size={18} className="mt-0.5 shrink-0 text-[#0047FF]" />
            <div className="text-xs leading-relaxed text-gray-600">
              <p className="mb-0.5 text-sm font-semibold text-gray-900">Mẹo nhỏ cho bạn:</p>
              <p>
                Bạn có thể đợi thêm để nhận được nhiều báo giá từ các nhà xe khác nhau. UniMove
                luôn đảm bảo bạn nhận được mức giá cạnh tranh nhất trên thị trường sinh viên.
              </p>
            </div>
          </div>

          {orderStatus !== "pending" && (
            <div className="text-center">
              <Link
                href={`/don-hang/${orderId}`}
                className="text-sm font-semibold text-[#0047FF] hover:underline"
              >
                Tiếp tục theo dõi đơn hàng →
              </Link>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
