"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck,
  Send,
  Phone,
  MapPin,
  MoreVertical,
  Image as ImageIcon,
  Smile,
  CheckCheck,
  RefreshCw,
  MessageCircle,
  FileText,
  Paperclip,
  Bell,
  Package,
  Star,
  AlertCircle,
  CheckCircle,
  Settings,
  HelpCircle,
  ArrowLeft,
  MessageSquare,
  ShoppingBag,
} from "lucide-react";
import { chatApi, conversationsApi, notificationsApi, ordersApi, marketplaceApi } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { cn, formatVND, getOrderStatusLabel, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type ChatConversation,
  type ChatMessage,
  type OrderChatContext,
  chatBlockReason,
  formatChatTime,
  groupMessagesByDate,
  orderAllowsChat,
  shortAddress,
  type ActiveChatThread,
  type InboxItem,
  type MarketplaceConversation,
  mergeInboxItems,
  upsertConversation,
  vehicleChatLabel,
} from "./order-chat-utils";

const NAVY = "#0A192F";
const NAVY_LIGHT = "#0F1E3D";
const ACTIVE_LIST_BG = "#FEF9C3";

interface NotificationRow {
  id: string;
  type: string;
  notification_type?: string;
  title: string;
  body: string;
  message?: string;
  read?: boolean;
  is_read?: boolean;
  created_at: string;
  listing_id?: string | null;
  icon?: string | null;
  action_data?: {
    order_id?: string;
    quote_id?: string;
    listing_id?: string;
    buyer_id?: string;
  } | null;
}

type NotifTarget =
  | { kind: "order_chat"; orderId: string }
  | { kind: "quote"; href: string }
  | { kind: "marketplace_thread"; listingId: string; buyerId: string }
  | { kind: "detail" };

function notifTypeOf(n: NotificationRow) {
  return String(n.type ?? n.notification_type ?? "");
}

function notifVisual(n: NotificationRow) {
  const type = notifTypeOf(n);
  const icon = n.icon ?? "";

  if (type.includes("marketplace") || icon === "chat") {
    return { Icon: MessageCircle, bg: "#DCFCE7", color: "#16A34A" };
  }
  if (type.includes("quote") || icon === "tag") {
    return { Icon: FileText, bg: "#F5F3FF", color: "#7C3AED" };
  }
  if (type.includes("order") || icon === "truck") {
    return { Icon: Package, bg: "#EFF6FF", color: "#2563EB" };
  }
  const kind = mapNotifType(type);
  const meta = NOTIF_META[kind];
  return { Icon: meta.icon, bg: meta.bg, color: meta.color };
}

function resolveNotificationTarget(n: NotificationRow): NotifTarget {
  const type = notifTypeOf(n);
  const action = n.action_data ?? {};
  const orderId = action.order_id;
  const quoteId = action.quote_id;
  const listingId = action.listing_id ?? n.listing_id ?? undefined;

  if (type.includes("marketplace") && listingId && action.buyer_id) {
    return { kind: "marketplace_thread", listingId, buyerId: action.buyer_id };
  }
  if ((type.includes("quote") || quoteId) && orderId && quoteId) {
    return { kind: "quote", href: `/don-hang/${orderId}/bao-gia/${quoteId}` };
  }
  if (orderId) {
    return { kind: "order_chat", orderId };
  }
  return { kind: "detail" };
}

export interface OrderChatWorkspaceProps {
  initialOrderId?: string | null;
  initialWithName?: string | null;
  initialListingId?: string | null;
  initialBuyerId?: string | null;
  initialTab?: "messages" | "notifications";
  initialInboxCategory?: "chuyen-tro" | "pass-do";
  enableNotificationsTab?: boolean;
  /** Tách danh sách Chuyển trọ (đơn hàng) và Pass đồ (Chợ SV). Mặc định: bật với khách, tắt với tài xế. */
  enableInboxCategoryTabs?: boolean;
  orderDetailPath?: (orderId: string) => string;
  className?: string;
}

function mapNotifType(t: string): "order" | "promo" | "system" | "review" {
  if (t?.includes("order") || t?.includes("quote")) return "order";
  if (t?.includes("review")) return "review";
  if (t?.includes("promo")) return "promo";
  return "system";
}

const NOTIF_META = {
  order: { icon: Package, bg: "#EFF6FF", color: "#2563EB" },
  promo: { icon: Star, bg: "#FFFBEB", color: "#D97706" },
  system: { icon: AlertCircle, bg: "#F0FDF4", color: "#16A34A" },
  review: { icon: CheckCircle, bg: "#FFF1F2", color: "#E11D48" },
};

function inboxListIcon(item: InboxItem) {
  if (item.kind === "marketplace") {
    return { Icon: MessageCircle, bg: "#DCFCE7", color: "#16A34A" };
  }
  const preview = (item.last_message_preview ?? "").toLowerCase();
  if (preview.includes("đơn") || preview.includes("nhận") || preview.includes("giao")) {
    return { Icon: Truck, bg: "#EFF6FF", color: "#2563EB" };
  }
  if (preview.includes("báo giá") || preview.includes("hóa đơn")) {
    return { Icon: FileText, bg: "#F5F3FF", color: "#7C3AED" };
  }
  return { Icon: MessageCircle, bg: "#F3F4F6", color: "#6B7280" };
}

function marketplaceListPreview(item: MarketplaceConversation): string {
  const msg = item.last_message_preview?.trim();
  if (msg && msg !== "Bắt đầu trò chuyện") return msg;
  if (item.listing?.title) return `Tin: ${item.listing.title}`;
  return "Chợ sinh viên";
}

