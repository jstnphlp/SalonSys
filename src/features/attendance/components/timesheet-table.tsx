"use client";
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { RecordTable } from "@/components/shared/record-table";
import { RecordDialog, type Field } from "@/components/shared/record-form";
import { MutationButton } from "@/components/shared/mutation-button";
import {
  businessDate,
  dateTime,
  payableMinutes,
  toLocalInput,
} from "@/features/salon/domain";
import type { Staff } from "@/features/staff/schemas";
import {
  correctionSchema,
  type Attendance,
  type AttendanceAudit,
} from "../schemas";
import { correctAttendanceAction, approveAttendanceAction } from "../actions";
export function TimesheetTable({
  entries,
  staff,
  canManage,
  audit = [],
}: {
  entries: Attendance[];
  staff: Staff[];
  canManage: boolean;
  audit?: AttendanceAudit[];
}) {
  const [employee, setEmployee] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const fields: Field[] = [
    {
      name: "staff_id",
      label: "Employee",
      kind: "select",
      options: [
        { value: "", label: "Choose employee" },
        ...staff.map((s) => ({ value: s.id, label: s.display_name })),
      ],
    },
    { name: "clock_in_at", label: "Clock in · Manila", kind: "datetime-local" },
    {
      name: "clock_out_at",
      label: "Clock out · Manila",
      kind: "datetime-local",
    },
    {
      name: "break_minutes",
      label: "Approved unpaid break (minutes)",
      kind: "number",
    },
    {
      name: "correction_reason",
      label: "Reason for correction",
      kind: "textarea",
      hint: "Required. The correction needs approval before it can enter payroll.",
    },
  ];
  const form = (entry?: Attendance) => (
    <RecordDialog
      title={entry ? "Correct shift" : "Record missed shift"}
      description="Corrections are audited and require approval. Attendance already allocated to payroll cannot be edited."
      triggerLabel={entry ? "Correct" : "Record missed shift"}
      schema={correctionSchema}
      defaults={
        entry
          ? {
              id: entry.id,
              staff_id: entry.staff_id,
              clock_in_at: toLocalInput(entry.clock_in_at),
              clock_out_at: entry.clock_out_at
                ? toLocalInput(entry.clock_out_at)
                : `${businessDate()}T18:00`,
              break_minutes: entry.break_minutes,
              correction_reason: "",
            }
          : {
              staff_id: "",
              clock_in_at: `${businessDate()}T09:00`,
              clock_out_at: `${businessDate()}T18:00`,
              break_minutes: 60,
              correction_reason: "",
            }
      }
      fields={entry ? fields.filter((f) => f.name !== "staff_id") : fields}
      action={correctAttendanceAction}
    />
  );
  const columns: ColumnDef<Attendance>[] = [
    {
      accessorKey: "staff_id",
      header: "Employee",
      cell: ({ row }) =>
        staff.find((s) => s.id === row.original.staff_id)?.display_name ??
        "Your shift",
    },
    {
      accessorKey: "clock_in_at",
      header: "Clock in",
      cell: ({ row }) => dateTime(row.original.clock_in_at),
    },
    {
      accessorKey: "clock_out_at",
      header: "Clock out",
      cell: ({ row }) => dateTime(row.original.clock_out_at),
    },
    {
      id: "duration",
      header: "Payable time",
      cell: ({ row }) =>
        row.original.clock_out_at
          ? `${payableMinutes(row.original.clock_in_at, row.original.clock_out_at, row.original.break_minutes)} min · ${row.original.break_minutes} break`
          : "On duty",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <div className="space-y-1">
          <Badge
            variant={
              row.original.status === "approved"
                ? "success"
                : row.original.status === "open"
                  ? "secondary"
                  : "warning"
            }
          >
            {row.original.status}
          </Badge>
          {row.original.correction_reason && (
            <p className="max-w-52 text-xs text-muted-foreground">
              {row.original.correction_reason}
            </p>
          )}
        </div>
      ),
    },
    ...(canManage
      ? [
          {
            id: "actions",
            header: "Review",
            cell: ({ row }) => (
              <div className="flex flex-wrap gap-2">
                {form(row.original)}
                {row.original.clock_out_at &&
                  row.original.status !== "approved" && (
                    <MutationButton
                      label="Approve shift"
                      description="Approve this shift and break duration for payroll. Allocated attendance is locked."
                      action={approveAttendanceAction}
                      input={row.original.id}
                    />
                  )}
              </div>
            ),
          } as ColumnDef<Attendance>,
        ]
      : []),
  ];
  const filtered = entries.filter(
    (e) =>
      (!employee || e.staff_id === employee) &&
      (!status || e.status === status) &&
      (!from || businessDate(e.clock_in_at) >= from) &&
      (!to || businessDate(e.clock_in_at) <= to),
  );
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1 text-xs">
          Employee
          <Select
            value={employee}
            onChange={(e) => setEmployee(e.target.value)}
          >
            <option value="">All employees</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.display_name}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-1 text-xs">
          Status
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All shifts</option>
            {["open", "submitted", "corrected", "approved"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-1 text-xs">
          From
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="space-y-1 text-xs">
          Through
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
      </div>
      <RecordTable
        data={filtered}
        columns={columns}
        searchText={(e) =>
          `${staff.find((s) => s.id === e.staff_id)?.display_name ?? ""} ${e.status} ${e.correction_reason ?? ""}`
        }
        action={canManage ? form() : null}
        emptyTitle="No shifts recorded"
      />
      {canManage && (
        <details className="rounded-xl border bg-card p-5">
          <summary className="cursor-pointer text-sm font-semibold">
            Correction and approval history
          </summary>
          <ol className="mt-4 space-y-3">
            {audit.slice(0, 100).map((a) => (
              <li key={a.id} className="text-xs text-muted-foreground">
                {dateTime(a.occurred_at)} · {a.action} ·{" "}
                {a.new_data?.reason ?? "Shift recorded / reviewed"} · Entry{" "}
                {a.entity_id?.slice(0, 8)}
                <p>
                  Actor:{" "}
                  {staff.find((s) => s.user_id === a.actor_user_id)
                    ?.display_name ??
                    a.actor_user_id?.slice(0, 8) ??
                    "System"}
                </p>
                {a.old_data?.clock_in_at && (
                  <p>
                    Before: {dateTime(a.old_data.clock_in_at)} →{" "}
                    {dateTime(a.old_data.clock_out_at ?? null)} ·{" "}
                    {a.old_data.break_minutes ?? 0} break min
                  </p>
                )}
                {a.new_data?.clock_in_at && (
                  <p>
                    After: {dateTime(a.new_data.clock_in_at)} →{" "}
                    {dateTime(a.new_data.clock_out_at ?? null)} ·{" "}
                    {a.new_data.break_minutes ?? 0} break min
                  </p>
                )}
              </li>
            ))}
            {!audit.length && (
              <li className="text-sm text-muted-foreground">
                No attendance changes yet.
              </li>
            )}
          </ol>
        </details>
      )}
    </div>
  );
}
