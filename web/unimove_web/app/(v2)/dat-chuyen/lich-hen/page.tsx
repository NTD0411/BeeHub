"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock } from "lucide-react";
import {
  BookingWizardLayout,
  BookingInsuranceBanner,
  AddressSummaryCard,
  QUOTE_WIZARD_STEPS,
  COMBO_WIZARD_STEPS,
} from "@/components/booking/BookingWizardLayout";
import { useBookingFlowStore } from "@/lib/stores/useBookingFlowStore";
import { useBookingModeGuard } from "@/lib/booking/use-booking-mode-guard";
import { ordersApi, customerApi } from "@/lib/api";
import { buildOrderPayload, defaultPickupSuggestion, isValidPickupTime, getAvailableScheduleSlots, resolveScheduleSelection, toLocalDateInputValue } from "@/lib/booking/order-payload";
import { uploadDormPhotos } from "@/lib/booking/upload-dorm-photos";
import { cn } from "@/lib/utils";
import { getStoredUser } from "@/lib/auth";

const inputClass =
  "h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-[#0047FF] focus:outline-none focus:ring-2 focus:ring-[#0047FF]/20";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-xs font-semibold text-gray-500">{children}</p>;
}

export default function LichHenPage() {
  const router = useRouter();
  useBookingModeGuard();
  const store = useBookingFlowStore();
  const { isComboBooking, pickup, destination, scheduledPickupAt, setScheduledPickupAt } = store;

  const initialSchedule = useMemo(() => {
    const preferred = scheduledPickupAt ? new Date(scheduledPickupAt) : defaultPickupSuggestion();
    return resolveScheduleSelection(preferred);
  }, []);

  const [selectedDay, setSelectedDay] = useState(() => initialSchedule.day);
  const [selectedHour, setSelectedHour] = useState(initialSchedule.hour);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const availableHours = useMemo(
    () => getAvailableScheduleSlots(selectedDay),
    [selectedDay],
  );

  useEffect(() => {
    if (availableHours.length === 0) return;
    if (!availableHours.includes(selectedHour)) {
      setSelectedHour(availableHours[0]);
    }
  }, [selectedDay, availableHours, selectedHour]);

  const combined = useMemo(() => {
    const [y, m, d] = selectedDay.split("-").map(Number);
    return new Date(y, m - 1, d, selectedHour, 0, 0, 0);
  }, [selectedDay, selectedHour]);

  useEffect(() => {
    setScheduledPickupAt(combined.toISOString());
  }, [combined, setScheduledPickupAt]);

  const validate = () => {
    if (!isValidPickupTime(combined)) {
      setError("Chọn thời gian sau ít nhất 1 giờ nữa");
      return false;
    }
    setError("");
    return true;
  };

  const submitQuote = async () => {
    if (!validate()) return;
    const user = getStoredUser();
    if (!user) {
      router.push("/login?tiep-theo=/dat-chuyen/lich-hen");
      return;
    }
    setSubmitting(true);
    try {
      const flow = useBookingFlowStore.getState();
      const items = flow.allDormPhotoItems();
      if (items.length > 0) {
        const { urls, failed } = await uploadDormPhotos(items);
        flow.setDormImageUrls(urls);
        if (failed && urls.length === 0) {
          setError("Không upload được ảnh. Vui lòng thử lại hoặc tiếp tục không ảnh.");
        }
      }
      const ref = `QR-${Date.now() % 1_000_000}`;
      const body = buildOrderPayload(useBookingFlowStore.getState(), {
        basePrice: 0,
        totalPrice: 0,
        quoteReferenceId: ref,
      });
      const res = await ordersApi.create(body);
      if (!res.success) throw new Error(res.message ?? "Gửi thất bại");
      const id = (res.data as { id?: string })?.id;
      if (pickup.trim())
        customerApi.addRecentPlace({ address: pickup.trim(), title: pickup.split(",")[0]?.trim() }).catch(() => {});
      if (destination.trim())
        customerApi
          .addRecentPlace({ address: destination.trim(), title: destination.split(",")[0]?.trim() })
          .catch(() => {});
      store.setQuoteOrderId(id ?? null);
      router.push(id ? `/dat-chuyen/bao-gia/${id}` : "/don-hang");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không gửi được yêu cầu");
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = () => {
    if (!validate()) return;
    if (isComboBooking) router.push("/dat-chuyen/goi-dich-vu");
    else submitQuote();
  };

  const steps = isComboBooking ? [...COMBO_WIZARD_STEPS] : [...QUOTE_WIZARD_STEPS];
  const continueLabel = submitting
    ? "Đang gửi..."
    : isComboBooking
      ? "Tiếp tục chọn combo"
      : "Gửi yêu cầu báo giá";

  return (
    <BookingWizardLayout
      steps={steps}
      currentStep={isComboBooking ? 3 : 2}
      segmentProgress={isComboBooking ? { current: 3, total: 6 } : { current: 2, total: 3 }}
      compact
      hideSidebar
      title="Chọn ngày giờ lấy đồ"
      subtitle="Nhà xe chỉ bắt đầu vận chuyển đúng khung bạn đặt."
      cancelHref="/dat-chuyen/phong-tro"
      onContinue={handleContinue}
      continueDisabled={submitting}
      continueLabel={continueLabel}
    >
      <div className="space-y-2">
        <AddressSummaryCard pickup={pickup} destination={destination} />
        <BookingInsuranceBanner />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EFF6FF]">
              <Calendar size={18} className="text-[#0047FF]" />
            </div>
            <h2 className="text-sm font-bold text-gray-900 sm:text-base">Lịch lấy đồ</h2>
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <div>
            <FieldLabel>Ngày lấy đồ</FieldLabel>
            <input
              type="date"
              value={selectedDay}
              min={toLocalDateInputValue(new Date())}
              onChange={(e) => setSelectedDay(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <FieldLabel>Khung giờ gợi ý</FieldLabel>
            {availableHours.length === 0 ? (
              <p className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
                Không còn khung giờ hôm nay. Vui lòng chọn ngày khác.
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {availableHours.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setSelectedHour(h)}
                    className={cn(
                      "rounded-xl border py-2 text-center text-xs font-medium transition-colors sm:py-2.5 sm:text-sm",
                      selectedHour === h
                        ? "border-[#0047FF] bg-blue-50 text-[#0047FF]"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300",
                    )}
                  >
                    {String(h).padStart(2, "0")}:00
                  </button>
                ))}
              </div>
            )}
            <p className="mt-2 text-[11px] text-gray-400">
              Chỉ hiển thị khung giờ sau ít nhất 1 giờ so với hiện tại.
            </p>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2.5 text-sm">
            <Clock size={16} className="shrink-0 text-[#0047FF]" />
            <span className="text-gray-600">
              Đã chọn:{" "}
              <span className="font-semibold text-gray-900">
                {combined.toLocaleString("vi-VN", {
                  weekday: "short",
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </span>
          </div>

          {error && (
            <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}
        </div>
      </div>

      {!isComboBooking && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm leading-relaxed text-blue-800">
          Sau khi gửi, các nhà xe phù hợp sẽ báo giá trong khoảng 30 phút. Bạn có thể so sánh và chốt nhà xe ưng ý.
        </div>
      )}
    </BookingWizardLayout>
  );
}
