"use server";

/**
 * Server-side API client for Next.js Server Actions and Server Components.
 * Reads the auth token from cookies (not localStorage).
 */

import { cookies } from "next/headers";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

async function getToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("admin_token")?.value ?? null;
}

async function serverFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `API error ${response.status}`);
  }

  return data as T;
}

// ────────────────────────────────────────────────────────────
// Generic helpers
// ────────────────────────────────────────────────────────────

export async function serverGet<T>(
  endpoint: string,
  params?: Record<string, any>
): Promise<T> {
  let url = endpoint;
  if (params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) qs.append(k, String(v));
    });
    const q = qs.toString();
    if (q) url += `?${q}`;
  }
  return serverFetch<T>(url, { method: "GET" });
}

export async function serverPost<T>(endpoint: string, body?: any): Promise<T> {
  return serverFetch<T>(endpoint, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function serverPut<T>(endpoint: string, body?: any): Promise<T> {
  return serverFetch<T>(endpoint, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function serverPatch<T>(
  endpoint: string,
  body?: any
): Promise<T> {
  return serverFetch<T>(endpoint, {
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function serverDelete<T>(endpoint: string): Promise<T> {
  return serverFetch<T>(endpoint, { method: "DELETE" });
}
