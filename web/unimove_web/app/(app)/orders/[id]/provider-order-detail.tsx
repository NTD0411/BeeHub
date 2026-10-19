"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, MapPin, Phone, CheckCircle, XCircle,
  Truck, Camera, AlertTriangle, Clock, Wallet, Users,
  Image as ImageIcon, Home, X, ArrowRight, Send, MessageSquare,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ordersApi, quotesApi } from "@/lib/api";
import { getOrderStatusLabel, getOrderStatusColor, formatVND, formatDate, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

interface OrderDetail {
  id: string; status: string; quote_request?: boolean; deposit_paid?: boolean;
  pickup_address: string; dropoff_address: string; delivery_address?: string;
  pickup_notes?: string; delivery_notes?: string;
  pickup_floor?: number; delivery_floor?: number;
  pickup_has_elevator?: boolean; delivery_has_elevator?: boolean;
  requires_helpers?: boolean; number_of_helpers?: number;
  vehicle_size?: string;
  description?: string; dorm_image_urls?: string[];
  estimated_price?: number; created_at: string;
  customer?: { id: string; full_name: string; phone: string };
}

interface MyQuote {
  total_price?: number;
  status?: string;
  note?: string;
}

const VEHICLE_LABELS: Record<string, string> = {
  motorbike: "Xe máy", pickup: "Bán tải", van: "Xe van",
  truck_1t: "Xe tải 1 tấn", truck_2t: "Xe tải 2 tấn",
  truck_5t: "Xe tải 5 tấn+", medium_truck: "Xe tải vừa",
  small_truck: "Xe tải nhỏ", large_truck: "Xe tải lớn",
};

/**
 * Strip noise tokens inline (không filter cả chunk), rồi split.
 * Lý do: "Ảnh mô tả: 2 tấm Hẻm: Hẻm hẹp" là 1 chunk → phải strip "Ảnh mô tả: X tấm"
 * trước rồi mới lấy "Hẻm: Hẻm hẹp".
 */
function parseNotes(raw?: string): string[] {
  if (!raw) return [];
  const cleaned = raw
    .replace(/Ảnh mô tả:\s*\d+\s*tấm\s*/gi, "")
    .replace(/Ảnh đính kèm:\s*\d+\s*/gi, "")
    .replace(/Mã báo giá:\s*\S+/gi, "");
  return cleaned
    .split(/\s*·\s*/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

export default function ProviderOrderDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const { toast } = useToast();

  const [order,           setOrder]           = useState<OrderDetail | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [acting,          setActing]          = useState(false);
  const [price,           setPrice]           = useState("");
  const [quoteNote,       setQuoteNote]       = useState("");
  const [myQuote,         setMyQuote]         = useState<MyQuote | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason,    setCancelReason]    = useState("");
  const [lightboxIdx,     setLightboxIdx]     = useState<number | null>(null);

  const load = async () => {
    const r = await ordersApi.get(id);
    if (r.success && r.data) setOrder(r.data as OrderDetail);
  };

  useEffect(() => { load().finally(() => setLoading(false)); }, [id]);

  useEffect(() => {
    if (!order?.quote_request) {
      setMyQuote(null);
      return;
    }
    quotesApi.list(id)
      .then((res) => {
        const quotes = (res.data ?? []) as MyQuote[];
        setMyQuote(quotes.length > 0 ? quotes[0] : null);
      })
      .catch(() => setMyQuote(null));
  }, [id, order?.quote_request]);

  /* ── Actions ── */
  const submitQuote = async () => {
    const base = parseInt(price.replace(/\D/g, ""), 10);
    if (!base || base <= 0) { toast("Nhập giá báo hợp lệ", "error"); return; }
    setActing(true);
    try {
      await quotesApi.submit(id, { base_price: base, schedule_fit: "exact_match", note: quoteNote || undefined });
      toast("Đã gửi báo giá — chờ khách chốt", "success");
      router.push("/orders?tab=quoted");
    } catch (e) { toast(e instanceof Error ? e.message : "Gửi báo giá thất bại", "error"); }
    finally { setActing(false); }
  };

  const respond = async (action: "accept" | "reject") => {
    setActing(true);
    try {
      await ordersApi.respond(id, action);
      toast(action === "accept" ? "Đã nhận đơn" : "Đã bỏ qua đơn", action === "accept" ? "success" : "info");
      if (action === "reject") router.push("/orders");
      else await load();
    } catch (e) { toast(e instanceof Error ? e.message : "Thử lại sau", "error"); }
    finally { setActing(false); }
  };

  const lifecycle = async (action: "accept" | "start" | "complete") => {
    setActing(true);
    try {
      if (action === "accept") await ordersApi.accept(id);
      else if (action === "start") await ordersApi.start(id);
      else await ordersApi.complete(id);
      toast("Cập nhật trạng thái thành công", "success");
      await load();
    } catch (e) { toast(e instanceof Error ? e.message : "Lỗi", "error"); }
    finally { setActing(false); }
  };

  const cancelOrder = async () => {
    if (!cancelReason.trim()) { toast("Vui lòng nhập lý do hủy", "error"); return; }
    setActing(true);
    try {
      await ordersApi.cancel(id, cancelReason.trim());
      toast("Đã hủy đơn. Điểm tuân thủ bị trừ.", "info");
      setShowCancelModal(false);
      router.push("/orders");
    } catch (e) { toast(e instanceof Error ? e.message : "Thử lại sau", "error"); }
    finally { setActing(false); }
  };

  const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setActing(true);
    try {
      await ordersApi.uploadDeliveryPhoto(id, file);
      toast("Đã tải ảnh giao hàng", "success");
    } catch { toast("Upload thất bại", "error"); }
    finally { setActing(false); }
  };

  const images        = order?.dorm_image_urls ?? [];
  const pickupNotes   = parseNotes(order?.pickup_notes);
  const deliveryNotes = parseNotes(order?.delivery_notes);
  const deliveryAddr  = order?.delivery_address || order?.dropoff_address;
  const vehicleLabel  = order?.vehicle_size
    ? (VEHICLE_LABELS[order.vehicle_size] ?? order.vehicle_size)
    : null;
  const sc           = order ? getOrderStatusColor(order.status) : "#9CA3AF";
  const shortId      = order?.id.slice(0, 8).toUpperCase();

  /* ── Layout ── */
  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Page header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="h-10 w-10 shrink-0 rounded-xl border-gray-200"
            aria-label="Quay lại"
          >
            <ArrowLeft size={18} />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                Chi tiết đơn hàng
              </h1>
              {order && (
                <Badge variant="secondary" className="font-mono text-[11px]">
                  #{shortId}
                </Badge>
              )}
            </div>
            {order && (
              <p className="mt-1 text-sm text-gray-500">
                Tạo lúc {formatDate(order.created_at)}
              </p>
            )}
          </div>
        </div>
        {order && (
          <Badge
            className="w-fit gap-2 px-3 py-1.5 text-sm"
            style={{ backgroundColor: `${sc}18`, color: sc, border: `1px solid ${sc}33` }}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: sc }} />
            {getOrderStatusLabel(order.status)}
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
        </div>
      ) : !order ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <XCircle size={48} className="mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">Không tìm thấy đơn hàng</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/orders")}>
              Về danh sách đơn
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          {/* ── Main column ── */}
          <div className="space-y-5">
            {/* Route */}
            <Card className="overflow-hidden border-gray-100 shadow-sm">
              <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-[#F8FAFC] to-white pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin size={18} className="text-[#1A56DB]" />
                  Lộ trình
                </CardTitle>
                <CardDescription>Vị trí lấy và giao hàng</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <RoutePoint
                  type="pickup"
                  label="Điểm lấy đồ"
                  address={order.pickup_address}
                  badges={[
                    order.pickup_floor ? `Tầng ${order.pickup_floor}` : null,
                    order.pickup_has_elevator === true ? "Có thang máy" : null,
                    order.pickup_has_elevator === false ? "Không thang máy" : null,
                    ...pickupNotes,
                  ].filter(Boolean) as string[]}
                />
                <div className="flex items-center gap-3 bg-gray-50/80 px-6 py-2.5">
                  <Separator className="flex-1" />
                  <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                    <ArrowRight size={12} /> Chuyển đến
                  </span>
                  <Separator className="flex-1" />
                </div>
                <RoutePoint
                  type="delivery"
                  label="Điểm giao đồ"
                  address={deliveryAddr}
                  badges={[
                    order.delivery_floor ? `Tầng ${order.delivery_floor}` : null,
                    order.delivery_has_elevator === true ? "Có thang máy" : null,
                    order.delivery_has_elevator === false ? "Không thang máy" : null,
                    ...deliveryNotes,
                  ].filter(Boolean) as string[]}
                />
                {(order.requires_helpers || vehicleLabel) && (
                  <>
                    <Separator />
                    <div className="flex flex-wrap gap-2 px-6 py-4">
                      {order.requires_helpers && (
                        <Badge variant="outline" className="gap-1.5 border-violet-200 bg-violet-50 text-violet-700">
                          <Users size={12} />
                          {order.number_of_helpers ? `${order.number_of_helpers} nhân công` : "Cần nhân công"}
                        </Badge>
                      )}
                      {vehicleLabel && (
                        <Badge variant="outline" className="gap-1.5">
                          <Truck size={12} />
                          {vehicleLabel}
                        </Badge>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Images */}
            {images.length > 0 && (
              <Card className="border-gray-100 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ImageIcon size={18} className="text-gray-400" />
                    Ảnh đồ đạc
                    <Badge variant="secondary" className="ml-1 font-normal">
                      {images.length} tấm
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                    {images.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setLightboxIdx(i)}
                        className="group aspect-square overflow-hidden rounded-xl border border-gray-100 bg-gray-50 transition hover:border-blue-300 hover:shadow-md"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status alerts — mobile only (duplicate in sidebar on desktop) */}
            <div className="space-y-4 lg:hidden">
              <StatusAlerts order={order} myQuote={myQuote} />
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-4 lg:sticky lg:top-6">
            {/* Customer */}
            {order.customer && (
              <Card className="border-gray-100 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Khách hàng</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11">
                      <AvatarFallback className="bg-[#EFF6FF] text-base text-[#1A56DB]">
                        {order.customer.full_name?.[0]?.toUpperCase() ?? "K"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">{order.customer.full_name}</p>
                      <p className="text-sm text-gray-500">{order.customer.phone}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5" asChild>
                      <a href={`tel:${order.customer.phone}`}>
                        <Phone size={14} /> Gọi
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5" asChild>
                      <Link href={`/tai-xe/tin-nhan?orderId=${order.id}`}>
                        <MessageSquare size={14} /> Chat
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Price */}
            {order.estimated_price != null && order.estimated_price > 0 && (
              <Card className="border-gray-100 shadow-sm">
                <CardContent className="flex items-center justify-between py-4">
                  <span className="text-sm text-gray-500">Giá báo / ước tính</span>
                  <span className="text-lg font-bold text-[#1A56DB]">
                    {formatVND(order.estimated_price)}
                  </span>
                </CardContent>
              </Card>
            )}

            {/* Alerts desktop */}
            <div className="hidden space-y-4 lg:block">
              <StatusAlerts order={order} myQuote={myQuote} />
            </div>

            {/* Actions */}
            <Card className="border-gray-100 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Thao tác</CardTitle>
                <CardDescription>Cập nhật tiến trình đơn hàng</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <OrderActions
                  order={order}
                  myQuote={myQuote}
                  acting={acting}
                  price={price}
                  quoteNote={quoteNote}
                  onPriceChange={setPrice}
                  onQuoteNoteChange={setQuoteNote}
                  onSubmitQuote={submitQuote}
                  onRespond={respond}
                  onLifecycle={lifecycle}
                  onUploadPhoto={uploadPhoto}
                  onCancel={() => setShowCancelModal(true)}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Cancel dialog */}
      <Dialog open={showCancelModal} onOpenChange={(open) => {
        setShowCancelModal(open);
        if (!open) setCancelReason("");
      }}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={20} />
              Hủy đơn hàng?
            </DialogTitle>
            <DialogDescription>
              Điểm tuân thủ sẽ bị trừ 2 điểm. Vui lòng ghi rõ lý do hủy.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Lý do hủy đơn (bắt buộc)..."
            rows={3}
            className="min-h-[96px] resize-none"
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setShowCancelModal(false); setCancelReason(""); }}>
              Quay lại
            </Button>
            <Button variant="destructive" loading={acting} onClick={cancelOrder}>
              Xác nhận hủy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      {lightboxIdx !== null && images.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxIdx(null)}
          role="presentation"
        >
          <button
            type="button"
            onClick={() => setLightboxIdx(null)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X size={18} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[lightboxIdx]}
            alt=""
            className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setLightboxIdx(i); }}
                  className={cn(
                    "h-2 w-2 rounded-full transition-colors",
                    i === lightboxIdx ? "bg-white" : "bg-white/30",
                  )}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RoutePoint({
  type,
  label,
  address,
  badges,
}: {
  type: "pickup" | "delivery";
  label: string;
  address?: string;
  badges: string[];
}) {
  const isPickup = type === "pickup";
  return (
    <div className={cn("px-6 py-5", isPickup ? "bg-blue-50/40" : "bg-amber-50/40")}>
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            isPickup ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600",
          )}
        >
          {isPickup ? <MapPin size={18} /> : <Home size={18} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn("text-[11px] font-bold uppercase tracking-wider", isPickup ? "text-blue-500" : "text-amber-600")}>
            {label}
          </p>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-gray-900">{address || "—"}</p>
          {badges.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {badges.map((b) => (
                <Badge
                  key={b}
                  variant="outline"
                  className={cn(
                    "font-normal",
                    isPickup ? "border-blue-200 bg-blue-50/80 text-blue-700" : "border-amber-200 bg-amber-50/80 text-amber-800",
                  )}
                >
                  {b}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusAlerts({ order, myQuote }: { order: OrderDetail; myQuote: MyQuote | null }) {
  if (order.status === "pending" && order.quote_request && myQuote) {
    return (
      <Card className="border-green-200 bg-green-50/50 shadow-sm">
        <CardContent className="py-4">
          <p className="font-semibold text-gray-900">Báo giá đã gửi</p>
          <p className="mt-1 text-sm text-gray-600">
            {formatVND(Math.round(Number(myQuote.total_price ?? 0)))} · Chờ khách chốt.
          </p>
          <Link href="/orders?tab=quoted" className="mt-2 inline-flex text-xs font-semibold text-[#1A56DB] hover:underline">
            Xem tab «Đã báo giá» →
          </Link>
        </CardContent>
      </Card>
    );
  }
  if (order.status === "matched" && !order.deposit_paid) {
    return (
      <Card className="border-amber-200 bg-amber-50/50 shadow-sm">
        <CardContent className="flex gap-3 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <Clock size={18} className="text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Khách đã chọn báo giá</p>
            <p className="mt-0.5 text-sm text-amber-700">Đang chờ khách thanh toán đặt cọc…</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  if (order.status === "matched" && order.deposit_paid) {
    return (
      <Card className="border-green-200 bg-green-50/50 shadow-sm">
        <CardContent className="flex gap-3 py-4">
          <Wallet size={18} className="mt-0.5 shrink-0 text-green-600" />
          <div>
            <p className="font-semibold text-green-800">Đặt cọc thành công</p>
            <p className="text-xs text-green-600">Trang sẽ tự cập nhật trong giây lát…</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  if ((order.status === "scheduled" || order.status === "accepted") && order.deposit_paid) {
    return (
      <Card className="border-blue-200 bg-blue-50/50 shadow-sm">
        <CardContent className="flex gap-3 py-4">
          <Wallet size={18} className="mt-0.5 shrink-0 text-blue-600" />
          <div>
            <p className="font-semibold text-blue-800">Khách đã đặt cọc thành công</p>
            <p className="text-xs text-blue-600">
              {order.status === "scheduled"
                ? "Đơn đã được xếp lịch. Hãy chuẩn bị đến lấy hàng đúng giờ hẹn."
                : "Đơn đã xác nhận. Hãy đến lấy hàng sớm."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  return null;
}

function OrderActions({
  order,
  myQuote,
  acting,
  price,
  quoteNote,
  onPriceChange,
  onQuoteNoteChange,
  onSubmitQuote,
  onRespond,
  onLifecycle,
  onUploadPhoto,
  onCancel,
}: {
  order: OrderDetail;
  myQuote: MyQuote | null;
  acting: boolean;
  price: string;
  quoteNote: string;
  onPriceChange: (v: string) => void;
  onQuoteNoteChange: (v: string) => void;
  onSubmitQuote: () => void;
  onRespond: (action: "accept" | "reject") => void;
  onLifecycle: (action: "accept" | "start" | "complete") => void;
  onUploadPhoto: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCancel: () => void;
}) {
  /** Nút chat nhỏ gọn dùng chung */
  const chatBtn = (
    <Button variant="ghost" size="sm" className="w-full gap-2 text-gray-500 hover:text-gray-700" asChild>
      <Link href={`/tai-xe/tin-nhan?orderId=${order.id}`}>
        <MessageSquare size={14} /> Chat với khách
      </Link>
    </Button>
  );

  /** Nút hủy dạng text link — ít nổi hơn, tránh trigger nhầm */
  const cancelBtn = (
    <button
      type="button"
      onClick={onCancel}
      className="mt-1 w-full text-center text-xs text-gray-400 underline-offset-2 hover:text-red-500 hover:underline transition-colors"
    >
      Hủy đơn
    </button>
  );

  /* ── Báo giá theo yêu cầu ── */
  if (order.status === "pending" && order.quote_request && !myQuote) {
    const parsed = parseInt(price, 10);
    return (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="quote-price" className="text-xs font-medium text-gray-600">Giá báo (VNĐ)</Label>
          <Input
            id="quote-price"
            inputMode="numeric"
            placeholder="VD: 1500000"
            value={price}
            onChange={(e) => onPriceChange(e.target.value.replace(/\D/g, ""))}
            endAdornment={<span className="text-xs font-semibold text-gray-400">₫</span>}
          />
          {parsed > 0 && (
            <p className="text-xs font-semibold text-[#1A56DB]">= {formatVND(parsed)}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="quote-note" className="text-xs font-medium text-gray-600">Ghi chú (tuỳ chọn)</Label>
          <Input
            id="quote-note"
            placeholder="VD: 2 người khuân, xe 1 tấn..."
            value={quoteNote}
            onChange={(e) => onQuoteNoteChange(e.target.value)}
          />
        </div>
        <Button className="w-full gap-2" loading={acting} onClick={onSubmitQuote}>
          <Send size={15} /> Gửi báo giá
        </Button>
      </div>
    );
  }

  /* ── Nhận / bỏ qua đơn thường ── */
  if (order.status === "pending" && !order.quote_request) {
    return (
      <div className="space-y-2">
        <Button size="sm" className="w-full gap-2" loading={acting} onClick={() => onRespond("accept")}>
          <CheckCircle size={15} /> Nhận đơn này
        </Button>
        <Button variant="ghost" size="sm" className="w-full gap-1.5 text-gray-400 hover:text-gray-600" loading={acting} onClick={() => onRespond("reject")}>
          Bỏ qua
        </Button>
      </div>
    );
  }

  /* ── Scheduled: chờ đến ngày, xác nhận khi sẵn sàng ── */
  if (order.status === "scheduled") {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-center">
          <p className="text-xs font-medium text-blue-700">Đơn đặt trước · Khách đã cọc</p>
          <p className="mt-0.5 text-[11px] text-blue-500">Nhấn khi bạn chuẩn bị xuất phát</p>
        </div>
        <Button
          className="w-full gap-2 rounded-xl bg-[#1A56DB] py-5 text-sm font-semibold hover:bg-[#1647c0]"
          loading={acting}
          onClick={() => onLifecycle("start")}
        >
          <Truck size={16} /> Bắt đầu chuyến
        </Button>
        <div className="flex items-center gap-2">
          <Separator className="flex-1" />
          <span className="text-[10px] text-gray-300">hoặc</span>
          <Separator className="flex-1" />
        </div>
        {chatBtn}
        {cancelBtn}
      </div>
    );
  }

  /* ── Accepted: đang chuẩn bị đến lấy ── */
  if (order.status === "accepted") {
    return (
      <div className="space-y-3">
        <Button
          className="w-full gap-2 rounded-xl bg-violet-600 py-5 text-sm font-semibold hover:bg-violet-700"
          loading={acting}
          onClick={() => onLifecycle("start")}
        >
          <Truck size={16} /> Đang đến lấy hàng
        </Button>
        <div className="flex items-center gap-2">
          <Separator className="flex-1" />
          <span className="text-[10px] text-gray-300">hoặc</span>
          <Separator className="flex-1" />
        </div>
        {chatBtn}
        {cancelBtn}
      </div>
    );
  }

  /* ── Picking up: đã đến nơi, bắt đầu vận chuyển ── */
  if (order.status === "picking_up") {
    return (
      <div className="space-y-3">
        <Button
          className="w-full gap-2 rounded-xl bg-violet-600 py-5 text-sm font-semibold hover:bg-violet-700"
          loading={acting}
          onClick={() => onLifecycle("start")}
        >
          <Truck size={16} /> Bắt đầu vận chuyển
        </Button>
        <div className="flex items-center gap-2">
          <Separator className="flex-1" />
          <span className="text-[10px] text-gray-300">hoặc</span>
          <Separator className="flex-1" />
        </div>
        {chatBtn}
        {cancelBtn}
      </div>
    );
  }

  /* ── In progress: hoàn thành + upload ảnh ── */
  if (order.status === "in_progress") {
    return (
      <div className="space-y-3">
        <input type="file" accept="image/*" id="delivery-photo" className="hidden" onChange={onUploadPhoto} />
        <Button
          className="w-full gap-2 rounded-xl bg-emerald-600 py-5 text-sm font-semibold hover:bg-emerald-700"
          loading={acting}
          onClick={() => onLifecycle("complete")}
        >
          <CheckCircle size={16} /> Hoàn thành đơn
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 rounded-xl border-dashed"
          onClick={() => document.getElementById("delivery-photo")?.click()}
        >
          <Camera size={14} /> Chụp ảnh giao hàng
        </Button>
        <div className="flex items-center gap-2">
          <Separator className="flex-1" />
          <span className="text-[10px] text-gray-300">hoặc</span>
          <Separator className="flex-1" />
        </div>
        {chatBtn}
        {cancelBtn}
      </div>
    );
  }

  /* ── Đã gửi báo giá, chờ khách ── */
  if (order.status === "pending" && order.quote_request && myQuote) {
    return (
      <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-center">
        <p className="text-xs font-medium text-amber-700">Đã gửi báo giá</p>
        <p className="mt-0.5 text-[11px] text-amber-500">Đang chờ khách xác nhận…</p>
      </div>
    );
  }

  return (
    <p className="text-sm text-gray-400">Không có thao tác khả dụng.</p>
  );
}
