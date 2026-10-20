import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { requireCurrentUser } from "@/features/auth/queries";
import { listStaff } from "@/features/staff/queries";
import {
  listPayrollItems,
  listPayrollPeriods,
} from "@/features/payroll/queries";
import { php } from "@/features/salon/domain";
export default async function MyPayslips() {
  const user = await requireCurrentUser();
  const [staff, items, periods] = await Promise.all([
    listStaff(),
    listPayrollItems(),
    listPayrollPeriods(),
  ]);
  const ownIds = staff.filter((s) => s.user_id === user.id).map((s) => s.id);
  const slips = items.filter(
    (i) =>
      ownIds.includes(i.staff_id) &&
      periods.some(
        (p) =>
          p.id === i.payroll_period_id &&
          ["approved", "paid"].includes(p.status),
      ),
  );
  return (
    <div className="page-wrap">
      <PageHeader
        eyebrow="Your pay"
        title="My payslips"
        description="Your approved payroll statements, with a clear breakdown of each amount."
      />
      {slips.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {slips.map((i) => {
            const p = periods.find((p) => p.id === i.payroll_period_id)!;
            return (
              <Card key={i.id}>
                <CardContent className="space-y-3 p-5">
                  <p className="text-sm font-medium">
                    {p.start_date} → {p.end_date}
                  </p>
                  <p className="text-2xl font-semibold">{php(i.net_php)}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {p.status}
                  </p>
                  <Link
                    className="text-sm font-medium text-primary underline"
                    href={`/my-payslips/${i.id}`}
                  >
                    View payslip
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No payslips yet"
          description="Your payslips appear here once payroll is approved."
        />
      )}
    </div>
  );
}
