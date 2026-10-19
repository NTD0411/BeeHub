import { RoleGuard } from "@/components/shared/role-guard";
import { WebLayout } from "@/components/layout/web-layout";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard requiredRole="customer">
      <WebLayout>{children}</WebLayout>
    </RoleGuard>
  );
}
