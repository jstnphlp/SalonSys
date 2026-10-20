"use client";
import type { ColumnDef } from "@tanstack/react-table";
import { RecordDialog, type Field } from "@/components/shared/record-form";
import { RecordTable } from "@/components/shared/record-table";
import { Badge } from "@/components/ui/badge";
import { php } from "@/features/salon/domain";
import { serviceSchema, type Service } from "../schemas";
import { saveServiceAction } from "../actions";
const fields: Field[] = [
  { name: "name", label: "Service name" },
  {
    name: "category",
    label: "Category",
    hint: "Use any category that fits your business.",
  },
  { name: "price_php", label: "Price (PHP)" },
  { name: "duration_minutes", label: "Duration (minutes)", kind: "number" },
  {
    name: "buffer_minutes",
    label: "Cleanup / buffer (minutes)",
    kind: "number",
  },
  { name: "active", label: "Available to book", kind: "checkbox" },
];
export function ServiceCatalog({
  services,
  canManage,
}: {
  services: Service[];
  canManage: boolean;
}) {
  const form = (service?: Service) => (
    <RecordDialog
      title={service ? "Edit service" : "Add service"}
      description="Prices and duration are saved on each booking. Changes apply to new bookings."
      triggerLabel={service ? `Edit ${service.name}` : "Add service"}
      schema={serviceSchema}
      defaults={
        service ?? {
          name: "",
          category: "",
          price_php: "0.00",
          duration_minutes: 45,
          buffer_minutes: 0,
          active: true,
        }
      }
      fields={fields}
      action={saveServiceAction}
    />
  );
  const columns: ColumnDef<Service>[] = [
    {
      accessorKey: "name",
      header: "Service",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.category}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "duration_minutes",
      header: "Duration",
      cell: ({ row }) =>
        `${row.original.duration_minutes} min + ${row.original.buffer_minutes} buffer`,
    },
    {
      accessorKey: "price_php",
      header: "Price",
      cell: ({ row }) => php(row.original.price_php),
    },
    {
      accessorKey: "active",
      header: "Availability",
      cell: ({ row }) => (
        <Badge variant={row.original.active ? "success" : "muted"}>
          {row.original.active ? "Active" : "Archived"}
        </Badge>
      ),
    },
    ...(canManage
      ? [
          {
            id: "actions",
            header: "",
            cell: ({ row }) => form(row.original),
          } as ColumnDef<Service>,
        ]
      : []),
  ];
  return (
    <RecordTable
      data={services}
      columns={columns}
      searchText={(r) => `${r.name} ${r.category}`}
      action={canManage ? form() : null}
      emptyTitle="Your service menu starts here"
    />
  );
}
