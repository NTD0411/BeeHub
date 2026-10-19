"use client";

export const dynamic = "force-dynamic";


import { useState, useTransition, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  MoreVertical,
  Users,
  Star,
  Truck,
} from "lucide-react";

import { getUsers, updateUserStatus } from "@/lib/admin/queries/users";
import type { UserStatus } from "@/lib/admin/types";
import { formatVND, formatDate, formatRating } from "@/lib/admin/formatters";

import { PageHeader } from "@/components/admin-dashboard/page-header";
import { StatusBadge } from "@/components/admin-dashboard/status-badge";
import { EmptyState } from "@/components/admin-dashboard/empty-state";
import { Pagination } from "@/components/admin-dashboard/pagination";
import { Skeleton } from "@/components/admin-ui/skeleton";
import { Input } from "@/components/admin-ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin-ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/admin-ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/admin-ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/admin-ui/avatar";

/* ─────────────────────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────────────────────── */

type Tab = "customers" | "providers";
type StatusFilter = "all" | UserStatus;
type UserRow = Awaited<ReturnType<typeof getUsers>>["data"][number];
type UsersResult = Awaited<ReturnType<typeof getUsers>>;

/* ─────────────────────────────────────────────────────────────────────────────
   Skeleton Row
───────────────────────────────────────────────────────────────────────────── */

