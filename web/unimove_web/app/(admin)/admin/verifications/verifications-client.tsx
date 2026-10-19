"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/admin-ui/dialog";
import { StatusBadge } from "@/components/admin-dashboard/status-badge";
import { EmptyState } from "@/components/admin-dashboard/empty-state";
import { Pagination } from "@/components/admin-dashboard/pagination";
import { formatDate } from "@/lib/admin/formatters";
import {
  getProviderDocuments,
  updateVerificationStatus,
} from "@/lib/admin/queries/verifications";
import type { VerificationStatus, ProviderDocument, PaginationMeta } from "@/lib/admin/types";
import { ShieldCheck, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/admin/utils";

// ─── Helpers ────────────────────────────────────────────────────────────────

const TABS: { value: VerificationStatus; label: string }[] = [
  { value: "pending", label: "Chờ duyệt" },
  { value: "approved", label: "Đã duyệt" },
  { value: "rejected", label: "Từ chối" },
];

const DOC_TYPE_LABELS: Record<string, string> = {
  license: "Bằng lái xe",
  id_card: "Căn cước công dân",
  vehicle_registration: "Đăng ký xe (cà vẹt)",
  insurance: "Ảnh phương tiện",
};

/** Khớp field name từ form đăng ký tài xế */
const REGISTRATION_FIELD_LABELS: Record<string, string> = {
  cccd_front: "CCCD/CMND mặt trước",
  cccd_back: "CCCD/CMND mặt sau",
  driver_license: "Bằng lái xe",
  vehicle_registration: "Đăng ký xe (cà vẹt)",
  vehicle_photo: "Ảnh phương tiện",
};

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  motorbike: "Xe máy (≤ 100kg)",
  pickup: "Bán tải",
  van: "Xe van 5 tạ – 1 tấn",
  truck_1t: "Xe tải 1 tấn",
  truck_2t: "Xe tải 2 tấn",
  truck_5t: "Xe tải 5 tấn+",
  small_truck: "Xe tải nhỏ",
  medium_truck: "Xe tải vừa",
  large_truck: "Xe tải lớn",
};

function documentLabel(doc: ProviderDocument): string {
  if (doc.notes && REGISTRATION_FIELD_LABELS[doc.notes]) {
    return REGISTRATION_FIELD_LABELS[doc.notes];
  }
  const raw = doc.document_type || "";
  const suffix = raw.split("_").slice(1).join("_");
  if (suffix && REGISTRATION_FIELD_LABELS[suffix]) {
    return REGISTRATION_FIELD_LABELS[suffix];
  }
  if (DOC_TYPE_LABELS[raw]) return DOC_TYPE_LABELS[raw];
  for (const [key, label] of Object.entries(REGISTRATION_FIELD_LABELS)) {
    if (raw.includes(key)) return label;
  }
  return raw || "Tài liệu";
}

function vehicleTypeLabel(value: string | null): string {
  if (!value) return "—";
  return VEHICLE_TYPE_LABELS[value] ?? value;
}

const DOC_SORT_ORDER = [
  "cccd_front",
  "cccd_back",
  "driver_license",
  "vehicle_registration",
  "vehicle_photo",
];

