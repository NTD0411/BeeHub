"use client";

import { useEffect, useRef } from "react";

/**
 * Gọi callback định kỳ khi tab đang hiển thị (dùng cho admin dashboard / orders).
 */
export function usePolling(
  callback: () => void | Promise<void>,
  intervalMs: number,
  enabled = true
) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || intervalMs <= 0) return;

    const tick = () => {
      if (document.visibilityState !== "visible") return;
      void savedCallback.current();
    };

    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs, enabled]);
}
