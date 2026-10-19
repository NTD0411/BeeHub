"use client";

import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { cn } from "@/lib/utils";

export interface SeparatorProps
  extends React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> {
  /** Optional label displayed in the center of the separator */
  label?: React.ReactNode;
}

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  SeparatorProps
>(
  (
    {
      className,
      orientation = "horizontal",
      decorative = true,
      label,
      style,
      ...props
    },
    ref,
  ) => {
    if (label && orientation === "horizontal") {
      return (
        <div className="flex items-center gap-3 w-full">
          <SeparatorPrimitive.Root
            ref={ref}
            decorative={decorative}
            orientation={orientation}
            className={cn("flex-1 h-px", className)}
            style={{ backgroundColor: "var(--border)", ...style }}
            {...props}
          />
          <span
            className="text-xs whitespace-nowrap shrink-0"
            style={{ color: "var(--muted)" }}
          >
            {label}
          </span>
          <SeparatorPrimitive.Root
            decorative={decorative}
            orientation={orientation}
            className="flex-1 h-px"
            style={{ backgroundColor: "var(--border)" }}
          />
        </div>
      );
    }

    return (
      <SeparatorPrimitive.Root
        ref={ref}
        decorative={decorative}
        orientation={orientation}
        className={cn(
          orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
          className,
        )}
        style={{ backgroundColor: "var(--border)", ...style }}
        {...props}
      />
    );
  },
);
Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Separator };
