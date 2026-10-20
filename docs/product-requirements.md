# SalonSys — MVP product requirements

**Status:** Approved implementation direction, not a claim of shipped features.

## Product goal

Deliver one clean, repeatable operations UI that feels natural to a Filipino hair salon, nail studio, barbershop, or mixed salon. Avoid building a custom UI per customer. Adapt via editable service catalogs, staff skills, business hours, names, and compensation rules.

## Personas and use cases

| Persona | Main actions | Forbidden by default |
| --- | --- | --- |
| Owner / salon admin | Set up salon, staff, services, bookings, attendance, payroll; approve payouts | Other salons' records |
| Manager / receptionist | Manage customer and booking calendar; staff roster; propose time corrections | Approve/pay payroll unless explicitly delegated |
| Staff member | Clock in/out; view own shifts and assigned bookings; see own finalized payslip | View/edit others' pay or attendance; edit pricing |
| Customer | No login needed for MVP; represented as customer/contact or walk-in | Access admin app |

Use tenant memberships for authorization; do **not** reuse the starter's global `admin` to grant every salon owner cross-organization access.

## Core scope and requirements

### R1. Salon configuration and service catalog

Admin sets salon display name, timezone (default Asia/Manila), opening hours, holiday/closed days, appointment slot settings, staff records, and service categories. Services have editable name, category, base price, duration, active flag and optional cleanup/buffer minutes. Examples (seed only): haircut, coloring, manicure, gel manicure, pedicure, lash service. Categories do not change workflows.

### R2. Admin booking and calendar

Daily/weekly calendar with staff filtering and service-colored appointments; create appointments for an existing customer or quick walk-in, assign one staff member, select one or more services, derive estimated end time, block staff overlaps, and support edit/reschedule/cancel/no-show/check-in/start/complete statuses. Completion snapshots actual service prices and commission eligibility. Appointment data can be searched and filtered; keep a list fallback on narrow screens.

### R3. Staff time-in / time-out

Staff with a login can clock in/out in one or two actions. Authorized admin can record/correct missed punches with a reason. Prevent duplicate open shifts and invalid chronology. Store break duration or controlled break entries; display local business date and calculated hours. Attendance review uses draft/submitted/approved/corrected states; only approved entries feed payroll. Do not pretend a browser punch verifies physical location or identity beyond logged-in credentials.

### R4. Payroll

Owner/admin configures compensation per staff and creates a payroll period (weekly, twice monthly or custom inclusive date range). Payroll previews reconcile **approved attendance**, salary/pay basis, eligible completed-service commissions and authorized adjustments. Display formula line items, source records and totals; approve to freeze versioned snapshots; mark paid with date/method/reference; show printable employee payslip. Each commission source is counted once. Corrections after approval require reversal or explicit new adjustment—not silent edits. Statutory contribution/tax logic must be verified before shipping automated claims.

### R5. Supporting records and overview

Customer directory (reusing/reworking existing CRUD), staff directory, salon service list, dashboard with today's bookings, expected appointments, staff present, missing time punches, and payroll pending approval. Use actual queries, not decorative sample metric claims. Include empty states.

## MVP navigation

- Overview
- Appointments (Calendar + List)
- Attendance
- Payroll
- Staff
- Services
- Customers
- Settings

Managers/staff see only authorized routes; hide controls in UI **and** enforce permissions server-side and in database RLS.

## Key journeys / acceptance

1. Admin sets services `Haircut, ₱350, 45min` and `Gel manicure, ₱650, 75min`; books each without changing code.
2. Admin creates a booking for 2:00 PM; selecting a 75-minute service shows a 3:15 PM end time; overlapping booking for same employee is rejected.
3. Admin reschedules or cancels; calendar reflects the new status/time and records the actor.
4. Staff clocks in 9:02 AM and out 6:04 PM; timestamps render in Manila time and approved payable duration reflects approved breaks.
5. Missing punch is corrected by authorized manager with reason and remains traceable.
6. Commission on a completed ₱650 service appears once in correct period; cancelling/uncompleting cannot silently duplicate or erase paid payroll.
7. A payroll preview shows transparent base pay, service commissions, allowances, deductions, and net pay. Manager cannot mark paid without explicit permission.
8. Approving payroll locks calculations; same payroll run cannot be paid twice; staff sees only own payslip.
9. Salon A's owner/staff cannot read, export, or mutate Salon B's customers, services, shifts, appointments, or payroll—even by supplying guessed IDs or calling actions directly.
10. Works on desktop, tablet and narrow mobile screens with keyboard navigation and understandable loading/errors.

## Deferred (deliberately not MVP)

Public booking site, online payment/POS, automated government payroll filing, government-compliant wage engine without verification, multi-branch switching, memberships/packages, commissions shared across staff, SMS, inventory, marketing automation, biometric attendance, advanced BI.

## Success measures for a pilot

- An admin can onboard a salon and enter service catalog and first staff member without developer help.
- An admin can complete a test booking from calendar in under a minute after onboarding.
- A cutoff preview ties each amount to attendance/services/adjustments; owner can review every variance.
- No unauthorized tenant data access in RLS and server-action tests.
- No double bookings or duplicate commission lines under concurrent requests.
