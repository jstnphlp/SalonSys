import { PageHeader } from "@/components/shared/page-header";
import { requireSalon } from "@/features/salon/queries";
import { requirePermission } from "@/features/auth/authorization";
import {
  listAttendance,
  listAttendanceAudit,
} from "@/features/attendance/queries";
import { listStaff } from "@/features/staff/queries";
import { TimesheetTable } from "@/features/attendance/components/timesheet-table";
import { Card, CardContent } from "@/components/ui/card";
export default async function AttendancePage() {
  const salon = await requireSalon();
  await requirePermission("attendance:read", salon.id);
  const [entries, staff, audit] = await Promise.all([
    listAttendance(),
    listStaff(),
    listAttendanceAudit(),
  ]);
  return (
    <div className="page-wrap">
      <PageHeader
        eyebrow="Team time"
        title="Attendance"
        description="Review shifts, resolve missing punches and approve time for payroll. Asia/Manila."
      />
      <Card>
        <CardContent className="flex flex-wrap gap-8 p-5">
          {[
            ["On duty", entries.filter((e) => e.status === "open").length],
            [
              "Awaiting review",
              entries.filter((e) =>
                ["submitted", "corrected"].includes(e.status),
              ).length,
            ],
            [
              "Approved shifts",
              entries.filter((e) => e.status === "approved").length,
            ],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-2xl font-semibold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      <TimesheetTable entries={entries} staff={staff} canManage audit={audit} />
    </div>
  );
}
