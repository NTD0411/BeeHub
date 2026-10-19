"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Truck, Package, Search, ChevronRight, MapPin, Route, Users, Store, Receipt,
  Sparkles, User, MessageCircle, ArrowRight, ExternalLink, X, CheckCircle2, Lightbulb,
} from "lucide-react";
import { FadeSlideIn, StaggerContainer, StaggerItem } from "@/components/motion/fade-slide-in";
import { PressableScale } from "@/components/motion/pressable-scale";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { customerApi, ordersApi } from "@/lib/api";
import { getStoredUser, type AuthUser } from "@/lib/auth";
import { cn, formatVND, getOrderStatusLabel, getOrderStatusColor, timeAgo } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/NotificationBell";

const BLUE = "#0047FF";
const YELLOW = "#FFC107";

interface Order {
  id: string;
  status: string;
  service_type?: string;
  pickup_address: string;
  dropoff_address: string;
  estimated_price?: number;
  final_price?: number;
  created_at: string;
}

const SERVICES = [
  { href: "/dat-chuyen", icon: Route, title: "Đặt chuyến", sub: "Chọn điểm đón & đến", tint: "#EFF6FF", color: BLUE },
  { href: "/dat-chuyen?mode=combo", icon: Users, title: "Đặt combo", sub: "Xe + người khuân trọn gói", tint: "#FEF9C3", color: "#CA8A04" },
  { href: "/cho-sinh-vien", icon: Store, title: "Chợ sinh viên", sub: "Mua bán đồ · SV tin nhau", tint: "#DCFCE7", color: "#16A34A" },
  { href: "/reference-prices", icon: Receipt, title: "Bảng phụ phí", sub: "Tham khảo minh bạch", tint: "#FCE7F3", color: "#DB2777" },
] as const;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Chào buổi sáng";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

function firstName(fullName?: string) {
  if (!fullName?.trim()) return "bạn";
  const parts = fullName.trim().split(/\s+/);
  return parts.length === 1 ? parts[0] : parts[parts.length - 1];
}

function orderTitle(o: Order) {
  const map: Record<string, string> = {
    moving: "Chuyển nhà",
    porter: "Dịch vụ khuân vác",
    combo: "Combo chuyển trọ",
    standard: "Đơn vận chuyển",
  };
  if (o.service_type && map[o.service_type]) return map[o.service_type];
  const short = o.dropoff_address?.split(",")[0]?.trim();
  return short ? `Chuyển đến ${short}` : "Đơn hàng";
}

function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.play().catch(() => {});
  }, []);

  return (
    <video
      ref={ref}
      src="/hero.mp4"
      muted
      loop
      playsInline
      preload="metadata"
      className="absolute inset-0 h-full w-full object-cover object-[85%_center]"
    />
  );
}

function OrderRow({ order }: { order: Order }) {
  const cancelled = order.status === "cancelled";
  const completed = order.status === "completed";

  return (
    <Link href={`/don-hang/${order.id}`} className="group flex gap-4 rounded-2xl border border-gray-100 bg-white p-4 transition hover:border-blue-100 hover:shadow-md no-underline">
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          cancelled ? "bg-red-50 text-red-500" : completed ? "bg-blue-50 text-[#0047FF]" : "bg-gray-50 text-gray-500"
        )}
      >
        {cancelled ? <X size={20} /> : completed ? <CheckCircle2 size={20} /> : <Truck size={20} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-semibold text-gray-900 group-hover:text-[#0047FF]">{orderTitle(order)}</p>
          <Badge
            className="shrink-0 border-0 text-[10px] font-bold uppercase tracking-wide"
            style={{
              backgroundColor: getOrderStatusColor(order.status) + "22",
              color: getOrderStatusColor(order.status),
            }}
          >
            {getOrderStatusLabel(order.status)}
          </Badge>
        </div>
        <p className="mt-1 truncate text-sm text-gray-500">
          {order.pickup_address} → {order.dropoff_address}
        </p>
        <p className="mt-1 text-xs text-gray-400">{timeAgo(order.created_at)}</p>
      </div>
    </Link>
  );
}

