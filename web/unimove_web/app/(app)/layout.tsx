"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getStoredUser } from "@/lib/auth";
import { WebLayout } from "@/components/layout/web-layout";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) { router.replace("/login"); return; }
    const user = getStoredUser();
    if (!user) { router.replace("/login"); return; }
    setReady(true);
  }, [router]);

  if (!ready) return null;
  return <WebLayout>{children}</WebLayout>;
}
