"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, MapPin, Truck, Users } from "lucide-react";
import { DormPhotoUpload } from "@/components/booking/DormPhotoUpload";
import {
  BookingWizardLayout,
  BookingInsuranceBanner,
  AddressSummaryCard,
  QUOTE_WIZARD_STEPS,
  COMBO_WIZARD_STEPS,
} from "@/components/booking/BookingWizardLayout";
import { useBookingFlowStore } from "@/lib/stores/useBookingFlowStore";
import { useBookingModeGuard } from "@/lib/booking/use-booking-mode-guard";
import {
  ALLEY_LABELS,
  CARGO_LABELS,
  isDormPhotoSectionVisible,
  type AlleyAccess,
  type CargoVolume,
  type DormPhotoSection,
} from "@/lib/booking/constants";
import { cn } from "@/lib/utils";

const ALLEY_OPTS = ["unknown", "wide", "narrow", "no_car"] as AlleyAccess[];
const CARGO_OPTS = ["light", "medium", "heavy"] as CargoVolume[];
const ALL_PHOTO_SECTIONS: DormPhotoSection[] = [
  "pickupStairs",
  "pickupAlley",
  "destinationStairs",
  "destinationAlley",
  "cargo",
];

const inputClass =
  "h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-[#0047FF] focus:outline-none focus:ring-2 focus:ring-[#0047FF]/20";

function ChipGroup<T extends string>({
  value,
  options,
  labels,
  onChange,
  layout = "grid-2",
}: {
  value: T;
  options: T[];
  labels: Record<T, string>;
  onChange: (v: T) => void;
  /** grid-2: 2 cột (2×2 cho 4 mục), grid-3: 3 cột một hàng */
  layout?: "grid-2" | "grid-3";
}) {
  return (
    <div
      className={cn(
        "grid w-full gap-1.5",
        layout === "grid-3" ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2"
      )}
    >
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "rounded-xl border px-2 py-2 text-center text-[11px] font-medium leading-tight transition-colors sm:text-xs",
            value === opt
              ? "border-[#0047FF] bg-blue-50 text-[#0047FF]"
              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
          )}
        >
          {labels[opt]}
        </button>
      ))}
    </div>
  );
}

function SectionHeader({
  icon,
  iconBg,
  title,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: iconBg }}
      >
        {icon}
      </div>
      <h2 className="text-sm font-bold text-gray-900 sm:text-base">{title}</h2>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-xs font-semibold text-gray-500">{children}</p>;
}

