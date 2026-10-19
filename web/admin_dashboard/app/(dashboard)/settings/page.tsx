export const dynamic = "force-dynamic";

import { PageHeader } from "@/components/dashboard/page-header";
import { ThemeSection } from "./theme-section";
import { PlatformSettingsSection } from "./platform-settings-section";
import { DangerZoneSection } from "./danger-zone-section";

export type PlatformSetting = {
  key: string;
  value: string;
  label: string;
  description: string;
};

export default function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Cài đặt"
        description="Quản lý tài khoản, giao diện và thông tin hệ thống"
      />

      <div className="space-y-6">
        <ThemeSection />
        <PlatformSettingsSection />
        <DangerZoneSection />
      </div>
    </div>
  );
}
