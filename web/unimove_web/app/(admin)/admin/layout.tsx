export const dynamic = "force-dynamic";

import { AdminShell } from "@/components/admin-dashboard/admin-shell";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
