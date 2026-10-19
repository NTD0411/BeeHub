import { redirect } from "next/navigation";

/** Chat Chợ SV gộp vào /tin-nhan */
export default async function MarketplaceChatRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ buyerId?: string }>;
}) {
  const { id } = await params;
  const { buyerId } = await searchParams;
  const q = new URLSearchParams({ listingId: id });
  if (buyerId) q.set("buyerId", buyerId);
  redirect(`/tin-nhan?${q.toString()}`);
}
