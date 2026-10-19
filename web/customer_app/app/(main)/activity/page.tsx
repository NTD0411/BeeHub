"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Truck, MapPin, ChevronRight, RefreshCw, History, Star, Navigation,
} from "lucide-react";
import { FadeSlideIn } from "@/components/motion/fade-slide-in";
import { PressableScale } from "@/components/motion/pressable-scale";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ordersApi } from "@/lib/api";
import { getOrderStatusLabel, getOrderStatusColor, timeAgo, formatVND } from "@/lib/utils";

interface Order {
  id: string;
  status: string;
  pickup_address: string;
  dropoff_address: string;
  delivery_address?: string;
  total_price?: number;
  estimated_price?: number;
  created_at: string;
  provider_id?: string;
  provider?: { full_name: string; rating?: number };
}

const ACTIVE = ["pending", "accepted", "matched", "picking_up", "in_progress"];

export default function ActivityPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ordersApi.getOrders({ page: 1 });
      if (res.success) {
        const data = res.data as { orders?: Order[] } | Order[];
        setOrders(Array.isArray(data) ? data : (data?.orders ?? []));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeOrder = orders.find((o) => ACTIVE.includes(o.status) && o.provider_id);
  const reviewOrder = orders.find((o) => o.status === "completed");
  const recent = orders.slice(0, 6);

  return (
    <div className="min-h-screen px-5 pt-6 pb-28">
      <FadeSlideIn>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>Hoạt động</h1>
          <div className="flex gap-2">
            <button onClick={load} className="p-2.5 rounded-xl" style={{ backgroundColor: "var(--surface)" }} aria-label="Làm mới">
              <RefreshCw size={18} style={{ color: "var(--muted)" }} />
            </button>
            <Link href="/orders">
              <PressableScale className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium border"
                style={{ backgroundColor: "var(--primary-tint)", borderColor: "var(--glass-border)", color: "var(--text)" }}>
                <History size={16} /> Lịch sử
              </PressableScale>
            </Link>
          </div>
        </div>
      </FadeSlideIn>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-5">
          {activeOrder && (
            <FadeSlideIn delay={80}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--primary)" }}>Đang thực hiện</p>
              <Link href={`/orders/${activeOrder.id}`}>
                <GlassCard className="p-4 border-2 border-[var(--primary)]" hover>
                  <div className="flex items-center justify-between mb-3">
                    <Badge style={{ backgroundColor: "var(--primary-tint)", color: "var(--primary)" }}>
                      {getOrderStatusLabel(activeOrder.status)}
                    </Badge>
                    <Navigation size={18} style={{ color: "var(--primary)" }} />
                  </div>
                  <p className="text-sm font-medium line-clamp-2 mb-2" style={{ color: "var(--text)" }}>
                    {activeOrder.pickup_address} → {activeOrder.dropoff_address || activeOrder.delivery_address}
                  </p>
                  {activeOrder.provider && (
                    <p className="text-xs" style={{ color: "var(--muted)" }}>Nhà xe: {activeOrder.provider.full_name}</p>
                  )}
                  <p className="text-sm font-bold mt-2 flex items-center gap-1" style={{ color: "var(--primary)" }}>
                    Theo dõi đơn <ChevronRight size={16} />
                  </p>
                </GlassCard>
              </Link>
            </FadeSlideIn>
          )}

          {reviewOrder && (
            <FadeSlideIn delay={120}>
              <Link href={`/orders/${reviewOrder.id}/review`}>
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="rounded-2xl p-4 flex items-center gap-4"
                  style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)" }}
                >
                  <Star size={28} className="text-amber-600 shrink-0" fill="#d97706" />
                  <div className="flex-1">
                    <p className="font-bold text-amber-900 text-sm">Đánh giá chuyến đi</p>
                    <p className="text-xs text-amber-800/80">Chia sẻ trải nghiệm với nhà xe</p>
                  </div>
                  <ChevronRight className="text-amber-700" size={20} />
                </motion.div>
              </Link>
            </FadeSlideIn>
          )}

          <FadeSlideIn delay={160}>
            <h2 className="text-base font-semibold mb-3" style={{ color: "var(--text)" }}>Gần đây</h2>
            {recent.length === 0 ? (
              <GlassCard className="p-8 text-center">
                <Truck size={36} className="mx-auto mb-2 opacity-30" style={{ color: "var(--primary)" }} />
                <p className="text-sm" style={{ color: "var(--muted)" }}>Chưa có hoạt động nào</p>
                <Link href="/booking/location" className="inline-block mt-4 text-sm font-semibold" style={{ color: "var(--primary)" }}>
                  Đặt chuyến đầu tiên →
                </Link>
              </GlassCard>
            ) : (
              <div className="space-y-3">
                {recent.map((order, i) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link href={`/orders/${order.id}`}>
                      <GlassCard className="p-4" hover>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--primary-tint)" }}>
                              <Truck size={18} style={{ color: "var(--primary)" }} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium line-clamp-1" style={{ color: "var(--text)" }}>
                                {order.dropoff_address || order.delivery_address || "Đơn hàng"}
                              </p>
                              <div className="flex items-center gap-1 mt-1">
                                <MapPin size={10} style={{ color: "var(--muted)" }} />
                                <span className="text-xs line-clamp-1" style={{ color: "var(--muted)" }}>{order.pickup_address}</span>
                              </div>
                              <span className="text-xs" style={{ color: "var(--muted)" }}>{timeAgo(order.created_at)}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <Badge style={{
                              backgroundColor: getOrderStatusColor(order.status) + "22",
                              color: getOrderStatusColor(order.status),
                            }}>
                              {getOrderStatusLabel(order.status)}
                            </Badge>
                            {(order.total_price || order.estimated_price) && (
                              <p className="text-xs font-semibold mt-1" style={{ color: "var(--text)" }}>
                                {formatVND(order.total_price ?? order.estimated_price ?? 0)}
                              </p>
                            )}
                          </div>
                        </div>
                      </GlassCard>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </FadeSlideIn>
        </div>
      )}
    </div>
  );
}
