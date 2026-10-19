"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ClipboardList, ShieldCheck, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Pagination } from "@/components/dashboard/pagination";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  getOrderStatusHistory,
  getVerificationHistory,
  getRefundHistory,
} from "@/lib/queries/activity-logs";
import {
  formatDateTime,
  formatVND,
  formatOrderNumber,
} from "@/lib/formatters";
import type { OrderStatus, PaymentStatus, VerificationStatus } from "@/lib/types";

type ActivityTab = "orders" | "verifications" | "refunds";

function TableSkeleton({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <Skeleton className="h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function ActivityLogsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab") as ActivityTab | null;
  const activeTab: ActivityTab =
    tabParam === "verifications" || tabParam === "refunds"
      ? tabParam
      : "orders";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [meta, setMeta] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const fetchers = {
      orders: getOrderStatusHistory,
      verifications: getVerificationHistory,
      refunds: getRefundHistory,
    };
    const res = await fetchers[activeTab]({ page, pageSize: 10 });
    setRows(res.data);
    setMeta(res.meta);
    setLoading(false);
  }, [activeTab, page]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  function handleTabChange(tab: ActivityTab) {
    router.push(`/activity-logs?tab=${tab}&page=1`, { scroll: false });
  }

  function handlePageChange(newPage: number) {
    router.push(`/activity-logs?tab=${activeTab}&page=${newPage}`, {
      scroll: false,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lịch sử hoạt động"
        description="Xem lịch sử thay đổi đơn hàng, xác minh và hoàn tiền trên hệ thống"
      />

      <Tabs
        value={activeTab}
        onValueChange={(v) => handleTabChange(v as ActivityTab)}
      >
        <TabsList>
          <TabsTrigger value="orders">Đơn hàng</TabsTrigger>
          <TabsTrigger value="verifications">Xác minh</TabsTrigger>
          <TabsTrigger value="refunds">Hoàn tiền</TabsTrigger>
        </TabsList>

        {/* Orders tab */}
        <TabsContent value="orders">
          <ActivityTable
            loading={loading}
            empty={!loading && rows.length === 0}
            emptyIcon={ClipboardList}
            emptyTitle="Chưa có lịch sử đơn hàng"
            cols={["STT", "Mã đơn", "Khách hàng", "Từ", "Sang", "Người thực hiện", "Thời gian"]}
            colCount={7}
            meta={meta}
            onPageChange={handlePageChange}
          >
            {!loading &&
              rows.map((row, idx) => (
                <tr
                  key={row.id}
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <td className="px-4 py-3 text-center text-xs font-medium w-12" style={{ color: "var(--muted)" }}>
                    {(page - 1) * meta.pageSize + idx + 1}
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--primary)" }}>
                    {row.order?.order_number
                      ? formatOrderNumber(row.order.order_number)
                      : "—"}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--text)" }}>
                    {row.order?.customer?.full_name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {row.from_status ? (
                      <StatusBadge type="order" status={row.from_status as OrderStatus} />
                    ) : (
                      <span style={{ color: "var(--muted)" }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge type="order" status={row.to_status as OrderStatus} />
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--muted)" }}>
                    {row.changed_by_profile?.full_name ?? "Hệ thống"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: "var(--muted)" }}>
                    {formatDateTime(row.created_at)}
                  </td>
                </tr>
              ))}
          </ActivityTable>
        </TabsContent>

        {/* Verifications tab */}
        <TabsContent value="verifications">
          <ActivityTable
            loading={loading}
            empty={!loading && rows.length === 0}
            emptyIcon={ShieldCheck}
            emptyTitle="Chưa có lịch sử xác minh"
            cols={["STT", "Doanh nghiệp", "Chủ sở hữu", "Trạng thái", "Admin duyệt", "Thời gian"]}
            colCount={6}
            meta={meta}
            onPageChange={handlePageChange}
          >
            {!loading &&
              rows.map((row, idx) => {
                const owner = Array.isArray(row.profiles)
                  ? row.profiles[0]
                  : row.profiles;
                return (
                  <tr
                    key={row.id}
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <td className="px-4 py-3 text-center text-xs font-medium w-12" style={{ color: "var(--muted)" }}>
                      {(page - 1) * meta.pageSize + idx + 1}
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: "var(--text)" }}>
                      {row.business_name}
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--muted)" }}>
                      {owner?.full_name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        type="verification"
                        status={row.verification_status as VerificationStatus}
                      />
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--muted)" }}>
                      {row.verified_by_profile?.full_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: "var(--muted)" }}>
                      {formatDateTime(row.verified_at)}
                    </td>
                  </tr>
                );
              })}
          </ActivityTable>
        </TabsContent>

        {/* Refunds tab */}
        <TabsContent value="refunds">
          <ActivityTable
            loading={loading}
            empty={!loading && rows.length === 0}
            emptyIcon={RefreshCw}
            emptyTitle="Chưa có lịch sử hoàn tiền"
            cols={["STT", "Mã đơn", "Người yêu cầu", "Số tiền", "Lý do", "Trạng thái", "Thời gian"]}
            colCount={7}
            meta={meta}
            onPageChange={handlePageChange}
          >
            {!loading &&
              rows.map((row, idx) => (
                <tr
                  key={row.id}
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <td className="px-4 py-3 text-center text-xs font-medium w-12" style={{ color: "var(--muted)" }}>
                    {(page - 1) * meta.pageSize + idx + 1}
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--primary)" }}>
                    {row.order?.order_number
                      ? formatOrderNumber(row.order.order_number)
                      : "—"}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--text)" }}>
                    {row.requested_by_profile?.full_name ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--text)" }}>
                    {formatVND(row.refund_amount)}
                  </td>
                  <td
                    className="px-4 py-3 max-w-[200px] truncate text-xs"
                    style={{ color: "var(--muted)" }}
                    title={row.refund_reason}
                  >
                    {row.refund_reason}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge type="payment" status={row.status as PaymentStatus} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: "var(--muted)" }}>
                    {formatDateTime(row.processed_at)}
                  </td>
                </tr>
              ))}
          </ActivityTable>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ActivityTableProps {
  loading: boolean;
  empty: boolean;
  emptyIcon: React.ElementType;
  emptyTitle: string;
  cols: string[];
  colCount: number;
  meta: { page: number; pageSize: number; total: number; totalPages: number };
  onPageChange: (page: number) => void;
  children: React.ReactNode;
}

function ActivityTable({
  loading,
  empty,
  emptyIcon,
  emptyTitle,
  cols,
  colCount,
  meta,
  onPageChange,
  children,
}: ActivityTableProps) {
  const EmptyIcon = emptyIcon;

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-sm mt-4"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {cols.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                  style={{ color: "var(--muted)" }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <TableSkeleton cols={colCount} /> : children}
          </tbody>
        </table>
      </div>

      {empty && (
        <EmptyState
          icon={EmptyIcon}
          title={emptyTitle}
          description="Lịch sử sẽ xuất hiện khi có hoạt động trên hệ thống."
        />
      )}

      {!loading && meta.total > 0 && (
        <div style={{ borderTop: "1px solid var(--border)" }}>
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            pageSize={meta.pageSize}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}

export function ActivityLogsPageClient() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      }
    >
      <ActivityLogsContent />
    </Suspense>
  );
}
