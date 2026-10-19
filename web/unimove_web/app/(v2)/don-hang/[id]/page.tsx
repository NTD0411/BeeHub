"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Phone, Star, CheckCircle, XCircle, CreditCard,
  AlertTriangle, ShieldCheck, Info, X, ChevronDown, ChevronUp,
  MessageSquare, Check, Truck, Eye, FileText, MapPin, ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "@/components/layout/Container";
import { FadeSlideIn } from "@/components/motion/fade-slide-in";
import { ordersApi, quotesApi, paymentsApi, providersApi, devApi } from "@/lib/api";
import { formatVND, formatDate, cn } from "@/lib/utils";
import { useUIStore } from "@/lib/stores";
import { getStoredUser } from "@/lib/auth";

/* ─── Interfaces (unchanged) ──────────────────────────────────── */
interface OrderDetail {
  id: string; order_number?: string; status: string; service_type: string; quote_request?: boolean;
  pickup_address: string; dropoff_address: string; delivery_address?: string;
  description?: string; pickup_notes?: string;
  dorm_image_urls?: string[];
  estimated_price?: number; final_price?: number; total_price?: number;
  deposit_amount?: number; deposit_paid?: boolean; created_at: string;
  provider_id?: string;
  provider?: { id: string; full_name: string; phone: string; rating: number; vehicle_type?: string; total_reviews?: number };
  provider_name?: string;
  my_review?: { id: string; rating: number; comment?: string };
}

interface Quote {
  id: string; provider_id: string; total_price: number; base_price: number;
  note?: string; provider_name?: string; status: string;
}

interface CancelEstimate {
  cancellable: boolean; status: string;
  deposit_amount: number; fee_percent: number; fee_amount: number; refund_amount: number;
}

interface ProviderReview {
  id: string; rating: number; title?: string; comment?: string;
  tags: string[]; created_at: string;
  customer?: { full_name: string };
}

interface ProviderProfile {
  id: string; full_name: string; business_name?: string; avatar_url?: string;
  rating: number; total_reviews: number; is_verified: boolean;
  vehicle_type?: string; vehicle_plate?: string;
  reviews_summary?: {
    average_rating: number; total_reviews: number;
    rating_5_count: number; rating_4_count: number; rating_3_count: number;
    rating_2_count: number; rating_1_count: number;
    avg_service_quality: number; avg_punctuality: number;
    avg_professionalism: number; avg_value_for_money: number;
  };
  reviews: ProviderReview[];
}

/* ─── Static config ─────────────────────────────────────────────── */
const CANCEL_REASONS = [
  "Tôi đổi lịch chuyển nhà",
  "Tìm được nhà xe khác phù hợp hơn",
  "Báo giá quá cao",
  "Tôi nhập sai địa chỉ",
  "Thay đổi kế hoạch",
  "Khác",
];

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  pending:     { label: "Chờ báo giá",     color: "#D97706", bg: "#FFFBEB" },
  matched:     { label: "Chờ thanh toán",  color: "#2563EB", bg: "#EFF6FF" },
  accepted:    { label: "Đã xác nhận",     color: "#059669", bg: "#ECFDF5" },
  picking_up:  { label: "Đang đến lấy",    color: "#7C3AED", bg: "#F5F3FF" },
  in_progress: { label: "Đang vận chuyển", color: "#7C3AED", bg: "#F5F3FF" },
  completed:   { label: "Hoàn thành",      color: "#059669", bg: "#ECFDF5" },
  cancelled:   { label: "Đã huỷ",          color: "#DC2626", bg: "#FEF2F2" },
};

const V_STEPS = [
  { key: "pending",     label: "Đặt đơn thành công",   sub: "Đang chờ báo giá từ nhà xe",        icon: "📋" },
  { key: "matched",     label: "Đã chọn nhà xe",        sub: "Chờ thanh toán đặt cọc",            icon: "✅" },
  { key: "accepted",    label: "Đặt cọc thành công",    sub: "Nhà xe đã xác nhận chuyến hàng",    icon: "💳" },
  { key: "picking_up",  label: "Nhà xe đang đến lấy",   sub: "Vui lòng chuẩn bị hàng hoá sẵn sàng", icon: "🚚" },
  { key: "in_progress", label: "Đang vận chuyển",       sub: "Hàng hoá đang trên đường đến bạn",   icon: "📦" },
  { key: "completed",   label: "Giao hàng thành công",  sub: "Cảm ơn bạn đã sử dụng UniMove!",    icon: "🎉" },
];

const STATUS_STEP: Record<string, number> = {
  pending: 0, matched: 1, accepted: 2, picking_up: 3, in_progress: 4, completed: 5,
};

function stripPhotoMetaFromNotes(text: string): string {
  return text
    .replace(/Ảnh mô tả:\s*\d+\s*tấm\s*/gi, "")
    .replace(/Ảnh đính kèm:\s*\d+\s*/gi, "")
    .replace(/\n+/g, " · ")
    .replace(/\s*·\s*(·\s*)+/g, " · ")
    .trim()
    .replace(/^(?:\s*·\s*)+|(?:\s*·\s*)+$/g, "");
}

