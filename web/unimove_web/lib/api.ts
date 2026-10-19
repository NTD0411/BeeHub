import { getStoredToken } from "./auth";
import { toApiCategory } from "@/lib/marketplace/categories";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: { page: number; pageSize: number; total: number; pages: number };
  listings?: T[];
  notifications?: T[];
  unread_count?: number;
}

export interface ApiError extends Error { status?: number; }

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = getStoredToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers: { ...headers, ...options.headers } });
  } catch {
    const err: ApiError = new Error("Không kết nối được máy chủ. Vui lòng thử lại sau.");
    err.status = 0;
    throw err;
  }
  const text = await res.text();
  let data: ApiResponse<T>;
  try {
    data = text ? JSON.parse(text) : { success: false };
  } catch {
    const err: ApiError = new Error(
      res.status === 404
        ? "Không tìm thấy API backend. Hãy chạy backend (npm run dev --prefix backend) trên port 3000 và kiểm tra NEXT_PUBLIC_API_URL."
        : "Máy chủ trả về phản hồi không hợp lệ. Vui lòng thử lại sau."
    );
    err.status = res.status;
    throw err;
  }
  if (!res.ok) {
    const err: ApiError = new Error(data.message || (data as { error?: string }).error || "API error");
    err.status = res.status;
    throw err;
  }
  return data;
}

async function upload<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
  const token = getStoredToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, { method: "POST", headers, body: formData });
  } catch {
    const err: ApiError = new Error("Không kết nối được máy chủ. Vui lòng thử lại sau.");
    err.status = 0;
    throw err;
  }
  const text = await res.text();
  let data: ApiResponse<T>;
  try {
    data = text ? JSON.parse(text) : { success: false };
  } catch {
    const err: ApiError = new Error("Máy chủ trả về phản hồi không hợp lệ khi tải lên.");
    err.status = res.status;
    throw err;
  }
  if (!res.ok) { const err: ApiError = new Error(data.message || (data as { error?: string }).error || "Upload failed"); err.status = res.status; throw err; }
  return data;
}

function buildUrl(endpoint: string, params?: Record<string, unknown>): string {
  if (!params) return endpoint;
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null) sp.append(k, String(v)); });
  const q = sp.toString();
  return q ? `${endpoint}?${q}` : endpoint;
}

const get  = <T>(ep: string, p?: Record<string, unknown>) => request<T>(buildUrl(ep, p));
const post  = <T>(ep: string, body?: unknown) => request<T>(ep, { method: "POST", body: JSON.stringify(body) });
const patch = <T>(ep: string, body?: unknown) => request<T>(ep, { method: "PATCH", body: JSON.stringify(body) });
const put   = <T>(ep: string, body?: unknown) => request<T>(ep, { method: "PUT",   body: JSON.stringify(body) });
const del   = <T>(ep: string) => request<T>(ep, { method: "DELETE" });

/** Chuẩn hóa order từ DB sang field frontend dùng */
export function normalizeOrder(raw: Record<string, unknown>) {
  const delivery = (raw.delivery_address ?? raw.dropoff_address) as string | undefined;
  const pickup = raw.pickup_address as string | undefined;
  return {
    ...raw,
    pickup_address: pickup ?? "",
    dropoff_address: delivery ?? "",
    delivery_address: delivery ?? "",
    floor_number: raw.floor_number ?? raw.pickup_floor,
    estimated_price: raw.estimated_price ?? raw.total_price ?? raw.base_price,
    final_price: raw.final_price ?? raw.total_price,
    description: raw.description ?? raw.pickup_notes,
    status: raw.status as string | undefined,
  };
}

/** Chuẩn hóa listing marketplace */
export function normalizeListing(raw: Record<string, unknown>) {
  const profiles = raw.profiles as { id?: string; full_name?: string; avatar_url?: string } | undefined;
  const ownerId = (raw.owner_id ?? profiles?.id) as string | undefined;
  return {
    ...raw,
    city: raw.city ?? raw.area,
    area: raw.area ?? raw.city,
    seller_id: raw.seller_id ?? ownerId,
    seller: raw.seller ?? (profiles ? { full_name: profiles.full_name, avatar_url: profiles.avatar_url } : undefined),
  };
}

