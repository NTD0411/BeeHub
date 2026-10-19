"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, isAuthenticated } from "@/lib/auth";

export function AdminRoleGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    const user = getStoredUser();
    if (!user || user.role !== "admin") {
      router.replace("/login");
    }
  }, [router]);

  if (typeof window !== "undefined") {
    if (!isAuthenticated()) return null;
    const user = getStoredUser();
    if (!user || user.role !== "admin") return null;
  }

  return <>{children}</>;
}
