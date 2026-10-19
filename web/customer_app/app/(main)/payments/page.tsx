"use client";

import React, { useEffect, useState } from "react";
import { Wallet, CreditCard, ArrowRight, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ordersApi } from "@/lib/api";
import { formatVND, formatDate } from "@/lib/utils";

interface Payment {
  id: string;
  order_id: string;
  amount: number;
  method: string;
  status: string;
  created_at: string;
  description?: string;
}

const paymentMethods = [
  { name: "PayOS", icon: "💳", color: "#3b82f6", desc: "Thẻ ATM / Ngân hàng" },
  { name: "MoMo", icon: "📱", color: "#d82d8b", desc: "Ví điện tử MoMo" },
  { name: "QR Code", icon: "📷", color: "#16a34a", desc: "Quét mã QR thanh toán" },
];

export default function PaymentsPage() {
  const [orders, setOrders] = useState<{ id: string; estimated_price?: number; final_price?: number; status: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.getOrders({ status: "completed" })
      .then((res) => {
        if (res.success && res.data) {
          const data = res.data as { orders?: typeof orders };
          setOrders((data?.orders ?? []).slice(0, 10));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const totalSpent = orders.reduce((sum, o) => sum + (o.final_price ?? 0), 0);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      {/* Hero */}
      <div
        className="px-4 pt-12 pb-8"
        style={{ background: "linear-gradient(160deg, #1d4ed8 0%, #3b82f6 60%, #38bdf8 100%)" }}
      >
        <h1 className="text-xl font-bold text-white mb-1">Thanh toán</h1>
        <p className="text-blue-100 text-sm mb-6">Quản lý giao dịch của bạn</p>

        <div className="rounded-2xl p-5" style={{ backgroundColor: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }}>
          <div className="flex items-center gap-3 mb-3">
            <Wallet size={24} className="text-white" />
            <p className="text-blue-100 text-sm">Tổng đã chi tiêu</p>
          </div>
          {loading ? (
            <Skeleton className="h-10 w-40" style={{ background: "rgba(255,255,255,0.2)" }} />
          ) : (
            <p className="text-4xl font-bold text-white">{formatVND(totalSpent)}</p>
          )}
          <p className="text-blue-100 text-xs mt-2">Tổng từ {orders.length} đơn hoàn thành</p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-5 -mt-3">
        {/* Payment methods */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold" style={{ color: "var(--text)" }}>Phương thức thanh toán</h2>
          </div>
          <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>Chấp nhận các phương thức sau:</p>
          <div className="space-y-3">
            {paymentMethods.map((pm) => (
              <div
                key={pm.name}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <span className="text-2xl">{pm.icon}</span>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>{pm.name}</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{pm.desc}</p>
                </div>
                <CreditCard size={16} className="ml-auto" style={{ color: "var(--muted)" }} />
              </div>
            ))}
          </div>
        </Card>

        {/* Transaction history */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold" style={{ color: "var(--text)" }}>Lịch sử giao dịch</h2>
            <button onClick={() => setLoading(true)} className="p-1.5 rounded-lg" style={{ backgroundColor: "var(--surface)" }}>
              <RefreshCw size={14} style={{ color: "var(--muted)" }} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-10">
              <Wallet size={40} className="mx-auto mb-3 opacity-20" style={{ color: "var(--text)" }} />
              <p className="text-sm" style={{ color: "var(--muted)" }}>Chưa có giao dịch nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <Card key={order.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: order.status === "completed" ? "var(--success-tint)" : "var(--error-tint)" }}
                    >
                      {order.status === "completed"
                        ? <CheckCircle size={20} style={{ color: "var(--success)" }} />
                        : <XCircle size={20} style={{ color: "var(--error)" }} />
                      }
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                        Đơn #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Clock size={11} style={{ color: "var(--muted)" }} />
                        <span className="text-xs" style={{ color: "var(--muted)" }}>Hoàn thành</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold" style={{ color: "var(--primary)" }}>
                        -{formatVND(order.final_price ?? order.estimated_price ?? 0)}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <Card className="p-4" style={{ backgroundColor: "var(--primary-tint)", borderColor: "var(--primary)" + "33" }}>
          <div className="flex items-start gap-3">
            <ArrowRight size={18} style={{ color: "var(--primary)", flexShrink: 0 }} />
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--primary)" }}>Thanh toán an toàn</p>
              <p className="text-xs" style={{ color: "var(--primary)" }}>
                Tiền đặt cọc được giữ an toàn qua PayOS cho đến khi chuyển trọ hoàn thành.
                Bạn được hoàn tiền nếu có vấn đề phát sinh.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
