"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
}: PaginationProps) {
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <p className="text-sm" style={{ color: "var(--muted)" }}>
        Hiển thị{" "}
        <span style={{ color: "var(--text)", fontWeight: 500 }}>
          {from}–{to}
        </span>{" "}
        trong{" "}
        <span style={{ color: "var(--text)", fontWeight: 500 }}>{total}</span>{" "}
        kết quả
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            "hover:bg-[var(--primary-tint)]"
          )}
          style={{ color: "var(--text)" }}
          aria-label="Trang trước"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-sm" style={{ color: "var(--muted)" }}>
              …
            </span>
          ) : (
            <button
              key={`page-${p}`}
              onClick={() => onPageChange(p as number)}
              className={cn(
                "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                p === page
                  ? "text-white"
                  : "hover:bg-[var(--primary-tint)]"
              )}
              style={
                p === page
                  ? { backgroundColor: "var(--primary)", color: "#fff" }
                  : { color: "var(--text)" }
              }
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            "hover:bg-[var(--primary-tint)]"
          )}
          style={{ color: "var(--text)" }}
          aria-label="Trang sau"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
