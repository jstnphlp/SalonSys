"use client";
import { z } from "zod";
import { RecordForm } from "@/components/shared/record-form";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { settingsSchema, settingsRowSchema, memberSchema } from "../schemas";
import { saveSettingsAction, setMemberAction } from "../actions";
export function SalonSettings({
  name,
  settings,
}: {
  name: string;
  settings: z.infer<typeof settingsRowSchema>;
}) {
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[1fr_22rem]">
      <Card>
        <CardHeader>
          <CardTitle>Salon configuration</CardTitle>
          <CardDescription>
            All times use Asia/Manila. Categories and services are configured in
            Services.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RecordForm
            schema={settingsSchema}
            defaults={{ ...settings, name }}
            action={saveSettingsAction}
            fields={[
              { name: "name", label: "Salon display name" },
              {
                name: "slot_minutes",
                label: "Booking interval",
                kind: "number",
                hint: "5, 10, 15, 30 or 60 minutes.",
              },
              {
                name: "opening_hours",
                label: "Operating hours",
                kind: "hours",
              },
              {
                name: "closed_dates",
                label: "Closed dates",
                kind: "dates",
                hint: "Choose dates when the salon is closed. Remove a date to reopen it.",
              },
              {
                name: "payroll_frequency",
                label: "Default cutoff frequency",
                kind: "select",
                options: [
                  { value: "weekly", label: "Weekly" },
                  { value: "semi_monthly", label: "Twice monthly" },
                  { value: "custom", label: "Custom" },
                ],
              },
              {
                name: "monthly_divisor",
                label: "Monthly pay divisor",
                hint: "Monthly rate ÷ this divisor per cutoff. Confirm the allocation policy before each run.",
              },
            ]}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Salon access</CardTitle>
          <CardDescription>
            Add an existing registered account by email. Owners manage payroll;
            managers handle bookings and attendance; staff see their own
            records.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RecordForm
            schema={memberSchema}
            defaults={{ email: "", role: "staff" }}
            action={setMemberAction}
            submitLabel="Save member access"
            fields={[
              { name: "email", label: "Account email", kind: "email" },
              {
                name: "role",
                label: "Salon role",
                kind: "select",
                options: [
                  { value: "staff", label: "Staff" },
                  { value: "manager", label: "Manager / receptionist" },
                  { value: "admin", label: "Owner / salon admin" },
                ],
              },
            ]}
          />
          <p className="text-xs text-muted-foreground">
            After adding access, choose this account from the employee form in
            Staff.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
