const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface ApiError extends Error {
  status?: number;
  code?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    pages: number;
  };
  error?: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("customer_token");
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("customer_token", token);
    }
  }

  removeToken() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("customer_token");
      localStorage.removeItem("customer_user");
    }
  }

  getToken(): string | null {
    if (typeof window !== "undefined" && !this.token) {
      this.token = localStorage.getItem("customer_token");
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, { ...options, headers });
      const data = await response.json();

      if (!response.ok) {
        const error: ApiError = new Error(data.message || "API request failed");
        error.status = response.status;
        error.code = data.code;
        throw error;
      }

      return data;
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error("Network error occurred");
    }
  }

  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const query = searchParams.toString();
      if (query) url += `?${query}`;
    }
    return this.request<T>(url, { method: "GET" });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  async uploadFormData<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();
    const headers: HeadersInit = {};
    if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    const response = await fetch(url, { method: "POST", headers, body: formData });
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

/* ──────────────────────── Typed API helpers ──────────────────────────────── */

export const authApi = {
  register: (body: { email: string; password: string; full_name: string; phone?: string }) =>
    apiClient.post("/auth/register", body),
  login: (body: { email: string; password: string }) =>
    apiClient.post("/auth/login", body),
  forgotPassword: (email: string) =>
    apiClient.post("/auth/forgot-password", { email }),
  resetPassword: (body: { token: string; newPassword: string }) =>
    apiClient.post("/auth/reset-password", body),
  getMe: () => apiClient.get("/auth/me"),
  updateMe: (body: Record<string, unknown>) => apiClient.patch("/auth/me", body),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    apiClient.post("/auth/change-password", body),
  googleLogin: (idToken: string) =>
    apiClient.post("/auth/google", { idToken }),
};

export const customerApi = {
  getMe: () => apiClient.get("/customers/me"),
  updateMe: (body: Record<string, unknown>) => apiClient.patch("/customers/me", body),
  uploadAvatar: (file: File) => {
    const fd = new FormData();
    fd.append("avatar", file);
    return apiClient.uploadFormData("/customers/me/avatar", fd);
  },
  getRecentPlaces: () => apiClient.get("/customers/me/recent-places"),
};

export const ordersApi = {
  getOrders: (params?: { status?: string; page?: number }) =>
    apiClient.get("/orders", params as Record<string, unknown>),
  createOrder: (body: Record<string, unknown>) => apiClient.post("/orders", body),
  getOrder: (id: string) => apiClient.get(`/orders/${id}`),
  getCancelEstimate: (id: string) => apiClient.get(`/orders/${id}/cancel-estimate`),
  cancelOrder: (id: string, reason: string) =>
    apiClient.patch(`/orders/${id}/cancel`, { reason }),
};

export const providersApi = {
  browse: (params?: { city?: string; service_type?: string; page?: number }) =>
    apiClient.get("/providers/browse", params as Record<string, unknown>),
  getProvider: (id: string) => apiClient.get(`/providers/${id}`),
};

export const paymentsApi = {
  createDeposit: (body: { order_id: string; amount: number; payment_method: string }) =>
    apiClient.post("/payments/deposit", body),
};

export const notificationsApi = {
  getNotifications: (params?: { page?: number; pageSize?: number }) =>
    apiClient.get("/notifications", params as Record<string, unknown>),
  getUnreadCount: () => apiClient.get("/notifications/unread-count"),
  markRead: (id: string) => apiClient.patch(`/notifications/${id}/read`, {}),
  markAllRead: () => apiClient.patch("/notifications/read-all", {}),
};

export const marketplaceApi = {
  getListings: (params?: { search?: string; category?: string; city?: string; page?: number }) =>
    apiClient.get("/marketplace/listings", params as Record<string, unknown>),
  getMyListings: () => apiClient.get("/marketplace/my-listings"),
  createListing: (body: Record<string, unknown>) =>
    apiClient.post("/marketplace/listings", body),
  uploadListingImages: (files: File[]) => {
    const fd = new FormData();
    files.forEach((f) => fd.append("images", f));
    return apiClient.uploadFormData("/marketplace/listings/images", fd);
  },
  getListing: (id: string) => apiClient.get(`/marketplace/listings/${id}`),
  updateListingStatus: (id: string, status: string) =>
    apiClient.patch(`/marketplace/listings/${id}/status`, { status }),
  addInterest: (id: string) =>
    apiClient.post(`/marketplace/listings/${id}/interest`, {}),
  removeInterest: (id: string) =>
    apiClient.delete(`/marketplace/listings/${id}/interest`),
  getMyInterests: () => apiClient.get("/marketplace/my-interests"),
  getMessages: (listingId: string, buyerId: string) =>
    apiClient.get(`/marketplace/listings/${listingId}/conversations/${buyerId}/messages`),
  sendMessage: (listingId: string, buyerId: string, content: string) =>
    apiClient.post(
      `/marketplace/listings/${listingId}/conversations/${buyerId}/messages`,
      { content }
    ),
  getSellerStats: (sellerId: string) =>
    apiClient.get(`/marketplace/seller/${sellerId}/stats`),
  confirmDeal: (listingId: string, buyerId: string) =>
    apiClient.post(`/marketplace/listings/${listingId}/conversations/${buyerId}/deal`, {}),
  rateSeller: (id: string, body: { rating: number; comment?: string }) =>
    apiClient.post(`/marketplace/listings/${id}/rating`, body),
  bump: (id: string) => apiClient.post(`/marketplace/listings/${id}/bump`, {}),
};
