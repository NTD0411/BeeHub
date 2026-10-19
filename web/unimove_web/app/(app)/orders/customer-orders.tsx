"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Truck, Plus, RefreshCw, MapPin, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ordersApi } from "@/lib/api";
import { getOrderStatusLabel, getOrderStatusColor, timeAgo, formatVND } from "@/lib/utils";

interface Order { id: string; status: string; pickup_address: string; dropoff_address: string; estimated_price?: number; final_price?: number; created_at: string; provider?: { full_name: string }; }

const TABS = [
  { key: "", label: "Tất cả" },
  { key: "pending,accepted,picking_up,in_progress", label: "Đang thực hiện" },
  { key: "completed", label: "Hoàn thành" },
  { key: "cancelled", label: "Đã hủy" },
];

export default function CustomerOrdersPage() {
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
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(TABS[tab].key); }, [tab, load]);

  const filtered = orders.filter(o =>
    !search ||
    (o.dropoff_address?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
    (o.pickup_address?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>Đơn hàng của tôi</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>Quản lý tất cả đơn hàng chuyển trọ</p>
        </div>
        <Link href="/booking/location">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ background: "linear-gradient(135deg, #1d4ed8, #3b82f6)" }}>
            <Plus size={16} /> Đặt dịch vụ mới
          </button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1.5 p-1 rounded-xl" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: tab === i ? "var(--primary)" : "transparent",
                color: tab === i ? "white" : "var(--muted)",
              }}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
          <input placeholder="Tìm kiếm địa điểm..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-xl border text-sm"
            style={{ backgroundColor: "var(--card)", borderColor: "var(--border)", color: "var(--text)" }} />
        </div>
        <button onClick={() => load(TABS[tab].key)} className="h-9 w-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", color: "var(--muted)" }}>
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        {loading ? (
          <div className="p-5 space-y-3">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Truck size={48} className="mx-auto mb-3 opacity-20" style={{ color: "var(--muted)" }} />
            <p className="font-semibold mb-1" style={{ color: "var(--text)" }}>Không có đơn hàng</p>
            {tab === 0 && !search && (
              <Link href="/booking/location">
                <button className="mt-3 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{ background: "linear-gradient(135deg, #1d4ed8, #3b82f6)" }}>
                  Đặt dịch vụ ngay
                </button>
              </Link>
            )}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Địa điểm</th>
                <th>Nhà xe</th>
                <th>Giá</th>
                <th>Trạng thái</th>
                <th>Thời gian</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => {
                const sc = getOrderStatusColor(o.status);
                const price = o.final_price ?? o.estimated_price;
                return (
                  <tr key={o.id}>
                    <td>
                      <span className="text-xs font-mono font-semibold px-2 py-1 rounded-lg"
                        style={{ backgroundColor: "var(--surface)", color: "var(--muted)" }}>
                        #{o.id.slice(0, 8).toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="max-w-[200px]">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "var(--primary)" }} />
                          <p className="text-sm truncate">{o.pickup_address}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin size={8} className="shrink-0" style={{ color: "var(--success)" }} />
                          <p className="text-sm truncate font-medium">{o.dropoff_address}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      {o.provider
                        ? <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold">{o.provider.full_name[0]}</div><span className="text-sm">{o.provider.full_name}</span></div>
                        : <span className="text-sm" style={{ color: "var(--muted)" }}>Chờ nhà xe</span>}
                    </td>
                    <td><span className="text-sm font-semibold">{price ? formatVND(price) : "—"}</span></td>
                    <td><Badge style={{ backgroundColor: sc + "22", color: sc, border: `1px solid ${sc}44` }}>{getOrderStatusLabel(o.status)}</Badge></td>
                    <td><span className="text-xs" style={{ color: "var(--muted)" }}>{timeAgo(o.created_at)}</span></td>
                    <td>
                      <Link href={`/orders/${o.id}`}>
                        <button className="text-xs font-medium px-3 py-1.5 rounded-lg hover:opacity-80"
                          style={{ color: "var(--primary)", backgroundColor: "var(--primary-tint)" }}>
                          Chi tiết →
                        </button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {filtered.length > 0 && (
          <div className="px-5 py-3 text-xs" style={{ borderTop: "1px solid var(--border)", color: "var(--muted)" }}>
            Hiển thị {filtered.length} đơn hàng
          </div>
        )}
      </div>
    </div>
  );
}
