export function formatVND(amount: number | null | undefined): string {
  if (amount == null) return "0đ";
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
}

export function formatOrderNumber(orderNumber: string): string {
  return `#${orderNumber}`;
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} ngày trước`;
  return formatDate(date);
}

export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value == null) return "0%";
  return `${value.toFixed(decimals)}%`;
}

export function formatRating(value: number | null | undefined): string {
  if (value == null) return "0.0";
  return value.toFixed(1);
}
