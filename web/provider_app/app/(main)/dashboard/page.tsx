"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Truck, Bell, CheckCircle, XCircle, Star, DollarSign,
  Package, Clock, ChevronRight, Shield, ToggleLeft, ToggleRight, AlertTriangle
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { providerOrdersApi, providerNotificationsApi, providerProfileApi } from "@/lib/api";
import { getStoredUser, storeUser, type ProviderUser } from "@/lib/auth";
import { formatVND, getOrderStatusLabel, getOrderStatusColor, timeAgo } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

interface Order {
  id: string;
  status: string;
  service_type: string;
  pickup_address: string;
  dropoff_address: string;
  estimated_price?: number;
  created_at: string;
  customer?: { full_name: string; phone: string };
}

export default function ProviderDashboardPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<ProviderUser | null>(getStoredUser());
  const [isOnline, setIsOnline] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingRes, activeRes, notifRes, profileRes] = await Promise.allSettled([
        providerOrdersApi.getOrders({ status: "pending" }),
        providerOrdersApi.getOrders({ status: "accepted,picking_up,in_progress" }),
        providerNotificationsApi.getUnreadCount(),
        providerProfileApi.getMe(),
      ]);
      if (pendingRes.status === "fulfilled" && pendingRes.value.success) {
        const d = pendingRes.value.data as { orders?: Order[] };
        setPendingOrders((d?.orders ?? []).slice(0, 5));
      }
      if (activeRes.status === "fulfilled" && activeRes.value.success) {
        const d = activeRes.value.data as { orders?: Order[] };
        setActiveOrders((d?.orders ?? []).slice(0, 3));
      }
      if (notifRes.status === "fulfilled" && notifRes.value.success) {
        const d = notifRes.value.data as { count?: number };
        setUnreadCount(d?.count ?? 0);
      }
      if (profileRes.status === "fulfilled" && profileRes.value.success && profileRes.value.data) {
        const freshUser = profileRes.value.data as ProviderUser;
        setUser(freshUser);
        const token = localStorage.getItem("provider_token");
        if (token) storeUser(freshUser, token);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleOnline = () => {
    if (!user?.is_verified) {
      toast("Bạn cần hoàn tất xác minh tài khoản trước", "error");
      return;
    }
    setIsOnline(!isOnline);
    toast(isOnline ? "Đã chuyển sang Offline" : "Bạn đang Online - Sẵn sàng nhận đơn!", isOnline ? "info" : "success");
  };

  const acceptOrder = async (orderId: string) => {
    try {
      const res = await providerOrdersApi.respondToOrder(orderId, { action: "accept" });
      if (res.success) {
        toast("Đã chấp nhận đơn hàng!", "success");
        fetchData();
      }
    } catch { toast("Thử lại sau", "error"); }
  };

  const rejectOrder = async (orderId: string) => {
    try {
      await providerOrdersApi.respondToOrder(orderId, { action: "reject" });
      toast("Đã từ chối đơn", "info");
      fetchData();
    } catch { toast("Thử lại sau", "error"); }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      {/* Header */}
      <div
        className="px-4 pt-12 pb-6"
        style={{ background: "linear-gradient(160deg, #14532d 0%, #16a34a 50%, #22c55e 100%)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-bold"
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
              {user?.full_name?.[0] ?? "P"}
            </div>
            <div>
              <p className="text-green-100 text-sm">Chào mừng trở lại,</p>
              {loading ? (
                <Skeleton className="h-6 w-28" style={{ background: "rgba(255,255,255,0.2)" }} />
              ) : (
                <h1 className="text-xl font-bold text-white">{user?.full_name}</h1>
              )}
            </div>
          </div>
          <Link href="/notifications" className="relative p-2 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }}>
            <Bell size={22} className="text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 text-white text-[10px] flex items-center justify-center font-bold"
                style={{ borderColor: "#16a34a" }}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        </div>

        {/* Verification banner */}
        {user && !user.is_verified && user.verification_status === "rejected" && (
          <Link href="/documents">
            <div className="mb-4 px-4 py-3 rounded-2xl flex items-center gap-3" style={{ backgroundColor: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)" }}>
              <XCircle size={18} className="text-red-300 shrink-0" />
              <div className="flex-1">
                <p className="text-red-200 text-xs font-bold">Hồ sơ bị từ chối</p>
                <p className="text-red-100 text-[11px]">Nhấn để xem lý do và nộp lại giấy tờ</p>
              </div>
              <ChevronRight size={16} className="text-red-200" />
            </div>
          </Link>
        )}
        {user && !user.is_verified && user.verification_status === "pending" && (
          <div className="mb-4 px-4 py-3 rounded-2xl flex items-center gap-3" style={{ backgroundColor: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.4)" }}>
            <Clock size={18} className="text-blue-300 shrink-0" />
            <div className="flex-1">
              <p className="text-blue-200 text-xs font-bold">Đang chờ xét duyệt</p>
              <p className="text-blue-100 text-[11px]">Admin sẽ xét duyệt hồ sơ trong vòng 24h</p>
            </div>
          </div>
        )}
        {user && !user.is_verified && !user.verification_status && (
          <Link href="/documents">
            <div className="mb-4 px-4 py-3 rounded-2xl flex items-center gap-3" style={{ backgroundColor: "rgba(251,191,36,0.2)", border: "1px solid rgba(251,191,36,0.4)" }}>
              <AlertTriangle size={18} className="text-yellow-300 shrink-0" />
              <div className="flex-1">
                <p className="text-yellow-200 text-xs font-bold">Chưa xác minh tài khoản</p>
                <p className="text-yellow-100 text-[11px]">Upload giấy tờ để bắt đầu nhận đơn</p>
              </div>
              <ChevronRight size={16} className="text-yellow-200" />
            </div>
          </Link>
        )}

        {/* Online toggle */}
        <div className="rounded-2xl p-4 flex items-center justify-between" style={{ backgroundColor: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }}>
          <div>
            <p className="text-white font-bold">Trạng thái</p>
            <p className="text-green-100 text-sm">{isOnline ? "🟢 Đang Online - Nhận đơn" : "⚫ Offline"}</p>
          </div>
          <button onClick={toggleOnline} className="transition-transform active:scale-95">
            {isOnline
              ? <ToggleRight size={48} className="text-white" />
              : <ToggleLeft size={48} style={{ color: "rgba(255,255,255,0.5)" }} />
            }
          </button>
        </div>
      </div>

      <div className="px-4 py-4 -mt-3 space-y-5">
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={<Package size={20} />} label="Đơn pending" value={pendingOrders.length.toString()} color="var(--warning)" />
          <StatCard icon={<Truck size={20} />} label="Đang thực hiện" value={activeOrders.length.toString()} color="var(--primary)" />
          <StatCard icon={<Star size={20} />} label="Đánh giá" value={user?.rating?.toFixed(1) ?? "N/A"} color="#f59e0b" />
        </div>

        {/* Active orders */}
        {activeOrders.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold" style={{ color: "var(--text)" }}>Đơn đang thực hiện</h2>
              <Link href="/orders" className="text-sm font-medium" style={{ color: "var(--primary)" }}>Xem tất cả</Link>
            </div>
            <div className="space-y-3">
              {activeOrders.map((order) => (
                <Link key={order.id} href={`/orders/${order.id}`}>
                  <Card className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <Badge style={{ backgroundColor: getOrderStatusColor(order.status) + "22", color: getOrderStatusColor(order.status), border: `1px solid ${getOrderStatusColor(order.status)}44` }}>
                        {getOrderStatusLabel(order.status)}
                      </Badge>
                      <span className="text-xs" style={{ color: "var(--muted)" }}>{timeAgo(order.created_at)}</span>
                    </div>
                    <p className="text-sm font-medium line-clamp-1 mb-1" style={{ color: "var(--text)" }}>{order.dropoff_address}</p>
                    {order.estimated_price && (
                      <p className="text-sm font-bold" style={{ color: "var(--success)" }}>{formatVND(order.estimated_price)}</p>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Pending orders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold" style={{ color: "var(--text)" }}>
              Đơn hàng mới
              {pendingOrders.length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs text-white" style={{ backgroundColor: "var(--warning)" }}>
                  {pendingOrders.length}
                </span>
              )}
            </h2>
            <button onClick={fetchData} className="text-sm font-medium" style={{ color: "var(--primary)" }}>Làm mới</button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <Skeleton key={i} className="h-36 w-full rounded-2xl" />)}
            </div>
          ) : pendingOrders.length === 0 ? (
            <Card className="p-6 text-center">
              <Clock size={40} className="mx-auto mb-3 opacity-20" style={{ color: "var(--text)" }} />
              <p className="font-semibold mb-1" style={{ color: "var(--text)" }}>Chưa có đơn mới</p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                {isOnline ? "Đang chờ đơn hàng từ khách hàng..." : "Bật Online để nhận đơn"}
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingOrders.map((order) => (
                <PendingOrderCard
                  key={order.id}
                  order={order}
                  onAccept={() => acceptOrder(order.id)}
                  onReject={() => rejectOrder(order.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/earnings">
            <Card className="p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--success-tint)" }}>
                <DollarSign size={20} style={{ color: "var(--success)" }} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>Thu nhập</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Xem chi tiết</p>
              </div>
            </Card>
          </Link>
          <Link href="/documents">
            <Card className="p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--primary-tint)" }}>
                <Shield size={20} style={{ color: "var(--primary)" }} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>Hồ sơ</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  {user?.is_verified
                    ? "✓ Đã xác minh"
                    : user?.verification_status === "rejected"
                      ? "⚠ Bị từ chối"
                      : user?.verification_status === "pending"
                        ? "⏳ Đang xét duyệt"
                        : "Chưa xác minh"}
                </p>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <Card className="p-4 text-center">
      <div className="flex justify-center mb-2" style={{ color }}>{icon}</div>
      <p className="text-xl font-bold" style={{ color }}>{value}</p>
      <p className="text-[11px] mt-0.5" style={{ color: "var(--muted)" }}>{label}</p>
    </Card>
  );
}

function PendingOrderCard({ order, onAccept, onReject }: {
  order: Order; onAccept: () => void; onReject: () => void;
}) {
  return (
    <Card className="p-4 border-2" style={{ borderColor: "var(--warning)" + "44" }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "var(--warning)" }} />
            <span className="text-xs font-bold" style={{ color: "var(--warning)" }}>ĐƠN MỚI</span>
          </div>
          <p className="text-xs" style={{ color: "var(--muted)" }}>{timeAgo(order.created_at)}</p>
        </div>
        {order.estimated_price && (
          <span className="text-base font-bold" style={{ color: "var(--success)" }}>{formatVND(order.estimated_price)}</span>
        )}
      </div>

      <div className="space-y-1.5 mb-4">
        <div className="flex items-start gap-2">
          <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: "var(--primary)" }} />
          <p className="text-sm line-clamp-1" style={{ color: "var(--text)" }}>{order.pickup_address}</p>
        </div>
        <div className="flex items-start gap-2">
          <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: "var(--success)" }} />
          <p className="text-sm line-clamp-1" style={{ color: "var(--text)" }}>{order.dropoff_address}</p>
        </div>
      </div>

      {order.customer && (
        <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>
          Khách: {order.customer.full_name} · {order.customer.phone}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button onClick={onReject}
          className="h-10 rounded-xl text-sm font-semibold border flex items-center justify-center gap-1.5"
          style={{ color: "var(--error)", borderColor: "var(--error)", backgroundColor: "var(--error-tint)" }}>
          <XCircle size={16} /> Từ chối
        </button>
        <button onClick={onAccept}
          className="h-10 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-1.5"
          style={{ backgroundColor: "var(--success)" }}>
          <CheckCircle size={16} /> Chấp nhận
        </button>
      </div>
    </Card>
  );
}
