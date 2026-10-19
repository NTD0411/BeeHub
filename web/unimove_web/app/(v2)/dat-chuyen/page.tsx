"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Package, Route, ChevronRight, Users, Sparkles, Scale } from "lucide-react";
import { useBookingFlowStore } from "@/lib/stores/useBookingFlowStore";
import { cn } from "@/lib/utils";

function QueryRedirect() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    const mode = sp.get("mode");
    const loai = sp.get("loai");
    const laborOnly = sp.get("laborOnly");
    const store = useBookingFlowStore.getState();
    store.resetFlow();

    if (loai === "khuan-vac") {
      store.setServiceKind("laborAddon");
      router.replace("/dat-chuyen/khuan-vac");
      return;
    }
    if (laborOnly === "1") {
      store.setServiceKind("laborOnly");
      router.replace("/dat-chuyen/dia-diem");
      return;
    }
    if (mode === "combo" || mode === "quote") {
      store.setBookingMode(mode === "combo" ? "combo" : "quote");
      router.replace("/dat-chuyen/dia-diem");
    }
  }, [router, sp]);

  const mode = sp.get("mode");
  const loai = sp.get("loai");
  const laborOnly = sp.get("laborOnly");
  if (loai || laborOnly || mode === "combo" || mode === "quote") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-gray-500">Đang mở luồng đặt chuyến...</p>
      </div>
    );
  }

  return <ModeChooser />;
}

const HIGHLIGHTS = {
  combo: ["Giá biết trước, không chờ báo giá", "Xe + người khuân trong một gói", "Phù hợp chuyển trọ gần"],
  quote: ["Nhiều nhà xe cùng báo giá", "Linh hoạt chuyến xa / nhiều điểm", "Bạn chọn mức giá ưng ý"],
} as const;

function ModeChooser() {
  const router = useRouter();
  const resetFlow = useBookingFlowStore((s) => s.resetFlow);
  const setBookingMode = useBookingFlowStore((s) => s.setBookingMode);

  useEffect(() => {
    resetFlow();
  }, [resetFlow]);

  const choose = (mode: "combo" | "quote") => {
    setBookingMode(mode);
    router.push("/dat-chuyen/dia-diem");
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 lg:py-14">
      <div className="mb-10 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-[#0047FF]">
          Đặt chuyến UniMove
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Chuyển trọ theo cách nào phù hợp với bạn?
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-gray-500">
          Hai hình thức khác nhau — chọn một để UniMove đồng hành cùng bạn suốt hành trình.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => choose("combo")}
          className={cn(
            "group relative flex h-full flex-col rounded-2xl border-2 border-gray-100 bg-white p-6 text-left shadow-sm",
            "transition hover:border-[#0047FF]/50 hover:shadow-lg hover:shadow-blue-100/40",
          )}
        >
          <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-[#0047FF] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            <Sparkles size={10} />
            Phổ biến
          </span>

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#0047FF] transition group-hover:scale-105">
            <Package size={28} strokeWidth={1.75} />
          </div>

          <h2 className="mt-5 text-lg font-bold text-gray-900">Gói combo</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Trọn gói xe vận chuyển và người khuân vác — biết giá ngay, đặt nhanh, phù hợp sinh viên chuyển trọ trong thành phố.
          </p>

          <ul className="mt-4 space-y-2">
            {HIGHLIGHTS.combo.map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs text-gray-500">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0047FF]" />
                {item}
              </li>
            ))}
          </ul>

          <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-[#0047FF]">
            Chọn gói combo
            <ChevronRight size={16} className="transition group-hover:translate-x-0.5" />
          </span>
        </button>

        <button
          type="button"
          onClick={() => choose("quote")}
          className={cn(
            "group relative flex h-full flex-col rounded-2xl border-2 border-gray-100 bg-white p-6 text-left shadow-sm",
            "transition hover:border-amber-400/60 hover:shadow-lg hover:shadow-amber-100/40",
          )}
        >
          <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
            <Scale size={10} />
            Linh hoạt
          </span>

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 transition group-hover:scale-105">
            <Route size={28} strokeWidth={1.75} />
          </div>

          <h2 className="mt-5 text-lg font-bold text-gray-900">Chuyến thông thường</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Gửi nhu cầu chuyển nhà — các nhà xe uy tín sẽ báo giá, bạn so sánh và chọn đối tác phù hợp nhất.
          </p>

          <ul className="mt-4 space-y-2">
            {HIGHLIGHTS.quote.map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs text-gray-500">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                {item}
              </li>
            ))}
          </ul>

          <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-amber-700">
            Đặt chuyến & nhận báo giá
            <ChevronRight size={16} className="transition group-hover:translate-x-0.5" />
          </span>
        </button>
      </div>

      <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-5 py-4 text-center">
        <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-white text-gray-400 shadow-sm">
          <Users size={18} />
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Chỉ cần người bốc xếp, không cần xe?
        </p>
        <Link
          href="/dat-chuyen?loai=khuan-vac"
          className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-[#0047FF] hover:underline"
        >
          Xem dịch vụ khuân vác
          <ChevronRight size={14} />
        </Link>
      </div>

      <p className="mt-8 text-center">
        <Link href="/trang-chu" className="text-sm text-gray-400 transition hover:text-gray-600">
          ← Về trang chủ
        </Link>
      </p>
    </div>
  );
}

export default function DatChuyenEntryPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-gray-500">Đang tải...</div>}>
      <QueryRedirect />
    </Suspense>
  );
}
