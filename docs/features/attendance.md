# Feature: time-in / time-out and timesheets

**Purpose:** A salon gets trustworthy, correctable work records that support payroll without claiming biometric proof of presence.

## Scope

- Logged-in employee uses `/my-attendance` for one-tap clock in/out.
- Admin/authorized manager sees live status, shift list, exceptions, and past attendance.
- Optional breaks stored as approved `break_minutes` in MVP; richer break punches later.
- Missing punch corrected by authorized admin with mandatory reason and visible history.
- Attendance status: `open` (clocked in), `submitted` (closed, awaiting review), `approved`, `corrected` (if later altered and requires reapproval).
- Staff cannot change their own historical approval or fabricate pay after the fact.

## Business rules

- Every attendance entry belongs to one salon and staff record; authenticated staff links securely to their own `staff_profiles.user_id`.
- Exactly one open attendance entry per staff, enforced by database constraint.
- Use server/database timestamp for punches, not client clock. Store in UTC, display Asia/Manila; overnight shifts can cross local midnight.
- Payable minutes = approved `clock_out_at - clock_in_at - approved_break_minutes`, never below zero. Do not infer holiday, overtime, night differential or break law rates automatically.
- Correction requires new values, actor, reason, timestamp and reapproval. Never silently edit an attendance source used in approved payroll; use formal adjustment next cycle.
- Duplicate button taps should not create duplicate entries. Clock-out without open clock-in gives an actionable error.

## Roles

Staff: self clock/read only. Manager: read staff shifts and propose/approve corrections if permitted. Owner/admin: full attendance review and approval within own salon. Public/kiosk anonymous time entry is not part of MVP.

## Acceptance / tests

- Clock in -> correct `On duty` state; second clock in blocked.
- Clock out -> shift closed and payable duration calculated accurately.
- Overnight shift uses correct business dates and UTC timestamps.
- Unauthorized staff cannot clock for another employee or see another employee's salary.
- Approved attendance flows into draft payroll only once according to cutoff.
- Correction after payroll approval is traceable and not reflected by mutating paid totals.
- Clock actions work on mobile and errors recover without duplicate punches.
