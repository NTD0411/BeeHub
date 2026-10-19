"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getStoredUser } from "@/lib/auth";
import { marketplaceApi } from "@/lib/api";
import { Container } from "@/components/layout/Container";
import { OrderChatWorkspace } from "@/components/chat/OrderChatWorkspace";
import { Skeleton } from "@/components/ui/skeleton";

function TinNhanContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const withName = searchParams.get("with");
  const listingId = searchParams.get("listingId");
  const buyerIdParam = searchParams.get("buyerId");
  const inboxCategory =
    searchParams.get("tab") === "pass-do" ? "pass-do" : "chuyen-tro";
  const [buyerId, setBuyerId] = useState<string | null>(buyerIdParam);

  useEffect(() => {
    if (buyerIdParam) {
      setBuyerId(buyerIdParam);
      return;
    }
    if (!listingId) return;

    const me = getStoredUser()?.id;
    if (!me) return;

    let cancelled = false;
    marketplaceApi.get(listingId).then((r) => {
      if (cancelled || !r.success || !r.data) return;
      const d = r.data as { seller_id?: string; profiles?: { id?: string }; is_mine?: boolean };
      const ownerId = d.seller_id ?? d.profiles?.id;
      const isOwner = d.is_mine === true || ownerId === me;
      if (!isOwner) setBuyerId(me);
    });

    return () => {
      cancelled = true;
    };
  }, [buyerIdParam, listingId]);

  return (
    <Container className="py-4">
      <OrderChatWorkspace
        initialOrderId={orderId}
        initialWithName={withName}
        initialListingId={listingId}
        initialBuyerId={buyerId}
        initialTab="messages"
        initialInboxCategory={inboxCategory}
        enableInboxCategoryTabs
        enableNotificationsTab={false}
        className="h-[calc(100vh-68px-2rem)] min-h-[560px]"
      />
    </Container>
  );
}

export default function TinNhanPage() {
  return (
    <Suspense
      fallback={
        <Container className="py-4">
          <Skeleton className="h-[calc(100vh-68px-2rem)] min-h-[560px] rounded-2xl" />
        </Container>
      }
    >
      <TinNhanContent />
    </Suspense>
  );
}
