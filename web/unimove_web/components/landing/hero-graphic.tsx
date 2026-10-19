"use client";

import { Package, MapPin, Truck } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { accentShadow, accentShadowLg, gradientBg } from "@/lib/landing-classes";

export function HeroGraphic() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-md lg:max-w-none">
      {/* Glow */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-64 w-64 rounded-full bg-accent/10 blur-[120px]" />

      {/* Rotating ring */}
      <div
        aria-hidden
        className="animate-spin-slow pointer-events-none absolute inset-6 rounded-full border border-dashed border-accent/25"
      />

      {/* Center hub */}
      <div
        className={cn(
          "absolute left-1/2 top-1/2 z-10 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl",
          gradientBg,
          accentShadowLg
        )}
      >
        <Truck className="h-10 w-10 text-white" strokeWidth={1.5} />
      </div>

      {/* Floating card — pickup */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className={cn(
          "absolute left-0 top-[10%] z-20 rounded-xl border border-border bg-card p-4 shadow-lg",
          accentShadow
        )}
      >
        <div className={cn("mb-2 flex h-9 w-9 items-center justify-center rounded-lg text-white", gradientBg)}>
          <MapPin className="h-4 w-4" />
        </div>
        <p className="text-xs font-semibold">Điểm đón</p>
        <p className="text-[11px] text-muted-foreground">KTX ĐHQG TP.HCM</p>
      </motion.div>

      {/* Floating card — quote */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className={cn(
          "absolute bottom-[15%] right-0 z-20 rounded-xl border border-border bg-card p-4 shadow-xl",
          accentShadowLg
        )}
      >
        <div className={cn("mb-2 flex h-9 w-9 items-center justify-center rounded-lg text-white", gradientBg)}>
          <Package className="h-4 w-4" />
        </div>
        <p className="text-xs font-semibold">Báo giá</p>
        <p className={cn("text-sm font-medium text-accent", "font-[family-name:var(--font-mono),monospace]")}>
          850.000₫
        </p>
      </motion.div>

      {/* Corner accent */}
      <div
        aria-hidden
        className={cn("absolute right-4 top-4 h-14 w-14 rounded-2xl", gradientBg, accentShadow)}
      />
    </div>
  );
}
