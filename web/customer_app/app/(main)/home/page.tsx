"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Truck, Package, ShoppingBag, Receipt,
  Search, ChevronRight, MapPin, Route, Users, Store,
  Sparkles, User,
} from "lucide-react";
import { FadeSlideIn, StaggerContainer, StaggerItem } from "@/components/motion/fade-slide-in";
import { PressableScale } from "@/components/motion/pressable-scale";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { customerApi, ordersApi } from "@/lib/api";
import { getStoredUser, type User as AuthUser } from "@/lib/auth";
import { formatVND, getOrderStatusLabel, getOrderStatusColor, timeAgo } from "@/lib/utils";

interface Order {
  id: string;
  status: string;
  pickup_address: string;
  dropoff_address: string;
  delivery_address?: string;
  total_price?: number;
  estimated_price?: number;
  created_at: string;
}

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

export default function HomePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getStoredUser());
    Promise.allSettled([customerApi.getMe(), ordersApi.getOrders({ page: 1 })])
      .then(([profileRes, ordersRes]) => {
        if (profileRes.status === "fulfilled" && profileRes.value.success) {
          setUser(profileRes.value.data as AuthUser);
        }
        if (ordersRes.status === "fulfilled" && ordersRes.value.success) {
          const data = ordersRes.value.data as { orders?: Order[] } | Order[];
          const list = Array.isArray(data) ? data : (data?.orders ?? []);
          setOrders(list.slice(0, 5));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const recentOrder = orders[0];

  return (
    <div className="min-h-screen">
      {/* Sticky header — khớp mobile HomePage */}
      <header
        className="sticky top-0 z-20 px-5 py-3 backdrop-blur-xl border-b"
        style={{ backgroundColor: "var(--glass-bg)", borderColor: "var(--glass-border)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/profile">
              <PressableScale className="w-10 h-10 rounded-full border-2 flex items-center justify-center overflow-hidden"
                style={{ borderColor: "var(--primary)", backgroundColor: "var(--primary-tint)" }}>
                {user?.avatar_url ? (
                  <Image src={user.avatar_url} alt="" width={40} height={40} className="object-cover" />
                ) : (
                  <User size={20} style={{ color: "var(--primary)" }} />
                )}
              </PressableScale>
            </Link>
            <span className="text-2xl font-bold tracking-tight gradient-text truncate">UniMove</span>
          </div>
        </div>
      </header>

      <div className="px-5 pt-4 pb-28 space-y-6">
        <FadeSlideIn delay={80}>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>
            {greeting()}, {firstName(user?.full_name)}! 👋
          </h1>
          <p className="text-base mt-1" style={{ color: "var(--muted)" }}>
            So sánh báo giá nhà xe · Đặt cọc an toàn qua UniMove
          </p>
        </FadeSlideIn>

        <FadeSlideIn delay={160}>
          <Link href="/booking/location">
            <GlassCard className="flex items-center gap-3 px-4 py-3.5" hover>
              <Search size={18} style={{ color: "var(--primary)" }} />
              <span className="text-sm" style={{ color: "var(--muted)" }}>Bạn muốn chuyển đến đâu?</span>
            </GlassCard>
          </Link>
        </FadeSlideIn>

        <FadeSlideIn delay={220}>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>Dịch vụ chính</h2>
          <Link href="/booking/location?mode=combo">
            <PressableScale>
              <div
                className="rounded-2xl p-5 border relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, var(--primary-tint) 0%, var(--card) 100%)",
                  borderColor: "var(--glass-border)",
                }}
              >
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--primary)" }}>
                    <Truck size={24} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--primary)" }}>
                      Combo chuyển trọ
                    </p>
                    <h3 className="text-lg font-bold mb-1" style={{ color: "var(--text)" }}>Gói trọn gói minh bạch</h3>
                    <p className="text-sm" style={{ color: "var(--muted)" }}>Chọn gói dịch vụ · Chốt nhà xe · Đặt cọc</p>
                  </div>
                  <ChevronRight size={20} style={{ color: "var(--muted)" }} />
                </div>
              </div>
            </PressableScale>
          </Link>
        </FadeSlideIn>

        <div>
          <FadeSlideIn delay={280}>
            <h2 className="text-base font-semibold mb-3" style={{ color: "var(--text)" }}>Tất cả dịch vụ</h2>
          </FadeSlideIn>
          <StaggerContainer className="grid grid-cols-2 gap-3">
            {[
              { href: "/booking/location", icon: Route, title: "Đặt chuyến", sub: "Chọn điểm đón & đến", tint: "var(--primary-tint)", color: "var(--primary)" },
              { href: "/booking/labor", icon: Users, title: "Khuân vác", sub: "Thêm vào đơn đã đặt", tint: "var(--success-tint)", color: "var(--success)" },
              { href: "/marketplace", icon: Store, title: "Chợ sinh viên", sub: "Mua bán đồ · SV tin nhau", tint: "var(--warning-tint)", color: "var(--warning)" },
              { href: "/reference-prices", icon: Receipt, title: "Bảng phụ phí", sub: "Tham khảo minh bạch", tint: "#f3e8ff", color: "#9333ea" },
            ].map((s) => (
              <StaggerItem key={s.href}>
                <Link href={s.href}>
                  <GlassCard className="p-4 h-full" hover>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: s.tint }}>
                      <s.icon size={20} style={{ color: s.color }} />
                    </div>
                    <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>{s.title}</p>
                    <p className="text-xs mt-0.5 leading-snug" style={{ color: "var(--muted)" }}>{s.sub}</p>
                  </GlassCard>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>

        <FadeSlideIn delay={360}>
          <Link href="/reference-prices">
            <div
              className="rounded-2xl p-4 flex items-center gap-4 overflow-hidden relative"
              style={{ background: "linear-gradient(135deg, #f59e0b, #ea580c)" }}
            >
              <Sparkles className="text-yellow-200 shrink-0" size={28} />
              <div className="flex-1">
                <p className="text-white font-bold text-sm">Flash Sale · Bảng phụ phí</p>
                <p className="text-white/80 text-xs">Xem giá tham khảo minh bạch trước khi đặt</p>
              </div>
              <ChevronRight className="text-white/90" size={20} />
            </div>
          </Link>
        </FadeSlideIn>

        <FadeSlideIn delay={420}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>Đơn hàng gần đây</h2>
            <Link href="/activity" className="text-sm font-medium" style={{ color: "var(--primary)" }}>Xem hoạt động</Link>
          </div>

          {loading ? (
            <Skeleton className="h-28 w-full rounded-2xl" />
          ) : recentOrder ? (
            <Link href={`/orders/${recentOrder.id}`}>
              <GlassCard className="p-4" hover>
                <div className="flex items-center justify-between mb-3">
                  <Badge style={{
                    backgroundColor: getOrderStatusColor(recentOrder.status) + "22",
                    color: getOrderStatusColor(recentOrder.status),
                  }}>
                    {getOrderStatusLabel(recentOrder.status)}
                  </Badge>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>{timeAgo(recentOrder.created_at)}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2 items-start">
                    <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: "var(--primary)" }} />
                    <span className="line-clamp-1" style={{ color: "var(--text)" }}>{recentOrder.pickup_address}</span>
                  </div>
                  <div className="flex gap-2 items-start">
                    <MapPin size={12} className="mt-1 shrink-0" style={{ color: "var(--success)" }} />
                    <span className="line-clamp-1" style={{ color: "var(--text)" }}>
                      {recentOrder.dropoff_address || recentOrder.delivery_address}
                    </span>
                  </div>
                </div>
                {(recentOrder.total_price || recentOrder.estimated_price) && (
                  <p className="text-sm font-bold mt-3" style={{ color: "var(--primary)" }}>
                    {formatVND(recentOrder.total_price ?? recentOrder.estimated_price ?? 0)}
                  </p>
                )}
              </GlassCard>
            </Link>
          ) : (
            <GlassCard className="p-8 text-center">
              <Package size={40} className="mx-auto mb-3 opacity-30" style={{ color: "var(--primary)" }} />
              <p className="font-semibold mb-1" style={{ color: "var(--text)" }}>Chưa có đơn hàng</p>
              <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>Bắt đầu với dịch vụ chuyển trọ</p>
              <Link href="/booking/location" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold btn-gradient">
                Đặt chuyến <ChevronRight size={16} />
              </Link>
            </GlassCard>
          )}
        </FadeSlideIn>
      </div>
    </div>
  );
}