function TableRowSkeleton({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Action Dropdown
───────────────────────────────────────────────────────────────────────────── */

interface ActionMenuProps {
  user: UserRow;
  onStatusChanged: () => void;
}

function ActionMenu({ user, onStatusChanged }: ActionMenuProps) {
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  function handleToggle() {
    const nextStatus: UserStatus =
      user.status === "suspended" ? "active" : "suspended";
    setBusy(true);
    startTransition(async () => {
      await updateUserStatus(user.id, nextStatus);
      setBusy(false);
      onStatusChanged();
    });
  }

  const isSuspended = user.status === "suspended";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-[var(--primary-tint)] disabled:opacity-50"
        disabled={busy}
        aria-label="Tuỳ chọn"
      >
        <MoreVertical className="w-4 h-4" style={{ color: "var(--muted)" }} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={handleToggle}
          destructive={!isSuspended}
        >
          {isSuspended ? "Mở khóa tài khoản" : "Khóa tài khoản"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Users Table (fetches its own data)
───────────────────────────────────────────────────────────────────────────── */

interface UsersTableProps {
  tab: Tab;
  search: string;
  statusFilter: StatusFilter;
}

function UsersTable({ tab, search, statusFilter }: UsersTableProps) {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<UsersResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();
  const isFirstPageEffect = useRef(true);

  const fetchData = useCallback(
    async (p: number) => {
      setLoading(true);
      const res = await getUsers({
        role: tab === "customers" ? "customer" : "provider",
        search: search.trim() || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        page: p,
        pageSize: 10,
      });
      setResult(res);
      setLoading(false);
    },
    [tab, search, statusFilter]
  );

  // Reset to page 1 and fetch when filters change
  useEffect(() => {
    setPage(1);
    isFirstPageEffect.current = true;
    void fetchData(1);
  }, [fetchData]);

  // Fetch when page changes (skip on first render — handled above)
  useEffect(() => {
    if (isFirstPageEffect.current) {
      isFirstPageEffect.current = false;
      return;
    }
    void fetchData(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function handlePageChange(p: number) {
    startTransition(() => setPage(p));
  }

  function refreshData() {
    void fetchData(page);
  }

  const rows = result?.data ?? [];
  const meta = result?.meta;
  const isCustomers = tab === "customers";

  // Column headers per tab
  const customerCols = [
    "STT", "Tên", "Email", "Số điện thoại", "Trường học",
    "Tổng đơn", "Tổng chi tiêu", "Trạng thái", "Ngày tham gia", "",
  ];
  const providerCols = [
    "STT", "Tên", "Tên doanh nghiệp", "Email", "Xe",
    "Đánh giá", "Tổng đơn", "Thu nhập", "Xác minh", "Trạng thái", "",
  ];
  const cols = isCustomers ? customerCols : providerCols;

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-sm"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {cols.map((col, i) => (
                <th
                  key={`${col}-${i}`}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                  style={{ color: "var(--muted)" }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={cols.length} />
                ))
              : rows.map((user: any, idx: number) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    stt={(page - 1) * (meta?.pageSize ?? 10) + idx + 1}
                    isCustomers={isCustomers}
                    onStatusChanged={refreshData}
                  />
                ))}
          </tbody>
        </table>
      </div>

      {!loading && rows.length === 0 && (
        <EmptyState
          icon={isCustomers ? Users : Truck}
          title={
            isCustomers
              ? "Không tìm thấy khách hàng"
              : "Không tìm thấy nhà vận chuyển"
          }
          description="Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm."
        />
      )}

      {meta && meta.total > 0 && (
        <div style={{ borderTop: "1px solid var(--border)" }}>
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            pageSize={meta.pageSize}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Single Table Row
───────────────────────────────────────────────────────────────────────────── */

interface UserRowProps {
  user: UserRow;
  stt: number;
  isCustomers: boolean;
  onStatusChanged: () => void;
}

function UserRow({ user, stt, isCustomers, onStatusChanged }: UserRowProps) {
  return (
    <tr
      style={{ borderBottom: "1px solid var(--border)" }}
      className="transition-colors"
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
          "var(--primary-tint)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
          "transparent";
      }}
    >
      <td
        className="px-4 py-3 text-center text-xs font-medium w-12"
        style={{ color: "var(--muted)" }}
      >
        {stt}
      </td>
      {/* Avatar + Name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Avatar size="md">
            {user.avatar_url && (
              <AvatarImage src={user.avatar_url} alt={user.full_name} />
            )}
            <AvatarFallback>
              {user.full_name ? user.full_name.charAt(0).toUpperCase() : "?"}
            </AvatarFallback>
          </Avatar>
          <span
            className="max-w-[120px] truncate font-medium"
            style={{ color: "var(--text)" }}
            title={user.full_name}
          >
            {user.full_name}
          </span>
        </div>
      </td>

      {/* Provider-only: Business name */}
      {!isCustomers && (
        <td
          className="px-4 py-3 max-w-[140px] truncate"
          style={{ color: "var(--text)" }}
          title={user.business_name ?? "—"}
        >
          {user.business_name ?? "—"}
        </td>
      )}

      {/* Email */}
      <td
        className="px-4 py-3 max-w-[180px] truncate"
        style={{ color: "var(--muted)" }}
        title={user.email}
      >
        {user.email}
      </td>

      {/* Customer: Phone | Provider: Vehicle */}
      {isCustomers ? (
        <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--muted)" }}>
          {user.phone ?? "—"}
        </td>
      ) : (
        <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: "var(--muted)" }}>
          {user.vehicle_type
            ? `${user.vehicle_type}${user.vehicle_plate ? ` · ${user.vehicle_plate}` : ""}`
            : "—"}
        </td>
      )}

      {/* Customer: University | Provider: Rating */}
      {isCustomers ? (
        <td
          className="px-4 py-3 max-w-[140px] truncate text-xs"
          style={{ color: "var(--muted)" }}
          title={user.university ?? "—"}
        >
          {user.university ?? "—"}
        </td>
      ) : (
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-medium" style={{ color: "var(--text)" }}>
              {formatRating(user.rating)}
            </span>
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              ({user.total_reviews})
            </span>
          </div>
        </td>
      )}

      {/* Total Orders */}
      <td
        className="px-4 py-3 text-center font-medium"
        style={{ color: "var(--text)" }}
      >
        {user.total_orders.toLocaleString("vi-VN")}
      </td>

      {/* Customer: total_spent | Provider: total_earnings */}
      <td
        className="px-4 py-3 whitespace-nowrap font-medium"
        style={{ color: "var(--text)" }}
      >
        {formatVND(isCustomers ? user.total_spent : user.total_earnings)}
      </td>

      {/* Provider-only: Verification status */}
      {!isCustomers && (
        <td className="px-4 py-3">
          <StatusBadge type="verification" status={user.verification_status} />
        </td>
      )}

      {/* User status */}
      <td className="px-4 py-3">
        <StatusBadge type="user" status={user.status} />
      </td>

      {/* Customer-only: Joined date */}
      {isCustomers && (
        <td
          className="px-4 py-3 whitespace-nowrap text-xs"
          style={{ color: "var(--muted)" }}
        >
          {formatDate(user.created_at)}
        </td>
      )}

      {/* Actions */}
      <td className="px-4 py-3">
        <ActionMenu user={user} onStatusChanged={onStatusChanged} />
      </td>
    </tr>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────────────────────── */

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab: Tab = tabParam === "providers" ? "providers" : "customers";

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Đồng bộ tab khi URL thay đổi (vd: bấm sidebar "Nhà vận chuyển")
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "providers" || tab === "customers") {
      setActiveTab(tab);
      setStatusFilter("all");
    }
  }, [searchParams]);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, 400);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Người dùng"
        description="Xem và quản lý tất cả khách hàng và nhà vận chuyển trên nền tảng."
        action={
          <div className="w-64">
            <Input
              placeholder="Tìm kiếm tên, email, SĐT..."
              value={search}
              onChange={handleSearchChange}
              startAdornment={<Search className="w-4 h-4" />}
            />
          </div>
        }
      />

      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          const tab = v as Tab;
          setActiveTab(tab);
          setStatusFilter("all");
          router.push(`/users?tab=${tab}`, { scroll: false });
        }}
      >
        {/* Tabs + filter bar */}
        <div className="flex flex-wrap items-center gap-3 mb-1">
          <TabsList>
            <TabsTrigger value="customers">Khách hàng</TabsTrigger>
            <TabsTrigger value="providers">Nhà vận chuyển</TabsTrigger>
          </TabsList>

          <div className="w-52">
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="inactive">Không hoạt động</SelectItem>
                <SelectItem value="suspended">Đã khóa</SelectItem>
                <SelectItem value="pending_verification">Chờ xác minh</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="customers">
          <UsersTable
            tab="customers"
            search={debouncedSearch}
            statusFilter={statusFilter}
          />
        </TabsContent>

        <TabsContent value="providers">
          <UsersTable
            tab="providers"
            search={debouncedSearch}
            statusFilter={statusFilter}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
