import type { ReactNode } from "react";

import { AppShell } from "@/components/shared/app-shell";
import { requireCurrentUser } from "@/features/auth/queries";
import { optionalSalon } from "@/features/salon/queries";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [user, salon] = await Promise.all([
    requireCurrentUser(),
    optionalSalon(),
  ]);
  return (
    <AppShell user={{ ...user, role: salon?.role ?? "staff" }} salon={salon}>
      {children}
    </AppShell>
  );
}
