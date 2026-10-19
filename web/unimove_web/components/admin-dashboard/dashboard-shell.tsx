"use client";

import React from "react";

interface DashboardShellProps {
  children: React.ReactNode;
}

/** Main column bên phải sidebar — chiếm phần còn lại của flex row. */
export default function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex flex-col flex-1 min-w-0 w-full">
      {children}
    </div>
  );
}
