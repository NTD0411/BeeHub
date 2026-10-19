"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Tag, MapPin, Clock,
  Banknote, ImagePlus, X, Send,
} from "lucide-react";
import { marketplaceApi } from "@/lib/api";
import { useUIStore } from "@/lib/stores";
import { formatVND } from "@/lib/utils";
import { ListingFeeQuotaCard } from "@/components/marketplace/ListingFeeQuotaCard";
import { useListingFeeQuota } from "@/components/marketplace/useListingFeeQuota";

/* ─── Constants ─────────────────────────────────────────────── */
const MAX_IMAGES = 5;

const CATEGORIES = [
  { value: "furniture",   label: "Nội thất"  },
  { value: "electronics", label: "Điện tử"   },
  { value: "appliances",  label: "Gia dụng"  },
  { value: "books",       label: "Sách & VPP"},
  { value: "clothes",     label: "Quần áo"   },
  { value: "other",       label: "Khác"      },
];

const CONDITIONS = [
  { value: "like_new", label: "Như mới"  },
  { value: "good",     label: "Còn tốt" },
  { value: "fair",     label: "Cũ nhẹ"  },
];

/* Fee preview uses API quota — see useListingFeeQuota */

/* ─── Sub-components ─────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-bold text-gray-900">{children}</p>;
}

function Chip({
  label, selected, onClick,
}: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
        selected
          ? "bg-[#0047FF] border-[#0047FF] text-white"
          : "bg-white border-gray-200 text-gray-700 hover:border-[#0047FF]/50"
      }`}
    >
      {label}
    </button>
  );
}

function SwitchRow({
  title, subtitle, checked, disabled, onChange,
}: {
  title: string; subtitle: string;
  checked: boolean; disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className={`flex items-center justify-between py-2 ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
      <div>
        <p className={`text-sm font-semibold ${disabled ? "text-gray-400" : "text-gray-800"}`}>{title}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
      <div
        onClick={() => !disabled && onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${checked && !disabled ? "bg-[#0047FF]" : "bg-gray-200"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked && !disabled ? "translate-x-5" : "translate-x-0.5"}`} />
      </div>
    </label>
  );
}

/* ─── Main page ─────────────────────────────────────────────── */
export default function DangBanPage() {
  const router = useRouter();
  const { showSuccess, showError } = useUIStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages]       = useState<File[]>([]);
  const [previews, setPreviews]   = useState<string[]>([]);
  const [title, setTitle]         = useState("");
  const [category, setCategory]   = useState("furniture");
  const [condition, setCondition] = useState("like_new");
  const [priceStr, setPriceStr]   = useState("");
  const [isFree, setIsFree]       = useState(false);
  const [isNego, setIsNego]       = useState(false);
  const [usage, setUsage]         = useState("");
  const [area, setArea]           = useState("");
  const [desc, setDesc]           = useState("");
  const [showSheet, setShowSheet] = useState(false);
  const [loading, setLoading]     = useState(false);

  const price    = isFree ? 0 : (Number(priceStr) || 0);
  const { preview, displayFee, isFreePost } = useListingFeeQuota(price);
  const isValid  = images.length > 0 && title.trim() !== "" && area.trim() !== "" && (isFree || price > 0);

  /* ─── Image handling ─── */
  const addImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = MAX_IMAGES - images.length;
    const toAdd = files.slice(0, remaining);
    setImages((p) => [...p, ...toAdd]);
    setPreviews((p) => [...p, ...toAdd.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    URL.revokeObjectURL(previews[idx]);
    setImages((p) => p.filter((_, i) => i !== idx));
    setPreviews((p) => p.filter((_, i) => i !== idx));
  };

  /* ─── Submit ─── */
  const handleSubmit = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setShowSheet(false);
    try {
      let imageUrls: string[] = [];
      if (images.length) {
        const up = await marketplaceApi.uploadImages(images);
        imageUrls = (up.data as string[]) ?? [];
      }
      const res = await marketplaceApi.create({
        title: title.trim(),
        description: desc.trim() || undefined,
        category,
        condition,
        area: area.trim() || undefined,
        price,
        images: imageUrls,
        usage_duration: usage.trim() || undefined,
        is_negotiable: isNego,
      });
      if (!res.success) {
        showError((res as { message?: string }).message || "Đăng tin thất bại");
        return;
      }
      const data = res.data as { id?: string };
      const feeInfo = (res as { listing_fee?: { requires_payment?: boolean; amount?: number } }).listing_fee;
      if (feeInfo?.requires_payment && data?.id) {
        try {
          const pay = await marketplaceApi.payListingFee(data.id, { payment_method: "payos" });
          const checkout = (pay.data as { checkout_url?: string })?.checkout_url;
          if (checkout) { window.location.href = checkout; return; }
        } catch { /* tiếp tục redirect về tin-cua-toi */ }
        // Không lấy được checkout URL → về Tin của tôi để thanh toán sau
        showSuccess(`Tin đã tạo! Phí ${formatVND(feeInfo.amount ?? 0)} — vào Tin của tôi để kích hoạt.`);
        router.push("/cho-sinh-vien/tin-cua-toi");
        return;
      }
      showSuccess("Đăng tin thành công!");
      router.push("/cho-sinh-vien/tin-cua-toi");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  const conditionLabel = CONDITIONS.find((c) => c.value === condition)?.label ?? "";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-white border-b border-gray-100 px-4 py-3.5">
        <Link href="/cho-sinh-vien" className="p-2 rounded-xl border border-gray-200 bg-white">
          <ArrowLeft size={18} className="text-gray-700" />
        </Link>
        <h1 className="text-base font-extrabold text-gray-900">Đăng tin pass đồ</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-6 pb-28">

        {/* ── Images ── */}
        <section className="space-y-2">
          <SectionLabel>Hình ảnh</SectionLabel>
          {images.length === 0 ? (
            <label className="flex flex-col items-center justify-center gap-2 h-40 rounded-2xl border-2 border-dashed border-gray-200 bg-white cursor-pointer hover:bg-gray-50 transition-colors">
              <ImagePlus size={36} className="text-[#0047FF]" />
              <p className="text-sm font-bold text-gray-800">Tải ảnh từ máy</p>
              <p className="text-xs text-gray-500">Chọn từ thiết bị (tối đa {MAX_IMAGES} ảnh)</p>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={addImages} />
            </label>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {previews.map((src, i) => (
                  <div key={i} className="relative shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-gray-200">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    {i === 0 && (
                      <span className="absolute bottom-1.5 left-1.5 text-[10px] font-bold bg-black/50 text-white px-1.5 py-0.5 rounded">Bìa</span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 flex items-center justify-center"
                    >
                      <X size={11} className="text-white" />
                    </button>
                  </div>
                ))}
                {images.length < MAX_IMAGES && (
                  <label className="shrink-0 w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 bg-white flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                    <ImagePlus size={22} className="text-[#0047FF]" />
                    <span className="text-[11px] text-[#0047FF] font-semibold mt-1">Thêm ảnh</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={addImages} />
                  </label>
                )}
              </div>
              <p className="text-xs text-gray-500">{images.length}/{MAX_IMAGES} ảnh · Ảnh đầu tiên là ảnh bìa</p>
            </div>
          )}
        </section>

        {/* ── Title ── */}
        <section className="space-y-2">
          <SectionLabel>Tên món đồ <span className="text-red-500">*</span></SectionLabel>
          <div className="relative">
            <Tag size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0047FF]" />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Tủ quần áo gỗ 2 cánh"
              className="w-full h-11 pl-9 pr-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0047FF]/20 focus:border-[#0047FF]"
            />
          </div>
        </section>

        {/* ── Category ── */}
        <section className="space-y-2">
          <SectionLabel>Danh mục</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Chip key={c.value} label={c.label} selected={category === c.value} onClick={() => setCategory(c.value)} />
            ))}
          </div>
        </section>

        {/* ── Condition ── */}
        <section className="space-y-2">
          <SectionLabel>Tình trạng</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map((c) => (
              <Chip key={c.value} label={c.label} selected={condition === c.value} onClick={() => setCondition(c.value)} />
            ))}
          </div>
        </section>

        {/* ── Price ── */}
        <section className="space-y-2">
          <SectionLabel>Giá mong muốn <span className="text-red-500">*</span></SectionLabel>
          <div className="relative">
            <Banknote size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0047FF]" />
            <input
              type="number"
              min={0}
              value={isFree ? "" : priceStr}
              onChange={(e) => setPriceStr(e.target.value)}
              disabled={isFree}
              placeholder={isFree ? "Miễn phí" : "VD: 250000"}
              className="w-full h-11 pl-9 pr-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0047FF]/20 focus:border-[#0047FF] disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
            <SwitchRow
              title="Tặng miễn phí"
              subtitle="Cho tặng, không lấy tiền"
              checked={isFree}
              onChange={(v) => { setIsFree(v); if (v) setIsNego(false); }}
            />
            <SwitchRow
              title="Có thể thương lượng"
              subtitle="Cho phép trả giá"
              checked={isNego}
              disabled={isFree}
              onChange={setIsNego}
            />
          </div>
        </section>

        {/* ── Usage duration ── */}
        <section className="space-y-2">
          <SectionLabel>Thời gian đã sử dụng</SectionLabel>
          <div className="relative">
            <Clock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0047FF]" />
            <input
              value={usage}
              onChange={(e) => setUsage(e.target.value)}
              placeholder="VD: 6 tháng"
              className="w-full h-11 pl-9 pr-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0047FF]/20 focus:border-[#0047FF]"
            />
          </div>
        </section>

        {/* ── Area ── */}
        <section className="space-y-2">
          <SectionLabel>Địa chỉ lấy đồ <span className="text-red-500">*</span></SectionLabel>
          <div className="relative">
            <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0047FF]" />
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="VD: KTX Khu B, Thủ Đức, Đà Nẵng"
              className="w-full h-11 pl-9 pr-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0047FF]/20 focus:border-[#0047FF]"
            />
          </div>
        </section>

        {/* ── Description ── */}
        <section className="space-y-2">
          <SectionLabel>Mô tả chi tiết</SectionLabel>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={4}
            placeholder="Mô tả tình trạng, lý do pass, lưu ý khi nhận..."
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0047FF]/20 focus:border-[#0047FF]"
          />
        </section>

        {/* ── Preview card ── */}
        <section className="space-y-2">
          <SectionLabel>Xem trước tin đăng</SectionLabel>
          <div className="flex gap-3 bg-white rounded-2xl border border-gray-100 p-3">
            <div className="shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
              {previews[0]
                ? <img src={previews[0]} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><ImagePlus size={22} className="text-gray-400" /></div>
              }
            </div>
            <div className="flex-1 min-w-0 py-0.5">
              <p className="font-bold text-gray-900 text-sm truncate">{title.trim() || "Tên món đồ"}</p>
              <p className={`font-extrabold text-sm mt-0.5 ${isFree ? "text-green-600" : "text-[#0047FF]"}`}>
                {isFree ? "Miễn phí" : (price > 0 ? formatVND(price) : "Chưa nhập giá")}
                {isNego && !isFree && <span className="text-xs font-semibold text-gray-500 ml-1">· Thương lượng</span>}
              </p>
              <p className="text-xs text-gray-500 mt-1">{conditionLabel} · {CATEGORIES.find((c) => c.value === category)?.label}</p>
              <p className="text-xs text-gray-500 truncate">{area.trim() || "Chưa nhập địa chỉ"}</p>
            </div>
          </div>
        </section>

        {/* ── Fee card ── */}
        <ListingFeeQuotaCard price={price} isGiveaway={isFree} />

        {!isValid && (
          <p className="text-xs text-gray-500 text-center">
            Cần tải ảnh, nhập tên món đồ, địa chỉ và giá (hoặc chọn miễn phí) để đăng tin.
          </p>
        )}
      </div>

      {/* ── Sticky submit button ── */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 px-4 py-3 max-w-lg mx-auto">
        <button
          type="button"
          disabled={!isValid || loading}
          onClick={() => setShowSheet(true)}
          className="w-full h-12 rounded-full bg-[#0047FF] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(0,71,255,0.3)] transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={16} />
          {loading ? "Đang đăng..." : "Tiếp tục đăng tin"}
        </button>
      </div>

      {/* ── Fee confirmation sheet ── */}
      {showSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowSheet(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full max-w-lg bg-white rounded-t-3xl px-5 py-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto w-10 h-1 bg-gray-200 rounded-full" />
            <div>
              <h3 className="text-lg font-extrabold text-gray-900">Phí đăng tin</h3>
              <p className="text-xs text-gray-500 mt-0.5">{preview?.message ?? "2 tin đầu miễn phí · sau đó 2% giá bán"}</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Loại tin</span>
                <span className="font-semibold text-gray-900">{isFree ? "Cho tặng miễn phí" : "Bán đồ cũ"}</span>
              </div>
              {!isFree && (
                <div className="flex justify-between text-gray-600">
                  <span>Giá bán</span>
                  <span className="font-semibold text-gray-900">{formatVND(price)}</span>
                </div>
              )}
              <hr className="border-gray-100" />
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900">Phí đăng tin</span>
                <span className={`text-xl font-extrabold ${isFreePost ? "text-green-600" : "text-[#0047FF]"}`}>
                  {isFreePost ? "Miễn phí" : formatVND(displayFee)}
                </span>
              </div>
              {!isFreePost && displayFee > 0 && (
                <p className="text-xs text-gray-500">Thanh toán qua QR PayOS sau khi đăng tin</p>
              )}
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full h-12 rounded-full bg-[#0047FF] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(0,71,255,0.3)] hover:brightness-110 disabled:opacity-50"
            >
              <Send size={16} />
              {isFreePost ? "Đăng tin miễn phí" : "Tiếp tục thanh toán"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
