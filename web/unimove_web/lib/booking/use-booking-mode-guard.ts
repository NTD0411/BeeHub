"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBookingFlowStore } from "@/lib/stores/useBookingFlowStore";

export function useBookingModeGuard(options?: {
  requireCombo?: boolean;
  requireQuote?: boolean;
}) {
  const router = useRouter();
  const bookingModeChosen = useBookingFlowStore((s) => s.bookingModeChosen);
  const isComboBooking = useBookingFlowStore((s) => s.isComboBooking);
  const serviceKind = useBookingFlowStore((s) => s.serviceKind);

  useEffect(() => {
    const isLabor = serviceKind === "laborOnly" || serviceKind === "laborAddon";
    if (isLabor) return;

    if (!bookingModeChosen) {
      router.replace("/dat-chuyen");
      return;
    }
    if (options?.requireCombo && !isComboBooking) {
      router.replace("/dat-chuyen");
      return;
    }
    if (options?.requireQuote && isComboBooking) {
      router.replace("/dat-chuyen");
    }
  }, [bookingModeChosen, isComboBooking, serviceKind, options?.requireCombo, options?.requireQuote, router]);
}
