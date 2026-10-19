export function storeAdminAuth(token: string, user: Record<string, unknown>) {
  localStorage.setItem("admin_token", token);
  localStorage.setItem("admin_user", JSON.stringify(user));
  document.cookie = `admin_token=${token}; path=/; max-age=604800; SameSite=Lax`;
}
