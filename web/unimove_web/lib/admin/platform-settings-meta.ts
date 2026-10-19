export type SettingType = "rate" | "currency" | "json-hint" | "text-hint";

export type PlatformSettingMeta = {
  label: string;
  description: string;
  type: SettingType;
  order: number;
};

export const PLATFORM_SETTINGS: Record<string, PlatformSettingMeta> = {
  deposit_rate: {
    label: "Tỷ lệ đặt cọc",
    description: "Tỷ lệ đặt cọc trên tổng tiền đơn hàng",
    type: "rate",
    order: 1,
  },
  commission_rate: {
    label: "Hoa hồng platform",
    description: "Phần trăm hoa hồng platform thu trên mỗi đơn",
    type: "rate",
    order: 2,
  },
  shared_move_discount_rate: {
    label: "Giảm giá gộp đơn",
    description: "Tỷ lệ giảm giá khi gộp chuyến đi",
    type: "rate",
    order: 3,
  },
  cancel_before_accept_refund_rate: {
    label: "Hoàn tiền (trước khi nhà xe nhận)",
    description: "Tỷ lệ hoàn tiền khi khách hủy trước khi nhà xe xác nhận",
    type: "rate",
    order: 4,
  },
  cancel_after_accept_refund_rate: {
    label: "Hoàn tiền (sau khi nhà xe nhận)",
    description: "Tỷ lệ hoàn tiền khi khách hủy sau khi nhà xe xác nhận",
    type: "rate",
    order: 5,
  },
  min_deposit_amount: {
    label: "Đặt cọc tối thiểu",
    description: "Số tiền đặt cọc tối thiểu (VNĐ)",
    type: "currency",
    order: 6,
  },
  referral_reward_amount: {
    label: "Thưởng giới thiệu",
    description: "Số tiền thưởng khi giới thiệu người dùng mới (VNĐ)",
    type: "currency",
    order: 7,
  },
  quote_flow_hint: {
    label: "Gợi ý luồng báo giá",
    description: "Nội dung hiển thị trên màn hình đặt chuyến báo giá (khách hàng)",
    type: "json-hint",
    order: 8,
  },
  combo_flow_hint: {
    label: "Gợi ý luồng combo",
    description: "Nội dung hiển thị trên màn hình đặt chuyến combo (khách hàng)",
    type: "text-hint",
    order: 9,
  },
};

/** @deprecated use PLATFORM_SETTINGS */
export const PLATFORM_SETTING_LABELS = PLATFORM_SETTINGS;

export function formatSettingRawValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

export function formatRateDisplay(value: string): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  if (num <= 1) return `${Math.round(num * 100)}%`;
  return `${num}%`;
}

export function formatCurrencyDisplay(value: string): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  return new Intl.NumberFormat("vi-VN").format(num) + "đ";
}

export type JsonHintValue = {
  title?: string;
  subtitle?: string;
};

export function parseJsonHint(value: string): JsonHintValue {
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return {
        title: typeof parsed.title === "string" ? parsed.title : "",
        subtitle: typeof parsed.subtitle === "string" ? parsed.subtitle : "",
      };
    }
  } catch {
    // ignore
  }
  return { title: "", subtitle: "" };
}

export function serializeJsonHint(hint: JsonHintValue): string {
  return JSON.stringify({
    title: hint.title ?? "",
    subtitle: hint.subtitle ?? "",
  });
}

export function formatSettingDisplayValue(key: string, raw: string): string {
  const meta = PLATFORM_SETTINGS[key];
  if (!meta) return raw;

  switch (meta.type) {
    case "rate":
      return formatRateDisplay(raw);
    case "currency":
      return formatCurrencyDisplay(raw);
    case "text-hint":
      return raw.replace(/^"|"$/g, "");
    case "json-hint": {
      const hint = parseJsonHint(raw);
      if (hint.title || hint.subtitle) {
        return [hint.title, hint.subtitle].filter(Boolean).join(" · ");
      }
      return raw;
    }
    default:
      return raw;
  }
}
