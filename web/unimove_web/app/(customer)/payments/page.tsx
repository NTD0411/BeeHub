"use client";

import React, { useEffect, useState } from "react";
import { DollarSign, CheckCircle, ArrowDownLeft, CreditCard, Clock, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { paymentsApi } from "@/lib/api";
import { formatVND, formatDate } from "@/lib/utils";

interface Payment { id: string; amount: number; status: string; created_at: string; payment_purpose?: string; }

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    paymentsApi.list().then(r => {
      if (r.success && r.data) {
        const d = r.data as Payment[] | { payments?: Payment[] };
        setPayments(Array.isArray(d) ? d : (d?.payments ?? []));
      }
    }).finally(() => setLoading(false));
  }, []);

  const total = payments.reduce((s, p) => s + (p.amount ?? 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>Lịch sử thanh toán</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>Tổng quan giao dịch và phương thức thanh toán</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl p-5" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--primary-tint)" }}>
              <TrendingDown size={20} style={{ color: "var(--primary)" }} />
            </div>
          </div>
          {loading ? <Skeleton className="h-8 w-32 mb-1" /> : <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>{formatVND(total)}</p>}
          <p className="text-xs" style={{ color: "var(--muted)" }}>Tổng đã chi tiêu</p>
        </div>
        <div className="rounded-2xl p-5" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: "var(--success-tint)" }}>
            <CheckCircle size={20} style={{ color: "var(--success)" }} />
          </div>
          <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>{payments.length}</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>Giao dịch thành công</p>
        </div>
        <div className="rounded-2xl p-5" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: "var(--warning-tint)" }}>
            <DollarSign size={20} style={{ color: "var(--warning)" }} />
          </div>
          <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>{payments.length > 0 ? formatVND(Math.round(total / payments.length)) : "0đ"}</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>Trung bình/chuyến</p>
        </div>
      </div>

      {/* Payment methods */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        <h3 className="font-semibold mb-4" style={{ color: "var(--text)" }}>Phương thức thanh toán được chấp nhận</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: "💳", name: "PayOS", desc: "Thẻ ATM / Ngân hàng" },
            { icon: "📱", name: "MoMo", desc: "Ví điện tử MoMo" },
            { icon: "📷", name: "QR Code", desc: "Quét mã QR" },
          ].map(pm => (
            <div key={pm.name} className="flex items-center gap-3 p-3.5 rounded-xl"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
              <span className="text-2xl">{pm.icon}</span>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{pm.name}</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{pm.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3.5 rounded-xl" style={{ backgroundColor: "var(--primary-tint)", border: "1px solid var(--primary)" + "33" }}>
          <p className="text-sm" style={{ color: "var(--primary)" }}>
            🔒 Tiền đặt cọc được giữ an toàn qua hệ thống escrow (PayOS) cho đến khi chuyến đi hoàn thành.
          </p>
        </div>
      </div>

      {/* Transaction history */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h3 className="font-semibold" style={{ color: "var(--text)" }}>Lịch sử giao dịch</h3>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : payments.length === 0 ? (
          <div className="py-12 text-center">
            <CreditCard size={40} className="mx-auto mb-3 opacity-20" style={{ color: "var(--muted)" }} />
            <p className="font-semibold" style={{ color: "var(--text)" }}>Chưa có giao dịch</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Mã</th>
                <th>Loại</th>
                <th>Ngày</th>
                <th>Trạng thái</th>
                <th>Số tiền</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--success-tint)" }}>
                        <ArrowDownLeft size={14} style={{ color: "var(--success)" }} />
                      </div>
                      <span className="text-sm font-mono">#{p.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                  </td>
                  <td><span className="text-sm">{p.payment_purpose === "deposit" ? "Đặt cọc" : "Thanh toán"}</span></td>
                  <td><span className="text-sm" style={{ color: "var(--muted)" }}>{formatDate(p.created_at)}</span></td>
                  <td>
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium capitalize"
                      style={{ backgroundColor: "var(--success-tint)", color: "var(--success)" }}>
                      {p.status}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm font-bold" style={{ color: "var(--error)" }}>
                      -{formatVND(p.amount)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
