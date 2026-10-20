# SalonSys implementation roadmap

For the implemented application, verification evidence and outstanding infrastructure gates, see [implementation status](implementation-status.md). The baseline below describes the starter before implementation.

**Baseline reviewed:** Next.js 16 + React 19 + Supabase modular monolith. Starter currently ships only auth, customers CRUD, generic overview, permission scaffold, RLS/audit and tests. This plan is **not** evidence that new features exist.

## Delivery priorities

### Phase 0 — Foundation and tenant safety (blocking)
- Read `AGENTS.md`, this roadmap, PRD and relevant feature docs.
- Rebrand `src/config/app.ts`, document env setup, preserve existing working template features.
- Define organization membership bootstrap for a new salon. Separate platform-level role (if any) from tenant salon owner/admin. Correct starter cross-tenant admin bypass in TypeScript and SQL before production multitenancy.
- Create salon context resolution and permission matrix; enforce server + RLS + cross-tenant FK integrity.
- Add migration and typed queries for `salon_settings`; seeded pilot salons and non-sensitive demo employees; update unit and pgTAP tests.
- Gate: two pilot salons cannot read/write each other's records.

### Phase 1 — UI shell + configuration
- Update sidebar/topbar/responsive layout, CSS design tokens, dashboard placeholders as honest empty states.
- Build service categories/catalog, staff directory, service-staff eligibility, salon hours, pay configuration authoring.
- Adapt customers to phone-first salon needs and mandatory salon scope.
- Gate: hair/nail salon catalogs both configurable with no code edits.

### Phase 2 — Admin calendar booking
- Migrate appointment and service snapshots; implement constrained booking/reschedule/state transition operations.
- Build usable desktop day/week calendar and mobile agenda, booking drawer, staff/status filters.
- Idempotent completion prepares commission earnings snapshots, never automatic payout.
- Gate: pilot can create, move, complete, cancel; concurrent double-book blocked.

### Phase 3 — Attendance
- Migrate attendance entries and safe one-open-shift constraint.
- Build logged-in staff punch UI plus admin live/timesheet/exception pages.
- Build reviewed corrections/approval and source audit metadata.
- Gate: shift/overnight tests pass; unauthorized clock-for-another-person denied.

### Phase 4 — Payroll
- Migrate compensation/earning/pay-period and line-item tables, exact-money calculation layer.
- Build transparent payroll preview, review, approval freeze, payment marking and staff payslip.
- Manual/statutory inputs only as reviewed adjustments; no unverified automatic PH payroll compliance claims.
- Gate: reconciliation, idempotence, cross-tenant confidentiality, retroactive edit and correction tests pass.

### Phase 5 — Product polish / pilot release
- Responsiveness, accessibility, empty/loading/error states, print, basic export restricted by role.
- Product walkthrough with one hair salon and one nail studio; record feedback.
- Validate data retention, backups, privacy notice, hosting, auth redirects, SMTP, audit scope, statutory pay treatment and review signoff before real payroll use.
- Gate: complete booking -> completion + commission -> attendance approval -> payroll approval -> own payslip demo using seeded data.

## Route outline (adjust only when justified)

```text
/dashboard
/appointments
/attendance
/my-attendance
/payroll
/payroll/[periodId]
/my-payslips
/staff
/services
/customers
/settings/salon
/settings/profile
```

Keep routes thin. Create `src/features/{salon,services,staff,appointments,attendance,payroll}/` with `actions.ts`, `queries.ts`, `schemas.ts`, domain logic, tests and components. Follow existing `src/features/customers` conventions. Retain existing auth, shadcn-style UI and infra; avoid a rewrite or unnecessary packages.

## Required implementation verification

- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.
- For every migration: `pnpm db:reset`, `pnpm db:types`, `pnpm db:test`, local database advisors; commit generated types.
- E2E critical admin create-booking and employee punch/payroll flows.
- Negative auth and concurrency tests are release blockers.
- Document command results and any environment blockers accurately; don't claim tests passed without running them.

## Definition of done

An MVP is done only when persisted backend, RLS, server validation, audit, usable UI, loading/errors/empty states and automated tests work end-to-end. Static mocks or clickable screens do not complete a phase. Use scoped follow-up commits/PRs for implementation; the current documentation commit changes no application behavior.
