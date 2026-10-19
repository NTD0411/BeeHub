import { MobileBottomNav } from "./MobileBottomNav";
import { DesktopTopNav } from "./DesktopTopNav";
import { CustomerFooter } from "./CustomerFooter";
import { ChatQuickAccess } from "./ChatQuickAccess";
import { MeshBackground } from "./mesh-background";
import { ToastRenderer } from "@/components/shared/ToastRenderer";
import { ActiveOrderBanner } from "@/components/shared/active-order-banner";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-[#F8FAFC] dark:bg-[var(--bg)]">
      <MeshBackground />
      <DesktopTopNav />
      <main id="main-content" className="relative flex min-h-0 flex-1 flex-col">
        {children}
      </main>
      <CustomerFooter />
      <div
        className="shrink-0 lg:hidden"
        style={{ height: "calc(76px + env(safe-area-inset-bottom))" }}
        aria-hidden="true"
      />
      <MobileBottomNav />
      <ChatQuickAccess />
      <ToastRenderer />
      <ActiveOrderBanner />
    </div>
  );
}
