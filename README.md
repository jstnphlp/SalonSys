# SalonSys

**SalonSys** is an admin-first salon operations platform for independent Philippine hair salons, nail studios, barbershops, and mixed beauty-service businesses. The initial release prioritizes **calendar booking, employee time-in/time-out, and payroll**, supported by configurable services, staff, and customer records.

> **Project status:** Product requirements and implementation plan are documented. The current app code remains the original Next.js business-starter foundation (auth, customers reference CRUD, shell, RBAC, Supabase). Booking, attendance, payroll, and the new UI have **not** been implemented yet.

## MVP capabilities

1. **Admin calendar:** create/reschedule/cancel appointments, select customer, staff member, services, and time; daily/weekly views.
2. **Attendance:** staff clock in/out; administrators review missing punches and corrections; approved time feeds payroll.
3. **Payroll:** configurable hourly/daily/monthly base-pay and service commissions; cutoff reviews, manual adjustments, immutable approved snapshots, payslips.
4. **Supporting records:** services, prices/durations, staff, customers, salon hours, roles, and dashboard.

No customer-facing booking portal, POS, automatic statutory payroll filing, inventory, multi-branch UI, or payment gateway in MVP.

## Read this before implementation

- [Business context and decisions](docs/business-context.md)
- [Product requirements and MVP acceptance](docs/product-requirements.md)
- [UI/UX redesign specifications](docs/ui-design.md)
- [Data model and security boundaries](docs/data-model-plan.md)
- [Bookings feature](docs/features/bookings.md)
- [Attendance feature](docs/features/attendance.md)
- [Payroll feature](docs/features/payroll.md)
- [Execution roadmap](docs/implementation-roadmap.md)
- [Coding conventions](AGENTS.md)

The existing template reference docs remain in `docs/` and apply to underlying technical conventions. Where they describe optional unscoped organizations, **the SalonSys tenancy and permission rules in the new product docs take precedence for salon-owned data**.

## Existing technology

Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Supabase PostgreSQL/Auth/RLS, shadcn-style primitives, React Hook Form, Zod, Vitest, Playwright and pnpm 11. Reuse the modular monolith, customers feature conventions, server actions, audit patterns and shared components.

## Local development

Prerequisites: Node.js 24, pnpm 11/Corepack, and local Supabase/Docker.

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm db:start
# Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local using local Supabase status.
pnpm db:reset
pnpm dev
```

The original starter template includes optional `pnpm template:init` for project rebranding; review its effects before using it on an already configured project. Template fixture credentials in the legacy starter README are **local-only**, not production accounts.

```bash
pnpm verify
pnpm db:test
pnpm test:e2e
```

## Implementation policy

- Preserve existing migrations; add forward-only migrations for features.
- Never treat a salon owner as a platform-wide super-admin.
- All salon-owned records must be organization-scoped, guarded by server permissions and PostgreSQL RLS.
- Payroll must be reviewable; **do not claim Philippine statutory compliance without verified configuration and legal/accounting review**.
- See `docs/implementation-roadmap.md` for delivery sequence and acceptance gates.
