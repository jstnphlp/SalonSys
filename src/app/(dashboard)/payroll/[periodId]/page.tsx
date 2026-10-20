import { z } from "zod";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { requireSalon } from "@/features/salon/queries";
import { requirePermission } from "@/features/auth/authorization";
import {
  listPayrollPeriods,
  listPayrollItems,
  listPayrollLines,
} from "@/features/payroll/queries";
import { listAttendance } from "@/features/attendance/queries";
import { PayrollBreakdown } from "@/features/payroll/components/payroll-breakdown";
export default async function PayrollDetail({
  params,
}: {
  params: Promise<{ periodId: string }>;
}) {
  const salon = await requireSalon();
  await requirePermission("payroll:manage", salon.id);
  const id = z.uuid().safeParse((await params).periodId);
  if (!id.success) notFound();
  const [periods, allItems, lines] = await Promise.all([
    listPayrollPeriods(),
    listPayrollItems(),
    listPayrollLines(),
  ]);
  const period = periods.find((p) => p.id === id.data);
  if (!period) notFound();
  const entries = await listAttendance(period.start_date, period.end_date);
  return (
    <div className="page-wrap">
      <PageHeader
        eyebrow="Payroll review"
        title={`${period.start_date} → ${period.end_date}`}
        description="Reconcile the source lines, review adjustments and approve this cutoff."
      />
      <PayrollBreakdown
        period={period}
        items={allItems.filter((i) => i.payroll_period_id === period.id)}
        lines={lines}
        salonName={salon.name}
        exceptions={entries.filter((e) => e.status !== "approved").length}
      />
    </div>
  );
}
