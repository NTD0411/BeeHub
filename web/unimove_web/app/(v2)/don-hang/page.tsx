"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Truck, Plus, MapPin, Search, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeSlideIn, StaggerContainer, StaggerItem } from "@/components/motion/fade-slide-in";
import { PressableScale } from "@/components/motion/pressable-scale";
import { Container } from "@/components/layout/Container";
import { ordersApi } from "@/lib/api";
import { getOrderStatusLabel, timeAgo, formatVND, cn } from "@/lib/utils";

interface Order {
  id: string;
  order_number?: string;
  status: string;
  pickup_address: string;
  dropoff_address: string;
  estimated_price?: number;
  final_price?: number;
  total_price?: number;
  created_at: string;
  provider?: { full_name: string };
}

const TABS = [
  { key: "", label: "Tất cả" },
  { key: "pending,accepted,picking_up,in_progress", label: "Đang thực hiện" },
  { key: "completed", label: "Hoàn thành" },
  { key: "cancelled", label: "Đã huỷ" },
] as const;

function formatOrderId(order: Order): string {
  if (order.order_number) return `#${order.order_number}`;
  return `#${order.id.slice(0, 8).toUpperCase()}`;
}

function getStatusTextClass(status: string): string {
  if (status === "cancelled") return "text-red-500";
  if (status === "completed") return "text-emerald-600";
  return "text-[#2563EB]";
}

function OrderCard({ order }: { order: Order }) {
  const price = order.final_price ?? order.estimated_price ?? order.total_price;
  const isCompleted = order.status === "completed";

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
    >
      <Card className="overflow-hidden border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md hover:border-gray-200">
        <Link href={`/don-hang/${order.id}`} className="block no-underline group">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <span className="text-xs font-mono font-semibold text-gray-400 tracking-wide">
              {formatOrderId(order)}
            </span>
            <span className={cn("text-xs font-bold", getStatusTextClass(order.status))}>
              {getOrderStatusLabel(order.status)}
            </span>
          </div>

          <div className="px-4 py-4 space-y-3">
            <div className="flex items-start gap-3">
              <span className="mt-1.5 w-2 h-2 rounded-full bg-[#2563EB] shrink-0" aria-hidden />
              <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                {order.pickup_address}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={14} className="mt-0.5 shrink-0 text-emerald-500" aria-hidden />
              <p className="text-sm font-semibold text-gray-900 leading-relaxed line-clamp-2">
                {order.dropoff_address}
              </p>
            </div>
          </div>
        </Link>

        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-gray-50">
          <div className="flex items-center gap-2.5 min-w-0">
            {price != null && price > 0 && (
              <span className="text-sm font-bold text-gray-900 shrink-0">
                {formatVND(price)}
              </span>
            )}
            <span className="text-xs text-gray-400 truncate">{timeAgo(order.created_at)}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isCompleted && (
              <Link
                href={`/don-hang/${order.id}/danh-gia`}
                className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 transition-colors hover:border-amber-300 hover:bg-amber-100 no-underline"
              >
                <Star size={12} className="fill-amber-500 text-amber-500" />
                Đánh giá
              </Link>
            )}
            <Link
              href={`/don-hang/${order.id}`}
              className="inline-flex items-center gap-0.5 text-xs font-bold text-[#2563EB] no-underline hover:gap-1.5 transition-all"
            >
              Chi tiết <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function FilterTabs({
  tab,
  onChange,
}: {
  tab: number;
  onChange: (index: number) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
      {TABS.map((t, i) => {
        const active = tab === i;
        return (
          <button
            key={t.label}
            type="button"
            onClick={() => onChange(i)}
            className={cn(
              "relative shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200",
              active ? "text-white" : "text-slate-500 hover:text-slate-700"
            )}
          >
            {active && (
              <motion.span
                layoutId="order-tab-pill"
                className="absolute inset-0 rounded-full bg-[#2563EB] shadow-[0_4px_12px_rgba(37,99,235,0.28)]"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            <span className="relative z-10">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function DonHangPage() {
  const [tab, setTab] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async (status: string) => {
    setLoading(true);
    try {
      const r = await ordersApi.list(status ? { status } : {});
      if (r.success && r.data) {
        const d = r.data as { orders?: Order[] } | Order[];
        setOrders(Array.isArray(d) ? d : (d?.orders ?? []));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(TABS[tab].key);
  }, [tab, load]);

  const filtered = orders.filter(
    (o) =>
      !search ||
      (o.dropoff_address?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (o.pickup_address?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  return (
    <Container className="pt-6 pb-10 space-y-5">
      <FadeSlideIn>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Đơn hàng</h1>
            <p className="text-sm text-gray-500 mt-1">
              Quản lý tất cả đơn chuyển trọ của bạn
            </p>
          </div>
          <PressableScale>
            <Button
              asChild
              size="md"
              className="rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] shadow-[0_4px_14px_rgba(37,99,235,0.3)] font-bold shrink-0"
              style={{ backgroundColor: "#2563EB" }}
            >
              <Link href="/dat-chuyen">
                <Plus size={16} />
                Đặt mới
              </Link>
            </Button>
          </PressableScale>
        </div>
      </FadeSlideIn>

      <FadeSlideIn delay={60}>
        <FilterTabs tab={tab} onChange={setTab} />
      </FadeSlideIn>

      <FadeSlideIn delay={100}>
        <Input
          placeholder="Tìm kiếm địa điểm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startAdornment={<Search size={16} />}
          className="h-11 rounded-2xl border-gray-200 bg-white shadow-sm focus-visible:ring-[#2563EB]/30"
        />
      </FadeSlideIn>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[168px] w-full rounded-2xl" />
            ))}
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <Card className="py-16 text-center border-gray-100 bg-white shadow-sm">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 22 }}
                className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4"
              >
                <Truck size={32} className="text-[#2563EB]" />
              </motion.div>
              <p className="font-bold text-gray-900 mb-1">Không có đơn hàng nào</p>
              <p className="text-sm text-gray-500 mb-5">Đặt chuyến đầu tiên để bắt đầu!</p>
              {tab === 0 && !search && (
                <PressableScale className="inline-block">
                  <Button
                    asChild
                    className="rounded-full bg-[#2563EB] font-bold shadow-[0_4px_14px_rgba(37,99,235,0.3)]"
                    style={{ backgroundColor: "#2563EB" }}
                  >
                    <Link href="/dat-chuyen">Đặt dịch vụ ngay</Link>
                  </Button>
                </PressableScale>
              )}
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key={`list-${tab}-${search}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-3"
          >
            <StaggerContainer className="space-y-3" stagger={0.07}>
              {filtered.map((order) => (
                <StaggerItem key={order.id}>
                  <OrderCard order={order} />
                </StaggerItem>
              ))}
            </StaggerContainer>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center text-xs text-gray-400 py-2"
            >
              {filtered.length} đơn hàng
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </Container>
  );
}