function sortRegistrationDocuments(docs: ProviderDocument[]): ProviderDocument[] {
  return [...docs].sort((a, b) => {
    const ai = DOC_SORT_ORDER.indexOf(a.notes ?? "");
    const bi = DOC_SORT_ORDER.indexOf(b.notes ?? "");
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

type Provider = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  address: string | null;
  ward: string | null;
  city: string | null;
  business_name: string | null;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  verification_status: VerificationStatus;
  verification_notes: string | null;
  verified_at: string | null;
  created_at: string;
  rating: number | null;
  total_orders: number;
  documents: ProviderDocument[];
};

/** API trả profiles lồng — flatten để UI hiển thị đúng tên/email. */
export function normalizeProvider(raw: Record<string, unknown>): Provider {
  const profileRaw = raw.profiles;
  const profile = Array.isArray(profileRaw)
    ? (profileRaw[0] as Record<string, unknown> | undefined)
    : (profileRaw as Record<string, unknown> | null);

  const businessName = (raw.business_name as string | null) ?? null;
  const fullName = (profile?.full_name as string | undefined) ?? businessName ?? "Chưa có tên";
  const docsRaw = raw.provider_documents;
  const documents = (Array.isArray(docsRaw) ? docsRaw : []) as ProviderDocument[];

  return {
    id: raw.id as string,
    full_name: fullName,
    email: (profile?.email as string | undefined) ?? "",
    phone: (profile?.phone as string | null | undefined) ?? null,
    avatar_url: (profile?.avatar_url as string | null | undefined) ?? null,
    address: (profile?.address as string | null | undefined) ?? null,
    ward: (profile?.ward as string | null | undefined) ?? null,
    city: (profile?.city as string | null | undefined) ?? null,
    business_name: businessName,
    vehicle_type: (raw.vehicle_type as string | null | undefined) ?? null,
    vehicle_plate: (raw.vehicle_plate as string | null | undefined) ?? null,
    verification_status: raw.verification_status as VerificationStatus,
    verification_notes: (raw.verification_notes as string | null | undefined) ?? null,
    verified_at: (raw.verified_at as string | null | undefined) ?? null,
    created_at: raw.created_at as string,
    rating: (raw.rating as number | null | undefined) ?? null,
    total_orders: (raw.total_orders as number | undefined) ?? 0,
    documents,
  };
}

function providerInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

// ─── Info Row ────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      className="rounded-lg p-3"
      style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <p className="text-xs mb-0.5" style={{ color: "var(--muted)" }}>{label}</p>
      <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{value}</div>
    </div>
  );
}

// ─── Verify Dialog ───────────────────────────────────────────────────────────

