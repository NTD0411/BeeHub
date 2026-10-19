const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: { page: number; pageSize: number; total: number; pages: number };
}

export interface ApiError extends Error {
  status?: number;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    if (typeof window !== "undefined") this.token = localStorage.getItem("provider_token");
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") localStorage.setItem("provider_token", token);
  }

  removeToken() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("provider_token");
      localStorage.removeItem("provider_user");
    }
  }

  getToken(): string | null {
    if (typeof window !== "undefined" && !this.token) this.token = localStorage.getItem("provider_token");
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const headers: HeadersInit = { "Content-Type": "application/json", ...options.headers };
    if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    const response = await fetch(`${this.baseUrl}${endpoint}`, { ...options, headers });
    const data = await response.json();
    if (!response.ok) {
      const error: ApiError = new Error(data.message || "API error");
      error.status = response.status;
      throw error;
    }
    return data;
  }

  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (params) {
      const sp = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null) sp.append(k, String(v)); });
      const q = sp.toString();
      if (q) url += `?${q}`;
    }
    return this.request<T>(url, { method: "GET" });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "POST", body: body ? JSON.stringify(body) : undefined });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "PUT", body: body ? JSON.stringify(body) : undefined });
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "PATCH", body: body ? JSON.stringify(body) : undefined });
  }

  async uploadFormData<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const headers: HeadersInit = {};
    if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    const response = await fetch(`${this.baseUrl}${endpoint}`, { method: "POST", headers, body: formData });
    const data = await response.json();
    if (!response.ok) {
      const error: ApiError = new Error(data.message || "Upload failed");
      error.status = response.status;
      throw error;
    }
    return data;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

export const providerAuthApi = {
  register: (body: { email: string; password: string; full_name: string; phone?: string; business_name?: string }) =>
    apiClient.post("/auth/register", { ...body, role: "provider" }),
  login: (body: { email: string; password: string }) => apiClient.post("/auth/login", body),
  forgotPassword: (email: string) => apiClient.post("/auth/forgot-password", { email }),
  resetPassword: (body: { token: string; newPassword: string }) => apiClient.post("/auth/reset-password", body),
  getMe: () => apiClient.get("/auth/me"),
  changePassword: (body: { currentPassword: string; newPassword: string }) => apiClient.post("/auth/change-password", body),
};

export const providerOrdersApi = {
  getOrders: (params?: { status?: string; page?: number }) =>
    apiClient.get("/orders", params as Record<string, unknown>),
  getOrder: (id: string) => apiClient.get(`/orders/${id}`),
  respondToOrder: (id: string, body: { response: "accepted" | "declined"; decline_reason?: string }) =>
    apiClient.post(`/orders/${id}/respond`, body),
  declineOrder: (id: string, reason?: string) =>
    apiClient.post(`/orders/${id}/respond`, { response: "declined", decline_reason: reason }),
};

export const providerQuotesApi = {
  submit: (
    orderId: string,
    body: {
      base_price: number;
      surcharges?: { label: string; amount: number }[];
      schedule_fit?: string;
      proposed_pickup_at?: string;
      note?: string;
    }
  ) => apiClient.post(`/orders/${orderId}/quotes`, body),
  list: (orderId: string) => apiClient.get(`/orders/${orderId}/quotes`),
};

export const providerProfileApi = {
  getMe: () => apiClient.get("/auth/me"),
  updateMe: (body: Record<string, unknown>) => apiClient.patch("/auth/me", body),
  uploadAvatar: (file: File) => {
    const fd = new FormData();
    fd.append("avatar", file);
    return apiClient.uploadFormData("/customers/me/avatar", fd);
  },
  uploadDocuments: (files: { [key: string]: File }) => {
    const fd = new FormData();
    Object.entries(files).forEach(([key, file]) => fd.append(key, file));
    return apiClient.uploadFormData("/providers/me/documents", fd);
  },
};

export const providerNotificationsApi = {
  getNotifications: (params?: { page?: number }) =>
    apiClient.get("/notifications", params as Record<string, unknown>),
  getUnreadCount: () => apiClient.get("/notifications/unread-count"),
  markRead: (id: string) => apiClient.patch(`/notifications/${id}/read`, {}),
  markAllRead: () => apiClient.patch("/notifications/read-all", {}),
};
