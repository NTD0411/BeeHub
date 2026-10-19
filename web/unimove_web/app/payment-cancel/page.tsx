"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { XCircle, ArrowLeft, Home } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

function PaymentCancelContent() {
  const params = useSearchParams();
  const paymentCode = params.get("payment_code") ?? "";

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
        <XCircle size={44} className="text-red-500" />
      </div>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Đã hủy thanh toán</h1>
      <p className="text-sm text-gray-500 leading-relaxed mb-2">
        Bạn có thể quay lại đơn hàng và đặt cọc lại khi sẵn sàng.
      </p>
      {paymentCode && (
        <p className="text-xs text-gray-400 font-mono mb-8">Mã: {paymentCode}</p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#2563EB] text-white font-bold text-sm"
        >
          <ArrowLeft size={16} />
          Quay lại
        </button>
        <Link
          href="/don-hang"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-sm"
        >
          Đơn hàng của tôi
        </Link>
        <Link
          href="/trang-chu"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-gray-500 font-semibold text-sm"
        >
          <Home size={16} />
          Trang chủ
        </Link>
      </div>
    </div>
  );
}

export default function PaymentCancelPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="max-w-lg mx-auto px-4 py-20 text-center text-gray-500">Đang tải...</div>
        }
      >
        <PaymentCancelContent />
      </Suspense>
    </AppShell>
  );
}
