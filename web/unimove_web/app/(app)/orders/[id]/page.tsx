"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getStoredUser } from "@/lib/auth";
import ProviderOrderDetailPage from "./provider-order-detail";

export default function OrderDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const r = getStoredUser()?.role ?? null;
    if (r === "customer") { router.replace(`/don-hang/${id}`); return; }
    setRole(r);
  }, [router, id]);

  if (!role || role === "customer") return null;
  return <ProviderOrderDetailPage />;
}
