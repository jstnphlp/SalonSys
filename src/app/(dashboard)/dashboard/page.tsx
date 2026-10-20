import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  Clock3,
  ClipboardCheck,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { requireCurrentUser } from "@/features/auth/queries";
import { hasPermission } from "@/features/auth/permissions";
import { requireSalon } from "@/features/salon/queries";
import { businessDate, dateTime, hasStaleShift } from "@/features/salon/domain";
import {
  listAppointments,
  listBookingServices,
} from "@/features/appointments/queries";
import { listAttendance } from "@/features/attendance/queries";
import { listStaff } from "@/features/staff/queries";
import { listPayrollPeriods } from "@/features/payroll/queries";
export default async function DashboardPage() {
  const [user, salon] = await Promise.all([
    requireCurrentUser(),
    requireSalon(),
  ]);
  const today = businessDate();
  const canPay = hasPermission(salon.role, "payroll:manage");
  const canReview = hasPermission(salon.role, "attendance:read");
  const [appointments, services, attendance, staff, periods] =
    await Promise.all([
      listAppointments(today, today),
      listBookingServices(),
      listAttendance(),
      listStaff(),
      canPay ? listPayrollPeriods() : Promise.resolve([]),
    ]);
  const pending = attendance.filter((e) =>
    ["submitted", "corrected"].includes(e.status),
  );
  const open = attendance.filter((e) => !e.clock_out_at);
  const payrollPending = periods.filter((p) =>
    ["calculated", "reviewed"].includes(p.status),
  );
  const metrics = [
    {
      label: "Appointments today",
      value: appointments.filter(
        (a) => !["cancelled", "no_show"].includes(a.status),
      ).length,
      icon: CalendarDays,
      href: "/appointments",
    },
    {
      label: canReview ? "Staff on duty" : "Your open shifts",
      value: open.length,
      icon: Clock3,
      href: canReview ? "/attendance" : "/my-attendance",
    },
    {
      label: canReview
        ? "Shifts awaiting review"
        : "Your shifts awaiting review",
      value: pending.length,
      icon: ClipboardCheck,
      href: canReview ? "/attendance" : "/my-attendance",
    },
    ...(canPay
      ? [
          {
            label: "Payroll to review",
            value: payrollPending.length,
            icon: Wallet,
            href: "/payroll",
          },
        ]
      : []),
  ];
  return (
    <div className="page-wrap">
      <PageHeader
        eyebrow={salon.name}
        title={`Good day, ${user.fullName.split(" ")[0]}.`}
        description="A little clarity for a busy day. Here’s what’s happening at your salon."
        action={
          <Link href="/appointments" className={buttonVariants()}>
            Open calendar <ArrowUpRight />
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => (
          <Link key={m.label} href={m.href}>
            <Card className="h-full transition-colors hover:border-primary/40">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">
                    {m.label}
                  </p>
                  <m.icon className="size-4 text-primary/70" />
                </div>
                <p className="mt-5 text-3xl font-semibold tracking-tight tabular-nums">
                  {m.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {m.label.includes("today")
                    ? "Today · Asia/Manila"
                    : "Current records"}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <div className="flex justify-between gap-3">
              <div>
                <CardTitle>Today’s appointments</CardTitle>
                <CardDescription>{today} · Asia/Manila</CardDescription>
              </div>
              <Link
                href="/appointments"
                className="text-xs font-medium text-primary"
              >
                View calendar ?
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {appointments.length ? (
              <div className="divide-y">
                {appointments.map((a) => (
                  <Link
                    href={`/appointments?date=${today}`}
                    className="flex flex-wrap items-center justify-between gap-4 py-4"
                    key={a.id}
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-1 size-2 rounded-full bg-primary" />
                      <div>
                        <p className="text-sm font-medium">
                          {services
                            .filter((s) => s.appointment_id === a.id)
                            .map((s) => s.name_snapshot)
                            .join(" + ")}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {dateTime(a.start_at)} ·{" "}
                          {staff.find((s) => s.id === a.staff_id)
                            ?.display_name ?? "Assigned employee"}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        a.status === "completed" ? "success" : "secondary"
                      }
                    >
                      {a.status.replaceAll("_", " ")}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<CalendarDays />}
                title="A fresh day ahead"
                description="No appointments today. Open the calendar to add your first booking."
              />
            )}
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>On duty</CardTitle>
              <CardDescription>Currently open shifts</CardDescription>
            </CardHeader>
            <CardContent>
              {open.length ? (
                <ul className="space-y-4">
                  {open.map((e) => (
                    <li
                      key={e.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {staff.find((s) => s.id === e.staff_id)
                            ?.display_name ?? "Your shift"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Since {dateTime(e.clock_in_at)}
                        </p>
                      </div>
                      <span
                        className="size-2 rounded-full bg-emerald-600"
                        aria-label="On duty"
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-4 text-sm text-muted-foreground">
                  No open shifts right now.
                </p>
              )}
            </CardContent>
          </Card>
          {canReview && (
            <Card>
              <CardHeader>
                <CardTitle>Needs your attention</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pending.length ? (
                  <Link
                    href="/attendance"
                    className="block rounded-lg bg-amber-50 p-4 text-sm text-amber-900"
                  >
                    {pending.length} shift(s) ready for review ?
                  </Link>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Attendance is up to date.
                  </p>
                )}
                {payrollPending.length > 0 && (
                  <Link
                    href="/payroll"
                    className="block rounded-lg bg-primary/5 p-4 text-sm text-primary"
                  >
                    {payrollPending.length} payroll cutoff(s) to review ?
                  </Link>
                )}
                {hasStaleShift(open) && (
                  <Link
                    href="/attendance"
                    className="block rounded-lg bg-amber-50 p-4 text-sm text-amber-900"
                  >
                    Check shifts open longer than 16 hours ?
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
