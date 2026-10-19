"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getStoredUser, getRoleHome, type UserRole } from "@/lib/auth";

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole: UserRole;
}

export function RoleGuard({ children, requiredRole }: RoleGuardProps) {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    const user = getStoredUser();
    if (!user) { router.replace("/login"); return; }
    if (user.role !== requiredRole) {
      // Redirect to the correct home for their role
      router.replace(getRoleHome(user.role));
    }
  }, [router, requiredRole]);

  if (typeof window !== "undefined") {
    if (!isAuthenticated()) return null;
    const user = getStoredUser();
    if (!user || user.role !== requiredRole) return null;
  }

  return <>{children}</>;
}
