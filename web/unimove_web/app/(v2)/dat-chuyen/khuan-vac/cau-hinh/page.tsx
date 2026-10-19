"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookingShell } from "@/components/booking/BookingShell";
import { useBookingFlowStore } from "@/lib/stores/useBookingFlowStore";
import { paymentsApi } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { formatVND } from "@/lib/utils";

export default function KhuanVacCauHinhPage() {
  const router = useRouter();
  const { linkedOrderId, transportLaborHelpers, transportLaborHours, floorCount, hasElevator, dormNote, setDormDetails } = useBookingFlowStore();
  const [loading, setLoading] = useState(false);

  const estimated = transportLaborHelpers * transportLaborHours * 60_000;
  const deposit = Math.round(estimated * 0.3);

  const handlePay = async () => {
    if (!linkedOrderId) return;
    const user = getStoredUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const payRes = await paymentsApi.createDeposit(linkedOrderId, deposit, "payos", {
        customer_name: user.full_name,
        customer_email: user.email,
        note: `Khuân vác ${transportLaborHelpers} người × ${transportLaborHours}h. ${dormNote}`,
      });
      const url = (payRes.data as { checkout_url?: string })?.checkout_url;
      if (url) window.location.href = url;
      else router.push(`/don-hang/${linkedOrderId}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BookingShell
      title="Cấu hình khuân vác"
      backHref="/dat-chuyen/khuan-vac/don-hang"
      footer={
        <button
          type="button"
          disabled={loading || !linkedOrderId}
          onClick={handlePay}
          className="w-full rounded-full bg-[#FFC107] py-3.5 text-sm font-bold text-gray-900 disabled:opacity-50"
        >
          {loading ? "Đang xử lý..." : `Đặt cọc ${formatVND(deposit)}`}
        </button>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">Số người</label>
            <input
              type="number"
              min={1}
              max={6}
              value={transportLaborHelpers}
              onChange={(e) => setDormDetails({ transportLaborHelpers: Number(e.target.value) })}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Số giờ</label>
            <input
              type="number"
              min={1}
              max={12}
              value={transportLaborHours}
              onChange={(e) => setDormDetails({ transportLaborHours: Number(e.target.value) })}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">Tầng</label>
            <input
              type="number"
              min={0}
              value={floorCount}
              onChange={(e) => setDormDetails({ floorCount: Number(e.target.value) })}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
            />
          </div>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input type="checkbox" checked={hasElevator} onChange={(e) => setDormDetails({ hasElevator: e.target.checked })} />
            Có thang máy
          </label>
        </div>
        <textarea
          rows={3}
          value={dormNote}
          onChange={(e) => setDormDetails({ dormNote: e.target.value })}
          placeholder="Ghi chú cho đội khuân vác..."
          className="w-full resize-none rounded-xl border border-gray-200 px-3 py-3 text-sm"
        />
        <p className="text-sm text-gray-600">
          Ước tính: <span className="font-bold text-gray-900">{formatVND(estimated)}</span> · Cọc 30%: {formatVND(deposit)}
        </p>
      </div>
    </BookingShell>
  );
}
