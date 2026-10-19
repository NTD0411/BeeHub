"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Calculator,
  Info,
  Layers,
  Package,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { FadeSlideIn } from "@/components/motion/fade-slide-in";

const BLUE = "#0047FF";

const TRIP_ROWS = [
  {
    label: "Chuyến gần (1-2km)",
    price: "200.000 - 300.000đ",
    hint: "Phù hợp nội khu, cùng phường",
  },
  {
    label: "Chuyến vừa (3-5km)",
    price: "250.000 - 350.000đ",
    hint: "Di chuyển giữa các quận lân cận",
  },
  {
    label: "Chuyến xa (5-10km)",
    price: "350.000 - 500.000đ",
    hint: "Vận chuyển xuyên thành phố",
  },
] as const;

const SURCHARGE_ROWS = [
  {
    icon: Layers,
    label: "Mỗi tầng không thang máy",
    price: "+50.000 - 100.000đ/tầng",
    hint: "Áp dụng khi phải leo cầu thang tại điểm đi hoặc đến",
  },
  {
    icon: Package,
    label: "Đồ cồng kềnh (tủ lạnh, máy giặt...)",
    price: "+100.000 - 200.000đ/món",
    hint: "Tủ lạnh, máy giặt, bàn ghế lớn và đồ cần thêm người bê",
  },
  {
    icon: Users,
    label: "Hỗ trợ bưng bê toàn bộ đồ đạc",
    price: "+100.000 - 300.000đ",
    hint: "Nhà xe hỗ trợ xuống–lên đồ thay vì chỉ vận chuyển trên xe",
  },
] as const;

const EXAMPLE_ROWS = [
  {
    label: "Chỉ vận chuyển",
    price: "250.000 - 350.000đ",
    hint: "Ví dụ: phòng nhỏ ~5km, đồ vừa phải, tự bưng bê xuống xe",
  },
  {
    label: "Có hỗ trợ bưng bê, tầng lầu",
    price: "350.000 - 700.000đ",
    hint: "Thêm phụ phí tầng + hỗ trợ bưng bê toàn bộ đồ đạc",
  },
] as const;

function PriceRow({
  label,
  price,
  hint,
}: {
  label: string;
  price: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
      </div>
      <p className="shrink-0 text-right text-sm font-bold" style={{ color: BLUE }}>
        {price}
      </p>
    </div>
  );
}

export default function ReferencePricesPage() {
  return (
    <Container className="py-6 lg:py-10">
      <FadeSlideIn>
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 lg:text-3xl">
            Bảng phụ phí tham khảo
          </h1>
          <p className="mt-1 text-sm text-gray-500">Giá ước tính · Thực tế có thể thay đổi</p>
        </div>
      </FadeSlideIn>

      <FadeSlideIn delay={60}>
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-gradient-to-r from-[#EFF6FF] to-white px-4 py-4 sm:px-5">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: "#DBEAFE", color: BLUE }}
          >
            <Info size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Lưu ý quan trọng</p>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">
              Giá chỉ mang tính tham khảo. Chi phí thực tế phụ thuộc số lượng đồ đạc, điều kiện
              bốc xếp, khoảng cách di chuyển và số tầng tại điểm đi/đến.
            </p>
          </div>
        </div>
      </FadeSlideIn>

      <FadeSlideIn delay={120}>
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-5 py-5 sm:px-6">
            <div className="flex items-start gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                style={{ backgroundColor: "#EFF6FF", color: BLUE }}
              >
                <Building2 size={22} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900">Phòng nhỏ (≤ 20m²)</h2>
                  <span className="rounded-full bg-[#FFFBEB] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                    Phổ biến
                  </span>
                </div>
                <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Gói cơ bản
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 sm:max-w-xs sm:text-right">
              Ví dụ: 5 km · 1 tủ lạnh 130L · 2 bàn học gấp · 2 ghế · dụng cụ bếp + quần áo vừa phải
            </p>
          </div>

          <div className="hidden grid-cols-[1fr_auto] gap-4 border-b border-gray-100 bg-gray-50/80 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-400 sm:grid sm:px-6">
            <span>Loại chuyến</span>
            <span>Giá tham khảo</span>
          </div>

          {TRIP_ROWS.map((row) => (
            <PriceRow key={row.label} {...row} />
          ))}
        </div>
      </FadeSlideIn>

      <FadeSlideIn delay={180}>
        <section className="mt-6 overflow-hidden rounded-3xl bg-[#0B1F4A] text-white shadow-lg lg:mt-8">
          <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-4 sm:px-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
              <Plus size={18} />
            </div>
            <h2 className="text-lg font-bold">Phụ phí thêm</h2>
          </div>

          <div className="grid gap-4 p-4 sm:grid-cols-3 sm:p-5">
            {SURCHARGE_ROWS.map(({ icon: Icon, label, price, hint }) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <Icon size={18} />
                </div>
                <p className="text-sm font-bold text-[#FFC107]">{price}</p>
                <p className="mt-2 text-sm font-semibold">{label}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/65">{hint}</p>
              </div>
            ))}
          </div>
        </section>
      </FadeSlideIn>

      <FadeSlideIn delay={240}>
        <section className="mt-6 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm lg:mt-8">
          <div className="flex items-center gap-2.5 border-b border-gray-100 px-5 py-4 sm:px-6">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ backgroundColor: "#FEF9C3", color: "#CA8A04" }}
            >
              <Sparkles size={18} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Ví dụ ước tính</h2>
          </div>

          <div className="hidden grid-cols-[1fr_auto] gap-4 border-b border-gray-100 bg-gray-50/80 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-400 sm:grid sm:px-6">
            <span>Trường hợp</span>
            <span>Tổng chi phí</span>
          </div>

          {EXAMPLE_ROWS.map((row) => (
            <PriceRow key={row.label} {...row} />
          ))}
        </section>
      </FadeSlideIn>

      <FadeSlideIn delay={300}>
        <div className="mt-8 grid gap-4 lg:mt-10 lg:grid-cols-[1fr_360px] lg:items-stretch">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 p-6 lg:p-8">
            <div className="relative z-10 max-w-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Quy trình minh bạch
              </p>
              <p className="mt-2 text-lg font-bold text-slate-800">
                Đặt chuyến → nhà xe báo giá → bạn chọn và thanh toán an toàn
              </p>
            </div>
            <div className="pointer-events-none absolute -bottom-6 -right-6 h-40 w-40 rounded-full bg-white/40 blur-2xl" />
          </div>

          <div className="flex flex-col justify-between rounded-3xl border border-amber-200 bg-gradient-to-br from-[#FFFBEB] to-white p-6">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <Calculator size={22} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900">Bạn muốn báo giá chính xác?</h3>
              <p className="mt-1 text-sm text-gray-600">
                Mô tả đồ đạc và địa điểm — nhà xe sẽ báo giá theo tình huống thực tế của bạn.
              </p>
            </div>
            <Button asChild className="mt-5 h-11 w-full rounded-xl font-semibold" size="lg">
              <Link href="/dat-chuyen">
                Tính phí ngay
                <ArrowRight size={16} className="ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </FadeSlideIn>

      <p className="mt-8 text-center text-xs text-gray-400">Cập nhật tháng 6/2026 · UniMove</p>
    </Container>
  );
}
