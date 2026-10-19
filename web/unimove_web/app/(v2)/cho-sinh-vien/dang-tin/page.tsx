"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ImagePlus,
  Info,
  Lightbulb,
  MapPin,
  Send,
  Headphones,
  CheckCircle2,
  X,
  Banknote,
  Gift,
  Handshake,
  Clock,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { marketplaceApi } from "@/lib/api";
import { useUIStore } from "@/lib/stores";
import { cn } from "@/lib/utils";
import { ListingFeeQuotaCard } from "@/components/marketplace/ListingFeeQuotaCard";

const CATEGORIES = [
  { value: "", label: "Chọn danh mục" },
  { value: "furniture", label: "Nội thất" },
  { value: "electronics", label: "Điện tử" },
  { value: "appliances", label: "Gia dụng" },
  { value: "clothes", label: "Quần áo" },
  { value: "books", label: "Sách vở" },
  { value: "other", label: "Khác" },
];

const CONDITIONS = [
  { value: "new", label: "Mới" },
  { value: "like_new", label: "Như mới" },
  { value: "good", label: "Tốt" },
  { value: "fair", label: "Khá" },
  { value: "poor", label: "Cũ" },
];

const TIPS = [
  "Chụp ảnh rõ nét, đủ ánh sáng và nhiều góc.",
  "Mô tả chi tiết tình trạng, kích thước và lý do bán.",
  "Đặt giá hợp lý để thu hút người mua nhanh hơn.",
];

const DRAFT_KEY = "unimove-marketplace-listing-draft";

const noSpinner =
  "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

function RequiredMark() {
  return <span className="text-red-500">*</span>;
}

function FormField({
  label,
  required,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="flex items-center gap-1">
        {label}
        {required && <RequiredMark />}
      </Label>
      {children}
      {hint && <p className="text-xs text-[var(--muted)]">{hint}</p>}
    </div>
  );
}

function SettingRow({
  icon: Icon,
  title,
  subtitle,
  checked,
  disabled,
  onCheckedChange,
  accent,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (v: boolean) => void;
  accent?: "emerald" | "blue";
}) {
  const accentClass =
    accent === "emerald"
      ? "bg-emerald-50 text-emerald-600"
      : "bg-[var(--primary-tint)] text-[var(--primary)]";

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-xl px-4 py-3.5 transition-colors",
        disabled && "opacity-50",
        checked && accent === "emerald" && "bg-emerald-50/60",
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            accentClass,
          )}
        >
          <Icon size={16} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{subtitle}</p>
        </div>
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        aria-label={title}
      />
    </div>
  );
}