function VerifyDialog({
  provider,
  adminId,
  open,
  onOpenChange,
  onVerified,
}: {
  provider: Provider;
  adminId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified?: () => void;
}) {
  const router = useRouter();
  const [docs, setDocs] = useState<ProviderDocument[] | null>(null);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setDocs(null);
    setDocsError(null);
    setDocsLoading(true);

    (async () => {
      try {
        const { data, error } = await getProviderDocuments(provider.id);
        if (cancelled) return;
        if (error) {
          setDocsError(error.message);
          setDocs(provider.documents?.length ? provider.documents : []);
        } else {
          setDocs(data?.length ? data : provider.documents ?? []);
        }
      } catch {
        if (!cancelled) {
          setDocsError("Không thể tải tài liệu.");
          setDocs(provider.documents?.length ? provider.documents : []);
        }
      } finally {
        if (!cancelled) setDocsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, provider.id, provider.documents]);

  function handleOpenChange(o: boolean) {
    if (!o) {
      setAction(null);
      setReason("");
      setSubmitError(null);
      setDocs(null);
    }
    onOpenChange(o);
  }

  function handleSubmit() {
    if (!action) return;
    if (action === "reject" && !reason.trim()) return;

    const status: VerificationStatus = action === "approve" ? "approved" : "rejected";
    const notes = action === "reject" ? reason.trim() : "";

    startTransition(async () => {
      setSubmitError(null);
      const { error } = await updateVerificationStatus(provider.id, status, notes, adminId);
      if (error) {
        setSubmitError(error.message);
      } else {
        onOpenChange(false);
        onVerified?.();
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent hideClose={false} className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader
          className="px-6 pt-6 pb-4 shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <DialogTitle>Chi tiết nhà vận chuyển</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 min-h-0">
          {/* Provider info */}
          <section>
            <h3 className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: "var(--muted)" }}>
              Thông tin cá nhân
            </h3>
            <div className="flex items-start gap-4">
              {provider.avatar_url ? (
                <img
                  src={provider.avatar_url}
                  alt={provider.full_name}
                  className="w-16 h-16 rounded-full object-cover shrink-0"
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 text-xl font-bold"
                  style={{ backgroundColor: "var(--primary-tint)", color: "var(--primary)" }}
                >
                  {providerInitial(provider.full_name)}
                </div>
              )}
              <div className="space-y-1 min-w-0">
                <p className="font-semibold text-base break-words" style={{ color: "var(--text)" }}>
                  {provider.full_name}
                </p>
                {provider.business_name && (
                  <p className="text-sm font-medium break-words" style={{ color: "var(--text)" }}>
                    {provider.business_name}
                  </p>
                )}
                <p className="text-sm break-all" style={{ color: "var(--muted)" }}>
                  {provider.email || "—"}
                </p>
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  {provider.phone || "—"}
                </p>
                {(provider.address || provider.ward) && (
                  <p className="text-sm break-words pt-1" style={{ color: "var(--muted)" }}>
                    {[provider.address, provider.ward, provider.city || "Đà Nẵng"].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Vehicle info */}
          <section>
            <h3 className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: "var(--muted)" }}>
              Thông tin phương tiện
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <InfoRow label="Loại xe" value={vehicleTypeLabel(provider.vehicle_type)} />
              <InfoRow
                label="Biển số xe"
                value={provider.vehicle_plate?.trim() ? provider.vehicle_plate : "Chưa khai báo"}
              />
              <InfoRow label="Ngày nộp hồ sơ" value={formatDate(provider.created_at)} />
              <InfoRow label="Trạng thái" value={
                <StatusBadge type="verification" status={provider.verification_status} />
              } />
            </div>
          </section>

          {/* Documents */}
          <section>
            <h3 className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: "var(--muted)" }}>
              Tài liệu xác minh
            </h3>
            {docsLoading && (
              <div className="flex items-center gap-2 py-4" style={{ color: "var(--muted)" }}>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Đang tải tài liệu...</span>
              </div>
            )}
            {docsError && (
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Lỗi: {docsError}
              </p>
            )}
            {docs && docs.length === 0 && (
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Chưa có tài liệu nào.
              </p>
            )}
            {docs && docs.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sortRegistrationDocuments(docs).map((doc) => (
                  <div
                    key={doc.id}
                    className="rounded-xl overflow-hidden"
                    style={{
                      backgroundColor: "var(--surface)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <a
                      href={doc.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block aspect-[4/3] bg-black/5"
                    >
                      <img
                        src={doc.document_url}
                        alt={documentLabel(doc)}
                        className="w-full h-full object-contain"
                      />
                    </a>
                    <div className="p-3 space-y-2">
                      <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                        {documentLabel(doc)}
                      </p>
                      {doc.document_number && (
                        <p className="text-xs" style={{ color: "var(--muted)" }}>
                          Số: {doc.document_number}
                        </p>
                      )}
                      <a
                        href={doc.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
                        style={{
                          backgroundColor: "var(--primary-tint)",
                          color: "var(--primary)",
                        }}
                      >
                        <ExternalLink className="w-3 h-3" />
                        Mở ảnh gốc
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Previous rejection notes */}
          {provider.verification_notes && (
            <section>
              <h3 className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                Ghi chú trước đó
              </h3>
              <p
                className="text-sm rounded-xl p-3"
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                }}
              >
                {provider.verification_notes}
              </p>
            </section>
          )}

        </div>

        {/* Action footer — luôn hiển thị rõ, không bị cắt */}
        {provider.verification_status === "pending" && (
          <section
            className="shrink-0 px-6 py-4 space-y-3"
            style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--card)" }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
              Hành động
            </h3>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setAction(action === "approve" ? null : "approve")}
                className={cn(
                  "flex-1 py-3 rounded-xl text-sm font-semibold border transition-colors",
                  action === "approve"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/15"
                )}
              >
                Duyệt
              </button>
              <button
                type="button"
                onClick={() => setAction(action === "reject" ? null : "reject")}
                className={cn(
                  "flex-1 py-3 rounded-xl text-sm font-semibold border transition-colors",
                  action === "reject"
                    ? "bg-red-600 text-white border-red-600"
                    : "border-red-500/50 text-red-400 hover:bg-red-500/15"
                )}
              >
                Từ chối
              </button>
            </div>

            {action === "reject" && (
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text)" }}
                >
                  Lý do từ chối <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Nhập lý do từ chối..."
                  rows={3}
                  className="w-full rounded-xl px-3 py-2 text-sm resize-none outline-none transition-colors"
                  style={{
                    backgroundColor: "var(--surface)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                  }}
                />
              </div>
            )}

            {submitError && (
              <p className="text-sm text-red-500">{submitError}</p>
            )}

            {action && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending || (action === "reject" && !reason.trim())}
                className={cn(
                  "w-full py-3 rounded-xl text-sm font-semibold text-white transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  action === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                )}
              >
                {isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang xử lý...
                  </span>
                ) : action === "approve" ? (
                  "Xác nhận duyệt"
                ) : (
                  "Xác nhận từ chối"
                )}
              </button>
            )}
          </section>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Client Component ───────────────────────────────────────────────────

export function VerificationsClient({
  providers,
  meta,
  activeTab,
  adminId,
  isRefreshing,
  lastUpdatedAt,
  onRefresh,
}: {
  providers: Provider[];
  meta: PaginationMeta;
  activeTab: VerificationStatus;
  adminId: string;
  isRefreshing?: boolean;
  lastUpdatedAt?: Date | null;
  onRefresh?: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  function setTab(tab: VerificationStatus) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    params.delete("page");
    router.push(`?${params.toString()}`);
  }

  function setPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`?${params.toString()}`);
  }

  return (
    <>
      {/* Tabs */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="flex gap-1 p-1 rounded-xl w-fit"
          style={{ backgroundColor: "var(--primary-tint)" }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setTab(tab.value)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer select-none",
                activeTab === tab.value
                  ? "text-white shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              )}
              style={
                activeTab === tab.value
                  ? { backgroundColor: "var(--primary)" }
                  : undefined
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {lastUpdatedAt && (
            <span className="text-xs hidden sm:inline" style={{ color: "var(--muted)" }}>
              Cập nhật{" "}
              {lastUpdatedAt.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          )}
          <button
            type="button"
            onClick={onRefresh}
            disabled={!onRefresh || isRefreshing}
            className={cn(
              "px-3 py-2 rounded-xl text-xs font-medium transition-opacity disabled:opacity-50",
              "inline-flex items-center gap-1.5"
            )}
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--muted)",
            }}
            title="Làm mới danh sách"
          >
            <Loader2 className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
            {isRefreshing ? "Đang cập nhật..." : "Làm mới"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden shadow-sm"
        style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
      >
        {providers.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="Không có hồ sơ nào"
            description="Hiện tại không có nhà vận chuyển nào trong danh mục này."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                    {[
                      "Nhà vận chuyển",
                      "Tên doanh nghiệp",
                      "Email",
                      "Loại xe",
                      "Biển số",
                      "Ngày đăng ký",
                      "Trạng thái",
                      "",
                    ].map((h, i) => (
                      <th
                        key={i}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                        style={{ color: "var(--muted)" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {providers.map((p, idx) => (
                    <tr
                      key={p.id}
                      className="transition-colors hover:bg-[var(--primary-tint)]/40"
                      style={{
                        borderTop: idx > 0 ? "1px solid var(--border)" : undefined,
                      }}
                    >
                      {/* Avatar + Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.avatar_url ? (
                            <img
                              src={p.avatar_url}
                              alt={p.full_name}
                              className="w-9 h-9 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                              style={{
                                backgroundColor: "var(--primary-tint)",
                                color: "var(--primary)",
                              }}
                            >
                              {providerInitial(p.full_name)}
                            </div>
                          )}
                          <span className="font-medium whitespace-nowrap" style={{ color: "var(--text)" }}>
                            {p.full_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--muted)" }}>
                        {p.business_name ?? "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--muted)" }}>
                        {p.email || "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--muted)" }}>
                        {vehicleTypeLabel(p.vehicle_type)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--muted)" }}>
                        {p.vehicle_plate ?? "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--muted)" }}>
                        {formatDate(p.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge type="verification" status={p.verification_status} />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedProvider(p)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
                          style={{
                            backgroundColor: "var(--primary-tint)",
                            color: "var(--primary)",
                          }}
                        >
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ borderTop: "1px solid var(--border)" }}>
              <Pagination
                page={meta.page}
                totalPages={meta.totalPages}
                total={meta.total}
                pageSize={meta.pageSize}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>

      {/* Verify Dialog */}
      {selectedProvider && (
        <VerifyDialog
          key={selectedProvider.id}
          provider={selectedProvider}
          adminId={adminId}
          open={!!selectedProvider}
          onOpenChange={(open) => {
            if (!open) setSelectedProvider(null);
          }}
          onVerified={onRefresh}
        />
      )}
    </>
  );
}
