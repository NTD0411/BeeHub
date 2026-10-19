"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser } from "@/lib/auth";
import ProviderOrdersPage from "./provider-orders";

function OrdersPageContent() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const r = getStoredUser()?.role ?? null;
    if (r === "customer") { router.replace("/don-hang"); return; }
    setRole(r);
  }, [router]);

  if (!role || role === "customer") return null;
  return <ProviderOrdersPage />;
}

export default function OrdersPage() {
  return (
    <Suspense fallback={null}>
      <OrdersPageContent />
    </Suspense>
  );
}
