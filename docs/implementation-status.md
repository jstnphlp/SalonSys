# SalonSys MVP implementation

For a demo without Supabase, containers or database setup, use `pnpm demo`. The [database-free demo guide](demo.md) covers local persistence, sample roles and the verified browser walkthrough. Normal Supabase deployment verification below remains separate.

Implemented on `main`, 20 October 2026. The application builds and the embedded PostgreSQL workflow checks pass. Full Supabase/browser release verification remains blocked by the local infrastructure described below. This is **not production payroll signoff**.

Implementation commits: `4b70357` (tenant authorization foundation), `1ba92d3` (persisted SalonSys MVP, UI, migrations, demo data and automated tests). The documentation handoff is committed separately.

## Working application

- Responsive SalonSys navigation and an overview queried from real appointments, attendance and payroll records. Staff dashboards show only records visible to that staff account.
- Email registration/sign-in, salon creation, explicit workspace selection, tenant membership roles and account linking. A profile's legacy `admin` role grants no business access without salon membership.
- Salon name, weekly hours, closed dates, booking interval, cutoff preference and explicit monthly-pay divisor. Services/categories and employee availability/qualifications are configurable without code changes.
- Services and staff authoring, restricted compensation settings, default commission and per-employee/per-service overrides. Staff can exist without accounts. Customers retain CRUD, with mandatory salon scope and Philippine mobile normalization.
- Day/week appointment columns, staff/status/search filters and mobile agenda. Booking, rescheduling, cancellation/no-show and check-in → in-service → completed operations persist atomically. Booked prices, duration and commission rules are snapshots. Completion earns a service commission once.
- Own-account server-clock punches, one open shift, overlap prevention, overnight shifts, timesheet review, correction reasons, before/after audit history and approval. Entries allocated to payroll are locked.
- Inclusive Manila-date cutoffs, approved-attendance sources, hourly/daily/monthly compensation, completed-service commissions, documented allowances/adjustments/deductions, source line items, review, approval freeze and idempotent payment references. Staff can access only their own finalized payslips. Payslip access is audited; statements are printable.

## Implementation decisions

- General employee data and confidential compensation are separate tables. `service_commission_rules` holds optional service overrides. Payroll-only reads require salon admin permission; managers receive no salary access by default.
- Business writes use narrowly scoped, authorized SQL RPC transactions. The application repeats Zod validation and `requirePermission()` checks; RLS independently controls reads. Authenticated roles have no direct write grants to the new operation tables. Composite tenant foreign keys guard customer/staff/service/source associations.
- Employee advisory transaction locks protect booking and attendance availability. A salon lock serializes cutoff generation; row locks protect approval and payment. Unique source references prevent reuse of attendance or commission allocations. The embedded engine tests sequential replay; **multi-connection concurrency still needs verification on full Supabase**.
- Preview calculation is the first persisted payroll state (`calculated`), followed by `reviewed`, `approved`, `paid`. Recalculate a mutable cutoff by selecting the same dates. Non-identical overlapping cutoffs are rejected. A preview containing manual lines cannot be recalculated, preventing accidental loss of adjustments.
- Hourly base uses approved elapsed time less reviewed breaks. Daily base counts distinct Manila clock-in dates, including split shifts only once. Overnight shifts belong to their clock-in business date. Monthly base is the configured monthly rate divided by the salon's explicit divisor, with no implicit proration. Numeric arithmetic and final line rounding happen in PostgreSQL, never JavaScript floating-point totals.
- Compensation authoring stores one current configuration with an effective-from date; previews before that date are rejected. Existing booking and payroll snapshots retain their basis. Historical rate editing/version management is not automated.
- Approved/paid runs cannot be rewritten or deleted through application operations. Use a documented signed adjustment in a later cutoff for a correction/reversal. There is no destructive “uncomplete” or payroll void control. Late-approved attendance for an already finalized cutoff requires a reviewed manual adjustment.
- Existing organization creators receive membership only in their own organizations. Legacy unscoped contacts are isolated into one legacy workspace per creator; they are never merged into an arbitrary salon. Review these workspaces before onboarding real clients.
- Audit payloads contain metadata; attendance additionally keeps punch/break before/after values. Legacy serialized contact payloads are sanitized. Financial values and private contact notes are not copied into broad audit payloads.
- System typography removes a build-time Google Fonts network dependency. No new production UI/calendar/decimal framework was added.