function partnerInitials(name: string) {
  return name
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function threadCacheKey(thread: ActiveChatThread): string {
  return thread.type === "order"
    ? `order:${thread.orderId}`
    : `mp:${thread.listingId}:${thread.buyerId}`;
}

export function OrderChatWorkspace({
  initialOrderId = null,
  initialWithName = null,
  initialListingId = null,
  initialBuyerId = null,
  initialTab = "messages",
  initialInboxCategory,
  enableNotificationsTab = false,
  enableInboxCategoryTabs,
  orderDetailPath = (id) => `/don-hang/${id}`,
  className,
}: OrderChatWorkspaceProps) {
  const router = useRouter();
  const role = getStoredUser()?.role ?? "customer";
  const userId = getStoredUser()?.id ?? "";
  const isProvider = role === "provider";
  const showInboxCategoryTabs = enableInboxCategoryTabs ?? !isProvider;

  const [sidebarTab, setSidebarTab] = useState<"messages" | "notifications">(
    initialTab === "notifications" && enableNotificationsTab ? "notifications" : "messages",
  );
  const [inboxCategory, setInboxCategory] = useState<"chuyen-tro" | "pass-do">(
    initialInboxCategory ?? (initialListingId ? "pass-do" : "chuyen-tro"),
  );
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [activeThread, setActiveThread] = useState<ActiveChatThread | null>(() =>
    initialOrderId ? { type: "order", orderId: initialOrderId } : null,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [order, setOrder] = useState<OrderChatContext | null>(null);
  const [mpListing, setMpListing] = useState<MarketplaceConversation["listing"]>(null);
  const [mpChatEnabled, setMpChatEnabled] = useState(true);
  const [mpDealStatusLabel, setMpDealStatusLabel] = useState<string | null>(null);
  const [mpDealLoading, setMpDealLoading] = useState(false);
  const [dealPriceInput, setDealPriceInput] = useState("");
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [notifs, setNotifs] = useState<NotificationRow[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [selectedNotifId, setSelectedNotifId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const deepLinkedRef = useRef(false);
  const messagesCacheRef = useRef<Map<string, ChatMessage[]>>(new Map());
  const orderCacheRef = useRef<Map<string, OrderChatContext>>(new Map());
  const mpListingCacheRef = useRef<Map<string, NonNullable<MarketplaceConversation["listing"]>>>(
    new Map(),
  );
  const inboxItemsRef = useRef(inboxItems);
  inboxItemsRef.current = inboxItems;

  const activeOrderId = activeThread?.type === "order" ? activeThread.orderId : null;
  const activeMarketplace =
    activeThread?.type === "marketplace" ? activeThread : null;
  const hasActiveChat = !!activeThread;

  const loadInbox = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoadingList(true);
    try {
      const orderRes = await conversationsApi.list();
      const mpRes = isProvider
        ? { success: false as const }
        : await marketplaceApi.listConversations();
      let orders: ChatConversation[] =
        orderRes.success && Array.isArray(orderRes.data)
          ? (orderRes.data as ChatConversation[])
          : [];
      if (initialOrderId && initialWithName) {
        orders = upsertConversation(orders, initialOrderId, initialWithName);
      }
      const marketplace: MarketplaceConversation[] =
        !isProvider && mpRes.success && Array.isArray(mpRes.data)
          ? (mpRes.data as MarketplaceConversation[])
          : [];
      setInboxItems(mergeInboxItems(orders, marketplace));
    } catch {
      setInboxItems([]);
    } finally {
      if (!opts?.silent) setLoadingList(false);
    }
  }, [initialOrderId, initialWithName, isProvider]);

  const loadNotifs = useCallback(async () => {
    if (!enableNotificationsTab) return;
    setNotifLoading(true);
    try {
      const res = await notificationsApi.list({ pageSize: 50 });
      if (res.success && res.data) {
        const d = res.data as { notifications?: NotificationRow[] } | NotificationRow[];
        setNotifs(Array.isArray(d) ? d : (d?.notifications ?? []));
      }
    } catch {
      setNotifs([]);
    } finally {
      setNotifLoading(false);
    }
  }, [enableNotificationsTab]);

  const loadOrder = useCallback(async (orderId: string, opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoadingOrder(true);
    try {
      const res = await ordersApi.get(orderId);
      if (res.success && res.data) {
        const data = res.data as OrderChatContext;
        orderCacheRef.current.set(orderId, data);
        setOrder(data);
      } else if (!opts?.silent) setOrder(null);
    } catch {
      if (!opts?.silent) setOrder(null);
    } finally {
      if (!opts?.silent) setLoadingOrder(false);
    }
  }, []);

  const loadMarketplaceMessages = useCallback(
    async (listingId: string, buyerId: string, opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoadingMessages(true);
      try {
        const res = await marketplaceApi.getMessages(listingId, buyerId);
        if (res.success && res.data) {
          const d = res.data as {
            messages?: Record<string, unknown>[];
            chat_enabled?: boolean;
            deal_status_label?: string | null;
          };
          if (d.chat_enabled !== undefined) setMpChatEnabled(d.chat_enabled !== false);
          if (d.deal_status_label !== undefined) setMpDealStatusLabel(d.deal_status_label);
          const raw = d.messages ?? [];
          const mapped = raw.map((m) => {
              const content = String(m.content ?? m.text ?? "");
              const fromBuyer = m.from_buyer as boolean | undefined;
              const isBuyerUser = userId === buyerId;
              const isMine =
                fromBuyer !== undefined
                  ? isBuyerUser
                    ? fromBuyer === true
                    : fromBuyer === false
                  : String(m.sender_id) === userId;
              return {
                id: String(m.id),
                content,
                is_mine: isMine,
                created_at: String(m.created_at ?? new Date().toISOString()),
                media_url: (m.media_url as string | null | undefined) ?? null,
                media_type: (m.media_type as string | null | undefined) ?? null,
                media_name: (m.media_name as string | null | undefined) ?? null,
                message_type: m.is_deal_confirm
                  ? "deal_confirm"
                  : m.is_deal_cancel
                    ? "deal_cancel"
                    : m.is_offer
                      ? "offer"
                      : m.message_type
                        ? String(m.message_type)
                        : m.media_url
                          ? String(m.media_type ?? "").startsWith("image/")
                            ? "image"
                            : "file"
                          : undefined,
              } satisfies ChatMessage;
            });
          messagesCacheRef.current.set(`mp:${listingId}:${buyerId}`, mapped);
          setMessages(mapped);
          setInboxItems((prev) =>
            prev.map((item) =>
              item.kind === "marketplace" &&
              item.listing_id === listingId &&
              item.buyer_id === buyerId
                ? { ...item, unread_count: 0 }
                : item,
            ),
          );
        } else if (!opts?.silent) {
          setMessages([]);
        }
      } catch {
        if (!opts?.silent) setMessages([]);
      } finally {
        if (!opts?.silent) setLoadingMessages(false);
      }
    },
    [userId],
  );

  const loadMessages = useCallback(async (orderId: string, opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoadingMessages(true);
    try {
      const res = await conversationsApi.getMessages(orderId);
      const d = res.data as { messages?: ChatMessage[] };
      const list = d?.messages ?? [];
      messagesCacheRef.current.set(`order:${orderId}`, list);
      setMessages(list);
      setInboxItems((prev) =>
        prev.map((item) =>
          item.kind === "order" && item.order_id === orderId
            ? { ...item, unread_count: 0 }
            : item,
        ),
      );
    } catch {
      if (!opts?.silent) setMessages([]);
    } finally {
      if (!opts?.silent) setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    loadInbox();
    loadNotifs();
  }, [loadInbox, loadNotifs]);

  useEffect(() => {
    if (deepLinkedRef.current || loadingList) return;
    if (initialOrderId) {
      deepLinkedRef.current = true;
      setSidebarTab("messages");
      setInboxCategory("chuyen-tro");
      setActiveThread({ type: "order", orderId: initialOrderId });
      return;
    }
    if (initialListingId && initialBuyerId) {
      deepLinkedRef.current = true;
      setSidebarTab("messages");
      setInboxCategory("pass-do");
      setActiveThread({
        type: "marketplace",
        listingId: initialListingId,
        buyerId: initialBuyerId,
      });
    }
  }, [initialOrderId, initialListingId, initialBuyerId, loadingList]);

  const visibleInboxItems = useMemo(() => {
    if (!showInboxCategoryTabs) return inboxItems;
    return inboxItems.filter((item) =>
      inboxCategory === "chuyen-tro" ? item.kind === "order" : item.kind === "marketplace",
    );
  }, [inboxItems, inboxCategory, showInboxCategoryTabs]);

  const handleInboxCategoryChange = (category: "chuyen-tro" | "pass-do") => {
    setInboxCategory(category);
    if (!activeThread) return;
    if (category === "chuyen-tro" && activeThread.type === "marketplace") {
      setActiveThread(null);
    }
    if (category === "pass-do" && activeThread.type === "order") {
      setActiveThread(null);
    }
  };

  useEffect(() => {
    if (!activeThread) {
      setMessages([]);
      return;
    }

    const key = threadCacheKey(activeThread);
    const cachedMessages = messagesCacheRef.current.get(key);
    if (cachedMessages) {
      setMessages(cachedMessages);
      setLoadingMessages(false);
    }

    let pollTimer: ReturnType<typeof setInterval> | undefined;

    if (activeThread.type === "order") {
      const cachedOrder = orderCacheRef.current.get(activeThread.orderId);
      if (cachedOrder) {
        setOrder(cachedOrder);
        setLoadingOrder(false);
      }
      void loadOrder(activeThread.orderId, { silent: !!cachedOrder });
      void loadMessages(activeThread.orderId, { silent: !!cachedMessages });
      pollTimer = setInterval(() => {
        void loadMessages(activeThread.orderId, { silent: true });
        void loadOrder(activeThread.orderId, { silent: true });
      }, 8000);
    } else {
      const cachedListing = mpListingCacheRef.current.get(key);
      if (cachedListing) {
        setMpListing(cachedListing);
      } else {
        const mpItem = inboxItemsRef.current.find(
          (item) =>
            item.kind === "marketplace" &&
            item.listing_id === activeThread.listingId &&
            item.buyer_id === activeThread.buyerId,
        );
        if (mpItem?.kind === "marketplace" && mpItem.listing) {
          setMpListing(mpItem.listing);
          mpListingCacheRef.current.set(key, mpItem.listing);
        }
      }
      setOrder(null);
      void loadMarketplaceMessages(activeThread.listingId, activeThread.buyerId, {
        silent: !!cachedMessages,
      });
      if (!cachedListing) {
        marketplaceApi.get(activeThread.listingId).then((r) => {
          if (r.success && r.data) {
            const l = r.data as Record<string, unknown>;
            const profiles = l.profiles as { id?: string } | undefined;
            const listing: NonNullable<MarketplaceConversation["listing"]> = {
              id: String(l.id),
              title: l.title as string | undefined,
              price: l.price as number | undefined,
              images: l.images as string[] | undefined,
              status: l.status as string | undefined,
              deal_confirmed: l.deal_confirmed as boolean | undefined,
              transport_booked: l.transport_booked as boolean | undefined,
              confirmed_buyer_id: l.confirmed_buyer_id as string | undefined,
              seller_id: (l.seller_id ?? profiles?.id) as string | undefined,
              chat_enabled: l.chat_enabled as boolean | undefined,
              deal_status_label: l.deal_status_label as string | null | undefined,
              area: l.area as string | undefined,
            };
            mpListingCacheRef.current.set(key, listing);
            setMpListing(listing);
            if (listing.chat_enabled !== undefined) setMpChatEnabled(listing.chat_enabled !== false);
            if (listing.deal_status_label !== undefined) setMpDealStatusLabel(listing.deal_status_label ?? null);
          }
        }).catch(() => {
          /* tin có thể đã bị xóa */
        });
      }
      pollTimer = setInterval(() => {
        void loadMarketplaceMessages(activeThread.listingId, activeThread.buyerId, {
          silent: true,
        });
      }, 8000);
    }

    return () => {
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [activeThread, loadOrder, loadMessages, loadMarketplaceMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const activeInboxItem = inboxItems.find((item) => {
    if (!activeThread) return false;
    if (activeThread.type === "order" && item.kind === "order") {
      return item.order_id === activeThread.orderId;
    }
    if (activeThread.type === "marketplace" && item.kind === "marketplace") {
      return (
        item.listing_id === activeThread.listingId && item.buyer_id === activeThread.buyerId
      );
    }
    return false;
  });

  const partnerName = useMemo(() => {
    if (activeMarketplace) {
      return activeInboxItem?.counterpart?.full_name ?? initialWithName ?? "Người bán";
    }
    if (isProvider) {
      return (
        order?.customer?.full_name ??
        order?.pickup_contact_name ??
        (activeInboxItem?.kind === "order" ? activeInboxItem.counterpart?.full_name : undefined) ??
        initialWithName ??
        "Khách hàng"
      );
    }
    return (
      order?.provider?.full_name ??
      order?.provider_name ??
      (activeInboxItem?.kind === "order" ? activeInboxItem.counterpart?.full_name : undefined) ??
      initialWithName ??
      "Nhà xe"
    );
  }, [isProvider, order, activeInboxItem, initialWithName, activeMarketplace]);

  const partnerPhone = useMemo(() => {
    if (activeInboxItem?.counterpart?.phone) return activeInboxItem.counterpart.phone;
    if (isProvider) {
      return order?.customer?.phone ?? order?.pickup_contact_phone;
    }
    return order?.provider?.phone ?? order?.provider_phone;
  }, [isProvider, order, activeInboxItem]);

  const canSendOrder = orderAllowsChat(order);
  const isMpBuyerInThread = !!activeMarketplace && userId === activeMarketplace.buyerId;
  const isMpSellerInThread = !!activeMarketplace && !isMpBuyerInThread;
  const isMpConfirmedBuyer =
    isMpBuyerInThread && mpListing?.confirmed_buyer_id === userId;
  const canSendMarketplace =
    !!activeMarketplace && mpChatEnabled !== false && mpListing?.status !== "closed";
  const canSend = activeMarketplace ? canSendMarketplace : canSendOrder;
  const blockReason = activeMarketplace
    ? !canSendMarketplace
      ? (mpDealStatusLabel ?? "Đã chốt — không nhận thêm tin nhắn.")
      : null
    : chatBlockReason(order);
  const dropoff = order?.dropoff_address ?? order?.delivery_address ?? "";
  const totalPrice = order?.final_price ?? order?.total_price ?? order?.estimated_price ?? 0;
  const messageGroups = groupMessagesByDate(messages);
  const vehicleType = order?.provider?.vehicle_type ?? order?.vehicle_size;
  const vehiclePlate = order?.provider_plate ?? null;

  const mapHref = useMemo(() => {
    if (!order?.pickup_address) return "#";
    const q = encodeURIComponent(`${order.pickup_address} to ${dropoff}`);
    return `https://www.google.com/maps/dir/?api=1&destination=${q}`;
  }, [order?.pickup_address, dropoff]);

  const refreshMpListing = useCallback(
    async (listingId: string, buyerId: string) => {
      const key = threadCacheKey({ type: "marketplace", listingId, buyerId });
      const r = await marketplaceApi.get(listingId);
      if (r.success && r.data) {
        const l = r.data as Record<string, unknown>;
        const profiles = l.profiles as { id?: string } | undefined;
        const listing: NonNullable<MarketplaceConversation["listing"]> = {
          id: String(l.id),
          title: l.title as string | undefined,
          price: l.price as number | undefined,
          images: l.images as string[] | undefined,
          status: l.status as string | undefined,
          deal_confirmed: l.deal_confirmed as boolean | undefined,
          transport_booked: l.transport_booked as boolean | undefined,
          confirmed_buyer_id: l.confirmed_buyer_id as string | undefined,
          seller_id: (l.seller_id ?? profiles?.id) as string | undefined,
          chat_enabled: l.chat_enabled as boolean | undefined,
          deal_status_label: l.deal_status_label as string | null | undefined,
          area: l.area as string | undefined,
        };
        mpListingCacheRef.current.set(key, listing);
        setMpListing(listing);
        if (listing.chat_enabled !== undefined) setMpChatEnabled(listing.chat_enabled !== false);
        if (listing.deal_status_label !== undefined) setMpDealStatusLabel(listing.deal_status_label ?? null);
      }
    },
    [],
  );

  const handleConfirmDeal = async () => {
    if (!activeMarketplace || mpDealLoading) return;
    const raw = dealPriceInput.replace(/\D/g, "");
    const agreedPrice = raw ? Number(raw) : undefined;
    if (!confirm("Chốt đơn với người mua này? Tin sẽ ẩn khỏi chợ và không nhận thêm người quan tâm mới.")) return;
    setMpDealLoading(true);
    try {
      await marketplaceApi.confirmDeal(activeMarketplace.listingId, activeMarketplace.buyerId, agreedPrice);
      setDealPriceInput("");
      await refreshMpListing(activeMarketplace.listingId, activeMarketplace.buyerId);
      await loadMarketplaceMessages(activeMarketplace.listingId, activeMarketplace.buyerId);
      await loadInbox();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Không chốt được đơn");
    } finally {
      setMpDealLoading(false);
    }
  };

  const handleCancelDeal = async () => {
    if (!activeMarketplace || mpDealLoading) return;
    if (!confirm("Huỷ chốt đơn? Tin sẽ hiện lại trên chợ.")) return;
    setMpDealLoading(true);
    try {
      await marketplaceApi.cancelDeal(activeMarketplace.listingId);
      await refreshMpListing(activeMarketplace.listingId, activeMarketplace.buyerId);
      await loadMarketplaceMessages(activeMarketplace.listingId, activeMarketplace.buyerId);
      await loadInbox();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Không huỷ được chốt");
    } finally {
      setMpDealLoading(false);
    }
  };

  const handleMarkTransport = async () => {
    if (!activeMarketplace || mpDealLoading) return;
    setMpDealLoading(true);
    try {
      await marketplaceApi.markTransportBooked(activeMarketplace.listingId);
      await refreshMpListing(activeMarketplace.listingId, activeMarketplace.buyerId);
      await loadMarketplaceMessages(activeMarketplace.listingId, activeMarketplace.buyerId);
      await loadInbox();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Không đặt xe được");
    } finally {
      setMpDealLoading(false);
    }
  };

  const handleConfirmReceived = async () => {
    if (!activeMarketplace || mpDealLoading) return;
    if (!confirm("Xác nhận đã nhận đồ? Giao dịch sẽ hoàn tất.")) return;
    setMpDealLoading(true);
    try {
      await marketplaceApi.confirmReceived(activeMarketplace.listingId);
      await refreshMpListing(activeMarketplace.listingId, activeMarketplace.buyerId);
      await loadMarketplaceMessages(activeMarketplace.listingId, activeMarketplace.buyerId);
      await loadInbox();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Không xác nhận được");
    } finally {
      setMpDealLoading(false);
    }
  };

  const sendAttachment = async (file: File) => {
    if (!activeThread || sending) return;

    if (activeThread.type === "marketplace" && !canSendMarketplace) return;
    if (activeThread.type === "order" && (!canSendOrder || !activeOrderId)) return;

    setSending(true);
    try {
      const up = await chatApi.uploadAttachment(file);
      if (!up.success || !up.data) {
        throw new Error(up.message || "Upload thất bại");
      }

      const caption = text.trim();
      const payload = {
        ...(caption ? { content: caption, text: caption } : {}),
        media_url: up.data.url,
        media_type: up.data.media_type,
        media_size: up.data.media_size,
        media_name: up.data.media_name,
      };

      if (activeThread.type === "marketplace") {
        await marketplaceApi.sendMessage(activeThread.listingId, activeThread.buyerId, payload);
        setText("");
        await loadMarketplaceMessages(activeThread.listingId, activeThread.buyerId);
        await loadInbox();
      } else if (activeOrderId) {
        await conversationsApi.sendMessage(activeOrderId, payload);
        setText("");
        await loadMessages(activeOrderId);
        await loadInbox();
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Không gửi được tệp đính kèm");
    } finally {
      setSending(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const send = async () => {
    const body = text.trim();
    if (!body || sending || !activeThread) return;

    if (activeThread.type === "marketplace") {
      if (!canSendMarketplace) return;
      setSending(true);
      try {
        await marketplaceApi.sendMessage(activeThread.listingId, activeThread.buyerId, body);
        setText("");
        await loadMarketplaceMessages(activeThread.listingId, activeThread.buyerId);
        await loadInbox();
      } finally {
        setSending(false);
      }
      return;
    }

    if (!canSendOrder || !activeOrderId) return;
    setSending(true);
    try {
      await conversationsApi.sendMessage(activeOrderId, body);
      setText("");
      await loadMessages(activeOrderId);
      await loadInbox();
    } finally {
      setSending(false);
    }
  };

  const selectInboxItem = (item: InboxItem) => {
    setSidebarTab("messages");
    setSelectedNotifId(null);
    if (item.kind === "order") {
      setActiveThread({ type: "order", orderId: item.order_id });
    } else {
      setActiveThread({
        type: "marketplace",
        listingId: item.listing_id,
        buyerId: item.buyer_id,
      });
    }
  };

  const handleNotificationClick = async (n: NotificationRow) => {
    setSelectedNotifId(n.id);
    const unread = !(n.read ?? n.is_read);
    if (unread) {
      await notificationsApi.markRead(n.id);
      setNotifs((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, is_read: true, read: true } : x)),
      );
    }

    const target = resolveNotificationTarget(n);
    if (target.kind === "quote") {
      router.push(target.href);
      return;
    }
    if (target.kind === "marketplace_thread") {
      setSidebarTab("messages");
      setActiveThread({
        type: "marketplace",
        listingId: target.listingId,
        buyerId: target.buyerId,
      });
      return;
    }
    if (target.kind === "order_chat") {
      setSidebarTab("messages");
      setActiveThread({ type: "order", orderId: target.orderId });
      return;
    }
    setActiveThread(null);
  };

  const selectedNotif = notifs.find((n) => n.id === selectedNotifId) ?? null;

  const handleRefresh = () => {
    if (sidebarTab === "messages") loadInbox();
    else loadNotifs();
  };

  const hideLeftOnMobile =
    (sidebarTab === "messages" && hasActiveChat) ||
    (sidebarTab === "notifications" && (hasActiveChat || !!selectedNotifId));
  const hasCenterContent = hasActiveChat || (sidebarTab === "notifications" && !!selectedNotif);

  return (
    <div
      className={cn(
        "flex overflow-hidden rounded-2xl border border-gray-200 bg-[#F4F6FA] shadow-sm",
        className ?? "h-[calc(100vh-72px-2rem)] min-h-[560px]",
      )}
    >
      {/* ── Cột trái ── */}
      <aside
        className={cn(
          "flex w-full shrink-0 flex-col border-r border-gray-200 bg-white lg:w-[280px]",
          hideLeftOnMobile ? "hidden lg:flex" : "flex",
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Tin nhắn</h2>
            <p className="mt-0.5 text-xs text-gray-400">
              {enableNotificationsTab
                ? "Chat & thông báo đơn hàng"
                : showInboxCategoryTabs
                  ? "Chat với tài xế & người mua/bán"
                  : "Chat theo đơn hàng"}
            </p>
          </div>
          <motion.button
            type="button"
            whileTap={{ scale: 0.9, rotate: 180 }}
            transition={{ duration: 0.35 }}
            onClick={handleRefresh}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-50"
          >
            <RefreshCw size={15} />
          </motion.button>
        </div>

        {enableNotificationsTab && (
          <div className="relative mx-3 mb-2 mt-1 flex shrink-0 gap-1 rounded-xl bg-gray-100 p-1">
            {(["messages", "notifications"] as const).map((key) => {
              const label = key === "messages" ? "Tin nhắn" : "Thông báo";
              const active = sidebarTab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setSidebarTab(key);
                    if (key === "messages") setSelectedNotifId(null);
                  }}
                  className={cn(
                    "relative z-10 flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors",
                    active ? "text-gray-900" : "text-gray-400 hover:text-gray-600",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="chat-sidebar-tab"
                      className="absolute inset-0 rounded-lg bg-white shadow-sm"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    />
                  )}
                  <span className="relative">{label}</span>
                </button>
              );
            })}
          </div>
        )}

        {showInboxCategoryTabs && sidebarTab === "messages" && (
          <div className="relative mx-3 mb-2 mt-1 flex shrink-0 gap-1 rounded-xl bg-gray-100 p-1">
            {([
              { key: "chuyen-tro" as const, label: "Chuyển trọ", Icon: Truck },
              { key: "pass-do" as const, label: "Pass đồ", Icon: ShoppingBag },
            ]).map(({ key, label, Icon }) => {
              const active = inboxCategory === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleInboxCategoryChange(key)}
                  className={cn(
                    "relative z-10 flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-semibold transition-colors",
                    active ? "text-gray-900" : "text-gray-400 hover:text-gray-600",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="chat-inbox-category-tab"
                      className="absolute inset-0 rounded-lg bg-white shadow-sm"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    />
                  )}
                  <Icon size={13} className="relative" />
                  <span className="relative">{label}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {sidebarTab === "messages" ? (
              <motion.div
                key="msg-list"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
              >
                {loadingList ? (
                  <div className="space-y-2 p-3">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-[72px] rounded-xl" />
                    ))}
                  </div>
                ) : visibleInboxItems.length === 0 ? (
                  <div className="flex flex-col items-center px-6 py-16 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50">
                      {showInboxCategoryTabs && inboxCategory === "pass-do" ? (
                        <ShoppingBag size={28} className="text-gray-300" />
                      ) : (
                        <MessageSquare size={28} className="text-gray-300" />
                      )}
                    </div>
                    <p className="text-sm font-bold text-gray-800">
                      {showInboxCategoryTabs && inboxCategory === "pass-do"
                        ? "Chưa có hội thoại"
                        : "Chưa có tin nhắn"}
                    </p>
                    <Link
                      href={
                        showInboxCategoryTabs && inboxCategory === "pass-do"
                          ? "/cho-sinh-vien"
                          : "/dat-chuyen"
                      }
                      className="mt-2 text-xs font-semibold text-[#2563EB] no-underline"
                    >
                      {showInboxCategoryTabs && inboxCategory === "pass-do"
                        ? "Khám phá Chợ sinh viên"
                        : "Đặt chuyến để bắt đầu"}
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-0.5 p-2">
                    {visibleInboxItems.map((item, idx) => {
                      const active =
                        !!activeThread &&
                        ((item.kind === "order" &&
                          activeThread.type === "order" &&
                          activeThread.orderId === item.order_id) ||
                          (item.kind === "marketplace" &&
                            activeThread.type === "marketplace" &&
                            activeThread.listingId === item.listing_id &&
                            activeThread.buyerId === item.buyer_id));
                      const name =
                        item.counterpart?.full_name ??
                        (item.kind === "marketplace" ? "Chợ SV" : isProvider ? "Khách hàng" : "Nhà xe");
                      const preview =
                        item.kind === "marketplace"
                          ? marketplaceListPreview(item)
                          : item.last_message_preview || "Bắt đầu trò chuyện";
                      const { Icon, bg, color } = inboxListIcon(item);
                      const rowKey =
                        item.kind === "order"
                          ? `order-${item.order_id}`
                          : `mp-${item.listing_id}-${item.buyer_id}`;
                      return (
                        <motion.button
                          key={rowKey}
                          type="button"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.04, duration: 0.22 }}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => selectInboxItem(item)}
                          className={cn(
                            "flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors",
                            active
                              ? "border-amber-200 shadow-sm"
                              : "border-transparent hover:border-gray-100 hover:bg-gray-50/80",
                          )}
                          style={active ? { backgroundColor: ACTIVE_LIST_BG } : undefined}
                        >
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                            style={{ backgroundColor: bg, color }}
                          >
                            <Icon size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={cn(
                                  "truncate text-sm",
                                  item.unread_count > 0 ? "font-bold text-gray-900" : "font-semibold text-gray-800",
                                )}
                              >
                                {name}
                              </span>
                              <span className="shrink-0 text-[10px] text-gray-400">
                                {item.last_message_at ? timeAgo(item.last_message_at) : ""}
                              </span>
                            </div>
                            <p
                              className={cn(
                                "mt-0.5 truncate text-xs",
                                item.unread_count > 0 ? "font-medium text-gray-700" : "text-gray-500",
                              )}
                            >
                              {preview}
                            </p>
                          </div>
                          {item.unread_count > 0 && (
                            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#2563EB] px-1 text-[10px] font-bold text-white">
                              {item.unread_count > 9 ? "9+" : item.unread_count}
                            </span>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="notif-list"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
              >
                {notifLoading ? (
                  <div className="space-y-2 p-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 rounded-xl" />
                    ))}
                  </div>
                ) : notifs.length === 0 ? (
                  <div className="flex flex-col items-center px-6 py-16 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50">
                      <Bell size={28} className="text-gray-300" />
                    </div>
                    <p className="text-sm font-bold text-gray-800">Chưa có thông báo</p>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {notifs.map((n, idx) => {
                      const { Icon, bg, color } = notifVisual(n);
                      const unread = !(n.read ?? n.is_read);
                      const active = selectedNotifId === n.id;
                      return (
                        <motion.button
                          key={n.id}
                          type="button"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => handleNotificationClick(n)}
                          className={cn(
                            "flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors",
                            active
                              ? "border-amber-200 shadow-sm"
                              : "border-transparent hover:border-gray-100 hover:bg-gray-50/80",
                          )}
                          style={active ? { backgroundColor: ACTIVE_LIST_BG } : undefined}
                        >
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                            style={{ backgroundColor: bg, color }}
                          >
                            <Icon size={17} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                "line-clamp-2 text-sm leading-snug",
                                unread ? "font-bold text-gray-900" : "font-semibold text-gray-700",
                              )}
                            >
                              {n.title}
                            </p>
                            <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                              {n.body || n.message}
                            </p>
                            <p className="mt-1.5 text-[10px] text-gray-400">{timeAgo(n.created_at)}</p>
                          </div>
                          {unread && (
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#2563EB]" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {enableNotificationsTab && (
          <div className="flex shrink-0 items-center justify-around border-t border-gray-100 px-4 py-3">
            <Link
              href="/tai-khoan"
              className="flex items-center gap-2 text-xs font-medium text-gray-500 no-underline transition-colors hover:text-gray-800"
            >
              <Settings size={14} /> Cài đặt
            </Link>
            <Link
              href="/tai-khoan"
              className="flex items-center gap-2 text-xs font-medium text-gray-500 no-underline transition-colors hover:text-gray-800"
            >
              <HelpCircle size={14} /> Trợ giúp
            </Link>
          </div>
        )}
      </aside>

      {/* ── Cột giữa: chat ── */}
      <section
        className={cn(
          "flex min-w-0 flex-1 flex-col bg-[#FAFBFC]",
          hasCenterContent ? "flex" : "hidden lg:flex",
        )}
      >
        <AnimatePresence mode="wait">
          {!hasActiveChat && sidebarTab === "notifications" && selectedNotif ? (
            <NotificationDetailPanel
              key={selectedNotif.id}
              notification={selectedNotif}
              onBack={() => setSelectedNotifId(null)}
              onAction={() => {
                const target = resolveNotificationTarget(selectedNotif);
                if (target.kind === "quote") {
                  router.push(target.href);
                } else if (target.kind === "marketplace_thread") {
                  setSidebarTab("messages");
                  setActiveThread({
                    type: "marketplace",
                    listingId: target.listingId,
                    buyerId: target.buyerId,
                  });
                } else if (target.kind === "order_chat") {
                  setSidebarTab("messages");
                  setActiveThread({ type: "order", orderId: target.orderId });
                }
              }}
            />
          ) : !hasActiveChat ? (
            <motion.div
              key="no-chat"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-1 flex-col items-center justify-center px-8 text-center"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="mb-5 flex h-20 w-20 items-center justify-center rounded-full"
                style={{ background: "linear-gradient(135deg, #EFF6FF, #DBEAFE)" }}
              >
                <MessageSquare size={32} className="text-[#2563EB]" />
              </motion.div>
              <p className="font-bold text-gray-800">
                {sidebarTab === "notifications" ? "Chọn một thông báo" : "Chọn cuộc trò chuyện"}
              </p>
              <p className="mt-1 max-w-sm text-sm text-gray-400">
                {sidebarTab === "notifications"
                  ? "Nhấn vào thông báo bên trái để xem chi tiết hoặc mở đơn hàng liên quan"
                  : "Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu chat"}
              </p>
            </motion.div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              <header className="flex shrink-0 items-center gap-3 border-b border-gray-100 bg-white px-4 py-3">
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 lg:hidden"
                  onClick={() => {
                    setActiveThread(null);
                    if (sidebarTab === "messages") setSelectedNotifId(null);
                  }}
                >
                  <ArrowLeft size={18} />
                </button>
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: `linear-gradient(135deg, #2563EB, ${NAVY_LIGHT})` }}
                >
                  {partnerInitials(partnerName)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-gray-900">{partnerName}</p>
                  {activeMarketplace ? (
                    <p className="truncate text-xs text-gray-400">
                      Chợ SV · {mpListing?.title ?? "Tin đăng"}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400">
                      Đơn #{activeOrderId?.slice(0, 8).toUpperCase()}
                    </p>
                  )}
                </div>
                {partnerPhone && (
                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    href={`tel:${partnerPhone}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    <Phone size={16} />
                  </motion.a>
                )}
                <button
                  type="button"
                  className="hidden h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 sm:flex"
                >
                  <MoreVertical size={16} />
                </button>
              </header>

              <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
                {loadingMessages && messages.length === 0 ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-2/3 rounded-2xl" />
                    <Skeleton className="h-12 w-1/2 rounded-2xl ml-auto" />
                  </div>
                ) : messages.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex h-full flex-col items-center justify-center py-12 text-center"
                  >
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                      <MessageCircle size={28} className="text-gray-400" />
                    </div>
                    <p className="text-base font-semibold text-gray-700">Chưa có tin nhắn</p>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-400">
                      Hãy bắt đầu cuộc trò chuyện với {partnerName} để
                      {activeMarketplace ? " thương lượng và chốt đơn." : " sắp xếp thời gian vận chuyển tốt nhất."}
                    </p>
                  </motion.div>
                ) : (
                  messageGroups.map((group) => (
                    <div key={group.label} className="space-y-3">
                      <div className="flex justify-center">
                        <span className="rounded-full border border-gray-100 bg-white px-3 py-1 text-[10px] font-bold tracking-wide text-gray-400">
                          {group.label}
                        </span>
                      </div>
                      {group.items.map((m) => (
                        <div key={m.id}>
                          <MessageBubble message={m} partnerName={partnerName} />
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>

              {activeMarketplace && mpListing && (
                <div className="shrink-0 space-y-2 border-t border-gray-100 bg-white px-4 py-3">
                  {mpDealStatusLabel && (
                    <p
                      className={cn(
                        "rounded-lg px-3 py-2 text-center text-xs font-semibold",
                        mpChatEnabled === false
                          ? "border border-amber-200 bg-amber-50 text-amber-900"
                          : "border border-emerald-200 bg-emerald-50 text-emerald-800",
                      )}
                    >
                      {mpDealStatusLabel}
                    </p>
                  )}

                  {isMpSellerInThread &&
                    !mpListing.deal_confirmed &&
                    mpListing.status !== "closed" && (
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={dealPriceInput}
                          onChange={(e) => setDealPriceInput(e.target.value)}
                          placeholder={
                            mpListing.price
                              ? `Giá chốt (mặc định ${formatVND(mpListing.price)})`
                              : "Giá chốt (tuỳ chọn)"
                          }
                          className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#2563EB]"
                        />
                        <Button
                          type="button"
                          disabled={mpDealLoading}
                          onClick={handleConfirmDeal}
                          className="shrink-0 rounded-xl bg-emerald-600 font-semibold hover:bg-emerald-700"
                        >
                          <CheckCircle size={16} className="mr-1.5" />
                          Chốt đơn
                        </Button>
                      </div>
                    )}

                  {isMpSellerInThread &&
                    mpListing.deal_confirmed &&
                    !mpListing.transport_booked &&
                    mpListing.status !== "closed" && (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={mpDealLoading}
                        onClick={handleCancelDeal}
                        className="w-full rounded-xl border-amber-200 text-amber-800 hover:bg-amber-50"
                      >
                        Huỷ chốt đơn
                      </Button>
                    )}

                  {isMpConfirmedBuyer &&
                    mpListing.deal_confirmed &&
                    !mpListing.transport_booked &&
                    mpListing.status !== "closed" && (
                      <Button
                        type="button"
                        disabled={mpDealLoading}
                        onClick={handleMarkTransport}
                        className="w-full rounded-xl bg-[#2563EB] font-semibold hover:bg-[#1D4ED8]"
                      >
                        <Truck size={16} className="mr-1.5" />
                        Đặt xe lấy đồ
                      </Button>
                    )}

                  {isMpConfirmedBuyer &&
                    mpListing.deal_confirmed &&
                    mpListing.transport_booked &&
                    mpListing.status === "reserved" && (
                      <Button
                        type="button"
                        disabled={mpDealLoading}
                        onClick={handleConfirmReceived}
                        className="w-full rounded-xl bg-[#2563EB] font-semibold hover:bg-[#1D4ED8]"
                      >
                        <CheckCircle size={16} className="mr-1.5" />
                        Xác nhận đã nhận hàng
                      </Button>
                    )}
                </div>
              )}

              {!canSend && blockReason && (
                <div className="border-t border-amber-100 bg-amber-50 px-4 py-2.5 text-center text-xs text-amber-800">
                  {blockReason}
                </div>
              )}

              {canSend && (
                <div className="shrink-0 border-t border-gray-100 bg-white px-4 py-3">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void sendAttachment(file);
                    }}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,application/zip"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void sendAttachment(file);
                    }}
                  />
                  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 focus-within:border-gray-300 focus-within:ring-2 focus-within:ring-gray-200">
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          send();
                        }
                      }}
                      placeholder="Nhập tin nhắn... (Enter để gửi)"
                      rows={2}
                      className="w-full resize-none bg-transparent px-4 pt-3 text-sm text-gray-900 outline-none placeholder:text-gray-400"
                    />
                    <div className="flex items-center justify-between px-3 pb-2.5">
                      <div className="flex items-center gap-1">
                        {[
                          {
                            Icon: Paperclip,
                            label: "Đính kèm file",
                            onClick: () => fileInputRef.current?.click(),
                          },
                          { Icon: Smile, label: "Emoji" },
                          {
                            Icon: ImageIcon,
                            label: "Gửi ảnh",
                            onClick: () => imageInputRef.current?.click(),
                          },
                        ].map(({ Icon, label, onClick }) => (
                          <button
                            key={label}
                            type="button"
                            aria-label={label}
                            disabled={sending}
                            onClick={onClick}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white hover:text-gray-600 disabled:opacity-40"
                          >
                            <Icon size={17} />
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="hidden text-[10px] text-gray-400 sm:inline">
                          Shift+Enter để xuống dòng
                        </span>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                          <Button
                            type="button"
                            onClick={send}
                            disabled={sending || !text.trim()}
                            className="h-9 gap-1.5 rounded-xl px-4 text-sm font-bold text-white shadow-sm"
                            style={{ backgroundColor: NAVY }}
                          >
                            <Send size={15} /> Gửi
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
      </section>

      {/* ── Cột phải: chi tiết đơn ── */}
      <aside
        className={cn(
          "hidden w-[300px] shrink-0 flex-col border-l border-gray-200 bg-white xl:flex",
          !hasActiveChat && "xl:hidden",
        )}
      >
        <AnimatePresence mode="wait">
          {hasActiveChat && activeMarketplace && (
            <div className="flex h-full flex-col overflow-y-auto p-4">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Chi tiết tin đăng
              </h3>
              <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                <p className="text-sm font-bold text-gray-900">{mpListing?.title ?? "Tin đăng"}</p>
                <p className="mt-2 text-base font-extrabold text-[#2563EB]">
                  {!mpListing?.price || mpListing.price === 0
                    ? "Miễn phí"
                    : formatVND(mpListing.price)}
                </p>
                {mpListing?.deal_status_label ? (
                  <p className="mt-2 text-xs font-semibold text-amber-800">{mpListing.deal_status_label}</p>
                ) : mpListing?.deal_confirmed ? (
                  <p className="mt-2 text-xs font-semibold text-emerald-700">Đã chốt đơn</p>
                ) : null}
              </div>
              <Link
                href={`/cho-sinh-vien/${activeMarketplace.listingId}`}
                className="mt-4 block rounded-xl border border-gray-200 py-2.5 text-center text-sm font-semibold text-gray-700 no-underline transition-colors hover:bg-gray-50"
              >
                Xem tin đăng
              </Link>
            </div>
          )}
          {hasActiveChat && activeOrderId && !activeMarketplace && (
            <div className="flex h-full flex-col overflow-y-auto">
              <div className="border-b border-gray-100 p-4">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Chi tiết đơn hàng
                </h3>
              </div>

              {loadingOrder && !order ? (
                <div className="space-y-3 p-4">
                  <Skeleton className="h-20 rounded-xl" />
                  <Skeleton className="h-32 rounded-xl" />
                  <Skeleton className="h-24 rounded-xl" />
                </div>
              ) : order ? (
                <div className="flex flex-1 flex-col gap-4 p-4">
                  <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                      Trạng thái
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#2563EB]" />
                      <span className="text-sm font-bold text-gray-900">
                        {getOrderStatusLabel(order.status)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="relative pl-4">
                      <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-[#2563EB]" />
                      <span className="absolute bottom-0 left-[3px] top-4 w-0.5 bg-gray-200" />
                      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                        Điểm đi
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-snug text-gray-900">
                        {shortAddress(order.pickup_address, 80)}
                      </p>
                    </div>
                    <div className="relative pl-4">
                      <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-emerald-500" />
                      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                        Điểm đến
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-snug text-gray-900">
                        {shortAddress(dropoff, 80) || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-violet-100 bg-violet-50/80 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-violet-600">
                      Thông tin xe
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                        <Truck size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900">
                          {vehicleChatLabel(vehicleType)}
                        </p>
                        {vehiclePlate && (
                          <p className="text-xs font-medium text-gray-500">{vehiclePlate}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {totalPrice > 0 && (
                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <p className="text-[10px] text-gray-400">Phí vận chuyển</p>
                      <p className="text-base font-extrabold text-[#2563EB]">{formatVND(totalPrice)}</p>
                    </div>
                  )}

                  <div className="relative h-36 overflow-hidden rounded-xl bg-[#E8EDF5]">
                    <div
                      className="absolute inset-0 opacity-60"
                      style={{
                        backgroundImage:
                          "linear-gradient(135deg, #c8d6e8 25%, transparent 25%), linear-gradient(225deg, #c8d6e8 25%, transparent 25%), linear-gradient(45deg, #c8d6e8 25%, transparent 25%), linear-gradient(315deg, #c8d6e8 25%, #dde5ef 25%)",
                        backgroundSize: "20px 20px",
                        backgroundPosition: "0 0, 10px 0, 10px -10px, 0 10px",
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <MapPin size={28} className="text-[#2563EB]/60" />
                    </div>
                    <a
                      href={mapHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-gray-700 shadow-md no-underline transition-transform hover:scale-105"
                    >
                      Xem bản đồ trực tuyến
                    </a>
                  </div>

                  <Link
                    href={orderDetailPath(activeOrderId)}
                    className="mt-auto block rounded-xl border border-gray-200 py-2.5 text-center text-sm font-semibold text-gray-700 no-underline transition-colors hover:bg-gray-50"
                  >
                    Xem chi tiết đơn
                  </Link>
                </div>
              ) : (
                <p className="p-4 text-sm text-gray-400">Không tải được thông tin đơn.</p>
              )}
            </div>
          )}
        </AnimatePresence>
      </aside>
    </div>
  );
}

function NotificationDetailPanel({
  notification,
  onBack,
  onAction,
}: {
  notification: NotificationRow;
  onBack?: () => void;
  onAction: () => void;
}) {
  const { Icon, bg, color } = notifVisual(notification);
  const target = resolveNotificationTarget(notification);
  const actionLabel =
    target.kind === "order_chat"
      ? "Mở chat đơn hàng"
      : target.kind === "quote"
        ? "Xem báo giá"
        : target.kind === "marketplace_thread"
          ? "Mở tin nhắn Chợ SV"
          : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-1 flex-col"
    >
      <div className="flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3.5 lg:hidden">
        <button
          type="button"
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
        >
          <ArrowLeft size={18} />
        </button>
        <p className="text-sm font-bold text-gray-900">Chi tiết thông báo</p>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-8 py-10 text-center">
        <div
          className="mb-5 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: bg, color }}
        >
          <Icon size={28} />
        </div>
        <h3 className="text-lg font-bold text-gray-900">{notification.title}</h3>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-500">
          {notification.body || notification.message}
        </p>
        <p className="mt-4 text-xs text-gray-400">{timeAgo(notification.created_at)}</p>
        {actionLabel && (
          <Button
            type="button"
            onClick={onAction}
            className="mt-6 rounded-xl px-6 text-white"
            style={{ backgroundColor: NAVY }}
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </motion.div>
  );
}

function shouldShowCaption(message: ChatMessage) {
  const content = message.content?.trim();
  if (!content) return false;
  if (message.media_url && message.media_type?.startsWith("image/") && content === "📷 Ảnh") {
    return false;
  }
  if (message.media_name && content === `📎 ${message.media_name}`) return false;
  if (message.media_url && content === "📎 Tệp đính kèm") return false;
  return true;
}

function MessageBubble({
  message: m,
  partnerName,
}: {
  message: ChatMessage;
  partnerName: string;
}) {
  const isSystem =
    m.message_type === "system" ||
    m.message_type === "orderUpdate" ||
    m.message_type === "location";

  if (isSystem || m.message_type === "location") {
    return (
      <div className="mx-auto flex max-w-md gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
        <MapPin size={18} className="mt-0.5 shrink-0 text-[#2563EB]" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{m.location_name || m.content}</p>
          {m.location_name && m.content !== m.location_name && (
            <p className="mt-1 text-xs text-gray-600">{m.content}</p>
          )}
        </div>
      </div>
    );
  }

  const mine = m.is_mine ?? false;
  const isImage =
    m.message_type === "image" ||
    (!!m.media_url && (m.media_type?.startsWith("image/") ?? false));
  const isFile = !!m.media_url && !isImage;
  const showCaption = shouldShowCaption(m);

  return (
    <div className={cn("flex gap-2", mine ? "justify-end" : "justify-start")}>
      {!mine && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200">
          <Truck size={14} className="text-gray-500" />
        </div>
      )}
      <div className={cn("max-w-[75%]", mine && "flex flex-col items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
            mine
              ? "rounded-br-md text-white"
              : "rounded-bl-md border border-gray-100 bg-white text-gray-800",
          )}
          style={mine ? { backgroundColor: NAVY_LIGHT } : undefined}
        >
          {isImage && m.media_url && (
            <a
              href={m.media_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-2 block overflow-hidden rounded-xl"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.media_url}
                alt={m.media_name || "Ảnh đính kèm"}
                className="max-h-56 w-full object-cover"
              />
            </a>
          )}
          {isFile && m.media_url && (
            <a
              href={m.media_url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "mb-2 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium",
                mine
                  ? "border-white/20 bg-white/10 text-white hover:bg-white/15"
                  : "border-gray-200 bg-gray-50 text-gray-800 hover:bg-gray-100",
              )}
            >
              <FileText size={16} className="shrink-0" />
              <span className="truncate">{m.media_name || "Tải file đính kèm"}</span>
            </a>
          )}
          {showCaption && <p className="whitespace-pre-wrap break-words">{m.content}</p>}
        </div>
        <div className={cn("mt-1 flex items-center gap-1.5 px-1", mine && "flex-row-reverse")}>
          <span className="text-[10px] text-gray-400">
            {formatChatTime(m.created_at)}
            {!mine && ` · ${m.sender?.full_name ?? partnerName}`}
          </span>
          {mine && (
            <CheckCheck size={12} className={m.is_read ? "text-[#2563EB]" : "text-gray-300"} />
          )}
        </div>
      </div>
      {mine && (
        <div
          className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ background: `linear-gradient(135deg, #2563EB, ${NAVY_LIGHT})` }}
        >
          {(getStoredUser()?.full_name ?? "B")[0]?.toUpperCase()}
        </div>
      )}
    </div>
  );
}
