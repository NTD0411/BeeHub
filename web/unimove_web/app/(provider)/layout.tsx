import { RoleGuard } from "@/components/shared/role-guard";
import { WebLayout } from "@/components/layout/web-layout";

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard requiredRole="provider">
      <WebLayout>{children}</WebLayout>
    </RoleGuard>
  );
}
