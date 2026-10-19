"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

/* ── Provider ────────────────────────────────────────────────────────────── */

function TooltipProvider({
  delayDuration = 400,
  ...props
}: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />;
}

/* ── Root ────────────────────────────────────────────────────────────────── */

const Tooltip = TooltipPrimitive.Root;

/* ── Trigger ─────────────────────────────────────────────────────────────── */

const TooltipTrigger = TooltipPrimitive.Trigger;

/* ── Content ─────────────────────────────────────────────────────────────── */

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, children, style, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-lg px-3 py-1.5 text-xs font-medium shadow-md",
        "animate-in fade-in-0 zoom-in-95",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        "duration-100",
        className,
      )}
      style={{
        backgroundColor: "var(--text)",
        color: "var(--surface)",
        ...style,
      }}
      {...props}
    >
      {children}
      <TooltipPrimitive.Arrow
        className="fill-current"
        style={{ color: "var(--text)" }}
        width={8}
        height={4}
      />
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent };
