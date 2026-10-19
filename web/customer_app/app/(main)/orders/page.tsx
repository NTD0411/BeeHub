"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Truck, MapPin, Clock, ChevronRight, RefreshCw, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ordersApi } from "@/lib/api";
import { getOrderStatusLabel, getOrderStatusColor, timeAgo, formatVND } from "@/lib/utils";

interface Order {
  id: string;
  status: string;
  service_type: string;
  pickup_address: string;
  dropoff_address: string;
  estimated_price?: number;
  final_price?: number;
  created_at: string;
  provider?: { full_name: string; rating: number };
}

const TABS = [
  { key: "", label: "Tất cả" },
  { key: "pending,accepted,picking_up,in_progress", label: "Đang thực hiện" },
  { key: "completed", label: "Hoàn thành" },
  { key: "cancelled", label: "Đã hủy" },
];

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchOrders = useCallback(async (status: string, pg: number) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page: pg };
      if (status) params.status = status;
      const res = await ordersApi.getOrders(params as { status?: string; page?: number });
      if (res.success) {
        const data = res.data as { orders?: Order[]; total?: number } | Order[];
        const list = Array.isArray(data) ? data : (data?.orders ?? []);
        if (pg === 1) setOrders(list);
        else setOrders((prev) => [...prev, ...list]);
        setHasMore(list.length >= 10);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    fetchOrders(TABS[activeTab].key, 1);
  }, [activeTab, fetchOrders]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchOrders(TABS[activeTab].key, next);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      {/* Header */}
      <div
        className="px-4 pt-12 pb-4 sticky top-0 z-10"
        style={{ backgroundColor: "var(--card)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Lịch sử đơn hàng</h1>
          <button onClick={() => fetchOrders(TABS[activeTab].key, 1)} className="p-2 rounded-xl" style={{ backgroundColor: "var(--surface)" }}>
            <RefreshCw size={18} style={{ color: "var(--muted)" }} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className="whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all shrink-0"
              style={{
                backgroundColor: activeTab === i ? "var(--primary)" : "var(--surface)",
                color: activeTab === i ? "white" : "var(--muted)",
                border: `1px solid ${activeTab === i ? "var(--primary)" : "var(--border)"}`,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-3">
        {loading && page === 1 ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border p-4 space-y-3" style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}>
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <Truck size={52} className="mx-auto mb-4 opacity-20" style={{ color: "var(--text)" }} />
            <p className="font-semibold mb-1" style={{ color: "var(--text)" }}>Không có đơn hàng nào</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {activeTab === 0 ? "Bắt đầu đặt dịch vụ chuyển trọ đầu tiên" : "Không tìm thấy đơn trong danh mục này"}
            </p>
            {activeTab === 0 && (
              <Link href="/booking/location">
                <button className="mt-4 px-6 py-3 rounded-xl text-white text-sm font-semibold"
                  style={{ background: "linear-gradient(135deg, var(--gradient-from), var(--gradient-to))" }}>
                  Đặt ngay
                </button>
              </Link>
            )}
          </div>
        ) : (
          <>
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
            {hasMore && (
              <button
                onClick={handleLoadMore}
                className="w-full py-3 text-sm font-medium rounded-xl"
                style={{ backgroundColor: "var(--surface)", color: "var(--primary)", border: "1px solid var(--border)" }}
              >
                {loading ? "Đang tải..." : "Xem thêm"}
              </button>
            )}
            <p className="text-center text-xs py-2" style={{ color: "var(--muted)" }}>
              Hiển thị {orders.length} đơn hàng
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const statusColor = getOrderStatusColor(order.status);
  const price = order.final_price ?? order.estimated_price;

  return (
    <Link href={`/orders/${order.id}`}>
      <Card className="p-4 hover:shadow-md transition-shadow">
        {/* Top */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge style={{ backgroundColor: statusColor + "22", color: statusColor, border: `1px solid ${statusColor}44` }}>
              {getOrderStatusLabel(order.status)}
            </Badge>
            {order.service_type && (
              <Badge variant="outline" className="text-[10px]">{order.service_type}</Badge>
            )}
          </div>
          <span className="text-xs" style={{ color: "var(--muted)" }}>{timeAgo(order.created_at)}</span>
        </div>

        {/* Route */}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: "var(--primary)" }} />
            <p className="text-sm line-clamp-1" style={{ color: "var(--text)" }}>{order.pickup_address}</p>
          </div>
          <div className="flex items-start gap-2">
            <MapPin size={8} className="mt-1.5 shrink-0" style={{ color: "var(--success)" }} />
            <p className="text-sm line-clamp-1" style={{ color: "var(--text)" }}>{order.dropoff_address}</p>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2">
            {order.provider ? (
              <>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
                  style={{ backgroundColor: "var(--primary)" }}>
                  {order.provider.full_name[0]}
                </div>
                <span className="text-xs" style={{ color: "var(--muted)" }}>{order.provider.full_name}</span>
                {order.provider.rating > 0 && (
                  <div className="flex items-center gap-0.5">
                    <Star size={10} fill="#f59e0b" style={{ color: "#f59e0b" }} />
                    <span className="text-xs" style={{ color: "var(--muted)" }}>{order.provider.rating.toFixed(1)}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <Clock size={12} style={{ color: "var(--muted)" }} />
                <span className="text-xs" style={{ color: "var(--muted)" }}>Chưa có nhà xe</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {price && (
              <span className="text-sm font-bold" style={{ color: "var(--text)" }}>{formatVND(price)}</span>
            )}
            <ChevronRight size={16} style={{ color: "var(--muted)" }} />
          </div>
        </div>
      </Card>
    </Link>
  );
}
