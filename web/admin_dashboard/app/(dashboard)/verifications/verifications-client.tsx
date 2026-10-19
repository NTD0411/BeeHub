"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Pagination } from "@/components/dashboard/pagination";
import { formatDate } from "@/lib/formatters";
import {
  getProviderDocuments,
  updateVerificationStatus,
} from "@/lib/queries/verifications";
import type { VerificationStatus, ProviderDocument, PaginationMeta } from "@/lib/types";
import { ShieldCheck, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Helpers ────────────────────────────────────────────────────────────────

const TABS: { value: VerificationStatus; label: string }[] = [
  { value: "pending", label: "Chờ duyệt" },
  { value: "approved", label: "Đã duyệt" },
  { value: "rejected", label: "Từ chối" },
];

const DOC_TYPE_LABELS: Record<string, string> = {
  license: "Bằng lái xe",
  id_card: "Căn cước công dân",
  vehicle_registration: "Đăng ký xe",
  insurance: "Bảo hiểm xe",
};

type Provider = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  business_name: string | null;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  verification_status: VerificationStatus;
  verification_notes: string | null;
  verified_at: string | null;
  created_at: string;
  rating: number | null;
  total_orders: number;
};

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
}: {
  provider: Provider;
  adminId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [docs, setDocs] = useState<ProviderDocument[] | null>(null);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function loadDocs() {
    if (docs !== null) return;
    setDocsLoading(true);
    try {
      const { data, error } = await getProviderDocuments(provider.id);
      if (error) setDocsError(error.message);
      else setDocs(data);
    } catch {
      setDocsError("Không thể tải tài liệu.");
    } finally {
      setDocsLoading(false);
    }
  }

  function handleOpenChange(o: boolean) {
    if (o) {
      loadDocs();
    } else {
      // Reset state on close
      setAction(null);
      setReason("");
      setSubmitError(null);
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
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        hideClose={false}
        className="max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle>Chi tiết nhà vận chuyển</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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
                  {provider.full_name ? provider.full_name.charAt(0).toUpperCase() : "?"}
                </div>
              )}
              <div className="space-y-1">
                <p className="font-semibold text-base" style={{ color: "var(--text)" }}>
                  {provider.full_name}
                </p>
                {provider.business_name && (
                  <p className="text-sm" style={{ color: "var(--muted)" }}>
                    {provider.business_name}
                  </p>
                )}
                <p className="text-sm" style={{ color: "var(--muted)" }}>{provider.email}</p>
                {provider.phone && (
                  <p className="text-sm" style={{ color: "var(--muted)" }}>{provider.phone}</p>
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
              <InfoRow label="Loại xe" value={provider.vehicle_type ?? "—"} />
              <InfoRow label="Biển số xe" value={provider.vehicle_plate ?? "—"} />
              <InfoRow label="Ngày đăng ký" value={formatDate(provider.created_at)} />
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
              <div className="space-y-3">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="rounded-xl p-4"
                    style={{
                      backgroundColor: "var(--surface)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                          {DOC_TYPE_LABELS[doc.document_type] ?? doc.document_type}
                        </p>
                        {doc.document_number && (
                          <p className="text-xs" style={{ color: "var(--muted)" }}>
                            Số: {doc.document_number}
                          </p>
                        )}
                        {doc.expiry_date && (
                          <p className="text-xs" style={{ color: "var(--muted)" }}>
                            Hết hạn: {formatDate(doc.expiry_date)}
                          </p>
                        )}
                      </div>
                      <a
                        href={doc.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:opacity-80 shrink-0"
                        style={{
                          backgroundColor: "var(--primary-tint)",
                          color: "var(--primary)",
                        }}
                      >
                        <ExternalLink className="w-3 h-3" />
                        Xem ảnh
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

          {/* Action buttons — only for pending */}
          {provider.verification_status === "pending" && (
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                Hành động
              </h3>
              <div className="flex gap-3">
                <button
                  onClick={() => setAction(action === "approve" ? null : "approve")}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                    action === "approve"
                      ? "bg-emerald-600 text-white"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400"
                  )}
                >
                  Duyệt
                </button>
                <button
                  onClick={() => setAction(action === "reject" ? null : "reject")}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                    action === "reject"
                      ? "bg-red-600 text-white"
                      : "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
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
                  onClick={handleSubmit}
                  disabled={isPending || (action === "reject" && !reason.trim())}
                  className={cn(
                    "w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors",
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
        </div>
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
}: {
  providers: Provider[];
  meta: PaginationMeta;
  activeTab: VerificationStatus;
  adminId: string;
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
      <div
        className="flex gap-1 p-1 rounded-xl mb-6 w-fit"
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
                              {p.full_name ? p.full_name.charAt(0).toUpperCase() : "?"}
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
                        {p.email}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--muted)" }}>
                        {p.vehicle_type ?? "—"}
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
          provider={selectedProvider}
          adminId={adminId}
          open={!!selectedProvider}
          onOpenChange={(open) => {
            if (!open) setSelectedProvider(null);
          }}
        />
      )}
    </>
  );
}
