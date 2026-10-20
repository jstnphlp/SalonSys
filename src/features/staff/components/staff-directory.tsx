"use client";
import type { ColumnDef } from "@tanstack/react-table";
import { RecordDialog, type Field } from "@/components/shared/record-form";
import { RecordTable } from "@/components/shared/record-table";
import { Badge } from "@/components/ui/badge";
import { businessDate, php } from "@/features/salon/domain";
import type { Service } from "@/features/services/schemas";
import {
  staffSchema,
  compensationSchema,
  type Staff,
  type Compensation,
  serviceCommissionSchema,
  type ServiceCommission,
} from "../schemas";
import {
  saveStaffAction,
  saveCompensationAction,
  setServiceCommissionAction,
} from "../actions";
export function StaffDirectory({
  staff,
  services,
  skills,
  compensation,
  canManage,
  canPay,
  members,
  commissionRules,
}: {
  staff: Staff[];
  services: Service[];
  skills: { staff_id: string; service_id: string }[];
  compensation: Compensation[];
  canManage: boolean;
  canPay: boolean;
  members: { user_id: string; name: string; email: string }[];
  commissionRules: ServiceCommission[];
}) {
  const fields: Field[] = [
    { name: "display_name", label: "Employee name" },
    { name: "phone", label: "Phone" },
    { name: "hire_date", label: "Hire date", kind: "date" },
    {
      name: "user_id",
      label: "Linked account (optional)",
      kind: "select",
      options: [
        { value: "", label: "Employee without login" },
        ...members.map((m) => ({
          value: m.user_id,
          label: `${m.name} · ${m.email}`,
        })),
      ],
      hint: "Add registered accounts in Settings before linking them to an employee.",
    },
    { name: "active", label: "Active employee", kind: "checkbox" },
    {
      name: "service_ids",
      label: "Service eligibility",
      kind: "multiple",
      options: services.map((s) => ({ value: s.id, label: s.name })),
      hint: "Select none to allow all services. Hold Ctrl / Command to select several.",
    },
    {
      name: "working_hours",
      label: "Weekly availability",
      kind: "hours",
      hint: "Without custom hours, salon operating hours apply.",
    },
  ];
  const form = (person?: Staff) => (
    <RecordDialog
      title={person ? "Edit employee" : "Add employee"}
      description="Employees can have an optional account for their own bookings, attendance and payslips."
      triggerLabel={person ? `Edit ${person.display_name}` : "Add employee"}
      triggerVariant={person ? "outline" : "default"}
      schema={staffSchema}
      defaults={
        person
          ? {
              ...person,
              phone: person.phone ?? "",
              user_id: person.user_id ?? "",
              service_ids: skills
                .filter((s) => s.staff_id === person.id)
                .map((s) => s.service_id),
            }
          : {
              display_name: "",
              phone: "",
              hire_date: businessDate(),
              user_id: "",
              active: true,
              working_hours: null,
              service_ids: [],
            }
      }
      fields={fields}
      action={saveStaffAction}
    />
  );
  const payForm = (person: Staff) => {
    const pay = compensation.find((c) => c.staff_id === person.id);
    return (
      <RecordDialog
        title={`Compensation · ${person.display_name}`}
        description="Rates apply to future payroll previews. Bookings retain their commission rule at booking time. Monthly pay uses the configured divisor in Settings."
        triggerLabel="Compensation"
        schema={compensationSchema}
        defaults={
          pay ?? {
            staff_id: person.id,
            pay_basis: "daily",
            rate_php: "0.00",
            commission_type: "none",
            commission_value: "0.00",
            effective_from: businessDate(),
          }
        }
        fields={[
          {
            name: "pay_basis",
            label: "Base pay basis",
            kind: "select",
            options: ["hourly", "daily", "monthly"].map((v) => ({
              value: v,
              label: v,
            })),
          },
          { name: "rate_php", label: "Base rate (PHP)" },
          { name: "effective_from", label: "Effective from", kind: "date" },
          {
            name: "commission_type",
            label: "Commission rule",
            kind: "select",
            options: ["none", "percent", "fixed"].map((v) => ({
              value: v,
              label: v,
            })),
          },
          {
            name: "commission_value",
            label: "Commission percent or fixed PHP",
          },
        ]}
        action={saveCompensationAction}
      />
    );
  };
  const ruleForm = (person: Staff) => (
    <RecordDialog
      title={`Service commission · ${person.display_name}`}
      triggerLabel="Service commission"
      description="Overrides this employee’s default commission for a selected service on new bookings. Save a 'none' rule to disable commission for that service."
      schema={serviceCommissionSchema}
      defaults={{
        staff_id: person.id,
        service_id: "",
        commission_type: "percent",
        commission_value: "0.00",
      }}
      fields={[
        {
          name: "service_id",
          label: "Service",
          kind: "select",
          options: [
            { value: "", label: "Choose service" },
            ...services.map((s) => ({ value: s.id, label: s.name })),
          ],
        },
        {
          name: "commission_type",
          label: "Rule type",
          kind: "select",
          options: ["percent", "fixed", "none"].map((v) => ({
            value: v,
            label: v,
          })),
        },
        { name: "commission_value", label: "Percent or fixed PHP" },
      ]}
      action={setServiceCommissionAction}
    />
  );
  const columns: ColumnDef<Staff>[] = [
    {
      accessorKey: "display_name",
      header: "Employee",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.display_name}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.phone || "No phone"}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "user_id",
      header: "Account",
      cell: ({ row }) => (row.original.user_id ? "Linked" : "No login"),
    },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.active ? "success" : "muted"}>
          {row.original.active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "services",
      header: "Services",
      cell: ({ row }) => {
        const ids = skills
          .filter((s) => s.staff_id === row.original.id)
          .map((s) => s.service_id);
        return ids.length
          ? services
              .filter((s) => ids.includes(s.id))
              .map((s) => s.name)
              .join(", ")
          : "All services";
      },
    },
    ...(canPay
      ? [
          {
            id: "pay",
            header: "Compensation",
            cell: ({ row }) => {
              const pay = compensation.find(
                (c) => c.staff_id === row.original.id,
              );
              return (
                <div className="space-y-2">
                  <p>
                    {pay
                      ? `${php(pay.rate_php)} / ${pay.pay_basis}`
                      : "Not configured"}
                  </p>
                  {payForm(row.original)}
                  {ruleForm(row.original)}
                  {commissionRules
                    .filter((r) => r.staff_id === row.original.id)
                    .map((r) => (
                      <p
                        key={r.service_id}
                        className="text-xs text-muted-foreground"
                      >
                        {services.find((s) => s.id === r.service_id)?.name}:{" "}
                        {r.commission_type === "none"
                          ? "No commission"
                          : r.commission_type === "percent"
                            ? `${r.commission_value}%`
                            : php(r.commission_value)}
                      </p>
                    ))}
                </div>
              );
            },
          } as ColumnDef<Staff>,
        ]
      : []),
    ...(canManage
      ? [
          {
            id: "actions",
            header: "",
            cell: ({ row }) => form(row.original),
          } as ColumnDef<Staff>,
        ]
      : []),
  ];
  return (
    <RecordTable
      data={staff}
      columns={columns}
      searchText={(r) => `${r.display_name} ${r.phone ?? ""}`}
      action={canManage ? form() : null}
      emptyTitle="Build your team"
    />
  );
}
