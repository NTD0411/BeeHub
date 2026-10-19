"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DollarSign, TrendingUp, Package, RefreshCw, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { providerApi } from "@/lib/api";
import { formatVND } from "@/lib/utils";

type Period = "week" | "month" | "year";

interface EarningsData {
  period: string;
  total_earned: number;
  total_orders: number;
  breakdown: { date: string; earned: number; orders: number }[];
}

const BRAND   = "#1A56DB";
const SUCCESS = "#16A34A";

export default function EarningsPage() {
  const [data, setData] = useState<EarningsData | null>(null);
  const [period, setPeriod] = useState<Period>("month");
  const [loading, setLoading] = useState(true);

  const load = async (p: Period = period) => {
    setLoading(true);
    try {
      const r = await providerApi.getEarnings(p);
      if (r.success && r.data) setData(r.data as EarningsData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(period); }, [period]);

  const total = data?.total_earned ?? 0;
  const net   = total * 0.9;
  const fee   = total * 0.1;
  const orders = data?.total_orders ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thu nhập</h1>
          <p className="text-sm text-gray-500 mt-0.5">Dữ liệu từ API nhà xe</p>
        </div>
        <div className="flex gap-2">
          {(["week", "month", "year"] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-full text-sm font-semibold ${period === p ? "bg-[#2563EB] text-white" : "bg-white border border-gray-200 text-gray-600"}`}>
              {p === "week" ? "Tuần" : p === "month" ? "Tháng" : "Năm"}
            </button>
          ))}
          <button onClick={() => load()} className="p-2 rounded-full border border-gray-200 bg-white"><RefreshCw size={14} /></button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl p-5 lg:col-span-2 text-white"
          style={{ background: "linear-gradient(135deg, #1648C0 0%, #1A56DB 100%)" }}>
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={17} className="text-blue-200" />
            <p className="text-blue-100 text-sm font-medium">Tổng doanh thu</p>
          </div>
          {loading
            ? <div className="h-9 w-40 rounded-lg mb-1 animate-pulse bg-white/20" />
            : <p className="text-3xl font-extrabold">{formatVND(total)}</p>
          }
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/20">
            <div>
              <p className="text-blue-200 text-xs mb-0.5">Thực nhận (90%)</p>
              <p className="text-xl font-bold">{formatVND(net)}</p>
            </div>
            <div>
              <p className="text-blue-200 text-xs mb-0.5">Phí nền tảng (10%)</p>
              <p className="text-xl font-bold text-yellow-200">{formatVND(fee ?? 0)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl p-5 bg-white border border-gray-100 shadow-sm">
          <Package size={18} className="text-[#2563EB] mb-2" />
          <p className="text-2xl font-bold">{orders}</p>
          <p className="text-sm text-gray-500">Đơn hoàn thành</p>
        </div>
        <div className="rounded-2xl p-5 bg-white border border-gray-100 shadow-sm">
          <TrendingUp size={18} className="text-amber-500 mb-2" />
          <p className="text-2xl font-bold">{orders ? formatVND(Math.round(total / orders)) : "—"}</p>
          <p className="text-sm text-gray-500">TB / đơn</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Wallet size={16} className="text-gray-500" />
          <h2 className="font-bold text-gray-900">Chi tiết theo ngày</h2>
        </div>
        {loading ? (
          <div className="p-4 space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {(data?.breakdown ?? []).filter((d) => d.earned > 0).slice(-14).reverse().map((d) => (
              <div key={d.date} className="flex justify-between px-5 py-3 text-sm">
                <span className="text-gray-600">{d.date}</span>
                <span className="font-semibold text-gray-900">{formatVND(d.earned)} <span className="text-gray-400 font-normal">({d.orders} đơn)</span></span>
              </div>
            ))}
            {!data?.breakdown?.some((d) => d.earned > 0) && (
              <p className="text-center py-10 text-gray-500 text-sm">Chưa có doanh thu trong kỳ này</p>
            )}
          </div>
        )}
      </div>

      <Link href="/orders" className="text-sm text-[#2563EB] font-semibold">Xem đơn hàng →</Link>
    </div>
  );
}
