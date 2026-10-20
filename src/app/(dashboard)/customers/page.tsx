import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { requireSalon } from "@/features/salon/queries";
import { CustomerTable } from "@/features/customers/components/customer-table";
import { listCustomers } from "@/features/customers/queries";

export const metadata: Metadata = { title: "Customers" };

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, user] = await Promise.all([searchParams, requireSalon()]);
  const result = await listCustomers(params, user.id);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-7 p-5 sm:p-7 lg:p-10">
      <PageHeader
        eyebrow="Your clients"
        title="Customers"
        description="Keep client contacts and visit notes organized for your team."
      />
      <CustomerTable
        result={result}
        role={user.role}
        organizationId={user.id}
      />
    </div>
  );
}
