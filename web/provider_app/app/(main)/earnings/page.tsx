"use client";

import React, { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Package, Star, RefreshCw, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { providerOrdersApi } from "@/lib/api";
import { formatVND, formatDate } from "@/lib/utils";

interface CompletedOrder {
  id: string;
  final_price?: number;
  estimated_price?: number;
  created_at: string;
  customer?: { full_name: string };
  dropoff_address: string;
}

export default function EarningsPage() {
  const [orders, setOrders] = useState<CompletedOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const res = await providerOrdersApi.getOrders({ status: "completed" });
      if (res.success && res.data) {
        const data = res.data as { orders?: CompletedOrder[] } | CompletedOrder[];
        setOrders(Array.isArray(data) ? data : (data?.orders ?? []));
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchEarnings(); }, []);

  const totalEarnings = orders.reduce((sum, o) => sum + (o.final_price ?? o.estimated_price ?? 0), 0);
  const platformFee = totalEarnings * 0.1;
  const netEarnings = totalEarnings - platformFee;

  // Group by month
  const byMonth: Record<string, { total: number; count: number }> = {};
  orders.forEach((o) => {
    const month = new Date(o.created_at).toLocaleString("vi-VN", { month: "long", year: "numeric" });
    if (!byMonth[month]) byMonth[month] = { total: 0, count: 0 };
    byMonth[month].total += o.final_price ?? o.estimated_price ?? 0;
    byMonth[month].count += 1;
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      {/* Hero */}
      <div className="px-4 pt-12 pb-8"
        style={{ background: "linear-gradient(160deg, #14532d 0%, #16a34a 60%, #22c55e 100%)" }}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Thu nhập</h1>
          <button onClick={fetchEarnings} className="p-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
            <RefreshCw size={18} className="text-white" />
          </button>
        </div>

        {/* Summary card */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }}>
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={20} className="text-white" />
            <p className="text-green-100 text-sm">Tổng doanh thu</p>
          </div>
          {loading ? (
            <Skeleton className="h-10 w-40" style={{ background: "rgba(255,255,255,0.2)" }} />
          ) : (
            <p className="text-4xl font-bold text-white">{formatVND(totalEarnings)}</p>
          )}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-green-100 text-xs mb-1">Thực nhận (90%)</p>
              <p className="text-xl font-bold text-white">{formatVND(netEarnings)}</p>
            </div>
            <div>
              <p className="text-green-100 text-xs mb-1">Phí nền tảng (10%)</p>
              <p className="text-xl font-bold text-yellow-200">{formatVND(platformFee)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 -mt-3 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center">
            <Package size={20} className="mx-auto mb-2" style={{ color: "var(--primary)" }} />
            <p className="text-xl font-bold" style={{ color: "var(--text)" }}>{orders.length}</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Chuyến</p>
          </Card>
          <Card className="p-4 text-center">
            <TrendingUp size={20} className="mx-auto mb-2" style={{ color: "var(--success)" }} />
            <p className="text-xl font-bold" style={{ color: "var(--text)" }}>
              {orders.length > 0 ? formatVND(Math.round(totalEarnings / orders.length)) : "0đ"}
            </p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>TB/chuyến</p>
          </Card>
          <Card className="p-4 text-center">
            <Star size={20} className="mx-auto mb-2" style={{ color: "#f59e0b" }} fill="#f59e0b" />
            <p className="text-xl font-bold" style={{ color: "var(--text)" }}>4.8</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Đánh giá</p>
          </Card>
        </div>

        {/* By month */}
        {Object.keys(byMonth).length > 0 && (
          <div>
            <h2 className="font-bold mb-3" style={{ color: "var(--text)" }}>Theo tháng</h2>
            <div className="space-y-2">
              {Object.entries(byMonth).map(([month, data]) => (
                <Card key={month} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>{month}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{data.count} chuyến</p>
                  </div>
                  <p className="font-bold" style={{ color: "var(--success)" }}>{formatVND(data.total)}</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recent transactions */}
        <div>
          <h2 className="font-bold mb-3" style={{ color: "var(--text)" }}>Giao dịch gần đây</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-10">
              <DollarSign size={40} className="mx-auto mb-3 opacity-20" style={{ color: "var(--text)" }} />
              <p className="text-sm" style={{ color: "var(--muted)" }}>Chưa có giao dịch nào</p>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.slice(0, 15).map((order) => (
                <Card key={order.id} className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--success-tint)" }}>
                    <Package size={18} style={{ color: "var(--success)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>
                      {order.dropoff_address}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>{formatDate(order.created_at)}</p>
                  </div>
                  <p className="font-bold shrink-0" style={{ color: "var(--success)" }}>
                    +{formatVND(order.final_price ?? order.estimated_price ?? 0)}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
