"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  RefreshCw,
  Search,
  ExternalLink,
  MoreVertical,
  Eye,
  CheckCircle,
  EyeOff,
  XCircle,
  RotateCcw,
  Trash2,
} from "lucide-react";

import {
  getMarketplaceListings,
  updateMarketplaceListingStatus,
  approveMarketplaceListingFee,
  deleteMarketplaceListing,
} from "@/lib/admin/queries/marketplace-listings";
import { formatVND, formatDateTime } from "@/lib/admin/formatters";
import { cn } from "@/lib/admin/utils";

import { PageHeader } from "@/components/admin-dashboard/page-header";
import { EmptyState } from "@/components/admin-dashboard/empty-state";
import { Pagination } from "@/components/admin-dashboard/pagination";
import { Button } from "@/components/admin-ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/admin-ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/admin-ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/admin-ui/dropdown-menu";

const LISTING_TABS = [
  { value: "all", label: "Tất cả" },
  { value: "active", label: "Đang hiển thị" },
  { value: "reserved", label: "Đã giữ chỗ" },
  { value: "hidden", label: "Đã ẩn" },
  { value: "closed", label: "Đã đóng" },
  { value: "pending_fee", label: "Chờ thanh toán phí" },
] as const;

type ListingTab = (typeof LISTING_TABS)[number]["value"];

type ListingAction =
  | { kind: "status"; status: string; title: string; id: string; requireReason?: boolean }
  | { kind: "approve-fee"; title: string; id: string }
  | { kind: "delete"; title: string; id: string };

const CATEGORY_LABELS: Record<string, string> = {
  furniture: "Nội thất",
  electronics: "Điện tử",
  appliances: "Đồ bếp",
  clothes: "Quần áo",
  books: "Sách & Tài liệu",
  other: "Khác",
  kitchen: "Đồ bếp",
};

