import { test } from "node:test";
import assert from "node:assert/strict";
import { salonTestDb, seedSalonDemo } from "./salon-test-db.mjs";
import { readFile } from "node:fs/promises";
import ts from "typescript";

test("migrated PostgreSQL: tenant isolation and booking → attendance → immutable payroll", async () => {
  const db = await salonTestDb();
  const owner = "00000000-0000-4000-8000-000000000001",
    staff = "00000000-0000-4000-8000-000000000002",
    other = "00000000-0000-4000-8000-000000000003",
    manager = "00000000-0000-4000-8000-000000000004";
  const q = async (sql, params = []) => (await db.query(sql, params)).rows;
  const one = async (sql, params = []) =>
    Object.values((await q(sql, params))[0])[0];
  const as = async (user, run) => {
    await db.exec(`set role authenticated;set request.jwt.claim.sub='${user}'`);
    try {
      return await run();
    } finally {
      await db.exec("reset role;reset request.jwt.claim.sub");
    }
  };
  try {
    const permissionSource = await readFile(
      "src/features/auth/permissions.ts",
      "utf8",
    );
    const permissionJs = ts.transpileModule(permissionSource, {
      compilerOptions: { module: ts.ModuleKind.ESNext },
    }).outputText;
    const { permissions, hasPermission } = await import(
      `data:text/javascript;base64,${Buffer.from(permissionJs).toString("base64")}`
    );
    for (const role of ["admin", "manager", "staff"])
      for (const permission of Object.values(permissions))
        assert.equal(
          await one("select private.role_has_permission($1,$2)", [
            role,
            permission,
          ]),
          hasPermission(role, permission),
          `${role} ${permission} SQL/TypeScript parity`,
        );
    await db.exec(
      `insert into auth.users(id,email) values('${owner}','owner@test.invalid'),('${staff}','staff@test.invalid'),('${other}','other@test.invalid'),('${manager}','manager@test.invalid');update public.profiles set role='admin' where id='${other}'`,
    );
    const a = await as(owner, () =>
      one("select public.create_salon('Hair salon','hair-salon')"),
    );
    const b = await as(other, () =>
      one("select public.create_salon('Nail studio','nail-studio')"),
    );
    await as(owner, async () => {
      await one(
        "select public.set_salon_member($1,'staff@test.invalid','staff')",
        [a],
      );
      await one(
        "select public.set_salon_member($1,'manager@test.invalid','manager')",
        [a],
      );
    });
    const employee = await as(owner, () =>
      one("select public.save_staff($1,$2)", [
        a,
        JSON.stringify({
          display_name: "Sam",
          phone: "",
          user_id: staff,
          active: true,
          hire_date: "2020-01-01",
          working_hours: null,
          service_ids: [],
        }),
      ]),
    );
    await as(owner, () =>
      one("select public.set_compensation($1,$2)", [
        a,
        JSON.stringify({
          staff_id: employee,
          pay_basis: "hourly",
          rate_php: "100.00",
          commission_type: "percent",
          commission_value: "10.00",
          effective_from: "2020-01-01",
        }),
      ]),
    );
    const daily = await as(owner, () =>
      one("select public.save_staff($1,$2)", [
        a,
        JSON.stringify({
          display_name: "Daily employee",
          phone: "",
          user_id: "",
          active: true,
          hire_date: "2020-01-01",
          working_hours: null,
          service_ids: [],
        }),
      ]),
    );
    const monthly = await as(owner, () =>
      one("select public.save_staff($1,$2)", [
        a,
        JSON.stringify({
          display_name: "Monthly employee",
          phone: "",
          user_id: "",
          active: true,
          hire_date: "2020-01-01",
          working_hours: null,
          service_ids: [],
        }),
      ]),
    );
    await as(owner, async () => {
      await q("select public.set_compensation($1,$2)", [
        a,
        JSON.stringify({
          staff_id: daily,
          pay_basis: "daily",
          rate_php: "700.00",
          commission_type: "none",
          commission_value: "0",
          effective_from: "2020-01-01",
        }),
      ]);
      await q("select public.set_compensation($1,$2)", [
        a,
        JSON.stringify({
          staff_id: monthly,
          pay_basis: "monthly",
          rate_php: "10000.01",
          commission_type: "none",
          commission_value: "0",
          effective_from: "2020-01-01",
        }),
      ]);
      await q("select public.save_salon_settings($1,$2)", [
        a,
        JSON.stringify({
          name: "Hair salon",
          opening_hours: Object.fromEntries(
            Array.from({ length: 7 }, (_, i) => [i, ["09:00", "18:00"]]),
          ),
          closed_dates: [],
          slot_minutes: 15,
          payroll_frequency: "custom",
          monthly_divisor: "3",
        }),
      ]);
      assert.equal(
        (await one("select public.salon_members($1)", [a])).length,
        3,
      );
      const settings = await one("select public.salon_read($1,'settings')", [
        a,
      ]);
      assert.equal(settings.monthly_divisor, 3);
    });
    const service = await as(owner, () =>
      one("select public.save_service($1,$2)", [
        a,
        JSON.stringify({
          name: "Haircut",
          category: "Hair",
          price_php: "350.00",
          duration_minutes: 45,
          buffer_minutes: 0,
          active: true,
        }),
      ]),
    );
    const nail = await as(other, () =>
      one("select public.save_service($1,$2)", [
        b,
        JSON.stringify({
          name: "Gel manicure",
          category: "Nails",
          price_php: "650.00",
          duration_minutes: 75,
          buffer_minutes: 0,
          active: true,
        }),
      ]),
    );
    await as(other, async () => {
      assert.equal(
        await one("select private.has_permission('payroll:manage',$1)", [a]),
        false,
        "global admin cannot bypass membership",
      );
      assert.equal(
        (await q("select * from public.services where organization_id=$1", [a]))
          .length,
        0,
      );
      await assert.rejects(
        () =>
          q("select public.save_service($1,$2)", [
            a,
            JSON.stringify({ name: "Attack" }),
          ]),
        /Permission denied/,
      );
    });
    await as(manager, async () => {
      assert.equal(
        (await q("select * from public.staff_compensation")).length,
        0,
      );
      await assert.rejects(
        () =>
          q("select public.calculate_payroll($1,'2026-10-01','2026-10-15')", [
            a,
          ]),
        /Permission denied/,
      );
    });
    await as(owner, () =>
      q("select public.set_service_commission($1,$2,$3,'fixed',25)", [
        a,
        employee,
        service,
      ]),
    );
    const booking = await as(owner, () =>
      one("select public.save_booking($1,$2)", [
        a,
        JSON.stringify({
          staff_id: employee,
          customer_id: "",
          walk_in_name: "Walk-in",
          start_at: "2026-10-20T06:00:00Z",
          service_ids: [service],
          notes: "",
        }),
      ]),
    );
    await as(owner, async () => {
      await q("select public.set_service_commission($1,$2,$3,'fixed',99)", [
        a,
        employee,
        service,
      ]);
      await assert.rejects(
        () =>
          q("select public.save_booking($1,$2)", [
            a,
            JSON.stringify({
              staff_id: employee,
              customer_id: "",
              walk_in_name: "Overlap",
              start_at: "2026-10-20T06:30:00Z",
              service_ids: [service],
            }),
          ]),
        /already has an appointment/,
      );
      await assert.rejects(
        () =>
          q("select public.save_booking($1,$2)", [
            a,
            JSON.stringify({
              staff_id: employee,
              start_at: "2026-10-20T08:00:00Z",
              service_ids: [nail],
            }),
          ]),
        /Invalid services/,
      );
      await q("select public.save_service($1,$2)", [
        a,
        JSON.stringify({
          id: service,
          name: "Haircut",
          category: "Hair",
          price_php: "999.00",
          duration_minutes: 45,
          buffer_minutes: 0,
          active: true,
        }),
      ]);
      assert.equal(
        await one(
          "select price_php::text from public.appointment_services where appointment_id=$1",
          [booking],
        ),
        "350.00",
      );
      await q("select public.transition_booking($1,$2,'checked_in')", [
        a,
        booking,
      ]);
      await q("select public.transition_booking($1,$2,'in_service')", [
        a,
        booking,
      ]);
      await q("select public.transition_booking($1,$2,'completed')", [
        a,
        booking,
      ]);
      await q("select public.transition_booking($1,$2,'completed')", [
        a,
        booking,
      ]);
      assert.equal(
        await one("select count(*)::integer from public.commission_earnings"),
        1,
      );
      assert.equal(
        await one("select amount_php::text from public.commission_earnings"),
        "25.00",
      );
    });
    await as(staff, async () => {
      await one("select public.punch_attendance($1,'in')", [a]);
      await assert.rejects(
        () => q("select public.punch_attendance($1,'in')", [a]),
        /already clocked in/,
      );
      await one("select public.punch_attendance($1,'out')", [a]);
      await assert.rejects(
        () => q("select public.punch_attendance($1,'out')", [a]),
        /Clock in before/,
      );
      assert.equal((await q("select * from public.payroll_items")).length, 0);
      await assert.rejects(
        () => q("select commission_type from public.appointment_services"),
        /permission denied/,
      );
    });
    const today = await one(
      "select (now() at time zone 'Asia/Manila')::date::text",
    );
    const previous = await one("select ($1::date-1)::text", [today]);
    const corrected = await as(owner, () =>
      one("select public.review_attendance($1,$2)", [
        a,
        JSON.stringify({
          operation: "correct",
          staff_id: employee,
          clock_in_at: `${previous}T23:00:00+08:00`,
          clock_out_at: `${today}T09:00:00+08:00`,
          break_minutes: 60,
          correction_reason: "Missed overnight punches",
        }),
      ]),
    );
    await as(owner, () =>
      q("select public.review_attendance($1,$2)", [
        a,
        JSON.stringify({ id: corrected, operation: "approve" }),
      ]),
    );
    await as(owner, async () => {
      for (const hour of [9, 11]) {
        const dayShift = await one("select public.review_attendance($1,$2)", [
          a,
          JSON.stringify({
            operation: "correct",
            staff_id: daily,
            clock_in_at: `${previous}T${String(hour).padStart(2, "0")}:00:00+08:00`,
            clock_out_at: `${previous}T${String(hour + 1).padStart(2, "0")}:00:00+08:00`,
            break_minutes: 0,
            correction_reason: "Reviewed split daily shift",
          }),
        ]);
        await q("select public.review_attendance($1,$2)", [
          a,
          JSON.stringify({ id: dayShift, operation: "approve" }),
        ]);
      }
    });
    const period = await as(owner, () =>
      one("select public.calculate_payroll($1,$2,$3)", [a, previous, today]),
    );
    await as(owner, async () => {
      const item = (
        await q(
          "select * from public.payroll_items where payroll_period_id=$1 and staff_id=$2",
          [period, employee],
        )
      )[0];
      assert.equal(item.base_php, "900.00");
      assert.equal(item.commissions_php, "25.00");
      assert.equal(item.net_php, "925.00");
      assert.equal(
        await one(
          "select base_php::text from public.payroll_items where payroll_period_id=$1 and staff_id=$2",
          [period, monthly],
        ),
        "3333.34",
        "monthly pay rounds once with exact numeric arithmetic",
      );
      assert.equal(
        await one(
          "select base_php::text from public.payroll_items where payroll_period_id=$1 and staff_id=$2",
          [period, daily],
        ),
        "700.00",
        "daily pay counts a split shift's business date once",
      );
      await q(
        "select public.adjust_payroll($1,$2,'deduction','Reviewed manual deduction',25)",
        [a, item.id],
      );
      assert.equal(
        await one(
          "select net_php::text from public.payroll_items where id=$1",
          [item.id],
        ),
        "900.00",
      );
      await q("select public.transition_payroll($1,$2,'reviewed')", [
        a,
        period,
      ]);
      await q("select public.transition_payroll($1,$2,'approved')", [
        a,
        period,
      ]);
      await assert.rejects(
        () =>
          q("select public.calculate_payroll($1,$2,$3)", [a, previous, today]),
        /immutable/,
      );
      await assert.rejects(
        () =>
          q("select public.adjust_payroll($1,$2,'allowance','Duplicate',25)", [
            a,
            item.id,
          ]),
        /immutable/,
      );
      await assert.rejects(
        () =>
          q("select public.review_attendance($1,$2)", [
            a,
            JSON.stringify({ id: corrected, operation: "approve" }),
          ]),
        /allocated to payroll/,
      );
      await q(
        "select public.transition_payroll($1,$2,'paid','Bank TEST-001')",
        [a, period],
      );
      const paidAt = await one(
        "select paid_at::text from public.payroll_periods where id=$1",
        [period],
      );
      await q("select public.transition_payroll($1,$2,'paid','Duplicate')", [
        a,
        period,
      ]);
      assert.equal(
        await one(
          "select paid_at::text from public.payroll_periods where id=$1",
          [period],
        ),
        paidAt,
      );
    });
    await as(staff, async () => {
      const items = await q("select * from public.payroll_items");
      assert.equal(items.length, 1);
      assert.equal(items[0].net_php, "900.00");
      assert.equal(
        (await one("select public.salon_read($1,'payroll_items')", [a])).length,
        1,
        "JSON read preserves self-only salary isolation",
      );
      assert.ok(
        (await q("select * from public.payroll_line_items")).length >= 4,
      );
    });
    await as(other, async () => {
      assert.equal((await q("select * from public.payroll_items")).length, 0);
      await assert.rejects(
        () =>
          q("select public.transition_payroll($1,$2,'paid','Attack')", [
            a,
            period,
          ]),
        /Permission denied/,
      );
    });
    await assert.rejects(
      () =>
        q(
          "update public.payroll_items set net_php=1 where payroll_period_id=$1",
          [period],
        ),
      /immutable/,
    );
  } finally {
    await db.close();
  }
});

