"use client";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { RecordDialog } from "@/components/shared/record-form";
import { RecordTable } from "@/components/shared/record-table";
import { MutationButton } from "@/components/shared/mutation-button";
import { php, centavos, decimal, dateTime } from "@/features/salon/domain";
import {
  periodSchema,
  payrollTransitionSchema,
  adjustmentSchema,
  type PayrollPeriod,
  type PayrollItem,
  type PayrollLine,
} from "../schemas";
import {
  calculatePayrollAction,
  transitionPayrollAction,
  adjustPayrollAction,
} from "../actions";
export function PayrollBreakdown({
  period,
  items,
  lines,
  salonName,
  exceptions,
}: {
  period: PayrollPeriod;
  items: PayrollItem[];
  lines: PayrollLine[];
  salonName: string;
  exceptions: number;
}) {
  const editable = ["calculated", "reviewed"].includes(period.status);
  const columns: ColumnDef<PayrollItem>[] = [
    {
      accessorKey: "employee_name",
      header: "Employee",
      cell: ({ row }) => (
        <div className="min-w-36">
          <p className="font-medium">{row.original.employee_name}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.approved_days} approved days ·{" "}
            {row.original.approved_minutes} minutes
          </p>
        </div>
      ),
    },
    {
      accessorKey: "base_php",
      header: "Base",
      cell: ({ row }) => php(row.original.base_php),
    },
    {
      accessorKey: "commissions_php",
      header: "Commission",
      cell: ({ row }) => php(row.original.commissions_php),
    },
    {
      accessorKey: "additions_php",
      header: "Additions",
      cell: ({ row }) => php(row.original.additions_php),
    },
    {
      accessorKey: "deductions_php",
      header: "Deductions",
      cell: ({ row }) => php(row.original.deductions_php),
    },
    {
      accessorKey: "net_php",
      header: "Net pay",
      cell: ({ row }) => <strong>{php(row.original.net_php)}</strong>,
    },
  ];
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <Badge variant={period.status === "paid" ? "success" : "secondary"}>
              {period.status}
            </Badge>
            <p className="mt-3 text-2xl font-semibold">
              {php(
                decimal(items.reduce((n, i) => n + centavos(i.net_php), 0n)),
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              Total net pay · {items.length} employees
            </p>
          </div>
          <div className="flex flex-wrap gap-2" data-no-print>
            {editable && (
              <RecordDialog
                title="Refresh calculation"
                triggerLabel="Refresh preview"
                description="Rebuild the preview from current approved sources. Runs with manual adjustments cannot be refreshed; use a later cutoff adjustment."
                schema={periodSchema}
                defaults={{
                  start_date: period.start_date,
                  end_date: period.end_date,
                }}
                fields={[]}
                action={calculatePayrollAction}
                submitLabel="Refresh preview"
              />
            )}
            {period.status === "calculated" && (
              <MutationButton
                label="Mark reviewed"
                description="Confirm you have reconciled all source attendance, commission and manual lines."
                action={transitionPayrollAction}
                input={{ id: period.id, status: "reviewed", reference: "" }}
              />
            )}
            {period.status === "reviewed" && (
              <MutationButton
                label="Approve payroll"
                description="Approval permanently freezes these calculations and allocates their sources. Corrections must be entered as documented adjustments in a later cutoff."
                action={transitionPayrollAction}
                input={{ id: period.id, status: "approved", reference: "" }}
              />
            )}
            {period.status === "approved" && (
              <RecordDialog
                title="Confirm payroll payment"
                triggerLabel="Mark paid"
                description="Confirm that these employees have actually been paid. Recording payment is permanent and does not transfer funds."
                schema={payrollTransitionSchema}
                defaults={{ id: period.id, status: "paid", reference: "" }}
                fields={[
                  {
                    name: "reference",
                    label: "Payment method and reference",
                    hint: "For example: Bank transfer · batch 2026-001",
                  },
                ]}
                action={transitionPayrollAction}
                submitLabel="Confirm mark paid"
              />
            )}
          </div>
        </CardContent>
      </Card>
      {editable && exceptions > 0 && (
        <div
          role="status"
          className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
        >
          {exceptions} unapproved or open shift(s) in this cutoff are excluded.
          Review attendance before approving this payroll.
        </div>
      )}
      <RecordTable
        data={items}
        columns={columns}
        searchText={(i) => i.employee_name}
      />
      <div className="space-y-5">
        {items.map((item) => (
          <Card key={item.id} className="payslip">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>{item.employee_name}</CardTitle>
                  <CardDescription>
                    {php(item.basis_snapshot.rate)} /{" "}
                    {item.basis_snapshot.basis} · effective{" "}
                    {item.basis_snapshot.effective_from}
                  </CardDescription>
                </div>
                {editable ? (
                  <RecordDialog
                    title={`Manual entry · ${item.employee_name}`}
                    triggerLabel="Add allowance / adjustment"
                    description="Enter only reviewed amounts. No statutory contribution or tax is calculated automatically. A negative adjustment must have a documented reason."
                    schema={adjustmentSchema}
                    defaults={{
                      item_id: item.id,
                      kind: "allowance",
                      description: "",
                      amount: "0.00",
                    }}
                    fields={[
                      {
                        name: "kind",
                        label: "Line type",
                        kind: "select",
                        options: [
                          {
                            value: "allowance",
                            label: "Allowance / extra pay",
                          },
                          { value: "adjustment", label: "Adjustment (+ or −)" },
                          {
                            value: "deduction",
                            label: "Reviewed manual deduction",
                          },
                        ],
                      },
                      { name: "amount", label: "Amount (PHP)" },
                      {
                        name: "description",
                        label: "Description and reason",
                        kind: "textarea",
                      },
                    ]}
                    action={adjustPayrollAction}
                  />
                ) : (
                  <Link
                    className="text-sm text-primary underline"
                    href={`/my-payslips/${item.id}`}
                  >
                    Open printable payslip
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <PayslipLines
                lines={lines.filter((l) => l.payroll_item_id === item.id)}
              />
              <div className="mt-4 flex justify-between border-t pt-4 text-lg font-semibold">
                <span>Net pay</span>
                <span>{php(item.net_php)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {salonName} · Asia/Manila · Reviewed manual payroll aid. Statutory,
        holiday, overtime and tax automation are not included.
      </p>
    </div>
  );
}
function PayslipLines({ lines }: { lines: PayrollLine[] }) {
  return (
    <ul className="divide-y">
      {lines.map((line) => (
        <li
          key={line.id}
          className="flex items-start justify-between gap-4 py-3 text-sm"
        >
          <div className="min-w-0">
            <p className="break-words">{line.description}</p>
            <p className="mt-1 text-xs text-muted-foreground capitalize">
              {line.kind}
              {line.attendance_id
                ? ` · Attendance ${line.attendance_id}`
                : line.commission_id
                  ? ` · Earning ${line.commission_id}`
                  : ""}
            </p>
          </div>
          <span className="shrink-0 tabular-nums">
            {line.kind === "attendance"
              ? "Source"
              : `${line.kind === "deduction" ? "−" : ""}${php(line.amount_php)}`}
          </span>
        </li>
      ))}
    </ul>
  );
}
export function PayslipPrintView({
  salonName,
  period,
  item,
  lines,
}: {
  salonName: string;
  period: PayrollPeriod;
  item: PayrollItem;
  lines: PayrollLine[];
}) {
  return (
    <Card className="payslip mx-auto w-full max-w-3xl">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardDescription>Employee payslip · PHP</CardDescription>
            <CardTitle className="mt-1 text-2xl">{salonName}</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer />
            Print payslip
          </Button>
        </div>
        <div className="mt-4 space-y-1 text-sm">
          <p className="font-semibold">{item.employee_name}</p>
          <p>
            {period.start_date} → {period.end_date} inclusive · Asia/Manila
          </p>
          <p>
            {item.approved_days} approved days · {item.approved_minutes}{" "}
            approved minutes
          </p>
          <p>
            Basis: {php(item.basis_snapshot.rate)} / {item.basis_snapshot.basis}
            {item.basis_snapshot.basis === "monthly"
              ? ` ÷ ${item.basis_snapshot.monthly_divisor} cutoffs`
              : ""}
          </p>
          <Badge variant={period.status === "paid" ? "success" : "secondary"}>
            {period.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <PayslipLines lines={lines} />
        <div className="mt-4 flex justify-between border-t py-4 text-xl font-semibold">
          <span>Net pay</span>
          <span>{php(item.net_php)}</span>
        </div>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>Approved: {dateTime(period.approved_at)}</p>
          <p>
            Paid: {dateTime(period.paid_at)}
            {period.paid_reference ? ` · ${period.paid_reference}` : ""}
          </p>
          <p>Reference: {item.id}</p>
          <p>Manual payroll calculation. No automatic statutory deductions.</p>
        </div>
      </CardContent>
    </Card>
  );
}
