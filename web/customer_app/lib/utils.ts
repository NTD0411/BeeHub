import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

export function formatDateShort(dateStr: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateStr));
}

export function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} ngày trước`;
  return formatDateShort(dateStr);
}

export function getOrderStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "Chờ xác nhận",
    accepted: "Đã chấp nhận",
    picking_up: "Đang đến",
    in_progress: "Đang thực hiện",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
    disputed: "Đang khiếu nại",
  };
  return map[status] ?? status;
}

export function getOrderStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: "var(--warning)",
    accepted: "var(--primary)",
    picking_up: "var(--primary)",
    in_progress: "var(--primary)",
    completed: "var(--success)",
    cancelled: "var(--error)",
    disputed: "var(--error)",
  };
  return map[status] ?? "var(--muted)";
}

export function getServiceTypeLabel(type: string): string {
  const map: Record<string, string> = {
    standard: "Tiêu chuẩn",
    express: "Nhanh",
    premium: "Cao cấp",
  };
  return map[type] ?? type;
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n - 1) + "…" : str;
}
