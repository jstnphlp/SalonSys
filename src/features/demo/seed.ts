import { addDays, businessDate, toUtc } from "@/features/salon/domain";

export type DemoRow = Record<string, unknown>;
export type DemoState = { version: 1; tables: Record<string, DemoRow[]> };
export const demoId = (group: number, value: number) =>
  `${group}0000000-0000-4000-8000-${String(value).padStart(12, "0")}`;
export const demoPeople = [
  { id: demoId(0, 1), name: "Alex · Hair salon owner" },
  { id: demoId(0, 3), name: "Sam · Hair salon staff" },
  { id: demoId(0, 2), name: "Morgan · Hair salon manager" },
  { id: demoId(0, 4), name: "Nico · Nail studio owner" },
  { id: demoId(0, 5), name: "Remy · Nail studio staff" },
];
export function createDemoSeed(now = new Date()): DemoState {
  const today = businessDate(now);
  const yesterday = addDays(today, -1);
  const previousMonth = addDays(`${today.slice(0, 8)}01`, -1).slice(0, 7);
  const timestamp = now.toISOString();
  const tables: DemoState["tables"] = Object.fromEntries(
    [
      "profiles",
      "organizations",
      "organization_memberships",
      "salon_settings",
      "customers",
      "services",
      "staff_profiles",
      "staff_compensation",
      "staff_services",
      "service_commission_rules",
      "appointments",
      "appointment_services",
      "attendance_entries",
      "commission_earnings",
      "payroll_periods",
      "payroll_items",
      "payroll_line_items",
      "audit_events",
      "file_records",
    ].map((name) => [name, []]),
  );
  const names = [
    "Alex Rivera",
    "Morgan Reyes",
    "Sam Santos",
    "Nico Cruz",
    "Remy Garcia",
  ];
  const emails = [
    "admin@example.test",
    "manager@example.test",
    "staff@example.test",
    "nail-owner@example.test",
    "nail-staff@example.test",
  ];
  names.forEach((full_name, i) =>
    tables.profiles.push({
      id: demoId(0, i + 1),
      full_name,
      email: emails[i],
      role: i === 0 || i === 3 ? "admin" : i === 1 ? "manager" : "staff",
      avatar_path: null,
    }),
  );
  const hours = Object.fromEntries(
    Array.from({ length: 7 }, (_, day) => [day, ["08:00", "20:00"]]),
  );
  for (const index of [1, 2]) {
    const organization_id = demoId(1, index);
    const owner = demoId(0, index === 1 ? 1 : 4);
    tables.organizations.push({
      id: organization_id,
      name: index === 1 ? "Common Ground Hair Studio" : "Still Nail Studio",
      slug: index === 1 ? "common-ground" : "still-nails",
      created_by: owner,
    });
    tables.salon_settings.push({
      organization_id,
      timezone: "Asia/Manila",
      opening_hours: structuredClone(hours),
      closed_dates: [],
      slot_minutes: 15,
      payroll_frequency: "semi_monthly",
      monthly_divisor: "2.00",
      updated_at: timestamp,
    });
    for (const user of index === 1 ? [1, 2, 3] : [4, 5])
      tables.organization_memberships.push({
        organization_id,
        user_id: demoId(0, user),
        role:
          user === 1 || user === 4 ? "admin" : user === 2 ? "manager" : "staff",
      });
    ["Jamie", "Casey", "Taylor"].forEach((name, i) =>
      tables.customers.push({
        id: demoId(2, index * 10 + i),
        organization_id,
        name: `${name} ${index === 1 ? "Rivera" : "Cruz"}`,
        email: null,
        phone: `+6391700000${index}${i}`,
        status: "active",
        notes: "Sample client for the SalonSys demo.",
        created_by: owner,
        updated_by: owner,
        created_at: timestamp,
        updated_at: timestamp,
      }),
    );
  }
  const serviceDefinitions: [
    number,
    number,
    string,
    string,
    string,
    number,
    number,
  ][] = [
    [1, 1, "Haircut & finish", "Hair", "350.00", 45, 0],
    [2, 1, "Color consultation", "Color", "500.00", 60, 15],
    [3, 1, "Hair treatment", "Care", "850.00", 60, 0],
    [4, 2, "Gel manicure", "Nails", "650.00", 75, 0],
    [5, 2, "Classic pedicure", "Nails", "400.00", 45, 15],
    [6, 2, "Nail art", "Design", "300.00", 30, 0],
  ];
  for (const [
    id,
    org,
    name,
    category,
    price_php,
    duration_minutes,
    buffer_minutes,
  ] of serviceDefinitions)
    tables.services.push({
      id: demoId(3, id),
      organization_id: demoId(1, org),
      name,
      category,
      price_php,
      duration_minutes,
      buffer_minutes,
      active: true,
    });
  const staffDefinitions: [
    number,
    number,
    number | null,
    string,
    string,
    string,
  ][] = [
    [1, 1, 3, "Sam Santos", "hourly", "100.00"],
    [2, 1, null, "Bea Mendoza", "daily", "700.00"],
    [3, 2, 5, "Remy Garcia", "monthly", "15000.00"],
  ];
  for (const [
    id,
    org,
    user,
    display_name,
    pay_basis,
    rate_php,
  ] of staffDefinitions) {
    const organization_id = demoId(1, org),
      staff_id = demoId(4, id);
    tables.staff_profiles.push({
      id: staff_id,
      organization_id,
      user_id: user ? demoId(0, user) : null,
      display_name,
      phone: "+639170000099",
      active: true,
      hire_date: "2025-01-01",
      working_hours: null,
    });
    tables.staff_compensation.push({
      staff_id,
      organization_id,
      pay_basis,
      rate_php,
      commission_type: "percent",
      commission_value: "10.00",
      effective_from: "2025-01-01",
    });
    tables.attendance_entries.push({
      id: demoId(6, id),
      organization_id,
      staff_id,
      clock_in_at: toUtc(`${yesterday}T09:00`),
      clock_out_at: toUtc(`${yesterday}T18:00`),
      break_minutes: 60,
      status: id === 2 ? "submitted" : "approved",
      correction_reason: null,
      approved_by: id === 2 ? null : demoId(0, org === 1 ? 1 : 4),
      approved_at: id === 2 ? null : timestamp,
    });
  }
  for (const [id, org, staff, service, start, status] of [
    [1, 1, 1, 1, "10:00", "completed"],
    [2, 1, 1, 3, "14:00", "scheduled"],
    [3, 1, 2, 2, "11:00", "checked_in"],
    [4, 2, 3, 4, "10:00", "completed"],
    [5, 2, 3, 5, "14:00", "scheduled"],
  ] as const) {
    const s = tables.services.find((row) => row.id === demoId(3, service))!;
    const organization_id = demoId(1, org),
      appointment_id = demoId(5, id),
      staff_id = demoId(4, staff);
    const start_at = toUtc(`${today}T${start}`);
    tables.appointments.push({
      id: appointment_id,
      organization_id,
      staff_id,
      customer_id: demoId(2, org * 10),
      walk_in_name: org === 1 ? "Jamie Rivera" : "Jamie Cruz",
      start_at,
      end_at: new Date(
        Date.parse(start_at) +
          (Number(s.duration_minutes) + Number(s.buffer_minutes)) * 60000,
      ).toISOString(),
      status,
      notes: "Sample appointment. Try creating or rescheduling a booking.",
      created_by: demoId(0, org === 1 ? 1 : 4),
      updated_by: demoId(0, org === 1 ? 1 : 4),
      created_at: timestamp,
      updated_at: timestamp,
    });
    tables.appointment_services.push({
      id: demoId(7, id),
      organization_id,
      appointment_id,
      service_id: s.id,
      position: 0,
      name_snapshot: s.name,
      price_php: s.price_php,
      duration_minutes: s.duration_minutes,
      buffer_minutes: s.buffer_minutes,
      commission_type: "percent",
      commission_value: "10.00",
    });
    if (status === "completed")
      tables.commission_earnings.push({
        id: demoId(8, id),
        organization_id,
        appointment_service_id: demoId(7, id),
        staff_id,
        earned_at: timestamp,
        amount_php: org === 1 ? "35.00" : "65.00",
        rule_snapshot: { type: "percent", value: "10.00", price: s.price_php },
      });
  }
  for (const org of [1, 2]) {
    const organization_id = demoId(1, org),
      staff_id = demoId(4, org === 1 ? 1 : 3),
      period = demoId(9, org),
      item = demoId(9, org + 10);
    tables.payroll_periods.push({
      id: period,
      organization_id,
      start_date: `${previousMonth}-01`,
      end_date: `${previousMonth}-15`,
      status: "paid",
      prepared_by: demoId(0, org === 1 ? 1 : 4),
      approved_at: timestamp,
      paid_at: timestamp,
      paid_reference: "Demo bank transfer · SAMPLE",
      approved_by: demoId(0, org === 1 ? 1 : 4),
      paid_by: demoId(0, org === 1 ? 1 : 4),
    });
    const pay = tables.staff_compensation.find(
      (row) => row.staff_id === staff_id,
    )!;
    const amount = org === 1 ? "4000.00" : "7500.00";
    tables.payroll_items.push({
      id: item,
      organization_id,
      payroll_period_id: period,
      staff_id,
      employee_name: org === 1 ? "Sam Santos" : "Remy Garcia",
      basis_snapshot: {
        basis: pay.pay_basis,
        rate: pay.rate_php,
        monthly_divisor: "2.00",
        effective_from: pay.effective_from,
      },
      approved_minutes: "2400",
      approved_days: 5,
      base_php: amount,
      commissions_php: "0.00",
      additions_php: "0.00",
      deductions_php: "0.00",
      net_php: amount,
    });
    tables.payroll_line_items.push({
      id: demoId(9, org + 20),
      organization_id,
      payroll_item_id: item,
      kind: "base",
      description:
        org === 1
          ? "40 approved hours × PHP 100.00 (sample statement)"
          : "PHP 15,000 monthly / 2 configured cutoffs (sample statement)",
      amount_php: amount,
      attendance_id: null,
      commission_id: null,
    });
  }
  return { version: 1, tables };
}