/** Chuẩn hóa notification */
export function normalizeNotification(raw: Record<string, unknown>) {
  return {
    ...raw,
    type: raw.type ?? raw.notification_type,
    action_url: raw.action_url ?? null,
  };
}

/** Chuẩn hóa chat message */
export function normalizeMessage(raw: Record<string, unknown>, buyerId?: string) {
  const fromBuyer = raw.from_buyer as boolean | undefined;
  return {
    ...raw,
    content: raw.content ?? raw.text,
    sender_id: raw.sender_id ?? (fromBuyer === true ? buyerId : fromBuyer === false ? "seller" : undefined),
    from_buyer: fromBuyer,
  };
}

function normalizeOrdersResponse(res: ApiResponse) {
  if (!res.success || !res.data) return res;
  const d = res.data as Record<string, unknown> | unknown[];
  if (Array.isArray(d)) {
    return { ...res, data: d.map(o => normalizeOrder(o as Record<string, unknown>)) };
  }
  if (Array.isArray(d.orders)) {
    return { ...res, data: { ...d, orders: (d.orders as Record<string, unknown>[]).map(normalizeOrder) } };
  }
  return { ...res, data: normalizeOrder(d as Record<string, unknown>) };
}

function normalizeListingsResponse(res: ApiResponse) {
  const listings = (res.listings ?? (res.data as { listings?: unknown[] })?.listings) as Record<string, unknown>[] | undefined;
  if (!listings) return res;
  const normalized = listings.map(normalizeListing);
  return { ...res, success: res.success ?? true, data: { listings: normalized }, listings: normalized };
}

function normalizeNotificationsResponse(res: ApiResponse) {
  const raw = res as ApiResponse & { notifications?: Record<string, unknown>[] };
  if (raw.notifications) {
    const notifications = raw.notifications.map(normalizeNotification);
    return { success: true, data: { notifications } };
  }
  return res;
}

function normalizeUnreadCountResponse(res: ApiResponse) {
  const raw = res as ApiResponse & { unread_count?: number };
  if (raw.unread_count !== undefined) {
    return { success: true, data: { count: raw.unread_count } };
  }
  return res;
}

/* ── Auth ── */
export const authApi = {
  login: (email: string, password: string) => post("/auth/login", { email, password }),
  register: (body: Record<string, unknown>) => post("/auth/register", body),
  forgotPassword: (email: string) => post("/auth/forgot-password", { email }),
  resetPassword: (email: string, token: string, newPassword: string) =>
    post("/auth/reset-password", { email, token, newPassword }),
  getMe: () => get("/auth/me"),
  updateMe: (body: Record<string, unknown>) => patch("/auth/me", body),
  changePassword: (currentPassword: string, newPassword: string) =>
    post("/auth/change-password", { current_password: currentPassword, new_password: newPassword }),
  logout: () => post("/auth/logout", {}),
  googleAuth: (idToken: string) => post("/auth/google", { id_token: idToken }),
  sendPhoneOtp: (phone: string, userId: string) => post("/auth/send-phone-otp", { phone, user_id: userId }),
  verifyPhoneOtp: (otp: string, userId: string) => post("/auth/verify-phone-otp", { otp, user_id: userId }),
  deleteAccount: () => del("/auth/me"),
};

/* ── Customer ── */
export const customerApi = {
  getMe: () => get("/customers/me"),
  updateMe: (body: Record<string, unknown>) => patch("/customers/me", body),
  getRecentPlaces: async () => {
    const res = await get<Array<{ title?: string; address: string; lat?: number; lng?: number }>>("/customers/me/recent-places");
    if (res.success && Array.isArray(res.data)) {
      return {
        ...res,
        data: res.data.map((p, i) => ({
          id: p.address || String(i),
          address: p.address,
          label: p.title ?? p.address.split(",")[0]?.trim(),
        })),
      };
    }
    return res;
  },
  uploadAvatar: (file: File) => { const fd = new FormData(); fd.append("avatar", file); return upload("/customers/me/avatar", fd); },
  addRecentPlace: (body: { address: string; title?: string; lat?: number; lng?: number }) =>
    post("/customers/me/recent-places", body),
  clearRecentPlaces: () => del("/customers/me/recent-places"),
  getBookingLocations: () => get("/customers/me/booking-locations"),
};

