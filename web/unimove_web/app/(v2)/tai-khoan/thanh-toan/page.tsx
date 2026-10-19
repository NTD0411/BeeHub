"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CreditCard, Wallet, RefreshCw } from "lucide-react";
import { paymentsApi } from "@/lib/api";
import { formatVND, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface Payment {
  id: string;
  amount: number;
  status: string;
  payment_purpose?: string;
  created_at: string;
  order_id?: string;
}

export default function ThanhToanPage() {
  const [wallet, setWallet] = useState<{ balance?: number } | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [w, p] = await Promise.all([paymentsApi.getWallet(), paymentsApi.list()]);
      if (w.success) setWallet(w.data as { balance?: number });
      if (p.success) {
        const d = p.data as Payment[] | { payments?: Payment[] };
        setPayments(Array.isArray(d) ? d : d?.payments ?? []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="px-4 pb-6 pt-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/tai-khoan" className="p-2 rounded-xl border border-gray-200 bg-white">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">Thanh toán & Ví</h1>
        <button onClick={load} className="ml-auto p-2 rounded-full border border-gray-200"><RefreshCw size={14} /></button>
      </div>

      <div className="rounded-2xl p-5 text-white" style={{ background: "linear-gradient(135deg, #1e3a8a, #2563EB)" }}>
        <div className="flex items-center gap-2 mb-2"><Wallet size={18} /><span className="text-sm text-blue-100">Số dư ví</span></div>
        {loading ? <Skeleton className="h-8 w-32 bg-white/20" /> : (
          <p className="text-3xl font-extrabold">{formatVND(wallet?.balance ?? 0)}</p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <CreditCard size={16} className="text-gray-500" />
          <h2 className="font-bold text-sm">Lịch sử thanh toán</h2>
        </div>
        {loading ? (
          <div className="p-4 space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : payments.length === 0 ? (
          <p className="text-center py-10 text-sm text-gray-500">Chưa có giao dịch</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {payments.map((p) => (
              <div key={p.id} className="px-4 py-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{p.payment_purpose === "deposit" ? "Đặt cọc" : "Thanh toán"}</p>
                  <p className="text-xs text-gray-500">{formatDate(p.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">{formatVND(p.amount)}</p>
                  <p className="text-xs capitalize text-gray-500">{p.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