function extractOrderPhotoUrls(order: OrderDetail): string[] {
  return order.dorm_image_urls?.filter(Boolean) ?? [];
}

const GENERIC_PROVIDER_NAMES = new Set(["Nhà xe", "Nhà vận chuyển", "Nhà xe N", "?"]);

function resolveProviderName(order: OrderDetail, selectedQuote?: Quote): string | null {
  const candidates = [
    selectedQuote?.provider_name,
    order.provider_name,
    order.provider?.full_name,
  ].filter((n): n is string => Boolean(n?.trim()));

  return candidates.find((n) => !GENERIC_PROVIDER_NAMES.has(n)) ?? candidates[0] ?? null;
}

function providerProfileHref(providerId: string, orderId: string) {
  return `/nha-xe/${providerId}?return=${encodeURIComponent(`/don-hang/${orderId}`)}`;
}

function orderChatHref(orderId: string, providerName?: string | null) {
  const params = new URLSearchParams({ orderId });
  if (providerName) params.set("with", providerName);
  return `/tin-nhan?${params.toString()}`;
}

function SidebarBlocks({
  order,
  quotes,
  selectedQuote,
  totalPrice,
  hasPrice,
  acting,
  hasProviderLinked,
  canCancel,
  selectQuote,
  openCancelFlow,
}: {
  order: OrderDetail;
  quotes: Quote[];
  selectedQuote: Quote | undefined;
  totalPrice: number;
  hasPrice: boolean;
  acting: boolean;
  hasProviderLinked: boolean;
  canCancel: boolean;
  selectQuote: (id: string) => void;
  openCancelFlow: () => void;
}) {
  const providerName = resolveProviderName(order, selectedQuote);
  const providerId =
    order.provider?.id ?? selectedQuote?.provider_id ?? order.provider_id;
  const providerInitial = (providerName?.[0] ?? "N").toUpperCase();
  const displayPrice = selectedQuote?.total_price ?? totalPrice;
  const profileHref = providerId ? providerProfileHref(providerId, order.id) : null;
  const chatHref = orderChatHref(order.id, providerName);
  const showProviderCard = Boolean(
    providerName &&
      (order.provider || selectedQuote || order.provider_name || hasProviderLinked)
  );

  return (
    <>
      {showProviderCard && (
        <div className="rounded-2xl overflow-hidden bg-[#2563EB] text-white shadow-[0_8px_24px_rgba(37,99,235,0.28)] p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-3">
            Nhà vận chuyển được chọn
          </p>
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 ring-2 ring-white/30 flex items-center justify-center text-lg font-bold shrink-0">
              {providerInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-base truncate">{providerName}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap text-white/85 text-xs">
                {(order.provider?.rating ?? 0) > 0 ? (
                  <span className="flex items-center gap-0.5">
                    <Star size={11} className="text-amber-300 fill-amber-300" />
                    <span className="font-semibold text-white">{order.provider!.rating.toFixed(1)}</span>
                    <span>/5</span>
                  </span>
                ) : (
                  <span className="text-white/70">Nhà xe đối tác</span>
                )}
                {order.provider?.total_reviews ? (
                  <span>
                    ·{" "}
                    {order.provider.total_reviews >= 1000
                      ? `${(order.provider.total_reviews / 1000).toFixed(1)}k`
                      : order.provider.total_reviews}{" "}
                    chuyến
                  </span>
                ) : null}
                {order.provider?.vehicle_type && (
                  <span>· {order.provider.vehicle_type}</span>
                )}
              </div>
              {profileHref ? (
                <Link
                  href={profileHref}
                  className="mt-2.5 inline-block text-xs font-semibold text-white hover:text-white/90 underline underline-offset-2"
                >
                  Xem hồ sơ
                </Link>
              ) : null}
            </div>
            <div className="text-right shrink-0 flex flex-col items-end gap-2">
              {displayPrice > 0 && (
                <p className="text-xl font-extrabold text-white leading-none">
                  {formatVND(displayPrice)}
                </p>
              )}
              {order.provider?.phone && (
                <a href={`tel:${order.provider.phone}`} className="inline-flex" aria-label="Gọi nhà xe">
                  <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors">
                    <Phone size={15} className="text-white" />
                  </div>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {hasPrice && (
        <Card className="border-yellow-200 bg-yellow-50 shadow-sm p-5">
          <p className="text-[11px] font-bold text-yellow-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <CreditCard size={13} /> Thanh toán
          </p>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Chi phí vận chuyển</span>
              <span className="font-bold text-gray-900">{formatVND(totalPrice)}</span>
            </div>
            {order.deposit_amount != null && order.deposit_amount > 0 && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Đặt cọc trước</span>
                  <span className="font-bold text-yellow-800">{formatVND(order.deposit_amount)}</span>
                </div>
                <div className="h-px bg-yellow-200" />
                <div className="flex justify-between items-center gap-3">
                  <span className="text-gray-500 text-xs leading-snug">Thanh toán sau khi hoàn thành</span>
                  <span className="text-base font-extrabold text-[#2563EB] shrink-0">
                    {formatVND(totalPrice - order.deposit_amount)}
                  </span>
                </div>
              </>
            )}
          </div>
          {order.deposit_paid ? (
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-yellow-200">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-2.5 py-1 text-xs font-semibold text-green-700">
                <CheckCircle size={12} /> Đã thanh toán đặt cọc
              </span>
            </div>
          ) : order.deposit_amount ? (
            <p className="text-[11px] text-yellow-700 mt-3 leading-relaxed">
              Khoản đặt cọc được giữ an toàn và hoàn lại nếu nhà xe không đến đúng hẹn.
            </p>
          ) : null}
        </Card>
      )}

      {order.quote_request && quotes.length > 0 && (
        <Card className="border-gray-100 bg-white shadow-sm p-5">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
            Báo giá khác
          </p>
          <div className="space-y-2">
            {quotes.map((q) => {
              const isSelected = q.status === "selected";
              const canChoose = order.status === "pending" && !order.provider;
              return (
                <div
                  key={q.id}
                  className="rounded-xl border px-3 py-2.5 flex items-center gap-2"
                  style={{
                    borderColor: isSelected ? "#2563EB" : "#F3F4F6",
                    backgroundColor: isSelected ? "#EFF6FF" : "#FAFAFA",
                    opacity: !isSelected && order.status !== "pending" ? 0.55 : 1,
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {q.provider_name ?? "Nhà xe"}
                      </p>
                      {isSelected && (
                        <span className="text-[10px] font-bold text-[#2563EB] bg-blue-100 px-1.5 py-0.5 rounded-full">
                          ĐÃ CHỌN
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-[#2563EB]">{formatVND(q.total_price)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Link
                      href={providerProfileHref(q.provider_id, order.id)}
                      className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-[#2563EB] hover:border-blue-200 transition-colors"
                      aria-label="Xem hồ sơ nhà xe"
                    >
                      <Eye size={14} />
                    </Link>
                    {canChoose && !isSelected && (
                      <Button size="sm" className="h-8 px-3 text-xs" loading={acting} onClick={() => selectQuote(q.id)}>
                        Chọn
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {hasProviderLinked && (
          <Link href={chatHref} className="block">
            <Button
              variant="outline"
              className="w-full h-11 rounded-2xl border-[#2563EB] text-[#2563EB] font-semibold bg-white hover:bg-blue-50"
            >
              <MessageSquare size={16} />
              Nhắn tin với nhà xe
            </Button>
          </Link>
        )}
        {canCancel && (
          <button
            type="button"
            onClick={openCancelFlow}
            className="w-full h-10 flex items-center justify-center gap-1.5 text-sm font-medium text-red-400 hover:text-red-500 transition-colors"
          >
            <XCircle size={14} /> Huỷ đơn hàng
          </button>
        )}
        {order.status === "completed" && (
          <Link href={`/don-hang/${order.id}/bao-cao-su-co`} className="block">
            <Button
              variant="outline"
              className="w-full h-11 rounded-2xl font-semibold"
              style={{ backgroundColor: "#FFCC00", borderColor: "#FFCC00", color: "#1a1a1a" }}
            >
              <AlertTriangle size={16} />
              Báo cáo sự cố
            </Button>
          </Link>
        )}
      </div>
    </>
  );
}

/* ─── Page ───────────────────────────────────────────────────────── */
export default function DonHangDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { showSuccess, showError } = useUIStore();

  /* state (unchanged) */
  const [order, setOrder]       = useState<OrderDetail | null>(null);
  const [quotes, setQuotes]     = useState<Quote[]>([]);
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState(false);

  const [cancelStep, setCancelStep]           = useState<0 | 1 | 2>(0);
  const [estimate, setEstimate]               = useState<CancelEstimate | null>(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [selectedReason, setSelectedReason]   = useState("");
  const [customReason, setCustomReason]       = useState("");
  const [cancelling, setCancelling]           = useState(false);

  const [drawerProvider, setDrawerProvider]   = useState<ProviderProfile | null>(null);
  const [loadingProfile, setLoadingProfile]   = useState(false);

  /* UI state for route expand */
  const [showFullRoute, setShowFullRoute] = useState(false);
  const [photoLightbox, setPhotoLightbox] = useState<number | null>(null);

  /* ── functions (ALL unchanged) ── */
  const openProviderDrawer = async (providerId: string) => {
    setLoadingProfile(true);
    setDrawerProvider(null);
    try {
      const res = await providersApi.getById(providerId, { reviews_limit: 5 });
      if (res.success && res.data) setDrawerProvider(res.data as ProviderProfile);
    } finally {
      setLoadingProfile(false);
    }
  };

  const load = async () => {
    const r = await ordersApi.get(id);
    const od = r.success && r.data ? (r.data as OrderDetail) : null;
    if (od) setOrder(od);
    const shouldLoadQuotes =
      od?.quote_request ||
      (od && ["pending", "matched", "accepted", "picking_up", "in_progress", "completed"].includes(od.status));
    if (shouldLoadQuotes) {
      try {
        const q = await quotesApi.list(id);
        const qd = q as { data?: Quote[] | { quotes?: Quote[] }; order?: unknown };
        const list = Array.isArray(qd.data) ? qd.data : qd.data?.quotes ?? [];
        if (list.length > 0) setQuotes(list);
      } catch {
        /* không có báo giá */
      }
    }
  };

  useEffect(() => { load().finally(() => setLoading(false)); }, [id]);

  // Tự động reload mỗi 15 giây khi đơn đang trong trạng thái chờ thay đổi từ provider
  // Dừng khi đã hoàn thành hoặc hủy
  useEffect(() => {
    const TERMINAL = new Set(["completed", "cancelled"]);
    if (order && TERMINAL.has(order.status)) return; // không cần poll nữa

    const interval = setInterval(() => {
      load().catch(() => {/* silent */});
    }, 15_000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, order?.status]);

  const openCancelFlow = async () => {
    setCancelStep(1);
    setLoadingEstimate(true);
    try {
      const res = await ordersApi.getCancelEstimate(id);
      setEstimate(res.data as CancelEstimate);
    } catch { setEstimate(null); }
    finally { setLoadingEstimate(false); }
  };

  const confirmCancel = async () => {
    const reason = selectedReason === "Khác" ? customReason.trim() : selectedReason;
    if (!reason) { showError("Vui lòng chọn lý do hủy"); return; }
    setCancelling(true);
    try {
      await ordersApi.cancel(id, reason);
      showSuccess("Đã hủy đơn hàng");
      setCancelStep(0);
      await load();
    } catch (e) { showError(e instanceof Error ? e.message : "Không thể hủy đơn"); }
    finally { setCancelling(false); }
  };

  const selectQuote = async (quoteId: string) => {
    setActing(true);
    try {
      await quotesApi.select(id, quoteId);
      showSuccess("Đã chọn báo giá");
      await load();
    } catch (e) { showError(e instanceof Error ? e.message : "Không thể chọn báo giá"); }
    finally { setActing(false); }
  };

  const payDeposit = async () => {
    if (!order) return;
    const amount = order.deposit_amount ?? Math.round((order.total_price ?? order.estimated_price ?? 0) * 0.3);
    if (!amount) { showError("Chưa có số tiền cọc"); return; }
    setActing(true);
    try {
      const user = getStoredUser();
      const res = await paymentsApi.createDeposit(order.id, amount, "payos", {
        customer_name: user?.full_name,
        customer_email: user?.email,
      });
      const url = (res.data as { checkout_url?: string })?.checkout_url;
      if (url) window.location.href = url;
      else showError("Không tạo được link thanh toán");
    } catch (e) { showError(e instanceof Error ? e.message : "Thanh toán thất bại"); }
    finally { setActing(false); }
  };

  const devSkipPayment = async () => {
    if (!order) return;
    setActing(true);
    try {
      await devApi.simulatePayment(order.id);
      showSuccess("✅ Giả lập thanh toán thành công");
      await load();
    } catch (e) { showError(e instanceof Error ? e.message : "Lỗi giả lập"); }
    finally { setActing(false); }
  };

  /* ── derived (unchanged logic) ── */
  const canCancel = order && ["pending", "matched", "accepted"].includes(order.status);
  const hasProviderLinked = order && (
    !!order.provider || ["matched", "accepted", "picking_up", "in_progress", "completed"].includes(order.status)
  );
  const depositNeeded = order && order.deposit_amount && !order.deposit_paid &&
    ["matched", "accepted", "pending"].includes(order.status);
  const depositAmount = order?.deposit_amount ??
    Math.round((order?.total_price ?? order?.estimated_price ?? 0) * 0.3);

  /* ── helpers ── */
  const shortAddr = (addr: string) => {
    if (addr.length <= 42) return addr;
    return addr.split(",").slice(0, 2).join(",").trim().slice(0, 40) + "…";
  };
  const totalPrice = order ? (order.final_price ?? order.total_price ?? order.estimated_price ?? 0) : 0;
  const hasPrice = totalPrice > 0;
  const selectedQuote =
    quotes.find((q) => q.status === "selected") ??
    (order?.provider_id ? quotes.find((q) => q.provider_id === order.provider_id) : undefined);
  const statusCfg = order ? (STATUS_CFG[order.status] ?? { label: order.status, color: "#6B7280", bg: "#F9FAFB" }) : null;

  const orderLabel = order
    ? `#${(order.order_number ?? order.id.slice(0, 8)).toUpperCase()}`
    : "";

  const dormPhotos = order ? extractOrderPhotoUrls(order) : [];
  const orderNotesRaw = order?.pickup_notes || order?.description || "";
  const orderNotesText = dormPhotos.length > 0
    ? stripPhotoMetaFromNotes(orderNotesRaw)
    : orderNotesRaw.replace(/\n+/g, " · ").trim();
  const dropoffAddr = order?.dropoff_address || order?.delivery_address || "";

  /* ══════════════════════════════════════════════════════════════ */
  return (
    <div className="bg-gray-50 min-h-screen pb-8">

      {/* ── Loading ── */}
      {loading && (
        <Container className="py-8">
          <Skeleton className="h-10 w-72 mb-6 rounded-xl" />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-4">
              <Skeleton className="h-80 rounded-2xl" />
              <Skeleton className="h-52 rounded-2xl" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-36 rounded-2xl" />
              <Skeleton className="h-44 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
            </div>
          </div>
        </Container>
      )}

      {/* ── Not found ── */}
      {!loading && !order && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <p className="text-4xl">📦</p>
          <p className="text-gray-500 font-medium">Không tìm thấy đơn hàng</p>
          <Link href="/don-hang" className="text-sm text-[#2563EB] font-semibold">← Về danh sách đơn</Link>
        </div>
      )}

      {/* ── Main content ── */}
      {!loading && order && (
        <>
          <Container className={`pt-6 ${depositNeeded ? "pb-36 lg:pb-28" : "pb-8"}`}>
            {/* Page header */}
            <FadeSlideIn>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
                <div className="flex items-start gap-3">
                  <Link
                    href="/don-hang"
                    className="mt-0.5 w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-colors shrink-0"
                  >
                    <ArrowLeft size={18} className="text-gray-700" />
                  </Link>
                  <div>
                    <div className="flex items-center gap-2">
                      <FileText size={18} className="text-[#2563EB] shrink-0" />
                      <h1 className="text-xl lg:text-2xl font-extrabold text-gray-900">
                        Đơn hàng {orderLabel}
                      </h1>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{formatDate(order.created_at)}</p>
                  </div>
                </div>
                {statusCfg && (
                  <span
                    className="inline-flex items-center gap-2 self-start rounded-full px-3.5 py-1.5 text-sm font-bold shrink-0"
                    style={{ color: statusCfg.color, backgroundColor: statusCfg.bg }}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: statusCfg.color }}
                    />
                    {statusCfg.label}
                  </span>
                )}
              </div>
            </FadeSlideIn>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
              {/* ── Left column ── */}
              <div className="space-y-4 min-w-0">
                {/* Stepper */}
                {order.status !== "cancelled" && (
                  <FadeSlideIn delay={60}>
                    <Card className="border-gray-100 bg-white shadow-sm p-5 lg:p-6">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-5">
                        Tiến trình đơn hàng
                      </p>
                      <div>
                        {V_STEPS.map((step, i) => {
                          const currentIdx = STATUS_STEP[order.status] ?? 0;
                          const done = i < currentIdx;
                          const current = i === currentIdx;
                          const isLast = i === V_STEPS.length - 1;
                          return (
                            <div key={step.key} className="flex gap-4">
                              <div className="flex flex-col items-center shrink-0" style={{ width: 32 }}>
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all"
                                  style={
                                    done
                                      ? { backgroundColor: "#2563EB", color: "#fff" }
                                      : current
                                        ? { backgroundColor: "#2563EB", color: "#fff", boxShadow: "0 0 0 4px #EFF6FF" }
                                        : { backgroundColor: "#F9FAFB", color: "#9CA3AF", border: "2px solid #E5E7EB" }
                                  }
                                >
                                  {done ? (
                                    <Check size={16} strokeWidth={3} />
                                  ) : current && (step.key === "in_progress" || step.key === "picking_up") ? (
                                    <Truck size={15} />
                                  ) : (
                                    <span className="text-xs">{step.icon}</span>
                                  )}
                                </div>
                                {!isLast && (
                                  <div
                                    className="w-0.5 my-1.5 rounded-full flex-1"
                                    style={{
                                      minHeight: 20,
                                      backgroundColor: done ? "#2563EB" : "#E5E7EB",
                                      borderLeft: done ? undefined : "1px dashed #D1D5DB",
                                    }}
                                  />
                                )}
                              </div>
                              <div className={`flex-1 ${isLast ? "pb-0" : "pb-4"}`}>
                                <p
                                  className={`text-sm leading-snug ${
                                    done
                                      ? "text-gray-500 font-medium"
                                      : current
                                        ? "text-gray-900 font-bold"
                                        : "text-gray-300 font-medium"
                                  }`}
                                >
                                  {step.label}
                                </p>
                                {(current || done) && (
                                  <p
                                    className={`text-xs mt-0.5 leading-relaxed ${
                                      current ? "text-[#2563EB]" : "text-gray-400"
                                    }`}
                                  >
                                    {step.sub}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  </FadeSlideIn>
                )}

                {/* Cancelled */}
                {order.status === "cancelled" && (
                  <Card className="border-red-100 bg-red-50 p-5 flex gap-3 items-start">
                    <XCircle className="text-red-500 shrink-0 mt-0.5" size={22} />
                    <div>
                      <p className="font-bold text-red-700">Đơn hàng đã bị huỷ</p>
                      <p className="text-sm text-red-500 mt-0.5">
                        Nếu bạn đã đặt cọc, tiền hoàn lại sẽ xử lý trong 1–3 ngày làm việc.
                      </p>
                    </div>
                  </Card>
                )}

                {/* Route */}
                <FadeSlideIn delay={100}>
                  <Card className="border-gray-100 bg-white shadow-sm p-5 lg:p-6">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                      Lộ trình vận chuyển
                    </p>
                    <div className="flex flex-col sm:flex-row gap-5">
                      <div className="flex gap-3 flex-1 min-w-0">
                        <div className="flex flex-col items-center pt-1 shrink-0">
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-[#2563EB] bg-[#EFF6FF]" />
                          <div className="w-px flex-1 bg-gray-200 my-2" style={{ minHeight: 28 }} />
                          <MapPin size={16} className="text-red-500 shrink-0" fill="#FEE2E2" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-4">
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Điểm lấy hàng</p>
                            <p className="text-sm text-gray-800 leading-relaxed">
                              {showFullRoute ? order.pickup_address : shortAddr(order.pickup_address)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Điểm giao hàng</p>
                            <p className="text-sm font-semibold text-gray-900 leading-relaxed">
                              {showFullRoute ? dropoffAddr : shortAddr(dropoffAddr)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="hidden sm:block w-[140px] lg:w-[160px] shrink-0">
                        <div className="relative h-full min-h-[120px] rounded-xl bg-gradient-to-br from-blue-50 to-slate-100 border border-gray-100 overflow-hidden">
                          <svg viewBox="0 0 160 120" className="absolute inset-0 w-full h-full" aria-hidden>
                            <path d="M15 90 Q55 35 95 50 T145 30" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeDasharray="5 4" />
                            <circle cx="15" cy="90" r="4" fill="#2563EB" />
                            <circle cx="145" cy="30" r="4" fill="#EF4444" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    {(order.pickup_address.length > 42 || dropoffAddr.length > 42) && (
                      <button
                        type="button"
                        onClick={() => setShowFullRoute(!showFullRoute)}
                        className="mt-4 flex items-center gap-1 text-xs text-[#2563EB] font-semibold hover:underline"
                      >
                        {showFullRoute ? (
                          <><ChevronUp size={14} /> Thu gọn địa chỉ</>
                        ) : (
                          <><ChevronDown size={14} /> Xem địa chỉ đầy đủ</>
                        )}
                      </button>
                    )}
                    {(orderNotesText || dormPhotos.length > 0) && (
                      <div className="mt-4 space-y-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                        {orderNotesText && (
                          <div className="flex gap-2.5 text-xs text-gray-500 leading-relaxed">
                            <Info size={14} className="shrink-0 mt-0.5 text-gray-400" />
                            <span>{orderNotesText}</span>
                          </div>
                        )}
                        {dormPhotos.length > 0 && (
                          <div className={orderNotesText ? "border-t border-gray-200/80 pt-3" : ""}>
                            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                              <ImageIcon size={13} />
                              Ảnh mô tả ({dormPhotos.length})
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {dormPhotos.map((url, i) => (
                                <button
                                  key={`${url}-${i}`}
                                  type="button"
                                  onClick={() => setPhotoLightbox(i)}
                                  className="group relative h-16 w-16 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:border-[#2563EB] hover:shadow-md sm:h-[72px] sm:w-[72px]"
                                  aria-label={`Xem ảnh ${i + 1}`}
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
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                </FadeSlideIn>

                {/* Mobile-only: payment & provider below route on small screens */}
                <div className="space-y-4 lg:hidden">
                  <SidebarBlocks
                    order={order}
                    quotes={quotes}
                    selectedQuote={selectedQuote}
                    totalPrice={totalPrice}
                    hasPrice={hasPrice}
                    acting={acting}
                    hasProviderLinked={!!hasProviderLinked}
                    canCancel={!!canCancel}
                    selectQuote={selectQuote}
                    openCancelFlow={openCancelFlow}
                  />
                </div>

                {order.status === "completed" && !order.my_review && (
                  <Link href={`/don-hang/${order.id}/danh-gia`} className="block">
                    <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 px-4 py-3 flex items-center justify-between hover:border-amber-300 transition-colors">
                      <div className="flex items-center gap-3">
                        <Star size={20} className="text-amber-600 shrink-0" fill="#d97706" />
                        <div>
                          <p className="text-sm font-bold text-amber-900">Đánh giá chuyến đi</p>
                          <p className="text-xs text-amber-800/80 mt-0.5">Chia sẻ trải nghiệm với nhà xe</p>
                        </div>
                      </div>
                      <span className="text-amber-700 text-lg">→</span>
                    </Card>
                  </Link>
                )}

                {order.status === "completed" && (
                  <Link href="/cho-sinh-vien" className="block">
                    <Card className="border-yellow-200 bg-yellow-50 px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-gray-800">Mua bán trên Chợ sinh viên?</p>
                        <p className="text-xs text-gray-500 mt-0.5">Tìm đồ cũ giá tốt từ sinh viên ĐN</p>
                      </div>
                      <span className="text-2xl">🛍️</span>
                    </Card>
                  </Link>
                )}
              </div>

              {/* ── Right sidebar (desktop) ── */}
              <div className="hidden lg:block space-y-4">
                <SidebarBlocks
                  order={order}
                  quotes={quotes}
                  selectedQuote={selectedQuote}
                  totalPrice={totalPrice}
                  hasPrice={hasPrice}
                  acting={acting}
                  hasProviderLinked={!!hasProviderLinked}
                  canCancel={!!canCancel}
                  selectQuote={selectQuote}
                  openCancelFlow={openCancelFlow}
                />
              </div>
            </div>
          </Container>

          {/* ─ Sticky bottom bar (deposit CTA) ─ */}
          {depositNeeded && (
            <div className="fixed bottom-20 lg:bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.09)]">
              <Container className="py-3 space-y-2">
                <div className="flex items-center gap-4">
                  <div className="shrink-0">
                    <p className="text-[10px] text-gray-400 font-medium leading-none mb-0.5">Đặt cọc</p>
                    <p className="text-xl font-extrabold text-gray-900 leading-none">{formatVND(depositAmount)}</p>
                  </div>
                  <Button
                    className="flex-1 h-12 rounded-2xl text-sm font-bold tracking-wide shadow-md"
                    style={{ backgroundColor: "#2563EB" }}
                    loading={acting}
                    onClick={payDeposit}
                  >
                    Đặt cọc ngay →
                  </Button>
                </div>
                {process.env.NODE_ENV === "development" && (
                  <button
                    type="button"
                    onClick={devSkipPayment}
                    disabled={acting}
                    className="w-full h-8 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors disabled:opacity-50"
                  >
                    🧪 Dev: Bỏ qua PayOS (giả lập thành công)
                  </button>
                )}
              </Container>
            </div>
          )}
          {photoLightbox !== null && dormPhotos.length > 0 && (
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
              onClick={() => setPhotoLightbox(null)}
              role="presentation"
            >
              <button
                type="button"
                onClick={() => setPhotoLightbox(null)}
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={dormPhotos[photoLightbox]}
                alt=""
                className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
              {dormPhotos.length > 1 && (
                <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
                  {dormPhotos.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setPhotoLightbox(i); }}
                      className={cn(
                        "h-2 w-2 rounded-full transition-colors",
                        i === photoLightbox ? "bg-white" : "bg-white/30",
                      )}
                      aria-label={`Ảnh ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ══ Modal bước 1: Chính sách hoàn tiền ══ */}
      {cancelStep === 1 && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="bg-white w-full max-w-lg rounded-t-3xl p-6 pb-8 space-y-4">
            <div className="flex items-center gap-3 mb-1">
              <AlertTriangle size={22} className="text-amber-500 shrink-0" />
              <h2 className="text-lg font-bold">Chính sách hủy đơn</h2>
            </div>
            {loadingEstimate ? (
              <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-8 rounded-xl" />)}</div>
            ) : estimate ? (
              <div className="rounded-2xl border border-gray-100 divide-y divide-gray-100 text-sm">
                <div className="flex justify-between px-4 py-3">
                  <span className="text-gray-500">Số tiền đã cọc</span>
                  <span className="font-semibold">{formatVND(estimate.deposit_amount)}</span>
                </div>
                <div className="flex justify-between px-4 py-3">
                  <span className="text-gray-500">Phí hủy ({estimate.fee_percent}%)</span>
                  <span className="font-semibold text-red-500">- {formatVND(estimate.fee_amount)}</span>
                </div>
                <div className="flex justify-between px-4 py-3 bg-green-50 rounded-b-2xl">
                  <span className="font-bold text-green-700">Hoàn lại</span>
                  <span className="font-bold text-green-700">{formatVND(estimate.refund_amount)}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Không thể tải thông tin hoàn tiền.</p>
            )}
            <div className="text-xs text-gray-400 leading-relaxed">
              Yêu cầu hoàn tiền sẽ được admin xét duyệt trong 1–3 ngày làm việc.{" "}
              <Link href="/chinh-sach-huy-don" className="text-blue-500 underline font-medium">
                Xem chính sách đầy đủ →
              </Link>
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setCancelStep(0)}>Quay lại</Button>
              <Button className="flex-1" onClick={() => setCancelStep(2)}>Tiếp tục</Button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Modal bước 2: Lý do hủy ══ */}
      {cancelStep === 2 && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="bg-white w-full max-w-lg rounded-t-3xl p-6 pb-8 space-y-4">
            <h2 className="text-lg font-bold">Lý do hủy đơn</h2>
            <div className="space-y-2">
              {CANCEL_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedReason(r)}
                  className="w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-colors"
                  style={{
                    borderColor: selectedReason === r ? "#2563EB" : "#E5E7EB",
                    backgroundColor: selectedReason === r ? "#EFF6FF" : "white",
                    color: selectedReason === r ? "#2563EB" : "#374151",
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
            {selectedReason === "Khác" && (
              <textarea
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none"
                rows={3}
                placeholder="Nhập lý do..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
              />
            )}
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setCancelStep(1)}>Quay lại</Button>
              <Button
                variant="destructive" className="flex-1" loading={cancelling}
                disabled={!selectedReason || (selectedReason === "Khác" && !customReason.trim())}
                onClick={confirmCancel}
              >
                Xác nhận hủy
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Drawer: Chi tiết nhà xe ══ */}
      {(loadingProfile || drawerProvider) && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
          onClick={() => setDrawerProvider(null)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-t-3xl overflow-y-auto"
            style={{ maxHeight: "88vh" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {loadingProfile ? (
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 animate-pulse">
                  <div className="w-14 h-14 rounded-full bg-gray-100 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 rounded bg-gray-100" />
                    <div className="h-3 w-24 rounded bg-gray-100" />
                  </div>
                </div>
                {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />)}
              </div>
            ) : drawerProvider && (
              <div className="px-5 pb-8 space-y-5">
                {/* Header */}
                <div className="flex items-center gap-3 pt-2">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0 overflow-hidden" style={{ backgroundColor: "#2563EB" }}>
                    {drawerProvider.avatar_url
                      ? <img src={drawerProvider.avatar_url} className="w-full h-full object-cover" alt="" />
                      : (drawerProvider.full_name?.[0] ?? "?").toUpperCase()
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-bold text-gray-900 text-base">{drawerProvider.business_name || drawerProvider.full_name}</p>
                      {drawerProvider.is_verified && (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">
                          <ShieldCheck size={10} /> Xác minh
                        </span>
                      )}
                    </div>
                    {drawerProvider.vehicle_type && (
                      <p className="text-sm text-gray-500 mt-0.5">
                        {drawerProvider.vehicle_type}{drawerProvider.vehicle_plate ? ` · ${drawerProvider.vehicle_plate}` : ""}
                      </p>
                    )}
                  </div>
                  <button onClick={() => setDrawerProvider(null)} className="p-1.5 rounded-full hover:bg-gray-100 shrink-0">
                    <X size={18} className="text-gray-400" />
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-2xl bg-amber-50 border border-amber-100 p-3 text-center">
                    <div className="flex items-center justify-center gap-0.5 mb-0.5">
                      <Star size={13} className="text-amber-500 fill-amber-500" />
                      <span className="text-lg font-bold text-gray-900">{(drawerProvider.reviews_summary?.average_rating ?? drawerProvider.rating).toFixed(1)}</span>
                    </div>
                    <p className="text-[10px] text-gray-500">Đánh giá</p>
                  </div>
                  <div className="rounded-2xl bg-blue-50 border border-blue-100 p-3 text-center">
                    <span className="text-lg font-bold text-gray-900">{drawerProvider.reviews_summary?.total_reviews ?? drawerProvider.total_reviews}</span>
                    <p className="text-[10px] text-gray-500 mt-0.5">Đơn thành công</p>
                  </div>
                  <div className="rounded-2xl bg-green-50 border border-green-100 p-3 text-center">
                    <span className="text-lg font-bold text-gray-900">
                      {drawerProvider.reviews_summary
                        ? (() => {
                            const s = drawerProvider.reviews_summary;
                            const pos = (s.rating_4_count || 0) + (s.rating_5_count || 0);
                            return Math.round(pos / (s.total_reviews || 1) * 100) + "%";
                          })()
                        : "—"
                      }
                    </span>
                    <p className="text-[10px] text-gray-500 mt-0.5">Hài lòng</p>
                  </div>
                </div>

                {/* Quality scores */}
                {drawerProvider.reviews_summary && (
                  <div className="rounded-2xl border border-gray-100 p-4 space-y-2.5">
                    <p className="text-sm font-bold text-gray-900 mb-3">Chất lượng dịch vụ</p>
                    {[
                      { label: "Chất lượng", value: drawerProvider.reviews_summary.avg_service_quality },
                      { label: "Đúng giờ",   value: drawerProvider.reviews_summary.avg_punctuality },
                      { label: "Thái độ",    value: drawerProvider.reviews_summary.avg_professionalism },
                      { label: "Giá cả",     value: drawerProvider.reviews_summary.avg_value_for_money },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-20 shrink-0">{label}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(value / 5 * 100, 100)}%`, backgroundColor: "#2563EB" }} />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 w-8 text-right">{value > 0 ? value.toFixed(1) : "—"}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Star distribution */}
                {drawerProvider.reviews_summary && drawerProvider.reviews_summary.total_reviews > 0 && (
                  <div className="rounded-2xl border border-gray-100 p-4">
                    <p className="text-sm font-bold text-gray-900 mb-3">Phân bổ sao</p>
                    {[5, 4, 3, 2, 1].map(star => {
                      const s = drawerProvider.reviews_summary!;
                      const count = s[`rating_${star}_count` as keyof typeof s] as number ?? 0;
                      const pct = s.total_reviews > 0 ? count / s.total_reviews * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs text-gray-500 w-4 text-right">{star}</span>
                          <Star size={10} className="text-amber-400 fill-amber-400 shrink-0" />
                          <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] text-gray-400 w-5 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Reviews */}
                {drawerProvider.reviews.length > 0 && (
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-3">Nhận xét gần đây</p>
                    <div className="space-y-3">
                      {drawerProvider.reviews.map(rv => (
                        <div key={rv.id} className="rounded-2xl border border-gray-100 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                                {(rv.customer?.full_name?.[0] ?? "?").toUpperCase()}
                              </div>
                              <span className="text-sm font-semibold text-gray-700">{rv.customer?.full_name ?? "Khách hàng"}</span>
                            </div>
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} size={11} className={i < rv.rating ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"} />
                              ))}
                            </div>
                          </div>
                          {rv.comment && <p className="text-sm text-gray-600 leading-relaxed">{rv.comment}</p>}
                          {rv.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {rv.tags.map(tag => (
                                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">{tag}</span>
                              ))}
                            </div>
                          )}
                          <p className="text-[10px] text-gray-300 mt-2">{formatDate(rv.created_at)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {drawerProvider.reviews.length === 0 && (
                  <div className="text-center py-6 text-sm text-gray-400">Chưa có đánh giá nào</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