/* ── Orders ── */
export const ordersApi = {
  list: async (params?: Record<string, unknown>) => {
    const res = await get("/orders", params);
    if (res.success && Array.isArray(res.data)) {
      let orders = (res.data as Record<string, unknown>[]).map(normalizeOrder);
      const status = params?.status as string | undefined;
      if (status) {
        const allowed = status.split(",").map(s => s.trim()).filter(Boolean);
        if (allowed.length) orders = orders.filter(o => allowed.includes(String(o.status)));
      }
      return { ...res, data: orders };
    }
    return normalizeOrdersResponse(res);
  },
  get: async (id: string) => normalizeOrdersResponse(await get(`/orders/${id}`)),
  create: (body: Record<string, unknown>) => post("/orders", {
    ...body,
    number_of_helpers: body.number_of_helpers ?? body.num_helpers,
    delivery_address: body.delivery_address ?? body.dropoff_address,
  }),
  respond: (id: string, action: "accept" | "reject", _estimatedPrice?: number, notes?: string) =>
    post(`/orders/${id}/respond`, {
      response: action === "accept" ? "accepted" : "declined",
      decline_reason: notes || undefined,
    }),
  skip: (id: string) => patch(`/orders/${id}/skip`, {}),
  cancel: (id: string, reason?: string) => patch(`/orders/${id}/cancel`, { reason }),
  getCancelEstimate: (id: string) => get(`/orders/${id}/cancel-estimate`),
  accept: (id: string) => patch(`/orders/${id}/accept`),
  start: (id: string) => patch(`/orders/${id}/start`),
  complete: (id: string) => patch(`/orders/${id}/complete`),
  decline: (id: string, reason?: string) => patch(`/orders/${id}/decline`, { reason }),
  cancelTimeout: (id: string) => post(`/orders/${id}/cancel-timeout`, {}),
  mySchedule: (from?: string, to?: string) => get("/orders/my-schedule", { from, to }),
  uploadDeliveryPhoto: (id: string, file: File) => {
    const fd = new FormData();
    fd.append("photo", file);
    return upload(`/orders/${id}/delivery-photo`, fd);
  },
};

/* ── Order quotes ── */
export const quotesApi = {
  list: (orderId: string) => get(`/orders/${orderId}/quotes`),
  submit: (orderId: string, body: Record<string, unknown>) => post(`/orders/${orderId}/quotes`, body),
  select: (orderId: string, quoteId: string) => post(`/orders/${orderId}/quotes/${quoteId}/select`, {}),
};

/* ── Providers ── */
export const providersApi = {
  browse: (params?: Record<string, unknown>) => get("/providers/browse", params),
  getById: (id: string, params?: Record<string, unknown>) => get(`/providers/${id}`, params),
  getQuotedOrders: () => get("/providers/me/quoted-orders"),
};

export const providerApi = {
  getEarnings: (period: "week" | "month" | "year" = "month") =>
    get("/providers/me/earnings", { period }),
  getSchedule: () => get("/providers/me/schedule"),
  updateSchedule: (slots: Record<string, unknown>[]) => patch("/providers/me/schedule", { slots }),
  getDocuments: () => get("/providers/me/documents"),
  uploadDocuments: (files: Record<string, File>) => {
    const fd = new FormData();
    Object.entries(files).forEach(([k, v]) => fd.append(k, v));
    return upload("/providers/me/documents", fd);
  },
  uploadAvatar: (file: File) => {
    const fd = new FormData(); fd.append("avatar", file);
    return upload("/customers/me/avatar", fd);
  },
  requestVerification: () => post("/providers/me/request-verification"),
};

