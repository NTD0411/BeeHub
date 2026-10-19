"use client";

import React, { Suspense } from "react";
import Sidebar from "@/components/admin-dashboard/sidebar";
import Header from "@/components/admin-dashboard/header";
import DashboardShell from "@/components/admin-dashboard/dashboard-shell";
import TokenInitializer from "@/components/admin-dashboard/token-initializer";
import { AdminRoleGuard } from "@/components/shared/admin-role-guard";
import { ThemeProvider } from "@/components/admin-providers/theme-provider";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="system">
      <AdminRoleGuard>
        <TokenInitializer />
        <div className="flex min-h-screen w-full overflow-x-hidden" style={{ backgroundColor: "var(--bg)" }}>
          <Suspense fallback={null}>
            <Sidebar />
          </Suspense>
          <DashboardShell>
            <Header />
            <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
              <Suspense fallback={null}>{children}</Suspense>
            </main>
          </DashboardShell>
        </div>
      </AdminRoleGuard>
    </ThemeProvider>
  );
}
