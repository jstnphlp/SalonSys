"use server";
import { salonMutation } from "@/features/salon/mutations";
import {
  staffSchema,
  compensationSchema,
  serviceCommissionSchema,
} from "./schemas";
export async function saveStaffAction(input: unknown) {
  return salonMutation(input, staffSchema, "staff:manage", (db, org, v) =>
    db.rpc("save_staff", { p_org: org, p_data: v }),
  );
}
export async function setServiceCommissionAction(input: unknown) {
  return salonMutation(
    input,
    serviceCommissionSchema,
    "payroll:manage",
    (db, org, v) =>
      db.rpc("set_service_commission", {
        p_org: org,
        p_staff: v.staff_id,
        p_service: v.service_id,
        p_type: v.commission_type,
        p_value: Number(v.commission_value),
      }),
  );
}
export async function saveCompensationAction(input: unknown) {
  return salonMutation(
    input,
    compensationSchema,
    "payroll:manage",
    (db, org, v) => db.rpc("set_compensation", { p_org: org, p_data: v }),
  );
}
