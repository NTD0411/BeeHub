"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  RefreshCw, Search, MapPin, Package, Clock,
} from "lucide-react";
import { ordersApi, providersApi } from "@/lib/api";
import { timeAgo, formatVND } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { getStoredUser } from "@/lib/auth";

const POLL_INTERVAL_MS = 30_000; // tự làm mới mỗi 30 giây

interface Order {
  id: string; status: string; deposit_paid?: boolean; quote_request?: boolean;
  pickup_address: string; delivery_address: string;
  base_price?: number; total_price?: number;
  created_at: string;
  customer?: { full_name: string; phone: string };
  my_quote?: { total_price: number; status: string; note?: string };
}

const BRAND   = "#1A56DB";
const SUCCESS = "#16A34A";

const TABS = [
  { key: "",                                label: "Tất cả",       quoted: false },
  { key: "pending",                         label: "Chờ xác nhận", quoted: false },
  { key: "__quoted__",                      label: "Đã báo giá",   quoted: true  },
  { key: "accepted,picking_up,in_progress", label: "Đang thực hiện", quoted: false },
  { key: "completed",                       label: "Hoàn thành",   quoted: false },
  { key: "cancelled",                       label: "Đã hủy",       quoted: false },
];

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pending:                  { label: "Chờ xác nhận",               bg: "#FEF9C3", text: "#A16207", dot: "#EAB308" },
  matched_no_deposit:       { label: "Khách đã chọn · Chờ đặt cọc", bg: "#FFF7ED", text: "#C2410C", dot: "#F97316" },
  matched_with_deposit:     { label: "Chờ bạn xác nhận",           bg: "#DBEAFE", text: "#1D4ED8", dot: "#3B82F6" },
  scheduled:                { label: "Đã xếp lịch",                bg: "#F3F4F6", text: "#374151", dot: "#9CA3AF" },
  scheduled_with_deposit:   { label: "Đã xếp lịch · Đã cọc",       bg: "#DBEAFE", text: "#1D4ED8", dot: "#3B82F6" },
  accepted:                 { label: "Đã xác nhận",                bg: "#DBEAFE", text: "#1D4ED8", dot: "#3B82F6" },
  picking_up:               { label: "Đang đến lấy hàng",          bg: "#EDE9FE", text: "#6D28D9", dot: "#8B5CF6" },
  in_progress:              { label: "Đang vận chuyển",            bg: "#EDE9FE", text: "#6D28D9", dot: "#8B5CF6" },
  completed:                { label: "Hoàn thành",                 bg: "#DCFCE7", text: "#15803D", dot: "#16A34A" },
  cancelled:                { label: "Đã hủy",                     bg: "#FEE2E2", text: "#DC2626", dot: "#EF4444" },
  disputed:                 { label: "Khiếu nại",                  bg: "#FEE2E2", text: "#DC2626", dot: "#EF4444" },
};

function resolveStatusKey(status: string, depositPaid?: boolean): string {
  if (status === "matched") return depositPaid ? "matched_with_deposit" : "matched_no_deposit";
  if (status === "scheduled") return depositPaid ? "scheduled_with_deposit" : "scheduled";
  return status;
}

function StatusBadge({ status, depositPaid }: { status: string; depositPaid?: boolean }) {
  const key = resolveStatusKey(status, depositPaid);
  const cfg = STATUS_CONFIG[key] ?? { label: status, bg: "#F3F4F6", text: "#6B7280", dot: "#9CA3AF" };
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ backgroundColor: cfg.bg, color: cfg.text }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

