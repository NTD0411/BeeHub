"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Star,
  ClipboardCheck,
  LayoutGrid,
  Clock,
  MapPin,
  BadgeCheck,
  Info,
  Zap,
  EyeOff,
  Flag,
  Loader2,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { marketplaceApi } from "@/lib/api";
import { formatVND, timeAgo, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { getStoredUser } from "@/lib/auth";
import { CONDITION_LABELS, CATEGORY_LABELS, type ListingCondition } from "@/lib/stores/useMarketplaceStore";

interface ListingDetail {
  id: string;
  title: string;
  description: string;
  price?: number;
  category: string;
  condition?: string;
  city?: string;
  area?: string;
  usage_duration?: string;
  is_negotiable?: boolean;
  interest_count?: number;
  status: string;
  images?: string[];
  created_at: string;
  bumped_at?: string | null;
  is_interested?: boolean;
  deal_confirmed?: boolean;
  transport_booked?: boolean;
  confirmed_buyer_id?: string;
  chat_enabled?: boolean;
  deal_status_label?: string | null;
  seller_id: string;
  seller?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    rating?: number;
    total_sales?: number;
  };
}

const CATEGORY_FROM_API: Record<string, string> = {
  furniture: "Nội thất",
  electronics: "Điện tử",
  appliances: "Gia dụng",
  books: "Sách & VPP",
  clothes: "Quần áo",
  other: "Khác",
  kitchen: "Gia dụng",
  "noi-that": "Nội thất",
  "dien-tu": "Điện tử",
  "sach-tai-lieu": "Sách & VPP",
  "quan-ao": "Quần áo",
  "do-bep": "Gia dụng",
  khac: "Khác",
};

const CONDITION_FROM_API: Record<string, string> = {
  new: "Mới",
  like_new: "Như mới",
  good: "Cực tốt",
  fair: "Khá",
  poor: "Cũ",
  moi: "Mới",
  "nhu-moi": "Như mới",
  "con-tot": "Cực tốt",
  "da-dung-nhieu": "Đã dùng nhiều",
};

function categoryLabel(category: string) {
  return CATEGORY_FROM_API[category] ?? CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category;
}

function conditionLabel(condition?: string) {
  if (!condition) return null;
  return (
    CONDITION_FROM_API[condition] ??
    CONDITION_LABELS[condition as ListingCondition] ??
    condition
  );
}

function conditionBadgeClass(condition?: string) {
  switch (condition) {
    case "good":
    case "con-tot":
      return "bg-emerald-500 text-white";
    case "like_new":
    case "nhu-moi":
      return "bg-[#0047FF] text-white";
    case "new":
    case "moi":
      return "bg-sky-500 text-white";
    case "fair":
      return "bg-amber-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
}

function shortListingId(id: string) {
  const compact = id.replace(/-/g, "");
  return compact.slice(-7).toUpperCase() || id.slice(0, 7).toUpperCase();
}

function safeListingImage(url?: string): string | undefined {
  if (!url?.trim()) return undefined;
  const u = url.trim();
  if (/^file:/i.test(u) || /^blob:/i.test(u)) return undefined;
  return u;
}

function bumpHoursRemaining(bumpedAt?: string | null): number {
  if (!bumpedAt) return 0;
  const hoursSince = (Date.now() - new Date(bumpedAt).getTime()) / 3_600_000;
  if (hoursSince >= 24 || Number.isNaN(hoursSince)) return 0;
  return Math.ceil(24 - hoursSince);
}

function canBumpStatus(status: string): boolean {
  return status === "active" || status === "reserved";
}

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5",
        className
      )}
    >
      {children}
    </div>
  );
}

function ListingInfoGrid({ listing }: { listing: ListingDetail }) {
  const area = listing.area ?? listing.city ?? "—";
  const rows: { icon: LucideIcon; label: string; value: string }[] = [
    { icon: ClipboardCheck, label: "Tình trạng", value: conditionLabel(listing.condition) ?? "—" },
    { icon: LayoutGrid, label: "Danh mục", value: categoryLabel(listing.category) },
    { icon: Clock, label: "Đã dùng", value: listing.usage_duration?.trim() || "—" },
    { icon: MapPin, label: "Khu vực", value: area },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-gray-50/50">
      {rows.map((row, i) => (
        <div key={row.label}>
          <div className="flex items-center gap-3 px-3.5 py-2.5 sm:px-4">
            <row.icon size={16} className="shrink-0 text-[#0047FF]" />
            <span className="text-xs text-gray-500">{row.label}</span>
            <span className="ml-auto max-w-[55%] truncate text-right text-xs font-semibold text-gray-900">
              {row.value}
            </span>
          </div>
          {i < rows.length - 1 && <div className="border-t border-gray-100" />}
        </div>
      ))}
    </div>
  );
}

