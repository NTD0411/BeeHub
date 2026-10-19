import { cn } from "@/lib/admin/utils";
import type {
  OrderStatus,
  PaymentStatus,
  UserStatus,
  VerificationStatus,
  DisputeStatus,
} from "@/lib/admin/types";

const orderStatusMap: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: "Chờ xử lý", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  matched: { label: "Đã ghép", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  accepted: { label: "Đã nhận", className: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400" },
  picking_up: { label: "Đang đến lấy", className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  picked_up: { label: "Đã lấy hàng", className: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400" },
  in_progress: { label: "Đang vận chuyển", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  completed: { label: "Hoàn thành", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  cancelled: { label: "Đã hủy", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  disputed: { label: "Tranh chấp", className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
};

const paymentStatusMap: Record<PaymentStatus, { label: string; className: string }> = {
  pending: { label: "Đang chờ", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  processing: { label: "Đang xử lý", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  completed: { label: "Đã thanh toán", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  failed: { label: "Thất bại", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  refunded: { label: "Đã hoàn tiền", className: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400" },
  partially_refunded: { label: "Hoàn tiền một phần", className: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400" },
  cancelled: { label: "Đã hủy", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

const userStatusMap: Record<UserStatus, { label: string; className: string }> = {
  active: { label: "Đang hoạt động", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  inactive: { label: "Không hoạt động", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  suspended: { label: "Đã khóa", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  pending_verification: { label: "Chờ xác minh", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
};

const verificationStatusMap: Record<VerificationStatus, { label: string; className: string }> = {
  pending: { label: "Chờ duyệt", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  approved: { label: "Đã duyệt", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  rejected: { label: "Từ chối", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

const disputeStatusMap: Record<DisputeStatus, { label: string; className: string }> = {
  open: { label: "Đang mở", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  investigating: { label: "Đang điều tra", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  resolved: { label: "Đã giải quyết", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  closed: { label: "Đã đóng", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
};

const refundStatusMap: Record<string, { label: string; className: string }> = {
  pending: { label: "Chờ duyệt", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  processing: { label: "Đã duyệt", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  completed: { label: "Hoàn tất", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  failed: { label: "Thất bại", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

interface StatusBadgeProps {
  type: "order" | "payment" | "user" | "verification" | "dispute" | "refund";
  status: string;
  className?: string;
}

export function StatusBadge({ type, status, className }: StatusBadgeProps) {
  let config: { label: string; className: string } | undefined;

  if (type === "order") config = orderStatusMap[status as OrderStatus];
  else if (type === "payment") config = paymentStatusMap[status as PaymentStatus];
  else if (type === "user") config = userStatusMap[status as UserStatus];
  else if (type === "verification") config = verificationStatusMap[status as VerificationStatus];
  else if (type === "dispute") config = disputeStatusMap[status as DisputeStatus];
  else if (type === "refund") config = refundStatusMap[status];

  if (!config) {
    config = { label: status, className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" };
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
