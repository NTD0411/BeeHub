export type AdminUser = {
  id: string;
  email?: string;
  full_name?: string;
  role?: string;
};

export function getAdminUserFromStorage(): AdminUser | null {
  if (typeof window === "undefined") return null;
  try {
    const userStr = localStorage.getItem("admin_user");
    if (!userStr) return null;
    return JSON.parse(userStr) as AdminUser;
  } catch {
    return null;
  }
}

export function getAdminUserId(): string {
  return getAdminUserFromStorage()?.id ?? "";
}
