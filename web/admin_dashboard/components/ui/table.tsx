import * as React from "react";
import { cn } from "@/lib/utils";

/* ── Table (scroll wrapper + table) ──────────────────────────────────────── */

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm border-collapse", className)}
        {...props}
      />
    </div>
  ),
);
Table.displayName = "Table";

/* ── TableHeader ─────────────────────────────────────────────────────────── */

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("sticky top-0 z-10", className)} {...props} />
));
TableHeader.displayName = "TableHeader";

/* ── TableBody ───────────────────────────────────────────────────────────── */

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
));
TableBody.displayName = "TableBody";

/* ── TableFooter ─────────────────────────────────────────────────────────── */

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, style, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn("border-t font-medium", className)}
    style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", ...style }}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

/* ── TableRow ────────────────────────────────────────────────────────────── */

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, style, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b transition-colors",
        "hover:bg-[var(--primary-tint)]/40",
        "data-[state=selected]:bg-[var(--primary-tint)]",
        className,
      )}
      style={{ borderColor: "var(--border)", ...style }}
      {...props}
    />
  ),
);
TableRow.displayName = "TableRow";

/* ── TableHead ───────────────────────────────────────────────────────────── */

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, style, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-11 px-4 text-left align-middle text-xs font-semibold uppercase tracking-wide",
        "whitespace-nowrap border-b",
        "[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      style={{
        color: "var(--muted)",
        backgroundColor: "var(--surface)",
        borderColor: "var(--border)",
        ...style,
      }}
      {...props}
    />
  ),
);
TableHead.displayName = "TableHead";

/* ── TableCell ───────────────────────────────────────────────────────────── */

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, style, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        "px-4 py-3 align-middle",
        "[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      style={{ color: "var(--text)", ...style }}
      {...props}
    />
  ),
);
TableCell.displayName = "TableCell";

/* ── TableCaption ────────────────────────────────────────────────────────── */

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, style, ...props }, ref) => (
    <caption
      ref={ref}
      className={cn("mt-4 text-sm", className)}
      style={{ color: "var(--muted)", ...style }}
      {...props}
    />
  ),
);
TableCaption.displayName = "TableCaption";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