/* ── Chat attachments ── */
export type ChatAttachmentPayload = {
  url: string;
  media_type: string;
  media_size: number;
  media_name: string;
  is_image: boolean;
};

export type ChatSendPayload = {
  content?: string;
  text?: string;
  media_url?: string;
  media_type?: string;
  media_size?: number;
  media_name?: string;
};

export const chatApi = {
  uploadAttachment: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return upload<ChatAttachmentPayload>("/chat/attachments", fd);
  },
};

/* ── Conversations (order chat) ── */
export const conversationsApi = {
  list: () => get("/conversations"),
  getMessages: (orderId: string) => get(`/conversations/${orderId}/messages`),
  sendMessage: (orderId: string, payload: string | ChatSendPayload) => {
    const body = typeof payload === "string" ? { content: payload } : payload;
    return post(`/conversations/${orderId}/messages`, body);
  },
};

/* ── Notifications ── */
export const notificationsApi = {
  list: async (params?: Record<string, unknown>) => {
    const mapped = params?.pageSize ? { ...params, limit: params.pageSize } : params;
    const res = await get("/notifications", mapped);
    return normalizeNotificationsResponse(res);
  },
  unreadCount: async () => normalizeUnreadCountResponse(await get("/notifications/unread-count")),
  markRead: async (id: string) => {
    const res = await patch(`/notifications/${id}/read`, {});
    return { success: !!(res as { ok?: boolean }).ok || res.success !== false };
  },
  markAllRead: async () => {
    const res = await patch("/notifications/read-all", {});
    return { success: !!(res as { ok?: boolean }).ok || res.success !== false };
  },
};

/* ── Marketplace ── */

export const marketplaceApi = {
  list: async (p?: Record<string, unknown>) => {
    const params = p ? { ...p } : {};
    if (params.search) { params.keyword = params.search; delete params.search; }
    if (params.category) {
      const apiCategory = toApiCategory(String(params.category));
      if (apiCategory) params.category = apiCategory;
      else delete params.category;
    }
    const res = await get("/marketplace/listings", params);
    return normalizeListingsResponse(res);
  },
  myListings: async () => normalizeListingsResponse(await get("/marketplace/my-listings")),
  create: (body: Record<string, unknown>) => post("/marketplace/listings", body),
  uploadImages: async (files: File[]) => {
    const urls: string[] = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append("image", file);
      const res = await upload<{ url: string }>("/marketplace/listings/images", fd);
      if (!res.success || !res.data?.url) {
        throw new Error(res.message || "Upload ảnh thất bại");
      }
      urls.push(res.data.url);
    }
    return { success: true, data: urls };
  },
  get: async (id: string) => {
    try {
      const res = await get(`/marketplace/listings/${id}`);
      if (res.success && res.data) {
        return { ...res, data: normalizeListing(res.data as Record<string, unknown>) };
      }
      return res;
    } catch (e) {
      const err = e as ApiError;
      return { success: false, message: err.message || "Không tìm thấy tin" };
    }
  },
  updateStatus: (id: string, status: string) => patch(`/marketplace/listings/${id}/status`, { status }),
  addInterest: (id: string, note?: string) => post(`/marketplace/listings/${id}/interest`, note ? { note } : {}),
  removeInterest: (id: string) => del(`/marketplace/listings/${id}/interest`),
  myInterests: async () => normalizeListingsResponse(await get("/marketplace/my-interests")),
  listConversations: () => get("/marketplace/conversations"),
  getMessages: async (listingId: string, buyerId: string) => {
    const res = await get(`/marketplace/listings/${listingId}/conversations/${buyerId}/messages`);
    if (res.success && res.data) {
      const d = res.data as { messages?: Record<string, unknown>[] };
      const messages = (d.messages ?? []).map(m => normalizeMessage(m, buyerId));
      return { ...res, data: { ...d, messages } };
    }
    return res;
  },
  sendMessage: (
    listingId: string,
    buyerId: string,
    payload: string | (ChatSendPayload & { is_offer?: boolean; offer_amount?: number }),
  ) => {
    const body = typeof payload === "string" ? { text: payload } : payload;
    return post(`/marketplace/listings/${listingId}/conversations/${buyerId}/messages`, body);
  },
  sellerStats: (sellerId: string) => get(`/marketplace/seller/${sellerId}/stats`),
  rate: (id: string, rating: number, comment?: string) => post(`/marketplace/listings/${id}/rating`, { rating, comment }),
  bump: (id: string) => post(`/marketplace/listings/${id}/bump`, {}),
  payListingFee: (id: string, body: Record<string, unknown>) =>
    post(`/marketplace/listings/${id}/listing-fee/pay`, body),
  getListingFeeQuota: (price?: number) =>
    get("/marketplace/listing-fee/quota", price !== undefined ? { price } : undefined),
  getInterests: (id: string) => get(`/marketplace/listings/${id}/interests`),
  confirmDeal: (listingId: string, buyerId: string, agreedPrice?: number) =>
    post(`/marketplace/listings/${listingId}/conversations/${buyerId}/deal`, { agreed_price: agreedPrice }),
  cancelDeal: (listingId: string) => del(`/marketplace/listings/${listingId}/deal`),
  markTransportBooked: (listingId: string) =>
    post(`/marketplace/listings/${listingId}/transport-booked`, {}),
  confirmReceived: (id: string) => post(`/marketplace/listings/${id}/confirm-received`, {}),
  myConversations: () => get('/marketplace/my-conversations'),
};

