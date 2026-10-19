import * as React from "react";
import { cn } from "@/lib/utils";

/* ── Card ─────────────────────────────────────────────────────────────────── */

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, style, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl shadow-sm border",
        className,
      )}
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--border)",
        ...style,
      }}
      {...props}
    />
  ),
);
Card.displayName = "Card";

/* ── CardHeader ───────────────────────────────────────────────────────────── */

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col gap-1.5 p-6", className)}
      {...props}
    />
  ),
);
CardHeader.displayName = "CardHeader";

/* ── CardTitle ────────────────────────────────────────────────────────────── */

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, style, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-lg font-semibold leading-tight tracking-tight", className)}
      style={{ color: "var(--text)", ...style }}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

/* ── CardDescription ──────────────────────────────────────────────────────── */

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, style, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm leading-relaxed", className)}
      style={{ color: "var(--muted)", ...style }}
      {...props}
    />
  ),
);
CardDescription.displayName = "CardDescription";

/* ── CardContent ──────────────────────────────────────────────────────────── */

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  ),
);
CardContent.displayName = "CardContent";

/* ── CardFooter ───────────────────────────────────────────────────────────── */

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, style, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center p-6 pt-0", className)}
      style={style}
      {...props}
    />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
