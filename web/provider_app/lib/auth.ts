"use client";

import { apiClient } from "./api";

export interface ProviderUser {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: "customer" | "provider" | "admin";
  business_name?: string;
  vehicle_type?: string;
  rating?: number;
  is_verified?: boolean;
  status?: string;
  verification_status?: "pending" | "approved" | "rejected";
  verification_notes?: string;
}

export function getStoredUser(): ProviderUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("provider_user");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function storeUser(user: ProviderUser, token: string) {
  localStorage.setItem("provider_user", JSON.stringify(user));
  localStorage.setItem("provider_token", token);
  document.cookie = `provider_token=${token}; path=/; max-age=604800; SameSite=Lax`;
  apiClient.setToken(token);
}

export function clearAuth() {
  localStorage.removeItem("provider_user");
  localStorage.removeItem("provider_token");
  document.cookie = "provider_token=; path=/; max-age=0";
  apiClient.removeToken();
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("provider_token");
}
