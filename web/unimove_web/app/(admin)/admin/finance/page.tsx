"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useTransition } from "react";
import { Wallet, RefreshCw, TrendingUp, CheckCircle, XCircle } from "lucide-react";

import {
  getProviderEarnings,
  getWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
} from "@/lib/admin/queries/finance";
import { formatVND, formatDateTime } from "@/lib/admin/formatters";
import { cn } from "@/lib/admin/utils";

import { PageHeader } from "@/components/admin-dashboard/page-header";
import { StatusBadge } from "@/components/admin-dashboard/status-badge";
import { EmptyState } from "@/components/admin-dashboard/empty-state";
import { Pagination } from "@/components/admin-dashboard/pagination";
import { Button } from "@/components/admin-ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/admin-ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/admin-ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/admin-ui/select";

const EARNING_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: "Chờ xử lý", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  available: { label: "Có thể rút", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  withdrawn: { label: "Đã rút", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
};

function EarningStatusBadge({ status }: { status: string }) {
  const cfg = EARNING_STATUS_LABELS[status] ?? {
    label: status,
    className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap",
        cfg.className
      )}
    >
      {cfg.label}
    </span>
  );
}

type EarningRow = {
  id: string;
  order_amount: number;
  platform_commission: number;
  net_earnings: number;
  commission_rate: number;
  status: string;
  created_at: string;
  provider?: {
    business_name?: string;
    profiles?: { full_name?: string; email?: string };
  };
  order?: { order_number?: string };
};

