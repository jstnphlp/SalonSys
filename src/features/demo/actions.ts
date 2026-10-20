"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isDemoMode } from "@/config/demo";
import { actionError, actionSuccess } from "@/lib/actions/result";
import { createDemoSeed } from "./seed";
import { withDemoState } from "./store";

export async function switchDemoAccountAction(input: unknown) {
  if (!isDemoMode()) return actionError("Demo mode is disabled.");
  const parsed = z.uuid().safeParse(input);
  if (!parsed.success) return actionError("Choose a demo account.");
  const allowed = await withDemoState((s) =>
    s.tables.profiles.some((p) => p.id === parsed.data),
  );
  if (!allowed) return actionError("Demo account unavailable.");
  const jar = await cookies();
  jar.set("demo-user-id", parsed.data, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  jar.delete("salon-id");
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
export async function resetDemoAction() {
  if (!isDemoMode()) return actionError("Demo mode is disabled.");
  await withDemoState((state) => {
    state.tables = createDemoSeed().tables;
  }, true);
  const jar = await cookies();
  jar.delete("demo-user-id");
  jar.delete("salon-id");
  revalidatePath("/", "layout");
  return actionSuccess("Demo reset to the sample salons.", undefined);
}
