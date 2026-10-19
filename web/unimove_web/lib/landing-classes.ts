import { cn } from "@/lib/utils";

/* ─── UniMove brand landing classes ──────────────────────── */
export const brandBluePrimary   = "#2563EB";
export const brandYellowPrimary = "#FFCC00";

export const btnBrandBlue = cn(
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#2563EB]",
  "font-bold text-white no-underline shadow-[0_8px_24px_rgba(37,99,235,0.35)]",
  "transition-all duration-200 hover:scale-[1.03] hover:brightness-110 active:scale-[0.98]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
);

export const btnBrandYellow = cn(
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#FFCC00]",
  "font-bold text-[#111827] no-underline",
  "transition-all duration-200 hover:scale-[1.03] hover:bg-[#E6B800] active:scale-[0.98]"
);

export const btnBrandOutlineBlue = cn(
  "inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#2563EB]",
  "font-semibold text-[#2563EB] no-underline bg-transparent",
  "transition-all duration-200 hover:bg-[#EFF6FF] hover:scale-[1.03] active:scale-[0.98]"
);

export const brandYellowTag = cn(
  "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold",
  "bg-[#FFFBEB] text-[#E6B800] border border-[#FFCC00]"
);

/** Minimalist Modern — Tailwind class bundles */
export const displayFont = "font-[family-name:var(--font-display),Georgia,serif]";
export const monoFont = "font-[family-name:var(--font-mono),monospace]";

export const gradientText = "bg-gradient-to-r from-accent to-accent-secondary bg-clip-text text-transparent";

export const gradientBg = "bg-gradient-to-br from-accent to-accent-secondary";

export const btnPrimary = cn(
  "group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent-secondary",
  "font-medium text-white no-underline shadow-sm transition-all duration-200",
  "hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,82,255,0.35)] hover:brightness-110",
  "active:scale-[0.98]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
);

export const btnOutline = cn(
  "inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card",
  "font-medium text-foreground no-underline transition-all duration-200",
  "hover:border-accent/30 hover:bg-muted hover:-translate-y-0.5 hover:shadow-md",
  "active:scale-[0.98]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
);

export const sectionLabel = cn(
  "inline-flex items-center gap-3 rounded-full border border-accent/30 bg-accent/5 px-5 py-2"
);

export const featureCard = cn(
  "group relative overflow-hidden rounded-2xl border border-border bg-card p-8",
  "shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
);

export const iconGradient = cn(
  "mb-5 flex h-12 w-12 items-center justify-center rounded-xl text-white",
  "bg-gradient-to-br from-accent to-accent-secondary",
  "shadow-[0_4px_14px_rgba(0,82,255,0.25)] transition-transform duration-300 group-hover:scale-110"
);

export const stepCard = cn(
  "relative rounded-2xl border border-border bg-card p-6 text-center shadow-sm",
  "transition-all duration-200 hover:border-accent/30 hover:shadow-md"
);

export const invertedSection = "bg-[#0f172a] text-white";

export const dotPatternDark =
  "bg-[radial-gradient(circle,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[length:32px_32px]";

export const accentShadow = "shadow-[0_4px_14px_rgba(0,82,255,0.25)]";
export const accentShadowLg = "shadow-[0_8px_24px_rgba(0,82,255,0.35)]";

export const container = "mx-auto max-w-6xl px-6";
export const sectionPy = "py-28 md:py-36";
