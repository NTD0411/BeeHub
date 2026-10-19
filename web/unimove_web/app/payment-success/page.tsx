"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Clock, AlertCircle, ArrowRight, Home } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { paymentsApi } from "@/lib/api";
import { formatVND } from "@/lib/utils";

function PaymentSuccessContent() {
  const params = useSearchParams();
  const paymentCode = params.get("payment_code") ?? "";
  const orderId = params.get("order_id") ?? "";
  const initialStatus = params.get("status") ?? "pending";

  const [status, setStatus] = useState(initialStatus);
  const [amount, setAmount] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(initialStatus !== "completed");

  useEffect(() => {
    if (!paymentCode) {
      setSyncing(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const listRes = await paymentsApi.list();
        if (!listRes.success || !listRes.data) return;
        const rows = Array.isArray(listRes.data)
          ? listRes.data
          : (listRes.data as { payments?: Record<string, unknown>[] }).payments ?? [];
        const found = rows.find(
          (p) => (p as { payment_code?: string }).payment_code === paymentCode,
        ) as { id?: string; status?: string; amount?: number } | undefined;

        if (found?.id) {
          const syncRes = await paymentsApi.sync(found.id);
          const synced = syncRes.data as { status?: string; amount?: number } | undefined;
          if (!cancelled) {
            setStatus(synced?.status ?? found.status ?? initialStatus);
            setAmount(synced?.amount ?? found.amount ?? null);
          }
        }
      } catch {
        /* giữ status từ query */
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [paymentCode, initialStatus]);

  const isSuccess = status === "completed";
  const isPending = status === "pending" || syncing;

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      {isPending ? (
        <>
          <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-6">
            <Clock size={40} className="text-blue-500 animate-pulse" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Đang xác nhận thanh toán</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Giao dịch đang được xử lý. Vui lòng đợi vài giây hoặc kiểm tra lại trong mục Hoạt động.
          </p>
        </>
      ) : isSuccess ? (
        <>
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={44} className="text-emerald-500" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Đặt cọc thành công!</h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-2">
            Chuyến chuyển của bạn đã được giữ. Theo dõi tiến trình tại tab Hoạt động.
          </p>
          {paymentCode && (
            <p className="text-xs text-gray-400 font-mono mb-6">Mã: {paymentCode}</p>
          )}
          {amount != null && amount > 0 && (
            <p className="text-lg font-bold text-[#2563EB] mb-6">{formatVND(amount)}</p>
          )}
        </>
      ) : (
        <>
          <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={40} className="text-amber-500" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Thanh toán chưa hoàn tất</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Trạng thái: <span className="font-semibold">{status}</span>. Bạn có thể thử đặt cọc lại từ chi tiết đơn hàng.
          </p>
        </>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
        {orderId && (
          <Link
            href={`/don-hang/${orderId}`}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#2563EB] text-white font-bold text-sm hover:bg-blue-700 transition-colors"
          >
            Xem đơn hàng
            <ArrowRight size={16} />
          </Link>
        )}
        <Link
          href="/hoat-dong"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-sm hover:bg-gray-50"
        >
          Hoạt động
        </Link>
        <Link
          href="/trang-chu"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-gray-500 font-semibold text-sm hover:text-gray-800"
        >
          <Home size={16} />
          Trang chủ
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="max-w-lg mx-auto px-4 py-20 text-center text-gray-500">Đang tải...</div>
        }
      >
        <PaymentSuccessContent />
      </Suspense>
    </AppShell>
  );
}