test("both pilot salon seeds persist with authentic service durations and account isolation", async () => {
  const db = await salonTestDb();
  try {
    await seedSalonDemo(db);
    assert.equal(
      (
        await db.query(
          "select count(*)::integer count from public.organizations",
        )
      ).rows[0].count,
      2,
    );
    assert.deepEqual(
      (
        await db.query(
          "select name,duration_minutes from public.services where name in ('Haircut','Gel manicure') order by name",
        )
      ).rows,
      [
        { name: "Gel manicure", duration_minutes: 75 },
        { name: "Haircut", duration_minutes: 45 },
      ],
    );
    assert.equal(
      (
        await db.query(
          "select count(*)::integer count from public.appointments",
        )
      ).rows[0].count,
      2,
    );
    await db.exec(
      "set role authenticated;set request.jwt.claim.sub='00000000-0000-4000-8000-000000000003'",
    );
    const rows = (
      await db.query(
        "select public.salon_read('10000000-0000-4000-8000-000000000001','appointments') appointments",
      )
    ).rows[0].appointments;
    assert.equal(rows.length, 1);
    assert.equal(
      (
        await db.query(
          "select count(*)::integer count from public.staff_compensation",
        )
      ).rows[0].count,
      0,
    );
  } finally {
    await db.close();
  }
});
