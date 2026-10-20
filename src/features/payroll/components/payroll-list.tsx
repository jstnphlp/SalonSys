"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { RecordDialog } from "@/components/shared/record-form";
import { RecordTable } from "@/components/shared/record-table";
import { Badge } from "@/components/ui/badge";
import {
  businessDate,
  addDays,
  centavos,
  decimal,
  php,
} from "@/features/salon/domain";
import { periodSchema, type PayrollPeriod, type PayrollItem } from "../schemas";
import { calculatePayrollAction } from "../actions";
export function PayrollList({
  periods,
  items,
  frequency,
}: {
  periods: PayrollPeriod[];
  items: PayrollItem[];
  frequency: string;
}) {
  const router = useRouter();
  const today = businessDate();
  const start =
    frequency === "weekly"
      ? addDays(today, -6)
      : frequency === "semi_monthly"
        ? `${today.slice(0, 8)}${Number(today.slice(8)) <= 15 ? "01" : "16"}`
        : today;
  const columns: ColumnDef<PayrollPeriod>[] = [
    {
      accessorKey: "start_date",
      header: "Cutoff",
      cell: ({ row }) => (
        <Link
          className="font-medium text-primary underline-offset-4 hover:underline"
          href={`/payroll/${row.original.id}`}
        >
          {row.original.start_date} → {row.original.end_date}
        </Link>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === "paid"
              ? "success"
              : row.original.status === "approved"
                ? "secondary"
                : "warning"
          }
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "employees",
      header: "Employees",
      cell: ({ row }) =>
        items.filter((i) => i.payroll_period_id === row.original.id).length,
    },
    {
      id: "net",
      header: "Net pay",
      cell: ({ row }) =>
        php(
          decimal(
            items
              .filter((i) => i.payroll_period_id === row.original.id)
              .reduce((n, i) => n + centavos(i.net_php), 0n),
          ),
        ),
    },
    {
      accessorKey: "paid_reference",
      header: "Payment reference",
      cell: ({ row }) => row.original.paid_reference ?? "Awaiting payment",
    },
  ];
  return (
    <RecordTable
      data={periods}
      columns={columns}
      searchText={(p) => `${p.start_date} ${p.end_date} ${p.status}`}
      emptyTitle="Prepare your first payroll"
      action={
        <RecordDialog
          title="Generate payroll preview"
          triggerLabel="Generate payroll"
          description="Uses approved attendance and earned service commissions. Cutoffs are inclusive Manila dates. Monthly pay uses your configured divisor; statutory deductions require reviewed manual entries."
          schema={periodSchema}
          defaults={{ start_date: start, end_date: today }}
          fields={[
            { name: "start_date", label: "Cutoff start", kind: "date" },
            { name: "end_date", label: "Cutoff end (inclusive)", kind: "date" },
          ]}
          action={calculatePayrollAction}
          submitLabel="Calculate preview"
          onSuccess={(id) => router.push(`/payroll/${String(id)}`)}
        />
      }
    />
  );
}
