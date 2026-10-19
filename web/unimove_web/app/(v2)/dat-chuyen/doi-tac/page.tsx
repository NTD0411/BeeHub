"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Truck } from "lucide-react";
import { BookingShell } from "@/components/booking/BookingShell";
import { useBookingFlowStore } from "@/lib/stores/useBookingFlowStore";
import { useBookingModeGuard } from "@/lib/booking/use-booking-mode-guard";
import { MOCK_PARTNERS } from "@/lib/booking/constants";
import { providersApi } from "@/lib/api";
import { formatVND } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function DoiTacPage() {
  const router = useRouter();
  useBookingModeGuard({ requireCombo: true });
  const { isComboBooking, selectedTier, selectedPartnerId, setSelectedPartnerId } = useBookingFlowStore();
  const [partners, setPartners] = useState(MOCK_PARTNERS);

  useEffect(() => {
    if (isComboBooking) {
      setPartners(MOCK_PARTNERS.filter((p) => p.offeredComboTiers.includes(selectedTier)));
      return;
    }
    providersApi.browse({ city: "Đà Nẵng" }).then((res) => {
      if (res.success && Array.isArray(res.data)) {
        const mapped = (res.data as Record<string, unknown>[]).map((p, i) => ({
          id: String(p.id ?? `api-${i}`),
          name: String(p.full_name ?? p.name ?? "Nhà xe"),
          distanceKm: Number(p.distance_km ?? 2),
          rating: Number(p.rating ?? 4.5),
          reviewCount: Number(p.review_count ?? 0),
          price: Number(p.starting_price ?? p.base_price ?? 200_000),
          vehicleLabel: String(p.vehicle_type ?? "Xe tải"),
          offeredComboTiers: [] as typeof MOCK_PARTNERS[0]["offeredComboTiers"],
        }));
        if (mapped.length) setPartners(mapped);
      }
    }).catch(() => {});
  }, [isComboBooking, selectedTier]);

  const backHref = isComboBooking ? "/dat-chuyen/goi-dich-vu" : "/dat-chuyen/lich-hen";

  return (
    <BookingShell
      title={isComboBooking ? "Chọn nhà xe combo" : "Chọn nhà xe"}
      subtitle={isComboBooking ? "Giá niêm yết — không chờ báo giá." : "Giá khởi điểm — nhà xe xác nhận khi nhận đơn."}
      step={isComboBooking ? 5 : 4}
      totalSteps={isComboBooking ? 6 : 5}
      backHref={backHref}
      footer={
        <button
          type="button"
          disabled={!selectedPartnerId}
          onClick={() => router.push("/dat-chuyen/thanh-toan")}
          className="w-full rounded-full bg-[#0047FF] py-3.5 text-sm font-bold text-white disabled:opacity-50"
        >
          Tiếp tục thanh toán
        </button>
      }
    >
      <div className="space-y-3">
        {partners.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelectedPartnerId(p.id)}
            className={cn(
              "flex w-full gap-4 rounded-2xl border p-4 text-left transition-all",
              selectedPartnerId === p.id ? "border-[#0047FF] bg-blue-50/30" : "border-gray-100 bg-white"
            )}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0047FF]">
              <Truck size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.vehicleLabel} · {p.distanceKm} km</p>
                </div>
                <p className="text-sm font-bold text-[#0047FF]">
                  {isComboBooking ? "GIÁ NIÊM YẾT" : formatVND(p.price)}
                </p>
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
                <Star size={12} fill="currentColor" />
                {p.rating} ({p.reviewCount})
              </div>
              {isComboBooking && p.comboLaborUnitPrice != null && (
                <p className="mt-1 text-xs text-gray-500">
                  Khuân vác {formatVND(p.comboLaborUnitPrice)}/người
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </BookingShell>
  );
}
