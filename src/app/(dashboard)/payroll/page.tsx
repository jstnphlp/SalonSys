import { PageHeader } from "@/components/shared/page-header";
import { requireSalon, readSalon } from "@/features/salon/queries";
import { requirePermission } from "@/features/auth/authorization";
import { settingsRowSchema } from "@/features/salon/schemas";
import {
  listPayrollPeriods,
  listPayrollItems,
} from "@/features/payroll/queries";
import { PayrollList } from "@/features/payroll/components/payroll-list";
export default async function PayrollPage() {
  const salon = await requireSalon();
  await requirePermission("payroll:manage", salon.id);
  const [periods, items, settings] = await Promise.all([
    listPayrollPeriods(),
    listPayrollItems(),
    readSalon("settings", settingsRowSchema),
  ]);
  return (
    <div className="page-wrap">
      <PageHeader
        eyebrow="Pay with clarity"
        title="Payroll"
        description="Approved time, earned commissions and reviewed adjustments. Every peso explained."
      />
      <PayrollList
        periods={periods}
        items={items}
        frequency={settings.payroll_frequency}
      />
      <p className="text-xs text-muted-foreground">
        No automated SSS, PhilHealth, Pag-IBIG, tax, holiday or overtime
        calculations. Confirm contracts and applicable rules with your payroll
        adviser.
      </p>
    </div>
  );
}
