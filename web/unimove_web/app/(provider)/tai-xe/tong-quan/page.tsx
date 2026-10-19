"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Truck, DollarSign, Package, Clock, MapPin,
  AlertTriangle, ChevronRight, TrendingUp, Users, RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ordersApi, authApi } from "@/lib/api";
import { getStoredUser, storeAuth, type AuthUser } from "@/lib/auth";
import { formatVND, getOrderStatusLabel, getOrderStatusColor, timeAgo } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

interface Order {
  id: string; status: string; quote_request?: boolean;
  pickup_address: string; dropoff_address?: string; delivery_address?: string;
  estimated_price?: number; total_price?: number; base_price?: number;
  created_at: string;
  customer?: { full_name: string; phone: string };
  my_quote?: { total_price: number; status: string; note?: string };
}

const BRAND   = "#1A56DB";
const SUCCESS = "#16A34A";
const BLUE    = "#2563EB";

export default function ProviderDashboardPage() {
  const { toast }  = useToast();
  const router     = useRouter();
  const [user,      setUser]      = useState<AuthUser | null>(null);
  const [hydrated,  setHydrated]  = useState(false);
  const [pending,   setPending]   = useState<Order[]>([]);
  const [active,    setActive]    = useState<Order[]>([]);
  const [completed, setCompleted] = useState<Order[]>([]);
  const [loading,   setLoading]   = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, aRes, cRes] = await Promise.allSettled([
        ordersApi.list({ status: "pending" }),
        ordersApi.list({ status: "accepted,picking_up,in_progress" }),
        ordersApi.list({ status: "completed" }),
      ]);
      const getData = (res: PromiseSettledResult<{ success: boolean; data?: unknown }>) => {
        if (res.status === "fulfilled" && res.value.success) {
          const d = res.value.data as { orders?: Order[] } | Order[];
          return Array.isArray(d) ? d : (d?.orders ?? []);
        }
        return [];
      };
      setPending(getData(pRes).slice(0, 5));
      setActive(getData(aRes).slice(0, 3));
      setCompleted(getData(cRes));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const u = getStoredUser();
    setUser(u);
    setHydrated(true);
    // Luôn fetch fresh để lấy trạng thái is_verified mới nhất từ server
    authApi.getMe().then(r => {
      if (r.success && r.data) {
        const fresh = { ...u, ...(r.data as AuthUser) };
        const token = localStorage.getItem("unimove_token") ?? "";
        if (token) storeAuth(fresh, token);
        setUser(fresh);
        setHydrated(true);
      }
    }).catch(() => {});
  }, [router]);

  const totalEarnings = completed.reduce((s, o) => s + (o.estimated_price ?? 0), 0);

  const skip = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await ordersApi.skip(id);
      setPending(prev => prev.filter(o => o.id !== id));
      toast("Đã bỏ qua đơn này", "info");
    } catch { toast("Thử lại sau", "error"); }
  };

  return (
    <div className="space-y-6">
      {/* KYC warning */}
      {hydrated && user && !user.is_verified && (
        <Link href="/tai-xe/giay-to">
          <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl cursor-pointer bg-yellow-50 border border-yellow-200 hover:bg-yellow-100 transition-colors">
            <AlertTriangle size={18} className="text-yellow-600 shrink-0" />
            <p className="text-sm font-medium flex-1 text-yellow-700">
              Tài khoản chưa được xác minh. Upload giấy tờ để nhận đơn hàng.
            </p>
            <ChevronRight size={16} className="text-yellow-500 shrink-0" />
          </div>
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Đơn chờ xác nhận" value={pending.length.toString()}
          icon={<Clock size={20} />} color="#D97706" bg="#FFFBEB" />
        <StatCard label="Đang thực hiện" value={active.length.toString()}
          icon={<Truck size={20} />} color={BLUE} bg="#EFF6FF" />
        <StatCard label="Đã hoàn thành" value={completed.length.toString()}
          icon={<TrendingUp size={20} />} color={SUCCESS} bg="#F0FDF4" />
        <StatCard label="Tổng thu nhập" value={formatVND(totalEarnings * 0.9)}
          icon={<DollarSign size={20} />} color={SUCCESS} bg="#F0FDF4" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Pending orders */}
        <div className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-gray-900">Đơn chờ xác nhận</h2>
              {pending.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs text-white font-bold bg-yellow-500">
                  {pending.length}
                </span>
              )}
            </div>
            <button onClick={load}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors">
              <RefreshCw size={13} /> Làm mới
            </button>
          </div>

          <div className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm">
            {loading ? (
              <div className="p-5 space-y-4">
                {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
              </div>
            ) : pending.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                  <Package size={28} className="text-gray-300" />
                </div>
                <p className="font-semibold text-gray-900">Không có đơn mới</p>
                <p className="text-sm text-gray-400 mt-1">Đơn hàng mới sẽ xuất hiện ở đây</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50">
                      {["Điểm đến", "Khách hàng", "Giá ước tính", "Thời gian", "Hành động"].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide last:text-right">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {pending.map(o => (
                      <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-gray-900 truncate max-w-[180px]">
                            {o.dropoff_address || o.delivery_address || "—"}
                          </p>
                          <p className="text-xs text-gray-400 truncate max-w-[180px] mt-0.5">{o.pickup_address}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          {o.customer
                            ? <div>
                                <p className="font-medium text-gray-900">{o.customer.full_name}</p>
                                <p className="text-xs text-gray-400">{o.customer.phone}</p>
                              </div>
                            : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3.5">
                          {o.my_quote?.total_price ? (
                            <div>
                              <span className="font-bold" style={{ color: SUCCESS }}>
                                {formatVND(o.my_quote.total_price)}
                              </span>
                              <p className="text-[10px] font-semibold mt-0.5" style={{ color: BLUE }}>
                                Đã báo giá · chờ khách chốt
                              </p>
                            </div>
                          ) : o.quote_request && o.status === "pending" ? (
                            <span className="font-bold" style={{ color: BRAND }}>Chờ báo giá</span>
                          ) : o.estimated_price || o.total_price || o.base_price ? (
                            <span className="font-bold" style={{ color: BRAND }}>
                              {formatVND(o.estimated_price ?? o.total_price ?? o.base_price ?? 0)}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-400">{timeAgo(o.created_at)}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={e => skip(o.id, e)}
                              className="px-3 py-1.5 rounded-full text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                              Bỏ qua
                            </button>
                            <Link href={`/orders/${o.id}`}>
                              <button
                                className="px-3 py-1.5 rounded-full text-xs font-semibold text-white transition-colors"
                                style={{ backgroundColor: BRAND }}
                              >
                                Xem chi tiết
                              </button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right col */}
        <div className="space-y-5">
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-3">Đang thực hiện</h2>
            {active.length === 0 ? (
              <div className="rounded-2xl p-5 text-center bg-white border border-gray-100 shadow-sm">
                <p className="text-sm text-gray-400">Không có đơn đang thực hiện</p>
              </div>
            ) : (
              <div className="space-y-2">
                {active.map(o => {
                  const sc = getOrderStatusColor(o.status);
                  return (
                    <Link key={o.id} href={`/orders/${o.id}`}>
                      <div className="rounded-2xl p-4 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        style={{ borderLeft: `3px solid ${sc}` }}>
                        <div className="flex items-start justify-between mb-2">
                          <Badge style={{ backgroundColor: sc + "20", color: sc, border: `1px solid ${sc}40`, borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
                            {getOrderStatusLabel(o.status)}
                          </Badge>
                          <span className="text-xs text-gray-400">{timeAgo(o.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={13} className="text-blue-400 shrink-0" />
                          <p className="text-sm font-medium text-gray-900 truncate">{o.dropoff_address}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-base font-bold text-gray-900 mb-3">Truy cập nhanh</h2>
            <div className="space-y-2">
              {[
                { href: "/tai-xe/thu-nhap", label: "Thu nhập của tôi",   icon: DollarSign, color: BRAND,  bg: "#EFF4FE" },
                { href: "/tai-xe/giay-to",  label: hydrated && user?.is_verified ? "Đã xác minh ✓" : "Upload giấy tờ",
                  icon: Users,
                  color: hydrated && user?.is_verified ? SUCCESS : "#D97706",
                  bg:    hydrated && user?.is_verified ? "#F0FDF4" : "#FFFBEB" },
                { href: "/orders",          label: "Tất cả đơn hàng",    icon: Package,    color: BLUE,   bg: "#EFF6FF" },
              ].map(item => (
                <Link key={item.href} href={item.href}>
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: item.bg, color: item.color }}>
                      <item.icon size={17} />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 flex-1">{item.label}</span>
                    <ChevronRight size={15} className="text-gray-300 shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, bg }: {
  label: string; value: string; icon: React.ReactNode; color: string; bg: string;
}) {
  return (
    <div className="rounded-2xl p-5 bg-white border border-gray-100 shadow-sm">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
        style={{ backgroundColor: bg, color }}>
        {icon}
      </div>
      <p className="text-2xl font-extrabold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}
