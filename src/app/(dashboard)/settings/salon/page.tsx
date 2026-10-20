import { PageHeader } from "@/components/shared/page-header";
import { requireSalon, readSalon } from "@/features/salon/queries";
import { requirePermission } from "@/features/auth/authorization";
import { settingsRowSchema } from "@/features/salon/schemas";
import { SalonSettings } from "@/features/salon/components/salon-settings";
export default async function SettingsPage() {
  const salon = await requireSalon();
  await requirePermission("settings:manage", salon.id);
  const settings = await readSalon("settings", settingsRowSchema);
  return (
    <div className="page-wrap">
      <PageHeader
        eyebrow="Workspace"
        title="Salon settings"
        description="Make SalonSys work the way your business does."
      />
      <SalonSettings name={salon.name} settings={settings} />
    </div>
  );
}