export default function ProviderOrdersPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [tab,          setTab]          = useState(0);
  const [orders,       setOrders]       = useState<Order[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [nearbyOnly,   setNearbyOnly]   = useState(false);
  const providerWard = getStoredUser()?.ward ?? "";

  useEffect(() => {
    if (searchParams.get("tab") === "quoted") {
      setTab(TABS.findIndex((t) => t.key === "__quoted__"));
    }
  }, [searchParams]);

  const load = useCallback(async (status: string, ward?: string) => {
    setLoading(true);
    setOrders([]);
    try {
      if (status === "__quoted__") {
        try {
          const r = await providersApi.getQuotedOrders();
          if (r.success && r.data) {
            const d = r.data as { orders?: Order[] };
            setOrders(d?.orders ?? []);
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Không tải được danh sách báo giá";
          toast(msg, "error");
        }
        return;
      }
      const params: Record<string, string> = {};
      if (status) params.status = status;
      if (ward)   params.ward   = ward;
      const r = await ordersApi.list(Object.keys(params).length ? params : undefined);
      if (r.success && r.data) {
        const d = r.data as { orders?: Order[] } | Order[];
        setOrders(Array.isArray(d) ? d : (d?.orders ?? []));
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const isQuoted = TABS[tab].quoted;
    load(TABS[tab].key, !isQuoted && nearbyOnly && providerWard ? providerWard : undefined);
  }, [tab, nearbyOnly, load, providerWard]);

  // Auto-polling mỗi 30 giây — giúp provider thấy ngay khi khách chọn báo giá
  const tabRef = useRef(tab);
  const nearbyRef = useRef(nearbyOnly);
  useEffect(() => { tabRef.current = tab; }, [tab]);
  useEffect(() => { nearbyRef.current = nearbyOnly; }, [nearbyOnly]);

  useEffect(() => {
    const interval = setInterval(() => {
      const isQuoted = TABS[tabRef.current].quoted;
      load(
        TABS[tabRef.current].key,
        !isQuoted && nearbyRef.current && providerWard ? providerWard : undefined,
      );
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load, providerWard]);

  const filtered = orders.filter(o =>
    !search ||
    o.delivery_address?.toLowerCase().includes(search.toLowerCase()) ||
    o.pickup_address?.toLowerCase().includes(search.toLowerCase()) ||
    (o.customer?.full_name?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  const pendingCount = orders.filter(o => o.status === "pending").length;

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý đơn hàng</h1>
          <p className="text-sm text-gray-500 mt-0.5">Nhận và xử lý đơn hàng từ khách</p>
        </div>
        {pendingCount > 0 && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: "#EAB308" }}>
            <Clock size={14} />
            {pendingCount} chờ xác nhận
          </span>
        )}
      </div>

      {/* Tabs + Search bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 p-1 rounded-2xl bg-gray-100">
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)}
              className="px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all"
              style={tab === i
                ? { backgroundColor: BRAND, color: "#fff", boxShadow: "0 2px 8px rgba(26,86,219,0.3)" }
                : { backgroundColor: "transparent", color: "#6B7280" }}>
              {t.label}
            </button>
          ))}
        </div>

        {providerWard && (
          <button
            onClick={() => setNearbyOnly(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border transition-all"
            style={nearbyOnly
              ? { backgroundColor: "#EFF6FF", borderColor: BRAND, color: BRAND }
              : { backgroundColor: "#F9FAFB", borderColor: "#E5E7EB", color: "#6B7280" }}>
            <MapPin size={13} />
            Gần bạn · {providerWard}
          </button>
        )}

        <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-sm ml-auto">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Tìm theo địa chỉ, khách hàng..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1A56DB] focus:border-[#1A56DB]"
            />
          </div>
          <button onClick={() => load(TABS[tab].key)}
            className="h-10 w-10 rounded-xl flex items-center justify-center border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors shrink-0">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex gap-4 items-center animate-pulse">
                <div className="h-4 w-24 rounded bg-gray-100" />
                <div className="h-4 flex-1 rounded bg-gray-100" />
                <div className="h-4 w-20 rounded bg-gray-100" />
                <div className="h-4 w-16 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-gray-50">
              <Package size={28} className="text-gray-300" />
            </div>
            <p className="font-semibold text-gray-500">Không có đơn hàng</p>
            <p className="text-sm text-gray-400 mt-1">
              {search ? "Không tìm thấy kết quả phù hợp" : "Chưa có đơn hàng nào"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Mã đơn", "Địa điểm", "Khách hàng", "Giá", "Trạng thái", "Thời gian", "Hành động"].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(o => {
                  const isQuotedTab = TABS[tab].quoted;
                  const needsProviderAction = o.status === "pending" || (o.status === "matched" && o.deposit_paid);
                  const price = o.my_quote?.total_price ?? (o.total_price ?? o.base_price);
                  return (
                    <tr key={o.id} className="hover:bg-gray-50/60 transition-colors">

                      {/* Mã đơn */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {needsProviderAction && (
                            <span className="w-2 h-2 rounded-full animate-pulse shrink-0" style={{ backgroundColor: o.status === "matched" ? "#3B82F6" : "#EAB308" }} />
                          )}
                          <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">
                            #{o.id.slice(0, 8).toUpperCase()}
                          </span>
                        </div>
                      </td>

                      {/* Địa điểm */}
                      <td className="px-5 py-4">
                        <div className="space-y-1 max-w-[220px]">
                          <div className="flex items-start gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0 mt-1" />
                            <p className="text-sm text-gray-600 truncate">{o.pickup_address || "—"}</p>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <MapPin size={9} className="shrink-0 mt-0.5 text-blue-400" />
                            <p className="text-sm font-semibold text-gray-800 truncate">{o.delivery_address || "—"}</p>
                          </div>
                        </div>
                      </td>

                      {/* Khách hàng */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {o.customer ? (
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{o.customer.full_name}</p>
                            <p className="text-xs text-gray-400">{o.customer.phone}</p>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-300">—</span>
                        )}
                      </td>

                      {/* Giá */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {price ? (
                          <div>
                            <span className="text-sm font-bold" style={{ color: SUCCESS }}>
                              {formatVND(price)}
                            </span>
                            {o.my_quote && (
                              <p className="text-[10px] text-blue-500 font-semibold mt-0.5">Báo giá của bạn</p>
                            )}
                          </div>
                        ) : o.quote_request && o.status === "pending" ? (
                          <span className="text-sm font-semibold text-amber-600">Chờ báo giá</span>
                        ) : (
                          <span className="text-sm text-gray-300">—</span>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusBadge status={o.status} depositPaid={o.deposit_paid} />
                      </td>

                      {/* Thời gian */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-xs text-gray-400">{timeAgo(o.created_at)}</span>
                      </td>

                      {/* Hành động */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <Link href={`/orders/${o.id}`}>
                          <button className="px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                            Xem chi tiết
                          </button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">Hiển thị <strong className="text-gray-600">{filtered.length}</strong> đơn hàng</p>
            {search && (
              <button onClick={() => setSearch("")} className="text-xs text-blue-500 hover:underline">
                Xoá bộ lọc
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
