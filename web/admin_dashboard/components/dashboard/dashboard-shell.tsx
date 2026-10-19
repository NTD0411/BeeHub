"use client";

import React from "react";
import { useSidebarStore } from "@/lib/stores/sidebar-store";

interface DashboardShellProps {
  children: React.ReactNode;
}

/**
 * Client wrapper that reads the sidebar collapsed state from Zustand
 * and applies the correct left margin so the main content area clears
 * the fixed sidebar on desktop.  On mobile there is no offset because
 * the sidebar is a full-screen drawer overlay.
 */
export default function DashboardShell({ children }: DashboardShellProps) {
  const { isCollapsed } = useSidebarStore();

  return (
    <>
      {/* Desktop: spacer div that pushes content right of sidebar */}
      <div
        className="hidden md:block shrink-0 transition-all duration-300 ease-in-out"
        style={{ width: isCollapsed ? "64px" : "256px" }}
      />

      {/* Main content: flex-1 so it fills the remaining space */}
      <div className="flex flex-col flex-1 min-w-0">
        {children}
      </div>
    </>
  );
}