function SellerSidebar({
  listing,
  isOwner,
  sold,
  canConfirmReceived,
  onBump,
  onHide,
  onConfirmReceived,
  bumpLoading,
  bumpHoursLeft,
}: {
  listing: ListingDetail;
  isOwner: boolean;
  sold: boolean;
  canConfirmReceived?: boolean;
  onBump: () => void;
  onHide: () => void;
  onConfirmReceived: () => void;
  bumpLoading?: boolean;
  bumpHoursLeft?: number;
}) {
  const seller = listing.seller;
  if (!seller) return null;

  const sales = seller.total_sales ?? 0;
  const rating = seller.rating != null ? seller.rating.toFixed(1) : "—";
  const bumpBlocked = (bumpHoursLeft ?? 0) > 0;
  const bumpAllowed = canBumpStatus(listing.status) && !bumpBlocked && !sold;

  return (
    <Card className="lg:sticky lg:top-[calc(var(--z-index-topnav,50px)+72px)] lg:p-5">
      <div className="mb-4 flex items-center gap-2">
        <Info size={14} className="text-gray-400" />
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Thông tin người bán
        </p>
      </div>

      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[#0047FF]/10 text-2xl font-extrabold text-[#0047FF]">
            {seller.avatar_url ? (
              <img src={seller.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              seller.full_name[0]?.toUpperCase() ?? "?"
            )}
          </div>
          <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
        </div>

        <div className="mt-3 flex items-center justify-center gap-1.5">
          <p className="text-base font-bold text-gray-900">{seller.full_name}</p>
          <BadgeCheck size={18} className="shrink-0 text-[#0047FF]" />
        </div>
        <p className="mt-1 text-xs text-gray-500">Thành viên UniMove · Đã xác thực</p>
      </div>

      <div className="mt-5 grid grid-cols-3 divide-x divide-gray-100 rounded-xl border border-gray-100 bg-gray-50/80 py-3">
        <div className="px-2 text-center">
          <p className="text-lg font-extrabold text-gray-900">{sales}</p>
          <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">Đã bán</p>
        </div>
        <div className="px-2 text-center">
          <p className="text-lg font-extrabold text-gray-900">{rating}</p>
          <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">Đánh giá</p>
        </div>
        <div className="px-2 text-center">
          <p className="text-lg font-extrabold text-gray-900">{listing.interest_count ?? 0}</p>
          <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">Quan tâm</p>
        </div>
      </div>

      <div className="mt-5 space-y-2.5">
        {isOwner ? (
          <>
            <Link
              href={`/tin-nhan?listingId=${listing.id}`}
              className="relative flex w-full items-center justify-center gap-2 rounded-xl bg-[#0047FF] py-3 text-sm font-bold text-white no-underline transition hover:bg-[#0039CC]"
            >
              <MessageCircle size={16} />
              Quản lý khách quan tâm
              {(listing.interest_count ?? 0) > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {(listing.interest_count ?? 0) > 9 ? "9+" : listing.interest_count}
                </span>
              )}
            </Link>
            {listing.deal_status_label && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 py-2.5 text-center text-xs font-semibold text-amber-900">
                {listing.deal_status_label}
              </p>
            )}
            {listing.deal_confirmed && !listing.deal_status_label && (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-center text-xs font-semibold text-emerald-800">
                {listing.transport_booked ? "Đã chốt & đã đặt xe" : "Đã chốt đơn — chờ khách đặt xe"}
              </p>
            )}
            <button
              type="button"
              onClick={onBump}
              disabled={!bumpAllowed || bumpLoading}
              title={
                bumpBlocked
                  ? `Còn ${bumpHoursLeft} giờ mới đẩy lại được`
                  : !canBumpStatus(listing.status)
                    ? "Chỉ đẩy được tin đang mở hoặc đang giữ"
                    : undefined
              }
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition",
                bumpAllowed && !bumpLoading
                  ? "bg-[#0047FF] text-white hover:bg-[#0039CC]"
                  : "cursor-not-allowed bg-gray-100 text-gray-400"
              )}
            >
              {bumpLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Zap size={16} />
              )}
              {bumpLoading
                ? "Đang đẩy..."
                : bumpBlocked
                  ? `Đẩy lại sau ${bumpHoursLeft}h`
                  : "Đẩy tin ngay"}
            </button>
            <button
              type="button"
              onClick={onHide}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-100"
            >
              <EyeOff size={16} />
              Ẩn tin này
            </button>
          </>
        ) : sold ? (
          <p className="rounded-xl bg-gray-50 py-3 text-center text-sm font-semibold text-gray-500">
            Tin đã bán
          </p>
        ) : (
          <Link
            href={`/tin-nhan?listingId=${listing.id}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0047FF] py-3 text-sm font-bold text-white no-underline transition hover:bg-[#0039CC]"
          >
            <MessageCircle size={16} />
            Nhắn tin hỏi mua
          </Link>
        )}

        {!isOwner && canConfirmReceived && (
          <button
            type="button"
            className="w-full rounded-xl border border-[#0047FF] bg-[#0047FF]/5 py-2.5 text-sm font-semibold text-[#0047FF]"
            onClick={onConfirmReceived}
          >
            Xác nhận đã nhận hàng
          </button>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4 text-[11px] text-gray-400">
        <span>Mã tin: {shortListingId(listing.id)}</span>
        <button type="button" className="inline-flex items-center gap-1 font-medium hover:text-gray-600">
          <Flag size={12} />
          Báo cáo
        </button>
      </div>
    </Card>
  );
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [bumpLoading, setBumpLoading] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const currentUser = getStoredUser();
  const isOwner = currentUser?.id === listing?.seller_id;
  const canConfirmReceived = !!(
    currentUser?.id === listing?.confirmed_buyer_id &&
    listing?.status === "reserved" &&
    listing?.transport_booked &&
    listing?.deal_confirmed
  );

  const loadListing = useCallback(async () => {
    const r = await marketplaceApi.get(id);
    if (r.success && r.data) setListing(r.data as ListingDetail);
    else setListing(null);
  }, [id]);

  useEffect(() => {
    marketplaceApi
      .get(id)
      .then((r) => {
        if (r.success && r.data) setListing(r.data as ListingDetail);
        else setListing(null);
      })
      .catch(() => setListing(null))
      .finally(() => setLoading(false));
  }, [id]);

  const toggleInterest = async () => {
    if (!listing) return;
    try {
      if (listing.is_interested) await marketplaceApi.removeInterest(listing.id);
      else await marketplaceApi.addInterest(listing.id);
      setListing((p) => (p ? { ...p, is_interested: !p.is_interested } : null));
      toast(listing.is_interested ? "Đã bỏ yêu thích" : "Đã thêm yêu thích", "info");
    } catch {
      toast("Thử lại sau", "error");
    }
  };

  const handleBump = async () => {
    if (!listing || bumpLoading) return;
    setBumpLoading(true);
    try {
      const r = await marketplaceApi.bump(listing.id);
      if (r.success) {
        const bumpedAt =
          (r.data as { bumped_at?: string } | undefined)?.bumped_at ??
          new Date().toISOString();
        setListing((prev) => (prev ? { ...prev, bumped_at: bumpedAt } : null));
        toast("Đã đẩy tin lên đầu!", "success");
        void loadListing();
      } else {
        toast(r.message || "Không đẩy được tin", "error");
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Không đẩy được tin. Vui lòng thử lại.";
      toast(msg, "error");
    } finally {
      setBumpLoading(false);
    }
  };

  const handleHide = async () => {
    if (!listing) return;
    try {
      await marketplaceApi.updateStatus(listing.id, "hidden");
      toast("Đã ẩn tin", "info");
    } catch {
      toast("Thử lại", "error");
    }
  };

  const handleConfirmReceived = async () => {
    if (!listing) return;
    if (!confirm("Xác nhận đã nhận đồ? Giao dịch sẽ hoàn tất.")) return;
    try {
      await marketplaceApi.confirmReceived(listing.id);
      toast("Giao dịch hoàn tất!", "success");
      await loadListing();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Thử lại", "error");
    }
  };

  const images = (listing?.images ?? [])
    .map(safeListingImage)
    .filter((u): u is string => !!u);
  const bumpHoursLeft = bumpHoursRemaining(listing?.bumped_at);

  useEffect(() => {
    if (imgIdx >= images.length && images.length > 0) {
      setImgIdx(0);
    }
  }, [images.length, imgIdx]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div className="aspect-[4/3] animate-pulse rounded-2xl bg-gray-200" />
            <div className="h-32 animate-pulse rounded-2xl bg-gray-100" />
            <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />
          </div>
          <div className="h-96 animate-pulse rounded-2xl bg-gray-100" />
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="text-center">
          <p className="font-medium text-gray-900">Không tìm thấy tin đăng</p>
          <Link
            href="/cho-sinh-vien"
            className="mt-4 inline-flex rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 no-underline hover:bg-gray-50"
          >
            Quay lại Chợ SV
          </Link>
        </div>
      </div>
    );
  }

  const sold = listing.status === "sold" || listing.status === "completed" || listing.status === "closed";
  const isFree = !listing.price || listing.price === 0;
  const priceLabel = isFree ? "Miễn phí" : formatVND(listing.price!);
  const condLabel = conditionLabel(listing.condition);
  const location = listing.area ?? listing.city;
  const interestedCount = listing.interest_count ?? 0;
  const descriptionText = listing.description?.trim() || "Người bán chưa thêm mô tả.";
  const hasMultipleImages = images.length > 1;

  const goPrevImage = () => {
    if (!hasMultipleImages) return;
    setImgIdx((i) => (i <= 0 ? images.length - 1 : i - 1));
  };

  const goNextImage = () => {
    if (!hasMultipleImages) return;
    setImgIdx((i) => (i >= images.length - 1 ? 0 : i + 1));
  };

  return (
    <div className="pb-24 lg:pb-10">
      <div className="mx-auto max-w-7xl px-4 py-4 lg:px-8 lg:py-6">
        <Link
          href="/cho-sinh-vien"
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 no-underline hover:text-[#0047FF]"
        >
          <ArrowLeft size={16} />
          Quay lại Chợ SV
        </Link>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
          {/* ── Left column ── */}
          <div className="space-y-4">
            {/* Gallery */}
            <Card className="overflow-hidden p-0">
              <div className="relative aspect-[4/3] bg-gray-100">
                {images[imgIdx] ? (
                  <img
                    src={images[imgIdx]}
                    alt={listing.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-5xl text-gray-300">
                    📦
                  </div>
                )}

                {sold && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <span className="rounded-full bg-black/70 px-6 py-2.5 text-lg font-bold text-white">
                      ĐÃ BÁN
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={toggleInterest}
                  className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md transition hover:scale-105"
                  aria-label={listing.is_interested ? "Bỏ yêu thích" : "Yêu thích"}
                >
                  <Heart
                    size={18}
                    className={cn(
                      listing.is_interested ? "fill-red-500 text-red-500" : "text-gray-500"
                    )}
                  />
                </button>

                {hasMultipleImages && (
                  <>
                    <button
                      type="button"
                      onClick={goPrevImage}
                      className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-gray-800 shadow-md transition hover:bg-white hover:scale-105"
                      aria-label="Ảnh trước"
                    >
                      <ChevronLeft size={22} />
                    </button>
                    <button
                      type="button"
                      onClick={goNextImage}
                      className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-gray-800 shadow-md transition hover:bg-white hover:scale-105"
                      aria-label="Ảnh sau"
                    >
                      <ChevronRight size={22} />
                    </button>
                  </>
                )}

                {hasMultipleImages && (
                  <span className="absolute bottom-3 right-3 rounded-lg bg-black/55 px-2 py-0.5 text-xs font-semibold text-white">
                    {imgIdx + 1}/{images.length}
                  </span>
                )}
              </div>

              {hasMultipleImages && (
                <div className="flex gap-2 overflow-x-auto border-t border-gray-100 p-3">
                  {images.map((src, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setImgIdx(i)}
                      className={cn(
                        "h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition",
                        i === imgIdx ? "border-[#0047FF]" : "border-gray-200 opacity-70 hover:opacity-100"
                      )}
                    >
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Product info */}
            <Card>
              <div className="flex flex-wrap items-center gap-2">
                {condLabel && (
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                      conditionBadgeClass(listing.condition)
                    )}
                  >
                    {condLabel}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                  <Clock size={12} />
                  {timeAgo(listing.created_at)}
                </span>
                {listing.is_negotiable && (
                  <span className="rounded-full bg-[#0047FF]/10 px-2 py-0.5 text-[10px] font-semibold text-[#0047FF]">
                    Thương lượng
                  </span>
                )}
                {listing.deal_status_label && !sold && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                    {listing.deal_status_label}
                  </span>
                )}
                {listing.deal_confirmed && !sold && !listing.deal_status_label && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    Đã chốt đơn
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl font-extrabold leading-snug text-gray-900 sm:text-2xl">
                    {listing.title}
                  </h1>
                  {location && (
                    <p className="mt-2 flex items-start gap-1.5 text-sm text-gray-500">
                      <MapPin size={15} className="mt-0.5 shrink-0 text-gray-400" />
                      <span>{location}</span>
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-400">
                    {interestedCount} người quan tâm
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Giá bán lẻ
                  </p>
                  <p
                    className={cn(
                      "text-2xl font-extrabold sm:text-3xl",
                      isFree ? "text-emerald-600" : "text-[#0047FF]"
                    )}
                  >
                    {priceLabel}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <ListingInfoGrid listing={listing} />
              </div>

              {listing.deal_status_label && (
                <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-900">
                  {listing.deal_status_label}
                </p>
              )}
            </Card>

            {/* Description — full text */}
            <Card>
              <div className="flex items-center gap-2.5">
                <span className="h-5 w-1 rounded-full bg-[#0047FF]" />
                <h2 className="text-base font-bold text-gray-900">Mô tả sản phẩm</h2>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-gray-700">
                {descriptionText.split(/\n\n+/).map((para, i) => (
                  <p key={i} className="whitespace-pre-line">
                    {para}
                  </p>
                ))}
              </div>
            </Card>
          </div>

          {/* ── Right sidebar (desktop) ── */}
          <div className="hidden lg:block">
            <SellerSidebar
              listing={listing}
              isOwner={!!isOwner}
              sold={sold}
              canConfirmReceived={canConfirmReceived}
              onBump={handleBump}
              onHide={handleHide}
              onConfirmReceived={handleConfirmReceived}
              bumpLoading={bumpLoading}
              bumpHoursLeft={bumpHoursLeft}
            />
          </div>
        </div>

        {/* Mobile seller card */}
        <div className="mt-4 lg:hidden">
          <SellerSidebar
            listing={listing}
            isOwner={!!isOwner}
            sold={sold}
            canConfirmReceived={canConfirmReceived}
            onBump={handleBump}
            onHide={handleHide}
            onConfirmReceived={handleConfirmReceived}
            bumpLoading={bumpLoading}
            bumpHoursLeft={bumpHoursLeft}
            />
        </div>
      </div>

      {/* Mobile sticky CTA for buyers */}
      {!isOwner && !sold && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white p-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] lg:hidden"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <Link
            href={`/tin-nhan?listingId=${id}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0047FF] py-3 text-sm font-bold text-white no-underline"
          >
            <MessageCircle size={18} />
            Nhắn tin hỏi mua
          </Link>
        </div>
      )}

      {/* Mobile sticky CTA for owner */}
      {isOwner && !sold && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white p-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] lg:hidden"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <Link
            href={`/tin-nhan?listingId=${id}`}
            className="relative flex w-full items-center justify-center gap-2 rounded-xl bg-[#0047FF] py-3 text-sm font-bold text-white no-underline"
          >
            <MessageCircle size={18} />
            Quản lý khách quan tâm
            {interestedCount > 0 && (
              <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {interestedCount > 9 ? "9+" : interestedCount}
              </span>
            )}
          </Link>
        </div>
      )}

      {/* Sold rating (mobile) */}
      {sold && !isOwner && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white p-4 lg:hidden"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <p className="mb-2 text-center text-sm font-medium text-gray-900">Đánh giá giao dịch</p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={async () => {
                  try {
                    await marketplaceApi.rate(listing.id, n);
                    toast("Cảm ơn đánh giá!", "success");
                  } catch {
                    toast("Thử lại", "error");
                  }
                }}
              >
                <Star size={28} className="text-amber-400 hover:fill-amber-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat FAB */}
      {!isOwner && !sold && (
        <Link
          href={`/tin-nhan?listingId=${id}`}
          className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#0047FF] text-white shadow-lg transition hover:bg-[#0039CC] lg:bottom-8 lg:right-8"
          aria-label="Mở chat"
        >
          <MessageCircle size={22} />
          {interestedCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {interestedCount > 9 ? "9+" : interestedCount}
            </span>
          )}
        </Link>
      )}
    </div>
  );
}
