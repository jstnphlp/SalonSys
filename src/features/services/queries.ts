import "server-only";
import { readSalon } from "@/features/salon/queries";
import { serviceRowSchema } from "./schemas";
export function listServices() {
  return readSalon("services", serviceRowSchema.array());
}