/* ── Payments ── */
export const paymentsApi = {
  getWallet: () => get("/payments/me/wallet"),
  list: () => get("/payments/me"),
  get: (id: string) => get(`/payments/${id}`),
  sync: (id: string) => post(`/payments/${id}/sync`, {}),
  createDeposit: (orderId: string, amount: number, method = "payos", extra?: Record<string, unknown>) =>
    post("/payments/deposit", { order_id: orderId, amount, payment_method: method, ...extra }),
  listMethods: () => get("/payments/me/payment-methods"),
  addMethod: (body: Record<string, unknown>) => post("/payments/me/payment-methods", body),
  updateMethod: (id: string, body: Record<string, unknown>) => patch(`/payments/me/payment-methods/${id}`, body),
  deleteMethod: (id: string) => del(`/payments/me/payment-methods/${id}`),
  createRefund: (body: Record<string, unknown>) => post("/payments/refund", body),
};

/* ── Dev helpers (chỉ dùng khi test local) ── */
export const devApi = {
  simulatePayment: (orderId: string) =>
    post("/dev/payments/simulate", { order_id: orderId }),
};

/* ── Maps ── */
export const mapsApi = {
  autocomplete: (input: string, sessionToken?: string, extra?: Record<string, unknown>) =>
    get("/maps/places/autocomplete", { input, session_token: sessionToken, ...extra }),
  placeDetails: (placeId: string, sessionToken?: string, address?: string) =>
    get("/maps/places/details", { place_id: placeId, session_token: sessionToken, address }),
  resolveAddress: (input: string, extra?: Record<string, unknown>) =>
    get("/maps/places/resolve", { input, ...extra }),
};

/* ── Reviews (provider) ── */
export const reviewsApi = {
  mine: () => get("/reviews/mine"),
  respond: (id: string, response: string) => patch(`/reviews/${id}/respond`, { response }),
  submit: (orderId: string, payload: {
    rating: number; comment?: string; tags?: string[];
    service_quality_rating?: number; punctuality_rating?: number;
    professionalism_rating?: number; value_for_money_rating?: number;
  }) => post(`/reviews/orders/${orderId}`, payload),
};


/* ── Disputes ── */
export const disputesApi = {
  create: (formData: FormData) => upload<{ id: string }>("/disputes", formData),
  my: (params?: Record<string, unknown>) => get("/disputes/my", params),
  getById: (id: string) => get(`/disputes/${id}`),
};
