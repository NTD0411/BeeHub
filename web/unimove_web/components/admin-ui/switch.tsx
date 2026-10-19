"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/admin/utils";

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

const sizeConfig = {
  sm: {
    root: "h-4 w-8",
    thumb: "h-3 w-3 data-[state=checked]:translate-x-4",
  },
  md: {
    root: "h-5 w-9",
    thumb: "h-4 w-4 data-[state=checked]:translate-x-4",
  },
  lg: {
    root: "h-6 w-11",
    thumb: "h-5 w-5 data-[state=checked]:translate-x-5",
  },
} as const;

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(({ className, size = "md", style, ...props }, ref) => {
  const config = sizeConfig[size];

  return (
    <SwitchPrimitive.Root
      ref={ref}
      className={cn(
        "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
        "transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        // unchecked
        "bg-slate-300 dark:bg-slate-600",
        // checked — blue
        "data-[state=checked]:bg-[var(--primary)]",
        config.root,
        className,
      )}
      style={style}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block rounded-full bg-white shadow-sm ring-0",
          "transition-transform duration-200",
          "translate-x-0",
          config.thumb,
        )}
      />
    </SwitchPrimitive.Root>
  );
});
Switch.displayName = SwitchPrimitive.Root.displayName;

export { Switch };
