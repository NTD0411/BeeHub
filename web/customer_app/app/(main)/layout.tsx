import { BottomNav } from "@/components/layout/bottom-nav";
import { MeshBackground } from "@/components/layout/mesh-background";
import { AuthGuard } from "@/components/providers/auth-guard";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <MeshBackground />
      <div className="relative min-h-screen pb-nav max-w-lg mx-auto" style={{ backgroundColor: "transparent" }}>
        {children}
      </div>
      <BottomNav />
    </AuthGuard>
  );
}
