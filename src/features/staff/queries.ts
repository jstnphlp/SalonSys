import "server-only";
import { readSalon } from "@/features/salon/queries";
import {
  staffRowSchema,
  compensationRowSchema,
  skillSchema,
  serviceCommissionRowSchema,
} from "./schemas";
export function listStaff() {
  return readSalon("staff", staffRowSchema.array());
}
export function listCompensation() {
  return readSalon("compensation", compensationRowSchema.array());
}
export function listSkills() {
  return readSalon("skills", skillSchema.array());
}
export function listServiceCommissions() {
  return readSalon("commission_rules", serviceCommissionRowSchema.array());
}
