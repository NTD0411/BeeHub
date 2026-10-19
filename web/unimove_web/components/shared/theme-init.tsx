"use client";

import { useEffect } from "react";

/** Force light mode — UniMove customer UI luôn dùng white/yellow/blue theme. */
export function ThemeInit() {
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  return null;
}
