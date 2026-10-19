import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderById } from "@/lib/admin/queries/orders";
import { flattenOrderProvider } from "@/lib/admin/normalize-order-relations";
import { PageHeader } from "@/components/admin-dashboard/page-header";
import { StatusBadge } from "@/components/admin-dashboard/status-badge";
import { formatVND, formatDateTime, formatDate, formatOrderNumber } from "@/lib/admin/formatters";
import type { OrderStatus, Payment, Profile, Order } from "@/lib/admin/types";
import {
  ArrowLeft,
  MapPin,
  User,
  Truck,
  CreditCard,
  Clock,
  Building2,
  Phone,
  Mail,
  Star,
  Package,
  Home,
  Navigation,
} from "lucide-react";
import { OrderDetailActions } from "./order-detail-actions";

// ─── Types ───────────────────────────────────────────────────────────────────

type StatusHistoryEntry = {
  id: string;
  order_id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  changed_by: string | null;
  notes: string | null;
  created_at: string;
  changer?: { id: string; full_name: string; role: string } | null;
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: "var(--primary-tint)" }}
        >
          <Icon className="w-4 h-4" style={{ color: "var(--primary)" }} />
        </div>
        <h2 className="font-semibold text-sm" style={{ color: "var(--text)" }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

function DataRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
      <span className="text-sm shrink-0" style={{ color: "var(--muted)" }}>
        {label}
      </span>
      <span
        className={`text-sm font-medium text-right ${mono ? "font-mono" : ""}`}
        style={{ color: "var(--text)" }}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}

// ─── Service type and vehicle size labels ────────────────────────────────────

const SERVICE_TYPE_LABELS: Record<string, string> = {
  standard: "Tiêu chuẩn",
  express: "Nhanh",
  premium: "Cao cấp",
};

const VEHICLE_SIZE_LABELS: Record<string, string> = {
  motorbike: "Xe máy",
  small_truck: "Xe tải nhỏ",
  medium_truck: "Xe tải vừa",
  large_truck: "Xe tải lớn",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  payos: "PayOS",
  cash: "Tiền mặt",
  bank_transfer: "Chuyển khoản",
  wallet: "Ví điện tử",
  credit_card: "Thẻ tín dụng",
  debit_card: "Thẻ ghi nợ",
  momo: "MoMo",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Quản trị viên",
  customer: "Khách hàng",
  provider: "Nhà vận chuyển",
};

// ─── Order detail content ────────────────────────────────────────────────────

type OrderFull = Order & {
  customer: Profile;
  provider: Profile | null;
  pickup_floor: string | null;
  pickup_contact_name: string | null;
  pickup_contact_phone: string | null;
  delivery_floor: string | null;
  delivery_contact_name: string | null;
  delivery_contact_phone: string | null;
  service_fee: number | null;
  notes: string | null;
};

