"use client";

import { apiClient } from "./api";

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: "customer" | "provider" | "admin";
  student_id?: string;
  loyalty_points?: number;
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("customer_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeUser(user: User, token: string) {
  localStorage.setItem("customer_user", JSON.stringify(user));
  localStorage.setItem("customer_token", token);
  document.cookie = `customer_token=${token}; path=/; max-age=604800; SameSite=Lax`;
  apiClient.setToken(token);
}

export function clearAuth() {
  localStorage.removeItem("customer_user");
  localStorage.removeItem("customer_token");
  document.cookie = "customer_token=; path=/; max-age=0";
  apiClient.removeToken();
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("customer_token");
}
