"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Truck,
  MapPin,
  ChevronRight,
  RefreshCw,
  History,
  Star,
  Navigation,
  Package,
} from "lucide-react";
import { FadeSlideIn } from "@/components/motion/fade-slide-in";
import { Container } from "@/components/layout/Container";
import { Skeleton } from "@/components/ui/skeleton";
import { ordersApi } from "@/lib/api";
import { getOrderStatusLabel, timeAgo, formatVND } from "@/lib/utils";

interface Order {
  id: string;
  order_number?: string;
  status: string;
  service_type?: string;
  pickup_address: string;
  dropoff_address: string;
  estimated_price?: number;
  final_price?: number;
  total_price?: number;
  created_at: string;
  scheduled_pickup_time?: string;
  payment_method?: string;
  provider_id?: string;
  provider_name?: string;
  provider?: { full_name: string };
}

const ACTIVE = ["pending", "accepted", "matched", "picking_up", "in_progress"];

function formatOrderId(order: Order): string {
  if (order.order_number) return `#${order.order_number}`;
  return `#ORD-${order.id.slice(0, 8).toUpperCase()}`;
}

function formatEstimatedDelivery(iso?: string): string {
  if (!iso) return "Đang cập nhật";
  const d = new Date(iso);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  const time = new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
  if (isToday) return `Hôm nay, ${time}`;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function displayTimeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff >= 604800 && diff < 2592000) {
    return `${Math.floor(diff / 604800)} tuần trước`;
  }
  return timeAgo(dateStr);
}

function getRecentStatusLabel(status: string): string {
  if (status === "completed") return "Đã vận chuyển";
  return getOrderStatusLabel(status);
}

function getRecentStatusColor(status: string): string {
  if (status === "cancelled") return "#DC2626";
  if (status === "completed") return "#6B7280";
  return "#6B7280";
}

function getPaymentLabel(method?: string): string | null {
  if (!method) return null;
  const map: Record<string, string> = {
    cash: "Thanh toán tiền mặt",
    payos: "Ví điện tử",
    wallet: "Ví điện tử",
    momo: "Ví điện tử",
  };
  return map[method] ?? null;
}

function LiveTrackingIllustration() {
  return (
    <div className="relative hidden md:flex w-[200px] lg:w-[260px] xl:w-[300px] shrink-0 items-center justify-center">
      <div className="relative w-full aspect-[4/3] rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-100 shadow-inner overflow-hidden">
        <svg viewBox="0 0 160 120" className="absolute inset-0 w-full h-full" aria-hidden>
          <path
            d="M20 80 Q50 40 90 55 T140 35"
            fill="none"
            stroke="#2563EB"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="6 4"
          />
          <circle cx="20" cy="80" r="5" fill="#2563EB" />
          <circle cx="140" cy="35" r="5" fill="#F59E0B" />
          <path d="M30 95 L50 75 L70 85 L95 60 L120 70" fill="none" stroke="#CBD5E1" strokeWidth="1.5" />
        </svg>
        <span className="absolute top-2 right-2 rounded-md bg-white/90 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-[#2563EB] shadow-sm">
          LIVE TRACKING
        </span>
      </div>
    </div>
  );
}

function ActiveOrderCard({ order }: { order: Order }) {
  const providerName =
    order.provider?.full_name ?? order.provider_name ?? "Đang cập nhật";

  return (
    <Link href={`/don-hang/${order.id}`} className="block no-underline group">
      <article className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-[0_4px_24px_rgba(15,23,42,0.06)] transition-shadow group-hover:shadow-[0_8px_32px_rgba(15,23,42,0.1)]">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#2563EB]" aria-hidden />

        <div className="flex flex-col md:flex-row md:items-stretch">
          <div className="flex-1 p-6 pl-7">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className="inline-flex items-center rounded-lg bg-[#EFF6FF] px-2.5 py-1 text-xs font-bold text-[#2563EB]">
                {getOrderStatusLabel(order.status)}
              </span>
              <span className="text-xs font-medium text-gray-400">{formatOrderId(order)}</span>
            </div>

            <div className="space-y-0 mb-6 max-w-2xl lg:max-w-none">
              <div className="flex gap-4">
                <div className="flex flex-col items-center pt-1">
                  <div className="w-8 h-8 rounded-full bg-[#EFF6FF] flex items-center justify-center shrink-0">
                    <MapPin size={15} className="text-[#2563EB]" />
                  </div>
                  <div className="w-px flex-1 min-h-[24px] border-l border-dashed border-gray-300 my-1.5" />
                </div>
                <div className="pb-4">
                  <p className="text-[11px] font-semibold text-gray-400 mb-0.5">Điểm đi</p>
                  <p className="text-sm font-medium text-gray-900 leading-relaxed">
                    {order.pickup_address}
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                  <Navigation size={15} className="text-amber-500" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 mb-0.5">Điểm đến</p>
                  <p className="text-sm font-medium text-gray-900 leading-relaxed">
                    {order.dropoff_address}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-6 lg:gap-10">
                <div className="flex items-center gap-2">
                  <Truck size={16} className="text-gray-400 shrink-0" />
                  <div>
                    <p className="text-[11px] text-gray-400">Nhà xe</p>
                    <p className="text-sm font-semibold text-gray-900">{providerName}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400">Dự kiến giao</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatEstimatedDelivery(order.scheduled_pickup_time)}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-0.5 text-sm font-bold text-[#2563EB] group-hover:gap-1.5 transition-all ml-auto">
                Theo dõi đơn <ChevronRight size={16} />
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center pr-6 py-6">
            <LiveTrackingIllustration />
          </div>
        </div>
      </article>
    </Link>
  );
}

