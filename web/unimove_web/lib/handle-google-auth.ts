import { authApi } from "@/lib/api";
import { storeAuth, storeAdminSession, getRoleHome, type AuthUser } from "@/lib/auth";

export async function handleGoogleAuthResponse(
  idToken: string,
  onError: (msg: string) => void,
): Promise<string | null> {
  const res = await authApi.googleAuth(idToken);
  if (!res.success || !res.data) {
    onError((res as { message?: string }).message || "Đăng nhập Google thất bại");
    return null;
  }
  const { accessToken, user } = res.data as { accessToken: string; user: AuthUser };
  if (user.role === "admin") {
    storeAdminSession(user, accessToken);
    return getRoleHome("admin");
  }
  storeAuth(user, accessToken);
  return getRoleHome(user.role);
}
