"use client";

import { useEffect, useState } from "react";
import { marketplaceApi } from "@/lib/api";

export type ListingFeeQuota = {
  free_listings_total: number;
  free_listings_remaining: number;
  listings_created_count: number;
  rate_label?: string;
  preview?: {
    amount: number;
    requires_payment: boolean;
    reason: string;
    message: string;
  };
};

export function useListingFeeQuota(price: number) {
  const [quota, setQuota] = useState<ListingFeeQuota | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    marketplaceApi
      .getListingFeeQuota(Number.isFinite(price) && price >= 0 ? price : undefined)
      .then((res) => {
        if (!cancelled && res.success && res.data) {
          setQuota(res.data as ListingFeeQuota);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [price]);

  const preview = quota?.preview;
  const displayFee = preview?.requires_payment ? preview.amount : 0;
  const isFreePost = !preview?.requires_payment;

  return { quota, loading, preview, displayFee, isFreePost };
}