function EarningsTab() {
  const [earnings, setEarnings] = useState<EarningRow[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getProviderEarnings({ page, pageSize: 20, status });
    setEarnings(result.data as EarningRow[]);
    setMeta(result.meta);
    setLoading(false);
  }, [page, status]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select
          value={status}
          onValueChange={(val) => {
            setStatus(val);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="pending">Chờ xử lý</SelectItem>
            <SelectItem value="available">Có thể rút</SelectItem>
            <SelectItem value="withdrawn">Đã rút</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm ml-auto" style={{ color: "var(--muted)" }}>
          {meta.total} bản ghi
        </span>
      </div>

      <div
        className="rounded-2xl shadow-sm overflow-hidden"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-5 h-5 animate-spin" style={{ color: "var(--muted)" }} />
          </div>
        ) : earnings.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="Không có dữ liệu thu nhập"
            description="Chưa có bản ghi thu nhập nhà vận chuyển nào."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["#Đơn hàng", "Nhà vận chuyển", "Giá đơn", "Hoa hồng", "Thực nhận", "Trạng thái", "Ngày tạo"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                          style={{ color: "var(--muted)" }}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {earnings.map((row) => (
                    <tr
                      key={row.id}
                      style={{ borderBottom: "1px solid var(--border)" }}
                      className="transition-colors hover:bg-[var(--primary-tint)]/30"
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: "var(--text)" }}>
                        #{row.order?.order_number ?? row.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3">
                        <div style={{ color: "var(--text)" }}>
                          {row.provider?.business_name ?? row.provider?.profiles?.full_name ?? "—"}
                        </div>
                        <div className="text-xs" style={{ color: "var(--muted)" }}>
                          {row.provider?.profiles?.email ?? ""}
                        </div>
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--text)" }}>
                        {formatVND(row.order_amount)}
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--muted)" }}>
                        {formatVND(row.platform_commission)}
                        <span className="text-xs ml-1">({row.commission_rate}%)</span>
                      </td>
                      <td className="px-4 py-3 font-semibold" style={{ color: "var(--text)" }}>
                        {formatVND(row.net_earnings)}
                      </td>
                      <td className="px-4 py-3">
                        <EarningStatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--muted)" }}>
                        {formatDateTime(row.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              pageSize={meta.pageSize}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}

type WithdrawalRow = {
  id: string;
  amount: number;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  status: string;
  requested_at: string;
  processed_at?: string | null;
  rejection_reason?: string | null;
  provider?: {
    business_name?: string;
    profiles?: { full_name?: string; email?: string; phone?: string };
  };
  processed_by_profile?: { full_name?: string };
};

function ApproveWithdrawalDialog({
  withdrawalId,
  open,
  onClose,
  onApproved,
}: {
  withdrawalId: string | null;
  open: boolean;
  onClose: () => void;
  onApproved: () => void;
}) {
  const [reference, setReference] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) setReference("");
  }, [open]);

  const handleApprove = () => {
    if (!withdrawalId) return;
    startTransition(async () => {
      const { error } = await approveWithdrawal(withdrawalId, reference.trim() || undefined);
      if (!error) {
        onApproved();
        onClose();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Duyệt yêu cầu rút tiền</DialogTitle>
        </DialogHeader>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Xác nhận đã chuyển khoản cho nhà vận chuyển. Bạn có thể nhập mã giao dịch (tuỳ chọn).
        </p>
        <input
          type="text"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Mã giao dịch ngân hàng..."
          className="w-full h-10 px-3 text-sm rounded-xl border outline-none"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)",
            color: "var(--text)",
          }}
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm">Hủy</Button>
          </DialogClose>
          <Button size="sm" disabled={pending} onClick={handleApprove}>
            {pending ? "Đang xử lý..." : "Duyệt rút tiền"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RejectWithdrawalDialog({
  withdrawalId,
  open,
  onClose,
  onRejected,
}: {
  withdrawalId: string | null;
  open: boolean;
  onClose: () => void;
  onRejected: () => void;
}) {
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  const handleReject = () => {
    if (!withdrawalId || !reason.trim()) return;
    startTransition(async () => {
      const { error } = await rejectWithdrawal(withdrawalId, reason.trim());
      if (!error) {
        onRejected();
        onClose();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Từ chối yêu cầu rút tiền</DialogTitle>
        </DialogHeader>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Nhập lý do từ chối..."
          className="w-full px-3 py-2 text-sm rounded-xl border outline-none resize-none"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)",
            color: "var(--text)",
          }}
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm">Hủy</Button>
          </DialogClose>
          <Button
            size="sm"
            variant="destructive"
            disabled={!reason.trim() || pending}
            onClick={handleReject}
          >
            {pending ? "Đang xử lý..." : "Từ chối"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function WithdrawalsTab() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [approveId, setApproveId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getWithdrawals({ page, pageSize: 20, status });
    setWithdrawals(result.data as WithdrawalRow[]);
    setMeta(result.meta);
    setLoading(false);
  }, [page, status]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select
          value={status}
          onValueChange={(val) => {
            setStatus(val);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="pending">Đang chờ</SelectItem>
            <SelectItem value="processing">Đang xử lý</SelectItem>
            <SelectItem value="completed">Đã hoàn thành</SelectItem>
            <SelectItem value="failed">Thất bại</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm ml-auto" style={{ color: "var(--muted)" }}>
          {meta.total} yêu cầu
        </span>
      </div>

      <div
        className="rounded-2xl shadow-sm overflow-hidden"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-5 h-5 animate-spin" style={{ color: "var(--muted)" }} />
          </div>
        ) : withdrawals.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="Không có yêu cầu rút tiền"
            description="Chưa có yêu cầu rút tiền nào phù hợp bộ lọc."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Nhà vận chuyển", "Số tiền", "Ngân hàng", "Trạng thái", "Yêu cầu lúc", ""].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                          style={{ color: "var(--muted)" }}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((row) => (
                    <tr
                      key={row.id}
                      style={{ borderBottom: "1px solid var(--border)" }}
                      className="transition-colors hover:bg-[var(--primary-tint)]/30"
                    >
                      <td className="px-4 py-3">
                        <div style={{ color: "var(--text)" }}>
                          {row.provider?.business_name ?? row.provider?.profiles?.full_name ?? "—"}
                        </div>
                        <div className="text-xs" style={{ color: "var(--muted)" }}>
                          {row.provider?.profiles?.phone ?? row.provider?.profiles?.email ?? ""}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold" style={{ color: "var(--text)" }}>
                        {formatVND(row.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <div style={{ color: "var(--text)" }}>{row.bank_name}</div>
                        <div className="text-xs font-mono" style={{ color: "var(--muted)" }}>
                          {row.bank_account_number} · {row.bank_account_name}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge type="payment" status={row.status} />
                        {row.rejection_reason && (
                          <p className="text-xs mt-1 max-w-[180px] line-clamp-2" style={{ color: "var(--muted)" }}>
                            {row.rejection_reason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--muted)" }}>
                        {formatDateTime(row.requested_at)}
                      </td>
                      <td className="px-4 py-3">
                        {row.status === "pending" && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setApproveId(row.id)}
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1" />
                              Duyệt
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRejectId(row.id)}
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              Từ chối
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              pageSize={meta.pageSize}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <ApproveWithdrawalDialog
        withdrawalId={approveId}
        open={!!approveId}
        onClose={() => setApproveId(null)}
        onApproved={load}
      />
      <RejectWithdrawalDialog
        withdrawalId={rejectId}
        open={!!rejectId}
        onClose={() => setRejectId(null)}
        onRejected={load}
      />
    </div>
  );
}

export default function FinancePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tài chính"
        description="Quản lý thu nhập và yêu cầu rút tiền của nhà vận chuyển"
      />

      <Tabs defaultValue="earnings">
        <TabsList>
          <TabsTrigger value="earnings">Thu nhập</TabsTrigger>
          <TabsTrigger value="withdrawals">Rút tiền</TabsTrigger>
        </TabsList>

        <TabsContent value="earnings">
          <EarningsTab />
        </TabsContent>

        <TabsContent value="withdrawals">
          <WithdrawalsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
