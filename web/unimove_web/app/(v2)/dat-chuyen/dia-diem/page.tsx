"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, MapPin, Truck } from "lucide-react";
import {
  BookingWizardLayout,
  BookingInsuranceCard,
  QUOTE_WIZARD_STEPS,
  COMBO_WIZARD_STEPS,
} from "@/components/booking/BookingWizardLayout";
import { BookingModeIntro } from "@/components/booking/BookingModeIntro";
import { useBookingFlowStore } from "@/lib/stores/useBookingFlowStore";
import { useBookingModeGuard } from "@/lib/booking/use-booking-mode-guard";

const DA_NANG_PHUONG = [
  "Phường Hải Châu", "Phường Hòa Cường", "Phường Thanh Khê", "Phường An Khê",
  "Phường An Hải", "Phường Sơn Trà", "Phường Ngũ Hành Sơn", "Phường Hòa Khánh",
  "Phường Hải Vân", "Phường Liên Chiểu", "Phường Cẩm Lệ", "Phường Hòa Xuân",
];

function buildAddress(street: string, ward: string) {
  return [street.trim(), ward, "Đà Nẵng"].filter(Boolean).join(", ");
}

/* ── Shared sub-components ── */
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="mb-2 text-xs font-semibold text-gray-500">
      {children}{required && <span className="ml-0.5 text-red-500">*</span>}
    </p>
  );
}

function AddressBlock({
  icon,
  iconBg,
  title,
  ward,
  street,
  onWardChange,
  onStreetChange,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  ward: string;
  street: string;
  onWardChange: (v: string) => void;
  onStreetChange: (v: string) => void;
}) {
  const preview = ward || street.trim() ? buildAddress(street, ward) : "";

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
      {/* Card header */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: iconBg }}
        >
          {icon}
        </div>
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
      </div>

      {/* Thành phố — fixed */}
      <div>
        <FieldLabel>Thành phố</FieldLabel>
        <div className="flex h-12 items-center gap-2 rounded-xl border border-gray-200 bg-gray-100 px-4">
          <MapPin size={15} className="shrink-0 text-gray-400" />
          <span className="flex-1 text-sm font-semibold text-gray-500">Đà Nẵng</span>
          <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-400">Mặc định</span>
        </div>
      </div>

      {/* Phường — dropdown */}
      <div>
        <FieldLabel required>Phường</FieldLabel>
        <div className="relative">
          <MapPin size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={ward}
            onChange={(e) => onWardChange(e.target.value)}
            className="w-full h-12 appearance-none rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-9 text-sm text-gray-900 focus:border-[#0047FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0047FF]/20"
          >
            <option value="">-- Chọn phường --</option>
            {DA_NANG_PHUONG.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Số nhà, tên đường */}
      <div>
        <FieldLabel required>Số nhà, tên đường</FieldLabel>
        <div className="relative">
          <MapPin size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={street}
            onChange={(e) => onStreetChange(e.target.value)}
            placeholder="VD: 45 Nguyễn Văn Linh"
            className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0047FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0047FF]/20"
          />
        </div>
        {preview && (
          <p className="mt-1.5 px-1 text-xs text-gray-400">→ {preview}</p>
        )}
      </div>
    </div>
  );
}

/* ── Page ── */
export default function DiaDiemPage() {
  const router = useRouter();
  useBookingModeGuard();
  const { isComboBooking, serviceKind, setPickup, setDestination } = useBookingFlowStore();

  const isLaborOnly = serviceKind === "laborOnly";

  const [pickupWard,   setPickupWard]   = useState("");
  const [pickupStreet, setPickupStreet] = useState("");
  const [destWard,     setDestWard]     = useState("");
  const [destStreet,   setDestStreet]   = useState("");

  const handlePickupWard = (v: string) => {
    setPickupWard(v);
    setPickup(buildAddress(pickupStreet, v));
  };
  const handlePickupStreet = (v: string) => {
    setPickupStreet(v);
    setPickup(buildAddress(v, pickupWard));
  };
  const handleDestWard = (v: string) => {
    setDestWard(v);
    setDestination(buildAddress(destStreet, v));
  };
  const handleDestStreet = (v: string) => {
    setDestStreet(v);
    setDestination(buildAddress(v, destWard));
  };

  const pickupReady = pickupWard.length > 0 && pickupStreet.trim().length > 0;
  const destReady   = destWard.length > 0   && destStreet.trim().length > 0;
  const canContinue = isLaborOnly ? destReady : pickupReady && destReady;

  const title = isLaborOnly ? "Địa điểm làm việc" : "Trọ cũ → trọ mới";

  const steps = isComboBooking ? [...COMBO_WIZARD_STEPS] : [...QUOTE_WIZARD_STEPS];

  return (
    <BookingWizardLayout
      steps={steps}
      currentStep={1}
      title={title}
      intro={
        !isLaborOnly ? (
          <BookingModeIntro mode={isComboBooking ? "combo" : "quote"} />
        ) : undefined
      }
      segmentProgress={{ current: 1, total: isComboBooking ? 6 : 3 }}
      sidebar={<BookingInsuranceCard />}
      onContinue={() =>
        router.push(isLaborOnly ? "/dat-chuyen/khuan-vac/cau-hinh" : "/dat-chuyen/phong-tro")
      }
      continueDisabled={!canContinue}
    >
      {!isLaborOnly && (
        <AddressBlock
          icon={<MapPin size={20} className="text-[#0047FF]" />}
          iconBg="#EFF6FF"
          title="Trọ cũ (lấy đồ)"
          ward={pickupWard}
          street={pickupStreet}
          onWardChange={handlePickupWard}
          onStreetChange={handlePickupStreet}
        />
      )}

      <AddressBlock
        icon={<Truck size={20} className="text-[#F59E0B]" />}
        iconBg="#FEF3C7"
        title={isLaborOnly ? "Địa chỉ làm việc" : "Trọ mới (giao đồ)"}
        ward={destWard}
        street={destStreet}
        onWardChange={handleDestWard}
        onStreetChange={handleDestStreet}
      />
    </BookingWizardLayout>
  );
}