function RecentOrderRow({ order }: { order: Order }) {
  const price = order.final_price ?? order.estimated_price ?? order.total_price;
  const payment = getPaymentLabel(order.payment_method);
  const statusLabel = getRecentStatusLabel(order.status);
  const statusColor = getRecentStatusColor(order.status);
  const isDelivery = order.service_type === "delivery";
  const Icon = isDelivery ? Package : Truck;

  return (
    <Link href={`/don-hang/${order.id}`} className="block no-underline group">
      <article className="grid grid-cols-[auto_1fr] md:grid-cols-[48px_minmax(0,1fr)_minmax(120px,160px)_minmax(100px,120px)_20px] items-center gap-3 md:gap-5 p-4 md:p-5 rounded-2xl bg-white border border-gray-100 shadow-sm transition-all group-hover:border-gray-200 group-hover:shadow-md">
        <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-[#EFF6FF] flex items-center justify-center shrink-0">
          <Icon size={20} className="text-[#2563EB]" />
        </div>

        <div className="min-w-0 col-span-1 md:col-span-1">
          <p className="text-sm font-bold text-gray-900 line-clamp-1">{order.dropoff_address}</p>
          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{order.pickup_address}</p>
        </div>

        <div className="hidden md:block text-right shrink-0">
          {price != null && price > 0 && (
            <p className="text-sm font-bold text-gray-900">{formatVND(price)}</p>
          )}
          {payment && <p className="text-[11px] text-gray-400 mt-0.5">{payment}</p>}
        </div>

        <div className="hidden md:block text-right shrink-0">
          <p className="text-xs font-semibold" style={{ color: statusColor }}>
            {statusLabel}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">{displayTimeAgo(order.created_at)}</p>
        </div>

        <ChevronRight
          size={18}
          className="hidden md:block text-gray-300 shrink-0 group-hover:text-gray-500 transition-colors justify-self-end"
        />

        <div className="col-span-2 flex md:hidden items-center justify-between pt-1 border-t border-gray-50 mt-1">
          <div>
            {price != null && price > 0 && (
              <p className="text-sm font-bold text-gray-900">{formatVND(price)}</p>
            )}
            {payment && <p className="text-[11px] text-gray-400">{payment}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold" style={{ color: statusColor }}>
              {statusLabel}
            </p>
            <p className="text-[11px] text-gray-400">{displayTimeAgo(order.created_at)}</p>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function HoatDongPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await ordersApi.list({});
      if (r.success && r.data) {
        const d = r.data as { orders?: Order[] } | Order[];
        setOrders(Array.isArray(d) ? d : (d?.orders ?? []));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  const activeOrder = orders.find((o) => ACTIVE.includes(o.status) && o.provider_id);
  const reviewOrder = orders.find((o) => o.status === "completed");
  const recent = orders.filter((o) => o.id !== activeOrder?.id).slice(0, 8);

  return (
    <Container className="pt-6 pb-10 space-y-8">
      <FadeSlideIn>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Hoạt động</h1>
            <p className="text-sm text-gray-500 mt-1">
              Đơn hàng đang chạy &amp; lịch sử gần đây
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              Làm mới
            </button>
            <Link
              href="/don-hang"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] text-sm font-semibold text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)] hover:brightness-110 transition-all no-underline"
            >
              <History size={16} />
              Lịch sử
            </Link>
          </div>
        </div>
      </FadeSlideIn>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-52 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      ) : (
        <>
          {activeOrder && (
            <FadeSlideIn delay={80}>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                Đang thực hiện
              </p>
              <ActiveOrderCard order={activeOrder} />
            </FadeSlideIn>
          )}

          {reviewOrder && (
            <FadeSlideIn delay={120}>
              <Link href={`/don-hang/${reviewOrder.id}/danh-gia`} className="no-underline block">
                <div className="rounded-2xl p-4 flex items-center gap-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 hover:border-amber-300 transition-colors">
                  <Star size={28} className="text-amber-600 shrink-0" fill="#d97706" />
                  <div className="flex-1">
                    <p className="font-bold text-amber-900 text-sm">Đánh giá chuyến đi</p>
                    <p className="text-xs text-amber-800/80">Chia sẻ trải nghiệm với nhà xe</p>
                  </div>
                  <ChevronRight className="text-amber-700" size={20} />
                </div>
              </Link>
            </FadeSlideIn>
          )}

          <FadeSlideIn delay={160}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Gần đây
              </h2>
              {recent.length > 0 && (
                <Link
                  href="/don-hang"
                  className="text-sm font-semibold text-[#2563EB] no-underline hover:underline"
                >
                  Xem tất cả
                </Link>
              )}
            </div>

            {recent.length === 0 ? (
              <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] flex items-center justify-center mx-auto mb-3">
                  <Truck size={28} className="text-[#2563EB]" />
                </div>
                <p className="text-sm font-medium text-gray-500">Chưa có hoạt động</p>
                <Link
                  href="/dat-chuyen"
                  className="inline-block mt-4 text-sm font-semibold text-[#2563EB] no-underline hover:underline"
                >
                  Đặt chuyến đầu tiên →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recent.map((order) => (
                  <RecentOrderRow key={order.id} order={order} />
                ))}
              </div>
            )}
          </FadeSlideIn>
        </>
      )}
    </Container>
  );
}
