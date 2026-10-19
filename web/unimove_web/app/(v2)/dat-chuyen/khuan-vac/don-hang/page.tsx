"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Truck } from "lucide-react";
import { BookingShell } from "@/components/booking/BookingShell";
import { ordersApi } from "@/lib/api";
import { getOrderStatusLabel, timeAgo } from "@/lib/utils";
import { useBookingFlowStore } from "@/lib/stores/useBookingFlowStore";
import { cn } from "@/lib/utils";

const ACTIVE = ["pending", "accepted", "matched", "picking_up", "in_progress"];

interface Order {
  id: string;
  status: string;
  pickup_address: string;
  dropoff_address: string;
  created_at: string;
}

export default function KhuanVacDonHangPage() {
  const router = useRouter();
  const { linkedOrderId, setLinkedOrderId } = useBookingFlowStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.list({}).then((r) => {
      if (r.success && Array.isArray(r.data)) {
        setOrders((r.data as Order[]).filter((o) => ACTIVE.includes(o.status)));
      }
    }).finally(() => setLoading(false));
  }, []);

  return (
    <BookingShell
      title="Chọn đơn để thêm khuân vác"
      backHref="/dat-chuyen/khuan-vac"
      footer={
        <button
          type="button"
          disabled={!linkedOrderId}
          onClick={() => router.push("/dat-chuyen/khuan-vac/cau-hinh")}
          className="w-full rounded-full bg-[#0047FF] py-3.5 text-sm font-bold text-white disabled:opacity-50"
        >
          Tiếp tục cấu hình
        </button>
      }
    >
      {loading ? (
        <p className="text-sm text-gray-500">Đang tải đơn...</p>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center">
          <p className="font-semibold text-gray-900">Không có đơn đang chạy</p>
          <p className="mt-1 text-sm text-gray-500">Hãy đặt chuyến vận chuyển trước khi thêm khuân vác.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setLinkedOrderId(o.id)}
              className={cn(
                "w-full rounded-2xl border p-4 text-left",
                linkedOrderId === o.id ? "border-[#0047FF] bg-blue-50/40" : "border-gray-100 bg-white"
              )}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">{getOrderStatusLabel(o.status)}</span>
                <span className="text-xs text-gray-400">{timeAgo(o.created_at)}</span>
              </div>
              <div className="flex gap-2 text-sm text-gray-800">
                <Truck size={16} className="mt-0.5 shrink-0 text-[#0047FF]" />
                <span className="line-clamp-2">{o.pickup_address} → {o.dropoff_address}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </BookingShell>
  );
}
