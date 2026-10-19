/**
 * API Client for UniMove Admin Dashboard
 * Connects to Node.js backend instead of direct Supabase
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface ApiError extends Error {
  status?: number;
  code?: string;
}

export interface ApiResponse<T = any> {
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
    // Try to get token from localStorage (client-side only)
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('admin_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_token', token);
    }
  }

  removeToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
    }
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        const error: ApiError = new Error(data.message || 'API request failed');
        error.status = response.status;
        error.code = data.code;
        throw error;
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  // GET request
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const query = searchParams.toString();
      if (query) {
        url += `?${query}`;
      }
    }
    
    return this.request<T>(url, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // PATCH request
  async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Multipart upload (avatar, etc.)
  async uploadFormData<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    const response = await fetch(url, { method: 'POST', headers, body: formData });
    const data = await response.json();
    if (!response.ok) {
      const error: ApiError = new Error(data.message || 'Upload failed');
      error.status = response.status;
      error.code = data.code;
      throw error;
    }
    return data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

// Helper functions for specific admin API calls
export const adminApi = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    apiClient.post('/admin/auth/login', credentials),
  
  getProfile: () => apiClient.get('/admin/auth/profile'),

  updateProfile: (body: { full_name?: string; phone?: string }) =>
    apiClient.patch('/admin/auth/profile', body),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiClient.uploadFormData('/admin/auth/avatar', formData);
  },

  // Dashboard
  getDashboard: () => apiClient.get('/admin/dashboard'),
  getLatestOrders: (params?: { page?: number; pageSize?: number }) =>
    apiClient.get('/admin/dashboard/latest-orders', params),
  getOrderStatusDistribution: () => 
    apiClient.get('/admin/dashboard/order-status-distribution'),

  // Users Management
  getUsers: (params?: { 
    role?: string; 
    search?: string; 
    status?: string; 
    page?: number; 
    pageSize?: number;
  }) => apiClient.get('/admin/users', params),
  
  updateUserStatus: (id: string, status: string) =>
    apiClient.patch(`/admin/users/${id}/status`, { status }),

  // Provider Management
  getPendingProviders: () => apiClient.get('/admin/providers/pending'),
  getProviderDocuments: (id: string) => apiClient.get(`/admin/providers/${id}/documents`),
  verifyProvider: (id: string, data: { action: 'approve' | 'reject'; notes?: string }) =>
    apiClient.put(`/admin/providers/${id}/verify`, data),

  // Orders Management
  getOrders: (params?: {
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
    dateFrom?: string;
    dateTo?: string;
  }) => apiClient.get('/admin/orders', params),
  
  getOrderById: (id: string) => apiClient.get(`/admin/orders/${id}`),
  forceCancelOrder: (id: string, reason: string) =>
    apiClient.put(`/admin/orders/${id}/cancel`, { reason }),

  // Disputes Management
  getDisputes: (params?: { status?: string; page?: number; pageSize?: number }) =>
    apiClient.get('/admin/disputes', params),
  
  getDisputeDetails: (id: string) => apiClient.get(`/admin/disputes/${id}`),
  resolveDispute: (id: string, data: {
    resolution: string;
    resolution_type: string;
    refund_amount?: number;
    internal_notes?: string;
  }) => apiClient.put(`/admin/disputes/${id}/resolve`, data),

  // Reviews Management
  getReviews: (params?: { flagged?: string; hidden?: string; page?: number; pageSize?: number }) =>
    apiClient.get('/admin/reviews', params),
  
  hideReview: (id: string, reason: string) =>
    apiClient.put(`/admin/reviews/${id}/hide`, { reason }),
  
  unhideReview: (id: string) => apiClient.put(`/admin/reviews/${id}/unhide`),
  flagReview: (id: string, reason: string) =>
    apiClient.put(`/admin/reviews/${id}/flag`, { reason }),

  // Refunds Management
  getRefunds: (params?: { status?: string; page?: number; pageSize?: number }) =>
    apiClient.get('/admin/refunds', params),
  
  approveRefund: (id: string) => apiClient.put(`/admin/refunds/${id}/approve`),

  // Provider Earnings & Withdrawals
  getProviderEarnings: (params?: { status?: string; page?: number; pageSize?: number }) =>
    apiClient.get('/admin/provider-earnings', params),
  
  getWithdrawals: (params?: { status?: string; page?: number; pageSize?: number }) =>
    apiClient.get('/admin/withdrawals', params),
  
  approveWithdrawal: (id: string, transaction_reference?: string) =>
    apiClient.put(`/admin/withdrawals/${id}/approve`, { transaction_reference }),
  
  rejectWithdrawal: (id: string, rejection_reason: string) =>
    apiClient.put(`/admin/withdrawals/${id}/reject`, { rejection_reason }),

  // Analytics
  getGMVStats: () => apiClient.get('/admin/analytics/gmv'),
  getOrderStatistics: (params?: { startDate?: string; endDate?: string }) =>
    apiClient.get('/admin/analytics/orders', params),
  
  getTopProviders: (params?: { limit?: number }) =>
    apiClient.get('/admin/analytics/providers', params),
  
  getPlatformCommissionByMonth: (params?: { months?: number }) =>
    apiClient.get('/admin/analytics/commission', params),
  
  getRevenueByMonth: (params?: { months?: number }) =>
    apiClient.get('/admin/analytics/revenue', params),

  // Announcements/Notifications
  getAnnouncements: (params?: { page?: number; pageSize?: number }) =>
    apiClient.get('/admin/announcements', params),
  
  createAnnouncement: (data: {
    title: string;
    body: string;
    targetAudience?: string;
    targetCities?: string[];
    priority?: string;
    scheduledAt?: string;
  }) => apiClient.post('/admin/announcements', data),
  
  publishAnnouncement: (id: string) => 
    apiClient.put(`/admin/announcements/${id}/publish`),

  // Activity Logs
  getOrderStatusHistory: (params?: { page?: number; pageSize?: number }) =>
    apiClient.get('/admin/activity/orders', params),
  
  getVerificationHistory: (params?: { page?: number; pageSize?: number }) =>
    apiClient.get('/admin/activity/verifications', params),
  
  getRefundHistory: (params?: { page?: number; pageSize?: number }) =>
    apiClient.get('/admin/activity/refunds', params),

  // Platform Settings
  getPlatformSettings: () => apiClient.get('/admin/settings'),
  updatePlatformSettings: (settings: Record<string, any>) =>
    apiClient.put('/admin/settings', settings),
};

export default apiClient;