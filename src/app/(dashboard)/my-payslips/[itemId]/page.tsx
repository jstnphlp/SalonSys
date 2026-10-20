import { z } from "zod";
import { notFound } from "next/navigation";
import { requireSalon } from "@/features/salon/queries";
import { createClient } from "@/lib/supabase/server";
import {
  listPayrollItems,
  listPayrollPeriods,
  listPayrollLines,
} from "@/features/payroll/queries";
import { PayslipPrintView } from "@/features/payroll/components/payroll-breakdown";
export default async function Payslip({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const salon = await requireSalon();
  const id = z.uuid().safeParse((await params).itemId);
  if (!id.success) notFound();
  const [items, periods, lines] = await Promise.all([
    listPayrollItems(),
    listPayrollPeriods(),
    listPayrollLines(),
  ]);
  const item = items.find((i) => i.id === id.data);
  const period = periods.find(
    (p) =>
      p.id === item?.payroll_period_id &&
      ["approved", "paid"].includes(p.status),
  );
  if (!item || !period) notFound();
  const db = await createClient();
  const { error } = await db.rpc("log_payslip_access", {
    p_org: salon.id,
    p_item: item.id,
  });
  if (error) throw new Error("Payslip could not be opened.");
  return (
    <div className="page-wrap">
      <PayslipPrintView
        salonName={salon.name}
        period={period}
        item={item}
        lines={lines.filter((l) => l.payroll_item_id === item.id)}
      />
    </div>
  );
}
