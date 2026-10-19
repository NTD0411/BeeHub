import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(dateStr));
}

export function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} ngày trước`;
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(dateStr));
}

export function getOrderStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "Chờ xác nhận",
    matched: "Đã chọn nhà xe",
    accepted: "Đã chấp nhận",
    picking_up: "Đang đến lấy",
    in_progress: "Đang vận chuyển",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
    disputed: "Khiếu nại",
  };
  return map[status] ?? status;
}

export function getOrderStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: "var(--warning)",
    matched: "var(--primary)",
    accepted: "var(--primary)",
    picking_up: "var(--primary)",
    in_progress: "var(--primary)",
    completed: "var(--success)",
    cancelled: "var(--error)",
    disputed: "var(--error)",
  };
  return map[status] ?? "var(--muted)";
}

export function getRoleLabel(role: string): string {
  return role === "provider" ? "Nhà vận chuyển" : "Khách hàng";
}
