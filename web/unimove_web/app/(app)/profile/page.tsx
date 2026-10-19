"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser } from "@/lib/auth";
import ProviderProfilePage from "./provider-profile";

export default function ProfilePage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const r = getStoredUser()?.role ?? null;
    if (r === "customer") { router.replace("/tai-khoan"); return; }
    setRole(r);
  }, [router]);

  if (!role || role === "customer") return null;
  return <ProviderProfilePage />;
}
