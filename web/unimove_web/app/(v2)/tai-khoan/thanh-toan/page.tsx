"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CreditCard, Wallet, RefreshCw, Plus, Trash2, CheckCircle2, Star } from "lucide-react";
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

interface PaymentMethod {
  id: string;
  kind: string;
  label: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

const KIND_LABELS: Record<string, string> = {
  bank_transfer: "Chuyển khoản ngân hàng",
  payos: "PayOS VietQR",
  momo: "Ví MoMo",
  credit_card: "Thẻ tín dụng",
  debit_card: "Thẻ ghi nợ",
};

export default function ThanhToanPage() {
  const [wallet, setWallet] = useState<{ balance?: number; loyalty_points?: number } | null>(null);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [kind, setKind] = useState("bank_transfer");
  const [label, setLabel] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [w, m, p] = await Promise.all([
        paymentsApi.getWallet(),
        paymentsApi.listMethods(),
        paymentsApi.list(),
      ]);
      if (w.success) setWallet(w.data as { balance?: number; loyalty_points?: number });
      if (m.success && Array.isArray(m.data)) {
        setMethods(m.data as PaymentMethod[]);
      }
      if (p.success) {
        const d = p.data as Payment[] | { payments?: Payment[] };
        setPayments(Array.isArray(d) ? d : d?.payments ?? []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAddMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !accountNumber.trim()) return;
    setSubmitting(true);
    setMsg(null);
    try {
      const res = await paymentsApi.addMethod({
        kind,
        label: `${label.trim()} (${accountNumber.trim()})`,
        token_ref: `${kind}_${accountNumber.trim()}`,
        metadata: { account_number: accountNumber.trim() },
      });
      if (res.success) {
        setLabel("");
        setAccountNumber("");
        setShowAdd(false);
        setMsg("Đã thêm phương thức thanh toán");
        await load();
      } else {
        setMsg(res.message || "Không thể thêm phương thức");
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Không thể thêm phương thức");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    setSubmitting(true);
    try {
      await paymentsApi.updateMethod(id, { is_default: true });
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSubmitting(true);
    try {
      await paymentsApi.deleteMethod(id);
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 pb-8 pt-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/tai-khoan" className="p-2 rounded-xl border border-gray-200 bg-white">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">Thanh toán & Ví</h1>
        <button onClick={load} className="ml-auto p-2 rounded-full border border-gray-200 bg-white">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Wallet Card */}
      <div className="rounded-2xl p-5 text-white" style={{ background: "linear-gradient(135deg, #1e3a8a, #2563EB)" }}>
        <div className="flex items-center gap-2 mb-2">
          <Wallet size={18} />
          <span className="text-sm text-blue-100">Số dư ví BeeHub</span>
        </div>
        {loading ? (
          <Skeleton className="h-8 w-32 bg-white/20" />
        ) : (
          <p className="text-3xl font-extrabold">{formatVND(wallet?.balance ?? 0)}</p>
        )}
      </div>

      {/* UC 27: Manage Payment Methods */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-[#2563EB]" />
            <h2 className="font-bold text-sm text-gray-900">Phương thức thanh toán</h2>
          </div>
          <button
            type="button"
            onClick={() => setShowAdd((v) => !v)}
            className="inline-flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#2563EB] hover:bg-blue-100 transition-colors"
          >
            <Plus size={14} /> Thêm phương thức
          </button>
        </div>

        {msg && (
          <div className="mx-4 mt-3 rounded-xl bg-blue-50 px-3 py-2 text-xs font-medium text-[#2563EB]">
            {msg}
          </div>
        )}

        {showAdd && (
          <form onSubmit={handleAddMethod} className="p-4 bg-gray-50/70 border-b border-gray-100 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Loại phương thức</label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
              >
                <option value="bank_transfer">Chuyển khoản ngân hàng (VietQR)</option>
                <option value="payos">PayOS QR</option>
                <option value="momo">Ví điện tử MoMo</option>
                <option value="debit_card">Thẻ ghi nợ / ATM</option>
                <option value="credit_card">Thẻ tín dụng</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Tên ngân hàng / Ví</label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="VD: MB Bank - TRAN CHAN"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Số tài khoản / Số thẻ / SĐT</label>
              <input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="VD: 0394405425"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600"
              >
                Huỷ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-[#2563EB] px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                {submitting ? "Đang lưu..." : "Lưu phương thức"}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="p-4 space-y-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : methods.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-gray-500">Chưa có phương thức thanh toán nào được lưu.</p>
            <p className="text-xs text-gray-400 mt-1">Bấm &ldquo;+ Thêm phương thức&rdquo; ở góc trên để thêm tài khoản ngân hàng hoặc ví.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {methods.map((m) => (
              <div key={m.id} className="px-4 py-3 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 truncate">{m.label}</p>
                    {m.is_default && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-[10px] font-bold text-green-700">
                        <CheckCircle2 size={11} /> Mặc định
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{KIND_LABELS[m.kind] || m.kind}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {!m.is_default && (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleSetDefault(m.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:border-blue-300 hover:text-[#2563EB]"
                    >
                      <Star size={12} /> Đặt mặc định
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleDelete(m.id)}
                    className="p-1.5 rounded-lg border border-gray-200 text-red-500 hover:bg-red-50"
                    title="Xoá phương thức"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction History */}
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
