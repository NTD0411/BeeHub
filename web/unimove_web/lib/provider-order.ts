import { getOrderStatusLabel } from "@/lib/utils";

export interface ProviderOrderFields {
  status: string;
  quote_request?: boolean;
  provider_id?: string | null;
  deposit_paid?: boolean;
}

export function isAssignedToProvider(
  order: ProviderOrderFields,
  providerUserId?: string | null,
): boolean {
  return !!providerUserId && order.provider_id === providerUserId;
}

/** Đơn báo giá còn mở — chưa có nhà xe được chốt. */
export function isOpenQuoteRequest(order: ProviderOrderFields): boolean {
  return !!order.quote_request && order.status === "pending" && !order.provider_id;
}

export function isAwaitingDeposit(
  order: ProviderOrderFields,
  providerUserId?: string | null,
): boolean {
  return (
    isAssignedToProvider(order, providerUserId) &&
    order.status === "matched" &&
    !order.deposit_paid
  );
}

export function isReadyToAccept(
  order: ProviderOrderFields,
  providerUserId?: string | null,
): boolean {
  return (
    isAssignedToProvider(order, providerUserId) &&
    order.status === "matched" &&
    !!order.deposit_paid
  );
}

export function getProviderOrderStatusLabel(
  order: ProviderOrderFields,
  providerUserId?: string | null,
): string {
  if (isAwaitingDeposit(order, providerUserId)) return "Chờ khách đặt cọc";
  if (isReadyToAccept(order, providerUserId)) return "Khách đã cọc";
  if (isOpenQuoteRequest(order)) return "Chờ báo giá";
  return getOrderStatusLabel(order.status);
}
