import { PageHeader } from "@/components/shared/page-header";
import { SalonPicker } from "@/features/salon/components/salon-picker";
import { listSalons } from "@/features/salon/queries";
export default async function SelectSalonPage() {
  return (
    <div className="page-wrap">
      <PageHeader
        eyebrow="Workspace"
        title="Welcome to SalonSys"
        description="One place for your appointments, team attendance and payroll."
      />
      <SalonPicker salons={await listSalons()} />
    </div>
  );
}
