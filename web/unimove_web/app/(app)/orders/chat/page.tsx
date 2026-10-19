"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderChatWorkspace } from "@/components/chat/OrderChatWorkspace";

function ProviderChatContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div className="px-4 lg:px-6 py-5 max-w-[1400px] mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tin nhắn đơn hàng</h1>
        <p className="text-sm text-gray-500 mt-0.5">Trao đổi với khách hàng theo từng đơn</p>
      </div>
      <OrderChatWorkspace
        initialOrderId={orderId}
        orderDetailPath={(id) => `/orders/${id}`}
        enableInboxCategoryTabs={false}
        enableNotificationsTab={false}
      />
    </div>
  );
}

export default function ProviderChatPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8">
          <Skeleton className="h-[560px] rounded-2xl" />
        </div>
      }
    >
      <ProviderChatContent />
    </Suspense>
  );
}
