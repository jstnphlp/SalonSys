"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { salonSchema, settingsSchema, memberSchema } from "./schemas";
import { salonMutation } from "./mutations";
import { requireOrganizationContext } from "@/features/organizations/context";
import { requireCurrentUser } from "@/features/auth/queries";
import { createClient } from "@/lib/supabase/server";
import {
  actionError,
  actionSuccess,
  validationError,
} from "@/lib/actions/result";
export async function createSalonAction(input: unknown) {
  const parsed = salonSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  await requireCurrentUser();
  const db = await createClient();
  const { data, error } = await db.rpc("create_salon", {
    p_name: parsed.data.name,
    p_slug: parsed.data.slug,
  });
  if (error)
    return actionError(
      "Salon could not be created. Try a different unique workspace address.",
    );
  (await cookies()).set("salon-id", data, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  revalidatePath("/", "layout");
  return actionSuccess("Salon created.", data);
}
export async function selectSalonAction(input: unknown) {
  const parsed = z.uuid().safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  try {
    await requireOrganizationContext(parsed.data);
  } catch {
    return actionError("Salon unavailable.");
  }
  (await cookies()).set("salon-id", parsed.data, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  revalidatePath("/", "layout");
  return actionSuccess("Salon selected.", undefined);
}
export async function saveSettingsAction(input: unknown) {
  return salonMutation(input, settingsSchema, "settings:manage", (db, org, v) =>
    db.rpc("save_salon_settings", { p_org: org, p_data: v }),
  );
}
export async function setMemberAction(input: unknown) {
  return salonMutation(input, memberSchema, "members:manage", (db, org, v) =>
    db.rpc("set_salon_member", {
      p_org: org,
      p_email: v.email,
      p_role: v.role,
    }),
  );
}
