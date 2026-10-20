import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireCurrentUser } from "@/features/auth/queries";
import { requireOrganizationContext } from "@/features/organizations/context";
import { requirePermission } from "@/features/auth/authorization";
import type { Permission } from "@/features/auth/permissions";
import { createClient } from "@/lib/supabase/server";

export const listSalons = cache(async () => {
  const user = await requireCurrentUser();
  const db = await createClient();
  const { data, error } = await db
    .from("organization_memberships")
    .select("organization_id,role")
    .eq("user_id", user.id);
  if (error) throw new Error("Your salons could not be loaded.");
  const { data: orgs, error: orgError } = await db
    .from("organizations")
    .select("id,name,slug")
    .in(
      "id",
      data.map((m) => m.organization_id),
    );
  if (orgError) throw new Error("Your salons could not be loaded.");
  return orgs.map((o) => ({
    ...o,
    role: data.find((m) => m.organization_id === o.id)!.role,
  }));
});
export const optionalSalon = cache(async () => {
  const salons = await listSalons();
  const selected = (await cookies()).get("salon-id")?.value;
  return (
    salons.find((s) => s.id === selected) ??
    (salons.length === 1 ? salons[0] : null)
  );
});
export const requireSalon = cache(async () => {
  const salon = await optionalSalon();
  if (!salon) redirect("/select-salon");
  return requireOrganizationContext(salon.id);
});
export async function readSalon<T>(
  resource: string,
  schema: z.ZodType<T>,
  from?: string,
  to?: string,
): Promise<T> {
  const salon = await requireSalon();
  const access: Record<string, Permission> = {
    settings: "dashboard:view",
    services: "services:read",
    staff: "dashboard:view",
    skills: "services:read",
    compensation: "payroll:manage",
    commission_rules: "payroll:manage",
    appointments: "appointments:read",
    booking_services: "appointments:read",
    attendance: "attendance:clock",
    periods: "payslips:read",
    payroll_items: "payslips:read",
    payroll_lines: "payslips:read",
    booking_audit: "appointments:manage",
    attendance_audit: "attendance:read",
  };
  const permission = access[resource];
  if (!permission) throw new Error("Unknown salon resource.");
  await requirePermission(permission, salon.id);
  const db = await createClient();
  const { data, error } = await db.rpc("salon_read", {
    p_org: salon.id,
    p_resource: resource,
    ...(from ? { p_from: from } : {}),
    ...(to ? { p_to: to } : {}),
  });
  if (error) throw new Error("Salon records could not be loaded. Try again.");
  return schema.parse(data);
}

export async function listSalonMembers() {
  const salon = await requireSalon();
  const db = await createClient();
  const { data, error } = await db.rpc("salon_members", { p_org: salon.id });
  if (error) throw new Error("Salon members could not be loaded.");
  return z
    .array(
      z.object({
        user_id: z.uuid(),
        name: z.string(),
        email: z.string(),
        role: z.enum(["admin", "manager", "staff"]),
      }),
    )
    .parse(data);
}