const CONDITION_LABELS: Record<string, string> = {
  new: "Mới",
  like_new: "Như mới",
  good: "Còn tốt",
  fair: "Khá ổn",
  poor: "Đã dùng nhiều",
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  active: {
    label: "Đang hiển thị",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  reserved: {
    label: "Đã giữ chỗ",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  hidden: {
    label: "Đã ẩn",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
  closed: {
    label: "Đã đóng",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};

type ListingRow = {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  condition?: string;
  area: string | null;
  price: number;
  images: string[] | null;
  status: string;
  fee_paid: boolean;
  created_at: string;
  profiles?: {
    id: string;
    full_name: string;
    email: string;
    phone?: string | null;
  } | null;
};

function ListingStatusBadge({ listing }: { listing: ListingRow }) {
  if (!listing.fee_paid) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
        Chờ thanh toán phí
      </span>
    );
  }
  const config = STATUS_LABELS[listing.status] ?? {
    label: listing.status,
    className: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive,
  onClose,
  onSubmit,
  loading,
  showReason,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  destructive?: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  loading: boolean;
  showReason?: boolean;
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {description && (
          <p className="text-sm" style={{ color: "var(--muted)" }}>{description}</p>
        )}
        {showReason && (
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Lý do (tuỳ chọn)..."
            className="w-full px-3 py-2 text-sm rounded-xl border outline-none resize-none"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
          />
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm" onClick={onClose}>Hủy</Button>
          </DialogClose>
          <Button
            size="sm"
            variant={destructive ? "destructive" : "default"}
            disabled={loading || (destructive && showReason && !reason.trim())}
            onClick={() => onSubmit(reason)}
          >
            {loading ? "Đang xử lý..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ListingDetailDialog({
  listing,
  open,
  onClose,
  onAction,
}: {
  listing: ListingRow | null;
  open: boolean;
  onClose: () => void;
  onAction: (action: ListingAction) => void;
}) {
  if (!listing) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pr-6">{listing.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {listing.images?.[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.images[0]}
              alt=""
              className="w-full max-h-48 object-cover rounded-xl"
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium uppercase" style={{ color: "var(--muted)" }}>Giá</p>
              <p className="font-semibold" style={{ color: "var(--text)" }}>{formatVND(Number(listing.price))}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase" style={{ color: "var(--muted)" }}>Trạng thái</p>
              <div className="mt-1"><ListingStatusBadge listing={listing} /></div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase" style={{ color: "var(--muted)" }}>Danh mục</p>
              <p style={{ color: "var(--text)" }}>{CATEGORY_LABELS[listing.category] ?? listing.category}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase" style={{ color: "var(--muted)" }}>Tình trạng</p>
              <p style={{ color: "var(--text)" }}>
                {CONDITION_LABELS[listing.condition ?? ""] ?? listing.condition ?? "—"}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-xs font-medium uppercase" style={{ color: "var(--muted)" }}>Khu vực</p>
              <p style={{ color: "var(--text)" }}>{listing.area ?? "—"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs font-medium uppercase" style={{ color: "var(--muted)" }}>Người đăng</p>
              <p style={{ color: "var(--text)" }}>{listing.profiles?.full_name ?? "—"}</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>{listing.profiles?.email}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs font-medium uppercase" style={{ color: "var(--muted)" }}>Ngày đăng</p>
              <p style={{ color: "var(--text)" }}>{formatDateTime(listing.created_at)}</p>
            </div>
          </div>

          {listing.description && (
            <div>
              <p className="text-xs font-medium uppercase mb-1" style={{ color: "var(--muted)" }}>Mô tả</p>
              <p className="whitespace-pre-wrap" style={{ color: "var(--text)" }}>{listing.description}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-wrap gap-2 sm:justify-between">
          <Link
            href={`/cho-sinh-vien/${listing.id}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-sm hover:underline"
            style={{ color: "var(--primary)" }}
          >
            Xem trên web
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Đóng</Button>
            <ListingActionsMenu listing={listing} onAction={onAction} variant="buttons" />
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ListingActionsMenu({
  listing,
  onAction,
  onViewDetail,
  variant = "menu",
}: {
  listing: ListingRow;
  onAction: (action: ListingAction) => void;
  onViewDetail?: () => void;
  variant?: "menu" | "buttons";
}) {
  const canApproveFee = !listing.fee_paid;
  const canShow = listing.status === "hidden" && listing.fee_paid;
  const canReopen = listing.status === "closed" && listing.fee_paid;
  const canHide = listing.fee_paid && (listing.status === "active" || listing.status === "reserved");
  const canClose = listing.status !== "closed";

  const items: Array<{
    label: string;
    icon: React.ElementType;
    action?: ListingAction;
    onClick?: () => void;
    destructive?: boolean;
  }> = [
    ...(onViewDetail
      ? [{ label: "Xem chi tiết", icon: Eye, onClick: onViewDetail }]
      : []),
    {
      label: "Xem trên web",
      icon: ExternalLink,
      onClick: () => window.open(`/cho-sinh-vien/${listing.id}`, "_blank"),
    },
  ];

  if (canApproveFee) {
    items.push({
      label: "Duyệt phí đăng",
      icon: CheckCircle,
      action: { kind: "approve-fee", id: listing.id, title: listing.title },
    });
  }
  if (canShow || canReopen) {
    items.push({
      label: canReopen ? "Mở lại tin" : "Hiển thị tin",
      icon: RotateCcw,
      action: { kind: "status", id: listing.id, status: "active", title: listing.title },
    });
  }
  if (canHide) {
    items.push({
      label: "Ẩn tin",
      icon: EyeOff,
      action: { kind: "status", id: listing.id, status: "hidden", title: listing.title, requireReason: true },
    });
  }
  if (canClose) {
    items.push({
      label: "Đóng tin",
      icon: XCircle,
      action: { kind: "status", id: listing.id, status: "closed", title: listing.title, requireReason: true },
    });
  }
  items.push({
    label: "Xóa tin",
    icon: Trash2,
    destructive: true,
    action: { kind: "delete", id: listing.id, title: listing.title },
  });

  if (variant === "buttons") {
    return (
      <>
        {items
          .filter((item) => item.action)
          .slice(0, 2)
          .map((item) => (
            <Button
              key={item.label}
              size="sm"
              variant={item.destructive ? "destructive" : "outline"}
              onClick={() => item.action && onAction(item.action)}
            >
              {item.label}
            </Button>
          ))}
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-[var(--primary-tint)]"
        aria-label="Thao tác quản lý"
      >
        <MoreVertical className="w-4 h-4" style={{ color: "var(--muted)" }} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[11rem]">
        {items.map((item, idx) => {
          const Icon = item.icon;
          const isDanger = item.destructive;
          const prev = items[idx - 1];
          const showSep =
            isDanger && prev && !prev.destructive;

          return (
            <React.Fragment key={item.label}>
              {showSep && <DropdownMenuSeparator />}
              <DropdownMenuItem
                destructive={isDanger}
                onClick={() => {
                  if (item.onClick) item.onClick();
                  else if (item.action) onAction(item.action);
                }}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </DropdownMenuItem>
            </React.Fragment>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const STICKY_ACTIONS =
  "sticky right-0 z-10 px-4 py-3 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)]";

export default function PassDoAdminPage() {
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [activeTab, setActiveTab] = useState<ListingTab>("all");
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<ListingAction | null>(null);
  const [detailListing, setDetailListing] = useState<ListingRow | null>(null);
  const [actionLoading, startAction] = useTransition();

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getMarketplaceListings({
      page,
      pageSize: 20,
      status: activeTab,
      keyword: keyword || undefined,
    });
    setListings(result.data as unknown as ListingRow[]);
    setMeta(result.meta);
    setLoading(false);
  }, [page, activeTab, keyword]);

  useEffect(() => { load(); }, [load]);

  const handleTabChange = (tab: ListingTab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(searchInput.trim());
    setPage(1);
  };

  const runAction = (reason: string) => {
    if (!pendingAction) return;
    startAction(async () => {
      let error: Error | null = null;

      if (pendingAction.kind === "status") {
        const res = await updateMarketplaceListingStatus(
          pendingAction.id,
          pendingAction.status,
          reason.trim() || undefined,
        );
        error = res.error;
      } else if (pendingAction.kind === "approve-fee") {
        const res = await approveMarketplaceListingFee(
          pendingAction.id,
          reason.trim() || undefined,
        );
        error = res.error;
      } else if (pendingAction.kind === "delete") {
        const res = await deleteMarketplaceListing(
          pendingAction.id,
          reason.trim() || undefined,
        );
        error = res.error;
      }

      if (!error) {
        setPendingAction(null);
        setDetailListing(null);
        load();
      }
    });
  };

  const dialogConfig = (() => {
    if (!pendingAction) return null;
    if (pendingAction.kind === "approve-fee") {
      return {
        title: "Duyệt phí đăng tin",
        description: `Kích hoạt tin "${pendingAction.title}" mà không cần thanh toán phí?`,
        confirmLabel: "Duyệt phí",
        showReason: true,
        destructive: false,
      };
    }
    if (pendingAction.kind === "delete") {
      return {
        title: "Xóa tin đăng",
        description: `Tin "${pendingAction.title}" sẽ bị xóa vĩnh viễn. Lý do bạn nhập sẽ được gửi thông báo tới người đăng.`,
        confirmLabel: "Xóa tin",
        showReason: true,
        destructive: true,
      };
    }
    const status = pendingAction.status;
    return {
      title:
        status === "hidden"
          ? "Ẩn tin đăng"
          : status === "closed"
            ? "Đóng tin đăng"
            : "Hiển thị lại tin đăng",
      description: `Thay đổi trạng thái tin "${pendingAction.title}"?`,
      confirmLabel: "Xác nhận",
      showReason: pendingAction.requireReason ?? status !== "active",
      destructive: status === "closed",
    };
  })();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Pass đồ"
        description="Kiểm duyệt và quản lý tin đăng trên Chợ sinh viên"
      />

      <Tabs value={activeTab} onValueChange={(v) => handleTabChange(v as ListingTab)}>
        <TabsList className="w-full flex flex-wrap h-auto gap-1">
          {LISTING_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex-1 min-w-[100px]">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <form onSubmit={handleSearch} className="flex flex-1 max-w-md gap-2">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "var(--muted)" }}
            />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo tiêu đề, mô tả..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border outline-none"
              style={{
                backgroundColor: "var(--card)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            />
          </div>
          <Button type="submit" variant="outline" size="sm">Tìm</Button>
        </form>

        <div className="flex items-center gap-3">
          <span className="text-sm" style={{ color: "var(--muted)" }}>
            {meta.total} tin đăng
          </span>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-opacity disabled:opacity-50"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--muted)",
            }}
          >
            <RefreshCw className={loading ? "w-3.5 h-3.5 animate-spin" : "w-3.5 h-3.5"} />
            Làm mới
          </button>
        </div>
      </div>

      <div
        className="rounded-2xl shadow-sm overflow-hidden"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-5 h-5 animate-spin" style={{ color: "var(--muted)" }} />
          </div>
        ) : listings.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Không có tin đăng"
            description="Chưa có tin nào phù hợp bộ lọc."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {[
                      "STT",
                      "Tin đăng",
                      "Người đăng",
                      "Danh mục",
                      "Khu vực",
                      "Giá",
                      "Trạng thái",
                      "Ngày đăng",
                      "Thao tác",
                    ].map((h, i) => (
                      <th
                        key={h}
                        className={cn(
                          "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap",
                          i === 8 && STICKY_ACTIONS,
                        )}
                        style={{
                          color: "var(--muted)",
                          ...(i === 8 ? { backgroundColor: "var(--card)" } : {}),
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {listings.map((listing, idx) => {
                    const thumb = listing.images?.[0];
                    return (
                      <tr
                        key={listing.id}
                        style={{ borderBottom: "1px solid var(--border)" }}
                        className="transition-colors hover:bg-[var(--primary-tint)]/30"
                      >
                        <td
                          className="px-4 py-3 text-center text-xs font-medium w-12"
                          style={{ color: "var(--muted)" }}
                        >
                          {(page - 1) * meta.pageSize + idx + 1}
                        </td>
                        <td className="px-4 py-3 min-w-[200px]">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-12 h-12 rounded-lg overflow-hidden shrink-0 flex items-center justify-center text-lg"
                              style={{ backgroundColor: "var(--primary-tint)" }}
                            >
                              {thumb ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={thumb} alt="" className="w-full h-full object-cover" />
                              ) : (
                                "📦"
                              )}
                            </div>
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => setDetailListing(listing)}
                                className="font-medium line-clamp-2 text-left hover:underline"
                                style={{ color: "var(--text)" }}
                              >
                                {listing.title}
                              </button>
                              <Link
                                href={`/cho-sinh-vien/${listing.id}`}
                                target="_blank"
                                className="inline-flex items-center gap-1 text-xs mt-0.5 hover:underline"
                                style={{ color: "var(--primary)" }}
                              >
                                Xem tin
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium truncate max-w-[140px]" style={{ color: "var(--text)" }}>
                            {listing.profiles?.full_name ?? "—"}
                          </p>
                          <p className="text-xs truncate max-w-[140px]" style={{ color: "var(--muted)" }}>
                            {listing.profiles?.email ?? ""}
                          </p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--text)" }}>
                          {CATEGORY_LABELS[listing.category] ?? listing.category}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap max-w-[120px] truncate" style={{ color: "var(--muted)" }}>
                          {listing.area ?? "—"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-medium" style={{ color: "var(--text)" }}>
                          {formatVND(Number(listing.price))}
                        </td>
                        <td className="px-4 py-3">
                          <ListingStatusBadge listing={listing} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--muted)" }}>
                          {formatDateTime(listing.created_at)}
                        </td>
                        <td
                          className={cn(STICKY_ACTIONS, "text-right")}
                          style={{ backgroundColor: "var(--card)" }}
                        >
                          <ListingActionsMenu
                            listing={listing}
                            onViewDetail={() => setDetailListing(listing)}
                            onAction={setPendingAction}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {meta.total > 0 && (
              <div style={{ borderTop: "1px solid var(--border)" }}>
                <Pagination
                  page={meta.page}
                  totalPages={meta.totalPages}
                  total={meta.total}
                  pageSize={meta.pageSize}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {dialogConfig && (
        <ConfirmDialog
          open={pendingAction !== null}
          title={dialogConfig.title}
          description={dialogConfig.description}
          confirmLabel={dialogConfig.confirmLabel}
          destructive={dialogConfig.destructive}
          showReason={dialogConfig.showReason}
          onClose={() => setPendingAction(null)}
          onSubmit={runAction}
          loading={actionLoading}
        />
      )}

      <ListingDetailDialog
        listing={detailListing}
        open={detailListing !== null}
        onClose={() => setDetailListing(null)}
        onAction={(action) => {
          setDetailListing(null);
          setPendingAction(action);
        }}
      />
    </div>
  );
}