function FloorElevatorRow({
  floor,
  hasElevator,
  onFloorChange,
  onElevatorChange,
}: {
  floor: number;
  hasElevator: boolean;
  onFloorChange: (v: number) => void;
  onElevatorChange: (v: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-[72px_1fr] items-end gap-2">
      <div>
        <FieldLabel>Tầng</FieldLabel>
        <input
          type="number"
          min={0}
          max={50}
          value={floor}
          onChange={(e) => onFloorChange(Number(e.target.value))}
          className={cn(inputClass, "text-center")}
        />
      </div>
      <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/80 px-3 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={hasElevator}
          onChange={(e) => onElevatorChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-[#0047FF]"
        />
        Có thang máy
      </label>
    </div>
  );
}

function PhotoIfVisible({
  section,
  ctx,
}: {
  section: DormPhotoSection;
  ctx: Parameters<typeof isDormPhotoSectionVisible>[1];
}) {
  if (!isDormPhotoSectionVisible(section, ctx)) return null;
  return <DormPhotoUpload section={section} />;
}

function PorterVisibilitySection({
  isComboBooking,
  wantsTransportLabor,
  transportLaborHelpers,
  onToggle,
  onCountChange,
}: {
  isComboBooking: boolean;
  wantsTransportLabor: boolean;
  transportLaborHelpers: number;
  onToggle: (v: boolean) => void;
  onCountChange: (n: number) => void;
}) {
  const countOptions = [1, 2, 3, 4];

  return (
    <div className="space-y-3 border-t border-gray-100 bg-white p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50">
          <Users size={18} className="text-violet-600" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-gray-900 sm:text-base">Nhu cầu khuân vác</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
            {isComboBooking
              ? "Chỉ để nhà xe tham khảo khi chuẩn bị. Gói combo & giá khuân vác bạn chọn ở bước sau — khác với thuê khuân vác riêng."
              : "Ghi nhận nhu cầu để nhà xe xem khi báo giá — khác với đặt dịch vụ khuân vác riêng."}
          </p>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2.5 text-sm text-gray-900">
        <input
          type="checkbox"
          checked={wantsTransportLabor}
          onChange={(e) => onToggle(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-[#0047FF]"
        />
        Cần hỗ trợ khuân vác
      </label>

      {wantsTransportLabor && (
        <div>
          <FieldLabel>
            Ước tính số người
            <span className="ml-1 font-normal text-gray-400">(nhà xe xem tham khảo)</span>
          </FieldLabel>
          <div className="flex flex-wrap gap-2">
            {countOptions.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onCountChange(n)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all",
                  transportLaborHelpers === n
                    ? "border-[#0047FF] bg-[#0047FF] text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-[#0047FF]/40",
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PhongTroPage() {
  const router = useRouter();
  useBookingModeGuard();
  const [showExtras, setShowExtras] = useState(false);
  const {
    isComboBooking,
    pickup,
    destination,
    pickupFloor,
    pickupHasElevator,
    pickupAlleyAccess,
    floorCount,
    hasElevator,
    destinationAlleyAccess,
    cargoVolume,
    dormNote,
    wantsTransportLabor,
    transportLaborHelpers,
    setDormDetails,
  } = useBookingFlowStore();

  const photoCtx = useMemo(
    () => ({
      pickupHasElevator,
      pickupAlleyAccess,
      hasElevator,
      destinationAlleyAccess,
      cargoVolume,
    }),
    [pickupHasElevator, pickupAlleyAccess, hasElevator, destinationAlleyAccess, cargoVolume]
  );

  const hasVisiblePhotos = useMemo(
    () => ALL_PHOTO_SECTIONS.some((s) => isDormPhotoSectionVisible(s, photoCtx)),
    [photoCtx]
  );

  const steps = isComboBooking ? [...COMBO_WIZARD_STEPS] : [...QUOTE_WIZARD_STEPS];

  return (
    <BookingWizardLayout
      steps={steps}
      currentStep={isComboBooking ? 2 : 1}
      segmentProgress={isComboBooking ? { current: 2, total: 6 } : { current: 2, total: 3 }}
      compact
      hideSidebar
      contentWidth="wide"
      title="Mô tả trọ"
      subtitle="Tầng, đường vào, khối lượng đồ."
      cancelHref="/dat-chuyen/dia-diem"
      onContinue={() => router.push("/dat-chuyen/lich-hen")}
      continueLabel="Tiếp tục chọn lịch"
    >
      <div className="space-y-2">
        <AddressSummaryCard pickup={pickup} destination={destination} />
        <BookingInsuranceBanner />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="grid md:grid-cols-2 md:divide-x md:divide-gray-100">
          <div className="min-w-0 space-y-4 border-b border-gray-100 p-4 sm:p-5 md:border-b-0">
            <SectionHeader
              icon={<MapPin size={18} className="text-[#0047FF]" />}
              iconBg="#EFF6FF"
              title="Trọ cũ (lấy đồ)"
            />
            <FloorElevatorRow
              floor={pickupFloor}
              hasElevator={pickupHasElevator}
              onFloorChange={(v) => setDormDetails({ pickupFloor: v })}
              onElevatorChange={(v) => setDormDetails({ pickupHasElevator: v })}
            />
            <div>
              <FieldLabel>Đường vào</FieldLabel>
              <ChipGroup
                value={pickupAlleyAccess}
                options={ALLEY_OPTS}
                labels={ALLEY_LABELS}
                onChange={(v) => setDormDetails({ pickupAlleyAccess: v })}
                layout="grid-2"
              />
            </div>
          </div>

          <div className="min-w-0 space-y-4 p-4 sm:p-5">
            <SectionHeader
              icon={<Truck size={18} className="text-[#F59E0B]" />}
              iconBg="#FEF3C7"
              title="Trọ mới (giao đồ)"
            />
            <FloorElevatorRow
              floor={floorCount}
              hasElevator={hasElevator}
              onFloorChange={(v) => setDormDetails({ floorCount: v })}
              onElevatorChange={(v) => setDormDetails({ hasElevator: v })}
            />
            <div>
              <FieldLabel>Đường vào</FieldLabel>
              <ChipGroup
                value={destinationAlleyAccess}
                options={ALLEY_OPTS}
                labels={ALLEY_LABELS}
                onChange={(v) => setDormDetails({ destinationAlleyAccess: v })}
                layout="grid-2"
              />
            </div>
          </div>
        </div>

        <div className="col-span-full space-y-4 border-t border-gray-100 bg-gray-50/50 p-4 sm:p-5">
          <div className="w-full">
            <FieldLabel>Khối lượng đồ</FieldLabel>
            <ChipGroup
              value={cargoVolume}
              options={CARGO_OPTS}
              labels={CARGO_LABELS}
              onChange={(v) => setDormDetails({ cargoVolume: v })}
              layout="grid-3"
            />
          </div>

          {hasVisiblePhotos && (
            <div>
              <FieldLabel>Ảnh minh họa</FieldLabel>
              <div className="space-y-2">
                <PhotoIfVisible section="pickupStairs" ctx={photoCtx} />
                <PhotoIfVisible section="pickupAlley" ctx={photoCtx} />
                <PhotoIfVisible section="destinationStairs" ctx={photoCtx} />
                <PhotoIfVisible section="destinationAlley" ctx={photoCtx} />
                <PhotoIfVisible section="cargo" ctx={photoCtx} />
              </div>
            </div>
          )}
        </div>

        <PorterVisibilitySection
          isComboBooking={isComboBooking}
          wantsTransportLabor={wantsTransportLabor}
          transportLaborHelpers={transportLaborHelpers}
          onToggle={(v) =>
            setDormDetails({
              wantsTransportLabor: v,
              ...(v && transportLaborHelpers < 1
                ? { transportLaborHelpers: 2 }
                : {}),
            })
          }
          onCountChange={(n) => setDormDetails({ transportLaborHelpers: n })}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setShowExtras((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 sm:px-5"
        >
          Ghi chú thêm
          <ChevronDown size={18} className={cn("shrink-0 transition-transform", showExtras && "rotate-180")} />
        </button>

        {showExtras && (
          <div className="border-t border-gray-100 px-4 py-4 sm:px-5">
            <div>
              <FieldLabel>Ghi chú cho nhà xe</FieldLabel>
              <textarea
                rows={2}
                value={dormNote}
                onChange={(e) => setDormDetails({ dormNote: e.target.value })}
                placeholder="VD: Hẻm nhỏ, cần bọc tủ lạnh..."
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-[#0047FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0047FF]/20"
              />
            </div>
          </div>
        )}
      </div>
    </BookingWizardLayout>
  );
}
