"use client";

export type UserRole = "customer" | "provider" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  /* customer extras */
  student_id?: string;
  loyalty_points?: number;
  /* common extras */
  address?: string;
  /* provider extras */
  business_name?: string;
  vehicle_type?: string;
  rating?: number;
  is_verified?: boolean;
  verification_status?: string | null;
  total_orders?: number;
  total_reviews?: number;
  compliance_score?: number;
  ward?: string;
}

const TOKEN_KEY = "unimove_token";
const USER_KEY  = "unimove_user";

export function storeAuth(user: AuthUser, token: string) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_KEY, token);
  document.cookie = `unimove_token=${token}; path=/; max-age=604800; SameSite=Lax`;
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch { return null; }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearAuth() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_user");
  document.cookie = "unimove_token=; path=/; max-age=0";
  document.cookie = "admin_token=; path=/; max-age=0";
  document.cookie = "admin_user=; path=/; max-age=0";
}

/** Đăng xuất và về trang chủ landing. */
export function logoutToHome(router: { replace: (path: string) => void }) {
  clearAuth();
  router.replace("/");
}

export function isAuthenticated(): boolean {
  return !!getStoredToken();
}

/** Trả về route trang chủ tương ứng với role */
export function getRoleHome(role: UserRole): string {
  if (role === "admin") return "/admin/dashboard";
  if (role === "provider") return "/tai-xe/tong-quan";
  return "/trang-chu";
}

/** Lưu session admin (dùng chung token với unimove + admin_token cho API admin) */
export function storeAdminSession(user: AuthUser, token: string) {
  storeAuth(user, token);
  localStorage.setItem("admin_token", token);
  localStorage.setItem("admin_user", JSON.stringify(user));
  document.cookie = `admin_token=${token}; path=/; max-age=604800; SameSite=Lax`;
}