export default function DangTinPage() {
  const router = useRouter();
  const { showSuccess, showError } = useUIStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    condition: "new",
    area: "",
    price: "",
    usage_duration: "",
  });
  const [isFree, setIsFree] = useState(false);
  const [isNego, setIsNego] = useState(false);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as typeof form & { isFree?: boolean; isNego?: boolean };
      setForm((p) => ({ ...p, ...saved }));
      if (saved.isFree) setIsFree(true);
      if (saved.isNego) setIsNego(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const urls = images.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [images]);

  const onPickImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setImages((prev) => [...prev, ...files].slice(0, 6));
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const saveDraft = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...form, isFree, isNego }));
    showSuccess("Đã lưu nháp trên thiết bị này");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      showError("Nhập tiêu đề tin");
      return;
    }
    if (!form.category) {
      showError("Chọn danh mục");
      return;
    }
    const price = isFree ? 0 : Number(form.price);
    if (!isFree && (!Number.isFinite(price) || price <= 0)) {
      showError("Nhập giá bán hoặc bật «Tặng miễn phí»");
      return;
    }
    setLoading(true);
    try {
      let imageUrls: string[] = [];
      if (images.length) {
        const up = await marketplaceApi.uploadImages(images);
        imageUrls = up.data ?? [];
      }
      const res = await marketplaceApi.create({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        category: form.category,
        condition: form.condition,
        area: form.area.trim() || undefined,
        price,
        images: imageUrls,
        usage_duration: form.usage_duration.trim() || undefined,
        is_negotiable: isNego && !isFree,
      });
      if (!res.success) {
        showError((res as { message?: string }).message || "Đăng tin thất bại");
        return;
      }
      const data = res.data as { id?: string };
      localStorage.removeItem(DRAFT_KEY);
      showSuccess("Đăng tin thành công!");
      router.push(data?.id ? `/cho-sinh-vien/${data.id}` : "/cho-sinh-vien/tin-cua-toi");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  const priceForQuota = isFree ? 0 : form.price.trim() ? Number(form.price) : undefined;

  const emptySlots = Math.max(0, 6 - images.length);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 pb-28 lg:px-8 lg:py-8">
      {/* Page header */}
      <div className="mb-6 flex items-start gap-3">
          <Link
            href="/cho-sinh-vien"
            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50"
            aria-label="Quay lại"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
              Đăng tin mới
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Điền thông tin chi tiết để rao bán mặt hàng của bạn
            </p>
          </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
          {/* Left — form */}
          <Card className="overflow-hidden border-gray-100 shadow-sm">
            <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-[#F8FAFC] to-white pb-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB] shadow-sm">
                  <Info size={18} />
                </span>
                <div>
                  <CardTitle className="text-lg">Thông tin cơ bản</CardTitle>
                  <p className="mt-0.5 text-sm font-normal text-gray-500">
                    Mô tả rõ sản phẩm để thu hút người mua
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 p-5 sm:p-6 lg:p-8">
              <FormField label="Tiêu đề tin đăng" required htmlFor="listing-title">
                <Input
                  id="listing-title"
                  required
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="VD: Bàn học + ghế"
                  startAdornment={<Tag size={16} />}
                />
              </FormField>

              <FormField
                label="Mô tả chi tiết"
                hint="Ghi rõ tình trạng, kích thước, lý do bán để tăng độ tin cậy"
                htmlFor="listing-description"
              >
                <Textarea
                  id="listing-description"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={5}
                  placeholder="Mô tả tình trạng, kích thước, lý do bán..."
                  className="min-h-[132px]"
                />
              </FormField>

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Danh mục" required>
                  <Select value={form.category || undefined} onValueChange={(v) => set("category", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.filter((c) => c.value).map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Tình trạng" required>
                  <Select value={form.condition} onValueChange={(v) => set("condition", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITIONS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>

              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-[#FAFBFC]">
                <div className="border-b border-gray-200 bg-white px-4 py-3 sm:px-5">
                  <p className="text-sm font-bold text-gray-900">Giá & giao dịch</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Đặt giá bán hoặc chọn cho tặng miễn phí
                  </p>
                </div>

                <div className="space-y-4 p-4 sm:p-5">
                  <FormField label="Giá mong muốn" required={!isFree}>
                    <Input
                      type="number"
                      min={0}
                      disabled={isFree}
                      value={isFree ? "" : form.price}
                      onChange={(e) => set("price", e.target.value)}
                      placeholder={isFree ? "Miễn phí — cho tặng" : "VD: 250000"}
                      startAdornment={<Banknote size={16} />}
                      endAdornment={
                        <span className="text-xs font-semibold text-gray-400">VNĐ</span>
                      }
                      className={cn(noSpinner, isFree && "opacity-70")}
                    />
                  </FormField>

                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <SettingRow
                      icon={Gift}
                      title="Tặng miễn phí"
                      subtitle="Cho tặng, không lấy tiền — luôn miễn phí đăng tin"
                      checked={isFree}
                      accent="emerald"
                      onCheckedChange={(v) => {
                        setIsFree(v);
                        if (v) {
                          setIsNego(false);
                          set("price", "");
                        }
                      }}
                    />
                    <Separator />
                    <SettingRow
                      icon={Handshake}
                      title="Có thể thương lượng"
                      subtitle="Cho phép người mua trả giá"
                      checked={isNego}
                      disabled={isFree}
                      accent="blue"
                      onCheckedChange={setIsNego}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Khu vực" htmlFor="listing-area">
                  <Input
                    id="listing-area"
                    value={form.area}
                    onChange={(e) => set("area", e.target.value)}
                    placeholder="Quận/Huyện, Thành phố"
                    startAdornment={<MapPin size={16} />}
                  />
                </FormField>

                <FormField label="Thời gian đã sử dụng" htmlFor="listing-usage">
                  <Input
                    id="listing-usage"
                    value={form.usage_duration}
                    onChange={(e) => set("usage_duration", e.target.value)}
                    placeholder="VD: 1 năm, 6 tháng"
                    startAdornment={<Clock size={16} />}
                  />
                </FormField>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-[#FAFBFC] px-5 py-5 sm:flex-row sm:justify-end sm:px-6 lg:px-8">
              <Button
                type="button"
                variant="outline"
                onClick={saveDraft}
                className="h-11 rounded-xl border-gray-200 px-6 font-semibold"
              >
                Lưu nháp
              </Button>
              <Button
                type="submit"
                loading={loading}
                className="h-11 gap-2 rounded-xl bg-[#2563EB] px-8 font-bold hover:bg-[#1D4ED8]"
              >
                <Send size={16} />
                Đăng tin ngay
              </Button>
            </CardFooter>
          </Card>

          {/* Right — images, tips, support */}
          <div className="space-y-5">
            <ListingFeeQuotaCard price={priceForQuota ?? -1} isGiveaway={isFree} />

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-1 flex items-center gap-2">
                <ImagePlus size={18} className="text-[#2563EB]" />
                <h3 className="text-sm font-bold text-gray-900">Hình ảnh</h3>
              </div>
              <p className="mb-4 text-xs text-gray-500">Tối đa 6 hình ảnh. Định dạng: JPG, PNG.</p>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={images.length >= 6}
                className={cn(
                  "flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed py-8 transition",
                  images.length >= 6
                    ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60"
                    : "border-[#BFDBFE] bg-[#F8FAFC] hover:border-[#2563EB] hover:bg-[#EFF6FF]"
                )}
              >
                <ImagePlus size={28} className="mb-2 text-[#2563EB]" />
                <span className="text-sm font-semibold text-[#2563EB]">Chọn ảnh sản phẩm</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={onPickImages}
              />

              <div className="mt-4 grid grid-cols-3 gap-2">
                {previews.map((src, i) => (
                  <div
                    key={src}
                    className="relative aspect-square overflow-hidden rounded-lg border border-gray-100 bg-gray-50"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/70"
                      aria-label="Xóa ảnh"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {Array.from({ length: emptySlots }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="flex aspect-square items-center justify-center rounded-lg border border-gray-100 bg-gray-50"
                  >
                    <ImagePlus size={18} className="text-gray-300" />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Lightbulb size={18} className="text-amber-500" />
                <h3 className="text-sm font-bold text-gray-900">Mẹo đăng tin hiệu quả</h3>
              </div>
              <ul className="space-y-3">
                {TIPS.map((tip) => (
                  <li key={tip} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#2563EB]" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] p-5 text-white shadow-md">
              <Headphones
                size={72}
                className="pointer-events-none absolute -bottom-2 -right-2 text-white/10"
                strokeWidth={1}
              />
              <p className="text-sm font-bold">Cần hỗ trợ?</p>
              <p className="mt-1 text-xs leading-relaxed text-blue-100">
                Nhân viên hỗ trợ của chúng tôi sẵn sàng giúp bạn đăng tin nhanh chóng.
              </p>
              <Link
                href="/tin-nhan"
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#FACC15] px-5 py-2.5 text-sm font-bold text-gray-900 no-underline transition hover:bg-[#EAB308]"
              >
                Chat ngay
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