export default function TrangChuPage() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    const stored = getStoredUser();
    if (stored) setUser(stored);

    Promise.allSettled([
      customerApi.getMe(),
      ordersApi.list({ page: 1 }),
    ]).then(([profileRes, ordersRes]) => {
      if (profileRes.status === "fulfilled" && profileRes.value.success) {
        setUser(profileRes.value.data as AuthUser);
      }
      if (ordersRes.status === "fulfilled" && ordersRes.value.success) {
        const d = ordersRes.value.data as { orders?: Order[] } | Order[];
        setOrders((Array.isArray(d) ? d : (d?.orders ?? [])).slice(0, 5));
      }
    }).finally(() => setLoading(false));
  }, []);

  const greetText = mounted ? greeting() : "Xin chào";
  const nameText = mounted ? firstName(user?.full_name) : "bạn";

  const completedOrders = orders.filter((o) => o.status === "completed");
  const totalSpent = completedOrders.reduce(
    (sum, o) => sum + (o.final_price ?? o.estimated_price ?? 0),
    0
  );
  const movingGoal = orders.length > 0
    ? Math.round((completedOrders.length / orders.length) * 100)
    : 0;

  return (
    <div className="pb-6 lg:pb-10">
      {/* ── Mobile header ── */}
      <header
        className="sticky top-0 z-20 border-b border-gray-100/80 bg-white/90 px-5 py-3 backdrop-blur-xl lg:hidden"
      >
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/tai-khoan">
              <PressableScale className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-[#0047FF] bg-[#EFF6FF]">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <User size={20} className="text-[#0047FF]" />
                )}
              </PressableScale>
            </Link>
            <span className="text-2xl font-extrabold tracking-tight">
              <span className="text-[#FFC107]">Uni</span>
              <span className="text-[#0047FF]">Move</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/tin-nhan"
              aria-label="Tin nhắn"
              className="relative rounded-full border border-gray-100 bg-white p-2.5 shadow-sm"
            >
              <MessageCircle size={20} className="text-[#0047FF]" />
            </Link>
            <NotificationBell
              showCountBadge
              buttonClassName="rounded-full border border-gray-100 bg-white p-2.5 shadow-sm"
              iconClassName="text-[#0047FF]"
              iconSize={20}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[var(--width-container)] space-y-6 px-5 pt-4 lg:space-y-8 lg:px-8 lg:pt-8">
        {/* Mobile greeting */}
        <FadeSlideIn delay={60} className="lg:hidden">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900" suppressHydrationWarning>
            {greetText}, {nameText}! 👋
          </h1>
          <p className="mt-1 text-base text-gray-500">So sánh báo giá nhà xe · Đặt cọc an toàn qua UniMove</p>
          <div className="mt-4 flex gap-3">
            <div className="flex-1 rounded-2xl border border-blue-100 bg-gradient-to-br from-[#EFF6FF] to-white px-4 py-3 shadow-sm">
              <p className="text-2xl font-extrabold text-[#0047FF]">90+</p>
              <p className="text-xs font-medium text-gray-500">Người sử dụng</p>
            </div>
            <div className="flex-1 rounded-2xl border border-amber-100 bg-gradient-to-br from-[#FFFBEB] to-white px-4 py-3 shadow-sm">
              <p className="text-2xl font-extrabold text-[#CA8A04]">2+</p>
              <p className="text-xs font-medium text-gray-500">Tài xế trên nền tảng</p>
            </div>
          </div>
        </FadeSlideIn>

        {/* Mobile search */}
        <FadeSlideIn delay={100} className="lg:hidden">
          <Link href="/dat-chuyen" className="no-underline">
            <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 shadow-sm">
              <Search size={18} className="shrink-0 text-[#0047FF]" />
              <span className="text-sm text-gray-500">Bạn muốn chuyển đến đâu?</span>
            </div>
          </Link>
        </FadeSlideIn>

        {/* ── Desktop Hero ── */}
        <FadeSlideIn delay={80} className="hidden lg:block">
          <div className="relative min-h-[300px] overflow-hidden rounded-3xl shadow-lg">
            <HeroVideo />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0047FF]/95 via-[#0047FF]/80 to-[#0047FF]/40" />
            <div className="relative z-10 flex min-h-[300px] max-w-xl flex-col justify-center p-10 text-white">
              <span className="mb-3 inline-flex w-fit rounded-full bg-[#FFC107] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-900">
                Combo chuyển trọ
              </span>
              <h1 className="text-4xl font-bold leading-tight tracking-tight">
                Gói trọn gói minh bạch.
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-blue-100">
                Dịch vụ chuyển nhà chuyên nghiệp cho sinh viên và người đi làm. Đặt cọc an toàn qua PayOS, so sánh báo giá từ nhiều nhà xe.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <div className="rounded-2xl bg-white/15 px-4 py-2.5 backdrop-blur-sm border border-white/20">
                  <p className="text-2xl font-extrabold leading-none">90+</p>
                  <p className="mt-1 text-xs text-blue-100">Người sử dụng</p>
                </div>
                <div className="rounded-2xl bg-white/15 px-4 py-2.5 backdrop-blur-sm border border-white/20">
                  <p className="text-2xl font-extrabold leading-none">2+</p>
                  <p className="mt-1 text-xs text-blue-100">Tài xế trên nền tảng</p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/dat-chuyen?mode=combo"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-[#0047FF] shadow-md transition hover:bg-blue-50 no-underline"
                >
                  Bắt đầu ngay <ArrowRight size={16} />
                </Link>
                <Link
                  href="/dat-chuyen"
                  className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 no-underline"
                >
                  Xem chi tiết
                </Link>
              </div>
            </div>
          </div>
        </FadeSlideIn>

        {/* Mobile combo card */}
        <FadeSlideIn delay={140} className="lg:hidden">
          <Link href="/dat-chuyen?mode=combo" className="no-underline">
            <PressableScale>
              <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-[#EFF6FF] to-white p-5">
                <div className="relative z-10 flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0047FF]">
                    <Truck size={24} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#0047FF]">Combo chuyển trọ</p>
                    <h3 className="mb-1 text-lg font-bold text-gray-900">Gói trọn gói minh bạch</h3>
                    <p className="text-sm text-gray-500">Chọn gói · Chốt nhà xe · Đặt cọc PayOS</p>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </div>
              </div>
            </PressableScale>
          </Link>
        </FadeSlideIn>

        {/* ── Services ── */}
        <section>
          <FadeSlideIn delay={180}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 lg:text-xl">Tất cả dịch vụ</h2>
              <Link href="/dat-chuyen" className="flex items-center gap-1 text-sm font-medium text-[#0047FF] no-underline hover:underline">
                Xem tất cả <ExternalLink size={14} />
              </Link>
            </div>
          </FadeSlideIn>
          <StaggerContainer className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            {SERVICES.map((s) => (
              <StaggerItem key={s.href}>
                <Link href={s.href} className="no-underline">
                  <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-blue-100 hover:shadow-md lg:p-5">
                    <div
                      className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl lg:h-12 lg:w-12"
                      style={{ backgroundColor: s.tint }}
                    >
                      <s.icon size={22} style={{ color: s.color }} />
                    </div>
                    <p className="font-semibold text-gray-900 lg:text-base">{s.title}</p>
                    <p className="mt-0.5 text-xs leading-snug text-gray-500 lg:text-sm">{s.sub}</p>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        {/* ── Flash sale ── */}
        <FadeSlideIn delay={240}>
          <Link href="/reference-prices" className="block no-underline">
            <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-[#FFC107] to-[#E6AD00] p-4 lg:rounded-3xl lg:p-5">
              <Sparkles className="shrink-0 text-gray-800" size={28} />
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900 lg:text-base">Flash Sale · Bảng phụ phí</p>
                <p className="text-xs text-gray-800/80 lg:text-sm">Xem giá tham khảo trước khi đặt · Ưu đãi giờ vàng</p>
              </div>
              <div className="hidden items-center gap-1 text-sm font-semibold text-gray-800 sm:flex">
                Ưu đãi có hạn <ChevronRight size={18} />
              </div>
              <ChevronRight className="text-gray-700 sm:hidden" size={20} />
            </div>
          </Link>
        </FadeSlideIn>

        {/* ── Dashboard: orders + overview ── */}
        <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
          <section className="lg:col-span-2">
            <FadeSlideIn delay={300}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 lg:text-xl">Đơn hàng gần đây</h2>
                <Link href="/hoat-dong" className="text-sm font-medium text-[#0047FF] no-underline hover:underline">
                  Hoạt động →
                </Link>
              </div>
            </FadeSlideIn>

            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
              </div>
            ) : orders.length > 0 ? (
              <div className="space-y-3">
                {orders.slice(0, 4).map((order) => (
                  <OrderRow key={order.id} order={order} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
                <Package size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="mb-1 font-semibold text-gray-900">Chưa có đơn hàng</p>
                <p className="mb-4 text-sm text-gray-500">Đặt chuyến đầu tiên để theo dõi tại đây</p>
                <Link
                  href="/dat-chuyen"
                  className="inline-flex items-center gap-2 rounded-full bg-[#0047FF] px-5 py-2.5 text-sm font-bold text-white no-underline"
                >
                  Đặt chuyến <ChevronRight size={16} />
                </Link>
              </div>
            )}
          </section>

          <aside className="hidden lg:block">
            <FadeSlideIn delay={360}>
              <div className="overflow-hidden rounded-3xl bg-[#0047FF] p-6 text-white shadow-lg">
                <p className="text-sm font-medium text-blue-200">Tổng quan logistics</p>
                <p className="mt-4 text-sm text-blue-100">Tổng chi tiêu</p>
                <p className="mt-1 text-3xl font-bold tracking-tight">
                  {mounted ? formatVND(totalSpent) : "—"}
                </p>

                <div className="mt-6">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-blue-100">Mục tiêu chuyển nhà</span>
                    <span className="font-semibold">{movingGoal}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-[#FFC107] transition-all duration-700"
                      style={{ width: `${movingGoal}%` }}
                    />
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-[#0039CC]/60 p-4">
                  <div className="mb-2 flex items-center gap-2 text-[#FFC107]">
                    <Lightbulb size={16} />
                    <span className="text-xs font-bold uppercase tracking-wide">Mẹo hôm nay</span>
                  </div>
                  <p className="text-sm leading-relaxed text-blue-50">
                    Đóng gói đồ nặng (sách, quần áo) trước — giúp nhà xe báo giá chính xác và tiết kiệm thời gian lên xe.
                  </p>
                </div>
              </div>
            </FadeSlideIn>
          </aside>
        </div>
      </div>
    </div>
  );
}
