import { PageHeader } from "@/components/shared/page-header";
import { requireCurrentUser } from "@/features/auth/queries";
import { listAttendance } from "@/features/attendance/queries";
import { listStaff } from "@/features/staff/queries";
import { AttendanceClock } from "@/features/attendance/components/attendance-clock";
import { TimesheetTable } from "@/features/attendance/components/timesheet-table";
export default async function MyAttendancePage() {
  const user = await requireCurrentUser();
  const [all, staff] = await Promise.all([listAttendance(), listStaff()]);
  const me = staff.find((s) => s.user_id === user.id);
  const entries = all.filter((a) => a.staff_id === me?.id);
  return (
    <div className="page-wrap">
      <PageHeader
        eyebrow="Your working day"
        title="My attendance"
        description="Your clock, recent shifts and approved time. All times are in Asia/Manila."
      />
      <AttendanceClock
        openShift={entries.find((e) => !e.clock_out_at)}
        hasProfile={!!me?.active}
        now={new Date().toISOString()}
      />
      <TimesheetTable
        entries={entries}
        staff={staff.filter((s) => s.id === me?.id)}
        canManage={false}
      />
    </div>
  );
}
