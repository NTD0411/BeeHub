"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookingShell, RouteSummary } from "@/components/booking/BookingShell";
import { useBookingFlowStore } from "@/lib/stores/useBookingFlowStore";
import { useBookingModeGuard } from "@/lib/booking/use-booking-mode-guard";
import { ordersApi, paymentsApi, customerApi } from "@/lib/api";
import { buildOrderPayload } from "@/lib/booking/order-payload";
import { uploadDormPhotos } from "@/lib/booking/upload-dorm-photos";
import { INSURANCE_PLANS } from "@/lib/booking/constants";
import { formatVND } from "@/lib/utils";
import { getStoredUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { TermsModal } from "@/components/modals/TermsModal";

const TOS_KEY = "unimove_customer_tos_agreed";

export default function ThanhToanPage() {
  const router = useRouter();
  useBookingModeGuard({ requireCombo: true });
  const store = useBookingFlowStore();
  const {
    isComboBooking,
    pickup,
    destination,
    selectedInsurancePlanId,
    discountCode,
    discountApplied,
    setInsurancePlanId,
    setDiscountCode,
    applyDiscount,
    total,
    movePackagePrice,
    comboLaborFee,
    insuranceFee,
    discountAmount,
  } = store;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showTerms, setShowTerms] = useState(false);
  const [tosAgreed, setTosAgreed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setTosAgreed(localStorage.getItem(TOS_KEY) === "1");
    }
  }, []);

  const orderTotal = total();
  const deposit = Math.round(orderTotal * 0.3);

  const handleCheckoutClick = () => {
    if (!tosAgreed) { setShowTerms(true); return; }
    handleCheckout();
  };

  const handleTermsAgree = () => {
    localStorage.setItem(TOS_KEY, "1");
    setTosAgreed(true);
    setShowTerms(false);
    handleCheckout();
  };

  const handleCheckout = async () => {
    const user = getStoredUser();
    if (!user) {
      router.push("/login?tiep-theo=/dat-chuyen/thanh-toan");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const flow = useBookingFlowStore.getState();
      const items = flow.allDormPhotoItems();
      if (items.length > 0) {
        const { urls, failed } = await uploadDormPhotos(items);
        flow.setDormImageUrls(urls);
        if (failed && urls.length === 0) {
          throw new Error("Không upload được ảnh mô tả trọ");
        }
      }
      const body = buildOrderPayload(useBookingFlowStore.getState(), {
        basePrice: movePackagePrice() + comboLaborFee(),
        totalPrice: orderTotal,
      });
      const res = await ordersApi.create(body);
      if (!res.success) throw new Error(res.message ?? "Không tạo được đơn");
      const orderId = (res.data as { id?: string })?.id;
      if (!orderId) throw new Error("Thiếu mã đơn hàng");

      if (pickup.trim()) customerApi.addRecentPlace({ address: pickup.trim(), title: pickup.split(",")[0]?.trim() }).catch(() => {});
      if (destination.trim()) customerApi.addRecentPlace({ address: destination.trim(), title: destination.split(",")[0]?.trim() }).catch(() => {});

      const payRes = await paymentsApi.createDeposit(orderId, deposit, "payos", {
        customer_name: user.full_name,
        customer_email: user.email,
      });
      const url = (payRes.data as { checkout_url?: string })?.checkout_url;
      if (url) {
        window.location.href = url;
        return;
      }
      router.push(`/don-hang/${orderId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Thanh toán thất bại");
    } finally {
      setLoading(false);
    }
  };

  if (!isComboBooking) {
    return (
      <BookingShell title="Thanh toán" backHref="/dat-chuyen/doi-tac">
        <p className="text-sm text-gray-600">Luồng báo giá xử lý đặt cọc sau khi chốt nhà xe tại trang đơn hàng.</p>
        <button
          type="button"
          onClick={() => router.push("/don-hang")}
          className="mt-4 rounded-full bg-[#0047FF] px-6 py-3 text-sm font-bold text-white"
        >
          Xem đơn hàng
        </button>
      </BookingShell>
    );
  }

  return (
    <>
    <BookingShell
      title="Thanh toán & đặt cọc"
      subtitle="Cọc 30% giữ an toàn qua PayOS — chuyển cho nhà xe khi bạn xác nhận hoàn tất."
      step={6}
      totalSteps={6}
      backHref="/dat-chuyen/doi-tac"
      footer={
        <button
          type="button"
          disabled={loading || orderTotal <= 0}
          onClick={handleCheckoutClick}
          className="w-full rounded-full bg-[#FFC107] py-3.5 text-sm font-bold text-gray-900 disabled:opacity-50"
        >
          {loading ? "Đang xử lý..." : `Đặt cọc ${formatVND(deposit)}`}
        </button>
      }
    >
      <div className="space-y-5">
        <RouteSummary pickup={pickup} destination={destination} />

        <div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm space-y-2">
          <div className="flex justify-between"><span className="text-gray-500">Gói vận chuyển</span><span>{formatVND(movePackagePrice())}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Khuân vác combo</span><span>{formatVND(comboLaborFee())}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Bảo hiểm</span><span>{formatVND(insuranceFee())}</span></div>
          {discountApplied && (
            <div className="flex justify-between text-green-600"><span>Giảm giá</span><span>-{formatVND(discountAmount())}</span></div>
          )}
          <div className="flex justify-between border-t border-gray-100 pt-2 font-bold text-gray-900">
            <span>Tổng</span><span>{formatVND(orderTotal)}</span>
          </div>
          <div className="flex justify-between text-[#0047FF] font-semibold">
            <span>Đặt cọc (30%)</span><span>{formatVND(deposit)}</span>
          </div>
        </div>

        <section>
          <h2 className="mb-2 text-sm font-bold text-gray-900">Bảo hiểm hàng hóa</h2>
          <div className="space-y-2">
            {INSURANCE_PLANS.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setInsurancePlanId(plan.id)}
                className={cn(
                  "w-full rounded-xl border p-3 text-left text-sm",
                  selectedInsurancePlanId === plan.id ? "border-[#0047FF] bg-blue-50/40" : "border-gray-100"
                )}
              >
                <p className="font-semibold text-gray-900">{plan.name}</p>
                <p className="text-xs text-gray-500">{plan.tagline}</p>
                <p className="mt-1 text-xs font-medium text-[#0047FF]">
                  {plan.price > 0 ? formatVND(plan.price) : "Miễn phí"}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="flex gap-2">
          <input
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value)}
            placeholder="Mã giảm giá"
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
          />
          <button type="button" onClick={applyDiscount} className="rounded-xl border border-gray-200 px-4 text-sm font-medium">
            Áp dụng
          </button>
        </section>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </BookingShell>

    {showTerms && (
      <TermsModal
        type="customer"
        onAgree={handleTermsAgree}
        onClose={() => setShowTerms(false)}
      />
    )}
    </>
  );
}
