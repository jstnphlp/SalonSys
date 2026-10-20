"use server";
import { salonMutation } from "@/features/salon/mutations";
import { serviceSchema } from "./schemas";
export async function saveServiceAction(input: unknown) {
  return salonMutation(input, serviceSchema, "services:manage", (db, org, v) =>
    db.rpc("save_service", { p_org: org, p_data: v }),
  );
}
