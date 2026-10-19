"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Truck, ChevronRight, X } from "lucide-react";
import { ordersApi } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";

interface ActiveOrder {
  id: string;
  status: string;
  pickup_address: string;
  dropoff_address?: string;
  delivery_address?: string;
}

const STATUS_LABEL: Record<string, string> = {
  accepted:    "Nhà xe đã xác nhận — chờ lấy hàng",
  picking_up:  "Nhà xe đang đến lấy hàng",
  in_progress: "Đang vận chuyển hàng của bạn",
  delivering:  "Đang giao hàng đến điểm đích",
};

const ACTIVE_STATUSES = ["accepted", "picking_up", "in_progress", "delivering"];
const POLL_MS = 15_000;

export function ActiveOrderBanner() {
  const router = useRouter();
  const [order, setOrder] = useState<ActiveOrder | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);

  const fetchActive = async () => {
    try {
      const user = getStoredUser();
      if (!user) return;

      const res = await ordersApi.list({ status: ACTIVE_STATUSES.join(",") });
      if (!res.success || !res.data) return;

      const data = res.data as { orders?: ActiveOrder[] } | ActiveOrder[];
      const orders: ActiveOrder[] = Array.isArray(data) ? data : (data?.orders ?? []);
      const active = orders.find(o => ACTIVE_STATUSES.includes(o.status));

      setOrder(active ?? null);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchActive();
    const interval = setInterval(fetchActive, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  if (!order || order.id === dismissed) return null;

  const label = STATUS_LABEL[order.status] ?? "Đơn hàng đang thực hiện";
  const dest = order.dropoff_address ?? order.delivery_address ?? "";

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] w-full max-w-lg px-4"
      style={{ pointerEvents: "none" }}
    >
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl cursor-pointer"
        style={{
          background: "linear-gradient(135deg, #1648C0, #2563EB)",
          pointerEvents: "all",
          border: "1.5px solid rgba(255,255,255,0.15)",
        }}
        onClick={() => router.push(
          // provider dùng /orders/:id, customer dùng /don-hang/:id
          window.location.pathname.startsWith("/tai-xe") || window.location.pathname.startsWith("/orders")
            ? `/orders/${order.id}`
            : `/don-hang/${order.id}`
        )}
      >
        {/* Icon */}
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <Truck size={18} className="text-white" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white/80 uppercase tracking-wide leading-none mb-0.5">
            {label}
          </p>
          {dest && (
            <p className="text-sm font-semibold text-white truncate">{dest}</p>
          )}
        </div>

        {/* Arrow */}
        <ChevronRight size={18} className="text-white/70 shrink-0" />

        {/* Dismiss */}
        <button
          onClick={e => { e.stopPropagation(); setDismissed(order.id); }}
          className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors shrink-0 ml-1"
        >
          <X size={14} className="text-white" />
        </button>
      </div>
    </div>
  );
}
