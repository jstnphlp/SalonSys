import { PageHeader } from "@/components/shared/page-header";
import { requireSalon, listSalonMembers } from "@/features/salon/queries";
import { requirePermission } from "@/features/auth/authorization";
import { hasPermission } from "@/features/auth/permissions";
import { listServices } from "@/features/services/queries";
import {
  listStaff,
  listSkills,
  listCompensation,
  listServiceCommissions,
} from "@/features/staff/queries";
import { StaffDirectory } from "@/features/staff/components/staff-directory";
export default async function StaffPage() {
  const salon = await requireSalon();
  await requirePermission("staff:read", salon.id);
  const canPay = hasPermission(salon.role, "payroll:manage");
  const [staff, skills, services, compensation, members, commissionRules] =
    await Promise.all([
      listStaff(),
      listSkills(),
      listServices(),
      canPay ? listCompensation() : Promise.resolve([]),
      hasPermission(salon.role, "members:manage")
        ? listSalonMembers()
        : Promise.resolve([]),
      canPay ? listServiceCommissions() : Promise.resolve([]),
    ]);
  return (
    <div className="page-wrap">
      <PageHeader
        eyebrow="Your people"
        title="Staff"
        description="Manage your team, service eligibility and work arrangements."
      />
      <StaffDirectory
        staff={staff}
        skills={skills}
        services={services}
        compensation={compensation}
        canManage={hasPermission(salon.role, "staff:manage")}
        canPay={canPay}
        members={members}
        commissionRules={commissionRules}
      />
    </div>
  );
}
