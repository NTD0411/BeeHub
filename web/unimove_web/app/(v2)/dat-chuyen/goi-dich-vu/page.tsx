"use client";

import { useRouter } from "next/navigation";
import { Check, Package, Truck } from "lucide-react";
import {
  BookingWizardLayout,
  BookingInsuranceBanner,
  RoutePointsCard,
  COMBO_WIZARD_STEPS,
} from "@/components/booking/BookingWizardLayout";
import { useBookingFlowStore } from "@/lib/stores/useBookingFlowStore";
import { useBookingModeGuard } from "@/lib/booking/use-booking-mode-guard";
import { SERVICE_PACKAGES, packagePriceAtLabor, type ServicePackage } from "@/lib/booking/constants";
import { formatVND, cn } from "@/lib/utils";

function ComboEstimateSidebar({
  pkg,
  laborCount,
  total,
}: {
  pkg: ServicePackage;
  laborCount: number;
  total: number;
}) {
  const laborFee = laborCount * pkg.extraLaborComboPrice;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900">Tạm tính</h3>
        <div className="mt-4 space-y-2.5 text-sm">
          <div className="flex items-start justify-between gap-2">
            <span className="text-gray-500">{pkg.label}</span>
            <span className="shrink-0 font-semibold text-gray-900">
              {formatVND(pkg.transportBasePrice)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-500">{pkg.includedKm}km bao gồm</span>
            <span className="text-xs font-semibold text-green-600">Miễn phí</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-500">{laborCount} người khuân</span>
            <span className="font-semibold text-gray-900">{formatVND(laborFee)}</span>
          </div>
        </div>
        <div className="mt-4 border-t border-gray-100 pt-4">
          <div className="flex items-end justify-between gap-2">
            <span className="text-sm font-bold text-gray-900">Tổng cộng</span>
            <span className="text-2xl font-bold text-[#0047FF]">{formatVND(total)}</span>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-gray-400">
            * Giá có thể thay đổi nếu quãng đường vượt quá {pkg.includedKm}km niêm yết.
          </p>
        </div>
      </div>

      <div className="flex h-36 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50">
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <Truck size={40} strokeWidth={1.25} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Đội xe UniMove</span>
        </div>
      </div>
    </div>
  );
}

function LaborPicker({
  pkg,
  laborCount,
  onChange,
}: {
  pkg: ServicePackage;
  laborCount: number;
  onChange: (n: number) => void;
}) {
  return (
    <div
      className="border-t border-[#0047FF]/20 bg-blue-50/70 px-4 py-4 sm:px-5"
      onClick={(e) => e.stopPropagation()}
    >
      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#0047FF]">
        Chọn số người khuân vác
        <span className="ml-1.5 font-semibold normal-case text-gray-600">
          (gợi ý {pkg.laborSuggested} người)
        </span>
      </p>
      <div className="flex flex-wrap items-center gap-2.5">
        {Array.from({ length: pkg.maxLaborCount }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full border-2 text-sm font-bold shadow-sm transition-all",
              laborCount === n
                ? "scale-105 border-[#0047FF] bg-[#0047FF] text-white"
                : "border-white bg-white text-gray-800 hover:border-[#0047FF]/40"
            )}
          >
            {n}
          </button>
        ))}
        <span className="ml-1 text-sm text-gray-600">người</span>
      </div>
      <p className="mt-3 text-sm font-bold text-gray-900">
        Tạm tính gói này:{" "}
        <span className="text-[#0047FF]">{formatVND(packagePriceAtLabor(pkg, laborCount))}</span>
      </p>
    </div>
  );
}

function PackageOptionCard({
  pkg,
  selected,
  laborCount,
  onSelect,
  onLaborChange,
}: {
  pkg: ServicePackage;
  selected: boolean;
  laborCount: number;
  onSelect: () => void;
  onLaborChange: (n: number) => void;
}) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-2xl border-2 bg-white shadow-sm transition-all",
        selected ? "border-[#0047FF] shadow-md shadow-blue-100/50" : "border-gray-100"
      )}
    >
      {pkg.popular && (
        <div className="bg-[#0047FF] py-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-white">
          Phổ biến
        </div>
      )}
      <button type="button" onClick={onSelect} className="w-full p-4 text-left sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0047FF]">
              {pkg.badge}
            </span>
            <h3 className="mt-1 text-base font-bold text-gray-900">{pkg.label}</h3>
            <p className="mt-0.5 text-xs text-gray-500">{pkg.subtitle}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold text-[#0047FF]">
              từ {formatVND(packagePriceAtLabor(pkg, pkg.laborSuggested))}
            </p>
            <div
              className={cn(
                "ml-auto mt-2 flex h-5 w-5 items-center justify-center rounded-full border-2",
                selected ? "border-[#0047FF] bg-[#0047FF]" : "border-gray-300 bg-white"
              )}
            >
              {selected && <span className="h-2 w-2 rounded-full bg-white" />}
            </div>
          </div>
        </div>
        <ul className="mt-4 space-y-2">
          {pkg.features.map((f) => (
            <li key={f.text} className="flex items-start gap-2.5 text-xs text-gray-600">
              <span
                className={cn(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                  f.included ? "bg-blue-50 text-[#0047FF]" : "bg-gray-50 text-gray-300"
                )}
              >
                <Check size={10} strokeWidth={3} />
              </span>
              {f.text}
            </li>
          ))}
        </ul>
      </button>
      {selected && (
        <LaborPicker pkg={pkg} laborCount={laborCount} onChange={onLaborChange} />
      )}
    </div>
  );
}

export default function GoiDichVuPage() {
  const router = useRouter();
  useBookingModeGuard({ requireCombo: true });
  const pickup = useBookingFlowStore((s) => s.pickup);
  const destination = useBookingFlowStore((s) => s.destination);
  const {
    selectedTier,
    selectedComboLaborCount,
    setSelectedTier,
    setComboLaborCount,
  } = useBookingFlowStore();

  const pkg = SERVICE_PACKAGES.find((p) => p.tier === selectedTier)!;
  const estimateTotal = packagePriceAtLabor(pkg, selectedComboLaborCount);

  return (
    <BookingWizardLayout
      steps={[...COMBO_WIZARD_STEPS]}
      currentStep={4}
      segmentProgress={{ current: 4, total: 6 }}
      compact
      title="Chọn gói combo"
      subtitle="Giá xe + km niêm yết cố định. Chọn số người khuân vác phù hợp."
      cancelHref="/dat-chuyen/lich-hen"
      onContinue={() => router.push("/dat-chuyen/doi-tac")}
      continueLabel="Chọn nhà xe"
      sidebar={
        <ComboEstimateSidebar
          pkg={pkg}
          laborCount={selectedComboLaborCount}
          total={estimateTotal}
        />
      }
    >
      <RoutePointsCard pickup={pickup} destination={destination} />
      <BookingInsuranceBanner />

      <div>
        <div className="mb-3 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EFF6FF]">
            <Package size={18} className="text-[#0047FF]" />
          </div>
          <h2 className="text-sm font-bold text-gray-900 sm:text-base">Gói xe + khuân vác</h2>
        </div>

        <div className="space-y-3">
          {SERVICE_PACKAGES.map((p) => (
            <PackageOptionCard
              key={p.tier}
              pkg={p}
              selected={selectedTier === p.tier}
              laborCount={selectedComboLaborCount}
              onSelect={() => setSelectedTier(p.tier)}
              onLaborChange={setComboLaborCount}
            />
          ))}
        </div>
      </div>
    </BookingWizardLayout>
  );
}