## Local setup and demo

1. Install dependencies with `pnpm install` and start Docker Desktop or the configured Podman machine.
2. Run `pnpm db:start`, then `pnpm db:reset` against **disposable local data**.
3. Copy `.env.example` to `.env.local`; use the local URL and publishable key from `pnpm exec supabase status`. Do not add service-role credentials.
4. Run `pnpm db:types`, `pnpm db:test`, `pnpm db:advisors`, then `pnpm dev`.
5. Run `pnpm test:e2e` with the local stack ready. The five Playwright cases include the existing customer/files journey, anonymous redirect, hair/nail payroll journeys and unauthorized access checks. A reset is required before replaying finalized demo cutoffs.

All seed accounts use local-only password `Starter123!`:

| Salon | Owner | Staff | Examples |
| --- | --- | --- | --- |
| Common Ground Hair Studio | `admin@example.test` | `staff@example.test` | Haircut, PHP 350 / 45 min; hourly and daily pay |
| Still Nail Studio | `nail-owner@example.test` | `nail-staff@example.test` | Gel manicure, PHP 650 / 75 min; monthly pay |

`manager@example.test` manages the hair salon's appointments and timesheets, with no payroll authority. Contacts, employee names and payments are synthetic. Never apply demo credentials to a hosted production project.

Suggested manual walkthrough: configure hours/services → create/link staff and compensation → create booking → check in/start/complete → staff clock in/out → review/correct/approve shift → generate cutoff → reconcile source lines → mark reviewed/approve → open own payslip → record actual payment.

## Verification and environment limits

- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`: passed. The final test run contains 39 Vitest cases and six Node script/database tests.
- `pnpm test` includes database migration/application/RLS tests using development-only PGlite (real embedded PostgreSQL). Tests exercise both demo seeds, all three pay bases, exact monthly rounding, SQL/TypeScript role parity, cross-tenant denials, same-salon salary confidentiality, duplicate punches, overlapping bookings, commission snapshot drift/replay, source allocation and finalized payroll/payment immutability.
- `pnpm db:reset` failed: configured Podman socket `127.0.0.1:57772` refused connections. Docker is unavailable on PATH.
- `pnpm db:types` failed for the same container connection. The Windows invocation was fixed to execute the installed CLI directly. **Checked-in database types were regenerated from the migrated embedded PostgreSQL catalog** using `pnpm db:types:embedded`; they were not hand-edited. Regenerate/diff against actual Supabase before deployment.
- `pnpm db:test` and `pnpm db:advisors` failed: local PostgreSQL at `127.0.0.1:59322` refused connections. Updated pgTAP tests are checked in but have not run in the full Supabase stack.
- `pnpm test:e2e` failed before browser execution: an existing Next dev process occupies port 3000 and this checkout's dev lock. `.env.local` is also absent and Supabase is unavailable. The existing process was left running. `playwright test --list` discovers all five cases; it is not a browser test pass.
- Embedded tests use minimal Supabase-owned auth/storage schemas. They do not establish GoTrue, PostgREST, Storage, SMTP or real multi-connection concurrency correctness. Full-stack and browser acceptance remain release blockers.

## Deployment and regulatory blockers

Before real customer/payroll use: run the full-stack gates above, exercise concurrent requests, review migration/backfill on a backup, verify auth redirect/email configuration, privacy/retention/backup/restore arrangements, accessibility and mobile browser behavior with pilot users, and obtain payroll/accounting/legal signoff for the salon's actual compensation policies. No automatic SSS, PhilHealth, Pag-IBIG, withholding, minimum wage, holiday, overtime or other statutory claims are implemented. Those values can only be entered as explicitly reviewed manual lines.
