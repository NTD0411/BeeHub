export const dynamic = "force-dynamic";

import { PageHeader } from "@/components/admin-dashboard/page-header";
import { ThemeSection } from "./theme-section";
import { PlatformSettingsSection } from "./platform-settings-section";
import { DangerZoneSection } from "./danger-zone-section";
import type { SettingType } from "@/lib/admin/platform-settings-meta";

export type PlatformSetting = {
  key: string;
  value: string;
  displayValue: string;
  label: string;
  description: string;
  type: SettingType;
  order: number;
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Cài đặt"
        description="Quản lý tài khoản, giao diện và thông tin hệ thống"
      />

      <div className="space-y-6 max-w-4xl">
        <ThemeSection />
        <PlatformSettingsSection />
        <DangerZoneSection />
      </div>
    </div>
  );
}
