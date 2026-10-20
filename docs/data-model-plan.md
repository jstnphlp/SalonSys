# SalonSys data model, tenancy and transaction plan

Implementation and schema differences are recorded in [implementation status](implementation-status.md). Compensation is stored separately from general employee records; service-specific commission overrides use `service_commission_rules`.

**Existing baseline:** `profiles`, `organizations`, `organization_memberships`, `customers`, `audit_events`, `file_records`. Existing nullable/unscoped customer data and starter roles are template behavior, **not** safe tenant policy for the new product. Use additive migrations with an explicit data migration/backfill strategy; do not edit applied migrations or hand-edit generated types.

## Tenancy decision

One salon business is one `organization` for MVP (one physical location initially). **All salon-owned rows require `organization_id NOT NULL`** and organization-scoped foreign keys/RLS. The authenticated user's salon context must be verified by membership; never trust a client-supplied organization ID alone. If staff can belong to multiple salons, require an explicit selected context and membership check.

**Critical existing starter issue:** `profiles.role = 'admin'` currently bypasses organization membership in `private.has_permission` and `requireOrganizationContext`. Do not use that privileged global role for ordinary salon owners. Before releasing multi-tenant behavior, create clear platform-vs-salon roles, update TS + SQL authorization and tests, and remove/default-deny cross-tenant business access. Enforce that an employee cannot be used in another salon's appointments or payroll through composite tenant-scoped constraints and authorization.

## Tables to add or extend (suggested MVP schema)

| Entity | Essential columns / relationships | Rules |
| --- | --- | --- |
| `salon_settings` | `organization_id PK`, timezone, opening hours JSON/normalized schedule, booking interval, display settings | TZ defaults Asia/Manila |
| `staff_profiles` | id, organization_id, nullable auth user_id, display name, phone, active, hire date, compensation_type, rate, commission settings | Staff records do not require login; sensitive pay only for payroll admins |
| `services` | id, organization_id, category, name, duration_minutes, buffer_minutes, price_php, active | Editable hair/nail/etc categories; historical booked prices do not change |
| `staff_services` | organization_id, staff_id, service_id | Optional qualifications; composite org integrity |
| `appointments` | id, organization_id, customer_id nullable, staff_id, start_at, end_at, status, notes, created_by, updated_by, timestamps, walk_in_name nullable | Staff/local overlap safety; UTC storage |
| `appointment_services` | id, organization_id, appointment_id, service_id, position, name_snapshot, duration_snapshot_minutes, price_snapshot_php | Keep historical billing basis immutable from catalog edits |
| `attendance_entries` | id, organization_id, staff_id, clock_in_at, clock_out_at nullable, break_minutes, status, correction_reason, approved_by/at, actor/timestamps | Partial unique for one open shift per staff; end >= start; corrections audited |
| `commission_earnings` | id, organization_id, appointment_service_id, staff_id, earned_at, rule_snapshot, amount_php, status | Unique earning per qualifying service + payee; reverse via explicit audited entry |
| `payroll_periods` | id, organization_id, start_date, end_date, status, prepared_by, approved_by/at, paid_by/at, paid_reference | Non-overlapping approved cutoffs per business/policy |
| `payroll_items` | id, organization_id, payroll_period_id, staff_id, basis_snapshot, approved_hours/days, base_php, commissions_php, additions_php, deductions_php, net_php | Unique staff+period; approved amounts frozen |
| `payroll_line_items` | id, organization_id, payroll_item_id, kind, description, amount_php, source_type, source_id, metadata minimal | Explains figures; source uniqueness where applicable |

This is a proposed logical schema; choose actual names and SQL details during migration. Use `numeric(12,2)` (or integer centavos) and deterministic decimal arithmetic for PHP amounts; never JavaScript floating-point calculations for payable totals. Timestamps are `timestamptz`, periods are business-local `date` boundaries. Check `start_at < end_at`, nonnegative durations/prices, allowed status transitions and cross-tenant composite relationships.

## Relationship and event flow

```text
organization
 ├─ salon_settings
 ├─ staff_profiles ─┬─ staff_services ─ services
 │                  ├─ appointments ─ appointment_services ─ services
 │                  ├─ attendance_entries
 │                  └─ payroll_items ─ payroll_line_items
 ├─ customers ─ appointments
 ├─ commission_earnings (from completed appointment_services)
 └─ payroll_periods ─ payroll_items
```

- **Booking transaction:** validate salon working hours/staff availability, reject overlapping active appointments in a concurrency-safe database operation (transaction/advisory lock or exclusion constraint where appropriate), and insert appointment + service snapshots atomically. Avoid frontend-only overlap checks.
- **Completion transaction:** mark an appointment completed and create eligible commission earning snapshots once; repeat submission is idempotent. Avoid recalculating past commissions when service pricing or compensation changes.
- **Attendance transaction:** one open shift per staff; clock-in/out atomic and idempotent where possible; record actor and correction reason; approval locks source included in a payroll run.
- **Payroll transaction:** create preview from approved attendance and eligible unallocated commission events; lock, snapshot and approve atomically. Ensure one attendance/commission source cannot be silently paid in two payroll runs. Revisions use an explicit supersession/adjustment record, not overwriting paid totals. Mark-paid idempotent.

## Access matrix — minimum

| Operation | Salon admin | Manager | Staff |
| --- | --- | --- | --- |
| Bookings: read/manage | Yes | Yes | Assigned read; no edit unless explicitly granted |
| Services/staff: manage | Yes | Optional delegated manage | No |
| Attendance: clock own | Yes if staff profile | Yes if staff profile | Own only |
| Attendance: review/correct | Yes | Yes with audit | No |
| Payroll: configure/calculate/approve/pay | Yes | Read/prepare only if specifically delegated | No |
| Payslips | All salon staff as authorized by role | Own unless explicit pay role | Own only |
| Other tenant data | No | No | No |

Implement a small explicit permission matrix in TypeScript and SQL and mirror it in pgTAP RLS tests. No client-side-only authorization.

## Data migration and privacy

- New business rows always use a resolved `organization_id` rather than `NULL`.
- Migrate the existing Customers reference carefully: keep demo seeds separate and plan assignment/backfill of legacy unscoped records before enforcing constraints; never merge two salons' contacts.
- Database audit triggers should **not** indiscriminately serialize salary, customer contact data or private employee notes into broad-access `audit_events`; create metadata-only/sanitized audit entries for sensitive tables and limit audit read access.
- Never expose service-role credentials to browser; restrict exports and payslips by role and tenant; design retention and deletion policy before real client onboarding.

## Testing gates

PgTAP: deny cross-tenant select/insert/update/delete, reject orphan cross-tenant FK relations, prove staff self-read only, deny manager payroll approval without privilege, reject double open shift, and verify permission parity. Domain/unit/integration: price and commission snapshot drift, duplicate completion, overlapping concurrent bookings, date-boundary attendance, rounding, payroll replay/duplicate source, approval freeze and reversal. Keep `src/types/database.generated.ts` generated.
