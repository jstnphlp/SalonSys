# Feature: admin booking and calendar

**Purpose:** A salon receptionist or owner sees available time and records appointments without needing a public booking portal.

## Scope

- Configurable service categories, price and duration; optional cleanup buffer.
- Business opening hours and staff availability.
- Create booking for customer or walk-in (customer contact optional).
- Exactly one primary staff member for an appointment in MVP; any number of sequential services with that person.
- Day/week/agenda views, staff/status filter, list/search, appointment detail.
- Reschedule, cancellation, no-show, check-in, in-service, completed state.
- Completion creates eligible commission snapshot; not every booking is a sale.

## Workflow and states

`scheduled -> checked_in -> in_service -> completed`; from active states, `cancelled` or `no_show` as allowed. Corrections to completed bookings require explicit admin privilege and reversing financial side effects. Status changes are audited. Do not directly update salary based on a booking edit.

1. Choose local date/time, staff, customer (or walk-in), service(s).
2. Compute total duration (and buffer) from snapshots and show end time/price.
3. Validate appointment fits salon operating hours and staff working/availability rules.
4. Prevent overlapping active bookings for the same staff, including simultaneous submissions.
5. Save atomically and render on calendar.
6. When marked completed, use stored amount/rule snapshots to create idempotent commission events.

## Data / validation

`appointments` with `appointment_services`, both non-null organization-scoped. Validate customer/staff/service belong to same salon; active staff/service; `start_at < end_at`; durations positive; services at most a reasonable configured count; optional note bounds. Keep all monetary values in PHP decimal precision. Historical booked price/duration must not change if catalog values are edited.

## Roles and authorization

Admin and manager create/change appointments; staff read only their own assigned upcoming appointments, if granted. Audit creations, reschedules, status changes, overrides and cancellations. No cross-tenant access. Commission adjustments are approval-limited.

## Acceptance / tests

- Both nail and hair services book using identical flow.
- Double booking rejected, including concurrent create calls.
- Rescheduling updates staff conflict check; failed attempt preserves previous booking.
- Cancellation frees availability and does not credit commissions.
- Completing twice earns commission only once.
- Editing catalog later does not change existing booking price/duration.
- Other salon's customer, staff, appointment IDs are rejected by action and RLS.
- Day/week calendar usable, accessible agenda on narrow screens.