async function OrderDetailContent({ id }: { id: string }) {
  const { order, history, payments, error } = await getOrderById(id);

  if (error || !order) {
    notFound();
  }

  const o = order as OrderFull;
  const provider = flattenOrderProvider(o.provider);
  const canCancel: boolean = !["completed", "cancelled"].includes(o.status);

  return (
    <div className="space-y-6">
      {/* Top grid: Order info + Customer info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order info */}
        <SectionCard title="Thông tin đơn hàng" icon={Package}>
          <DataRow label="Mã đơn hàng" value={
            <span className="font-mono text-xs font-bold" style={{ color: "var(--primary)" }}>
              {formatOrderNumber(o.order_number)}
            </span>
          } />
          <DataRow label="Trạng thái" value={<StatusBadge type="order" status={o.status} />} />
          <DataRow label="Loại dịch vụ" value={SERVICE_TYPE_LABELS[o.service_type] ?? o.service_type} />
          <DataRow label="Loại xe" value={VEHICLE_SIZE_LABELS[o.vehicle_size] ?? o.vehicle_size} />
          <DataRow label="Ngày tạo" value={formatDateTime(o.created_at)} />
          {o.completed_at && (
            <DataRow label="Hoàn thành lúc" value={formatDateTime(o.completed_at)} />
          )}
          {o.cancelled_at && (
            <DataRow label="Hủy lúc" value={formatDateTime(o.cancelled_at)} />
          )}
          {o.cancellation_reason && (
            <DataRow label="Lý do hủy" value={o.cancellation_reason} />
          )}
          <div className="mt-3 pt-3 space-y-1" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: "var(--muted)" }}>Giá cơ bản</span>
              <span className="text-sm" style={{ color: "var(--text)" }}>{formatVND(o.base_price)}</span>
            </div>
            {o.service_fee != null && (
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: "var(--muted)" }}>Phí dịch vụ</span>
                <span className="text-sm" style={{ color: "var(--text)" }}>{formatVND(o.service_fee)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-1 border-t" style={{ borderColor: "var(--border)" }}>
              <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>Tổng cộng</span>
              <span className="text-base font-bold" style={{ color: "var(--primary)" }}>{formatVND(o.total_price)}</span>
            </div>
          </div>
        </SectionCard>

        {/* Customer info */}
        <SectionCard title="Thông tin khách hàng" icon={User}>
          {o.customer ? (
            <div>
              <div className="flex items-center gap-3 mb-4">
                {o.customer.avatar_url ? (
                  <img
                    src={o.customer.avatar_url}
                    alt={o.customer.full_name}
                    className="w-12 h-12 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
                    style={{ backgroundColor: "var(--primary-tint)", color: "var(--primary)" }}
                  >
                    {o.customer?.full_name ? o.customer.full_name.charAt(0).toUpperCase() : "?"}
                  </div>
                )}
                <div>
                  <p className="font-semibold" style={{ color: "var(--text)" }}>{o.customer.full_name}</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>Khách hàng</p>
                </div>
              </div>
              <DataRow
                label="Email"
                value={
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    {o.customer.email}
                  </span>
                }
              />
              <DataRow
                label="Điện thoại"
                value={
                  o.customer.phone ? (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      {o.customer.phone}
                    </span>
                  ) : "—"
                }
              />
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--muted)" }}>Không có thông tin khách hàng.</p>
          )}
        </SectionCard>
      </div>

      {/* Route section */}
      <SectionCard title="Tuyến đường vận chuyển" icon={Navigation}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pickup */}
          <div
            className="rounded-xl p-4 space-y-2"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                Điểm lấy hàng
              </span>
            </div>
            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{o.pickup_address}</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {o.pickup_district}, {o.pickup_city}
            </p>
            {(o as any).pickup_floor && (
              <p className="text-xs flex items-center gap-1" style={{ color: "var(--muted)" }}>
                <Home className="w-3 h-3" />
                Tầng: {(o as any).pickup_floor}
              </p>
            )}
            {(o as any).pickup_contact_name && (
              <p className="text-xs flex items-center gap-1" style={{ color: "var(--muted)" }}>
                <User className="w-3 h-3" />
                {(o as any).pickup_contact_name}
              </p>
            )}
            {(o as any).pickup_contact_phone && (
              <p className="text-xs flex items-center gap-1" style={{ color: "var(--muted)" }}>
                <Phone className="w-3 h-3" />
                {(o as any).pickup_contact_phone}
              </p>
            )}
          </div>

          {/* Delivery */}
          <div
            className="rounded-xl p-4 space-y-2"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                Điểm giao hàng
              </span>
            </div>
            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{o.delivery_address}</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {o.delivery_district}, {o.delivery_city}
            </p>
            {(o as any).delivery_floor && (
              <p className="text-xs flex items-center gap-1" style={{ color: "var(--muted)" }}>
                <Home className="w-3 h-3" />
                Tầng: {(o as any).delivery_floor}
              </p>
            )}
            {(o as any).delivery_contact_name && (
              <p className="text-xs flex items-center gap-1" style={{ color: "var(--muted)" }}>
                <User className="w-3 h-3" />
                {(o as any).delivery_contact_name}
              </p>
            )}
            {(o as any).delivery_contact_phone && (
              <p className="text-xs flex items-center gap-1" style={{ color: "var(--muted)" }}>
                <Phone className="w-3 h-3" />
                {(o as any).delivery_contact_phone}
              </p>
            )}
          </div>
        </div>
        {o.notes && (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--muted)" }}>
              Ghi chú
            </p>
            <p
              className="text-sm rounded-xl p-3"
              style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
            >
              {o.notes}
            </p>
          </div>
        )}
      </SectionCard>

      {/* Provider card */}
      {provider && (
        <SectionCard title="Nhà vận chuyển" icon={Truck}>
          <div className="flex items-center gap-4">
            {provider.avatar_url ? (
              <img
                src={provider.avatar_url}
                alt={provider.full_name}
                className="w-12 h-12 rounded-full object-cover shrink-0"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
                style={{ backgroundColor: "var(--primary-tint)", color: "var(--primary)" }}
              >
                {provider.full_name ? provider.full_name.charAt(0).toUpperCase() : "?"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate" style={{ color: "var(--text)" }}>
                {provider.business_name ?? provider.full_name}
              </p>
              {provider.business_name && provider.full_name && provider.business_name !== provider.full_name && (
                <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "var(--muted)" }}>
                  <Building2 className="w-3 h-3" />
                  {provider.full_name}
                </p>
              )}
            </div>
            {provider.phone && (
              <a
                href={`tel:${provider.phone}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-colors"
                style={{ backgroundColor: "var(--primary-tint)", color: "var(--primary)" }}
              >
                <Phone className="w-4 h-4" />
                {provider.phone}
              </a>
            )}
          </div>
        </SectionCard>
      )}

      {/* Payments */}
      <SectionCard title="Thanh toán" icon={CreditCard}>
        {payments.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: "var(--muted)" }}>
            Chưa có giao dịch nào.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Mã thanh toán", "Phương thức", "Số tiền", "Trạng thái", "Ngày thanh toán"].map((h, i) => (
                    <th
                      key={i}
                      className="pb-2 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap pr-4"
                      style={{ color: "var(--muted)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(payments as Payment[]).map((p, idx) => (
                  <tr
                    key={p.id}
                    style={{ borderTop: idx > 0 ? "1px solid var(--border)" : undefined }}
                  >
                    <td className="py-2.5 pr-4">
                      <span className="font-mono text-xs" style={{ color: "var(--text)" }}>
                        {p.payment_code}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 whitespace-nowrap" style={{ color: "var(--muted)" }}>
                      {PAYMENT_METHOD_LABELS[p.payment_method] ?? p.payment_method}
                    </td>
                    <td className="py-2.5 pr-4 font-semibold whitespace-nowrap" style={{ color: "var(--text)" }}>
                      {formatVND(p.amount)}
                    </td>
                    <td className="py-2.5 pr-4">
                      <StatusBadge type="payment" status={p.status} />
                    </td>
                    <td className="py-2.5 text-xs whitespace-nowrap" style={{ color: "var(--muted)" }}>
                      {p.paid_at ? formatDateTime(p.paid_at) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Status history timeline */}
      <SectionCard title="Lịch sử trạng thái" icon={Clock}>
        {history.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: "var(--muted)" }}>
            Chưa có lịch sử trạng thái.
          </p>
        ) : (
          <div className="relative pl-4">
            <div
              className="absolute left-4 top-2 bottom-2 w-px"
              style={{ backgroundColor: "var(--border)" }}
            />
            <div className="space-y-4">
              {(history as StatusHistoryEntry[]).map((entry, idx) => (
                <div
                  key={entry.id ? `${entry.id}-${idx}` : `history-${entry.created_at}-${idx}`}
                  className="relative flex gap-4 pl-4"
                >
                  {/* Dot */}
                  <div
                    className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 shrink-0"
                    style={{
                      backgroundColor: "var(--primary)",
                      borderColor: "var(--card)",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {entry.from_status && (
                        <>
                          <StatusBadge type="order" status={entry.from_status} />
                          <span style={{ color: "var(--muted)" }}>→</span>
                        </>
                      )}
                      <StatusBadge type="order" status={entry.to_status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      {entry.changer && (
                        <span className="text-xs" style={{ color: "var(--muted)" }}>
                          bởi{" "}
                          <span style={{ color: "var(--text)", fontWeight: 500 }}>
                            {entry.changer.full_name}
                          </span>
                          {" "}
                          <span className="opacity-70">
                            ({ROLE_LABELS[entry.changer.role] ?? entry.changer.role})
                          </span>
                        </span>
                      )}
                      <span className="text-xs" style={{ color: "var(--muted)" }}>
                        {formatDateTime(entry.created_at)}
                      </span>
                    </div>
                    {entry.notes && (
                      <p className="text-xs mt-1 italic" style={{ color: "var(--muted)" }}>
                        {entry.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      {/* Admin actions */}
      {canCancel && (
        <OrderDetailActions
          orderId={o.id}
          orderNumber={o.order_number}
        />
      )}
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function OrderDetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-2xl p-5 h-64"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
          />
        ))}
      </div>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-2xl p-5 h-40"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        />
      ))}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Chi tiết đơn hàng"
        action={
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Danh sách đơn hàng
          </Link>
        }
      />
      <Suspense fallback={<OrderDetailSkeleton />}>
        <OrderDetailContent id={id} />
      </Suspense>
    </div>
  );
}
