import { PageHeader } from "@/components/shared/page-header";
import { requireSalon } from "@/features/salon/queries";
import { hasPermission } from "@/features/auth/permissions";
import { listServices } from "@/features/services/queries";
import { ServiceCatalog } from "@/features/services/components/service-catalog";
export default async function ServicesPage() {
  const salon = await requireSalon();
  return (
    <div className="page-wrap">
      <PageHeader
        eyebrow="Your catalog"
        title="Services"
        description="Your expertise, your menu. Configure services for any kind of salon."
      />
      <ServiceCatalog
        services={await listServices()}
        canManage={hasPermission(salon.role, "services:manage")}
      />
    </div>
  );
}
