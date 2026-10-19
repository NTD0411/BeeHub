export interface ChatConversation {
  id: string;
  order_id: string;
  last_message_preview?: string;
  last_message_at?: string;
  unread_count: number;
  counterpart?: { full_name?: string; avatar_url?: string; phone?: string };
  order?: { id: string; status: string; service_type?: string };
}

export interface MarketplaceConversation {
  id: string;
  kind: "marketplace";
  listing_id: string;
  buyer_id: string;
  last_message_preview?: string;
  last_message_at?: string;
  unread_count: number;
  created_at?: string;
  counterpart?: { full_name?: string; avatar_url?: string; phone?: string };
  listing?: {
    id: string;
    title?: string;
    price?: number;
    images?: string[];
    status?: string;
    deal_confirmed?: boolean;
    transport_booked?: boolean;
    confirmed_buyer_id?: string;
    seller_id?: string;
    chat_enabled?: boolean;
    deal_status_label?: string | null;
    area?: string;
  } | null;
}

export type InboxItem =
  | (ChatConversation & { kind: "order" })
  | MarketplaceConversation;

export type ActiveChatThread =
  | { type: "order"; orderId: string }
  | { type: "marketplace"; listingId: string; buyerId: string };

export function inboxSortTime(item: InboxItem): number {
  const t = item.last_message_at ?? ("created_at" in item ? item.created_at : undefined);
  return t ? new Date(t).getTime() : 0;
}

export function mergeInboxItems(
  orders: ChatConversation[],
  marketplace: MarketplaceConversation[],
): InboxItem[] {
  const orderItems: InboxItem[] = orders.map((c) => ({ ...c, kind: "order" as const }));
  return [...orderItems, ...marketplace].sort((a, b) => inboxSortTime(b) - inboxSortTime(a));
}

export function marketplaceThreadKey(listingId: string, buyerId: string) {
  return `mp:${listingId}:${buyerId}`;
}

export function isSameThread(a: ActiveChatThread | null, b: ActiveChatThread | null): boolean {
  if (!a || !b) return false;
  if (a.type !== b.type) return false;
  if (a.type === "order" && b.type === "order") return a.orderId === b.orderId;
  if (a.type === "marketplace" && b.type === "marketplace") {
    return a.listingId === b.listingId && a.buyerId === b.buyerId;
  }
  return false;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender_id?: string;
  is_mine?: boolean;
  message_type?: string;
  location_name?: string;
  is_read?: boolean;
  created_at: string;
  sender?: { full_name?: string; avatar_url?: string };
  media_url?: string | null;
  media_type?: string | null;
  media_name?: string | null;
}

export interface OrderChatContext {
  id: string;
  status: string;
  service_type?: string;
  vehicle_size?: string;
  pickup_address: string;
  dropoff_address?: string;
  delivery_address?: string;
  total_price?: number;
  estimated_price?: number;
  final_price?: number;
  provider_id?: string | null;
  provider?: { full_name?: string; phone?: string; avatar_url?: string; vehicle_type?: string };
  provider_name?: string;
  provider_phone?: string;
  provider_plate?: string | null;
  customer?: { full_name?: string; phone?: string };
  pickup_contact_name?: string;
  pickup_contact_phone?: string;
}

export function upsertConversation(
  prev: ChatConversation[],
  orderId: string,
  counterpartName?: string | null,
): ChatConversation[] {
  if (prev.some((c) => c.order_id === orderId)) return prev;
  if (!counterpartName) return prev;
  return [
    {
      id: `pending-${orderId}`,
      order_id: orderId,
      unread_count: 0,
      last_message_preview: "Bắt đầu trò chuyện",
      counterpart: { full_name: counterpartName },
    },
    ...prev,
  ];
}

export function vehicleChatLabel(v?: string | null) {
  const map: Record<string, string> = {
    small_truck: "Xe tải 500kg",
    medium_truck: "Xe tải 1 tấn",
    large_truck: "Xe tải 1.5 tấn",
    motorbike: "Xe máy",
    truck_1t: "Xe tải 1 tấn",
    truck_2t: "Xe tải 2 tấn",
    truck_5t: "Xe tải 5 tấn+",
  };
  return (v && map[v]) || v || "Xe tải";
}

export const QUICK_REPLIES = [
  "Tôi đang xuống",
  "Bạn đợi 2 phút nhé",
  "Gọi cho tôi khi đến",
];

export function orderAllowsChat(order: OrderChatContext | null): boolean {
  if (!order?.provider_id) return false;
  if (["cancelled", "completed", "disputed"].includes(order.status)) return false;
  return ["matched", "accepted", "picking_up", "in_progress"].includes(order.status);
}

export function chatBlockReason(order: OrderChatContext | null): string | null {
  if (!order) return "Không tìm thấy đơn hàng";
  if (orderAllowsChat(order)) return null;
  if (order.status === "completed") {
    return "Đơn đã hoàn thành — chỉ xem lại tin nhắn, không gửi mới.";
  }
  if (order.status === "cancelled") {
    return "Đơn đã hủy — chỉ xem lại tin nhắn.";
  }
  if (!order.provider_id) {
    return "Chưa có nhà xe — chat mở khi đã chốt đối tác.";
  }
  return "Chat không khả dụng cho đơn này.";
}

export function orderStatusChatLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "Chờ xác nhận",
    matched: "Đã chốt nhà xe",
    accepted: "Đang hoạt động",
    picking_up: "Tài xế đang đến",
    in_progress: "Đang vận chuyển",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
  };
  return map[status] ?? "Đang hoạt động";
}

export function formatChatTime(dateStr: string) {
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(d);
}

export function formatChatDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  if (isToday) {
    return `HÔM NAY, ${d.getDate()} THÁNG ${d.getMonth() + 1}`;
  }
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d).toUpperCase();
}

export function formatRelativeTime(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const day = 86400000;
  if (diff < day) return formatChatTime(dateStr);
  if (diff < day * 2) return "Hôm qua";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(d);
}

export function shortAddress(addr: string, max = 64) {
  if (addr.length <= max) return addr;
  return `${addr.slice(0, max)}…`;
}

export function groupMessagesByDate(messages: ChatMessage[]) {
  const groups: { label: string; items: ChatMessage[] }[] = [];
  for (const m of messages) {
    const label = formatChatDateLabel(m.created_at);
    const last = groups[groups.length - 1];
    if (last?.label === label) last.items.push(m);
    else groups.push({ label, items: [m] });
  }
  return groups;
}
