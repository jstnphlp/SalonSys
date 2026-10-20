# SalonSys business context

**Product:** One adaptable back-office web app for Philippine hair salons, nail salons, barbershops, and combinations of those businesses.

**Primary user:** A salon owner or manager who currently tracks bookings in chat/paper, attendance in a logbook, and pay in a spreadsheet. Small teams should be able to start without an IT administrator.

**Secondary user:** A stylist, barber, technician, receptionist, or other staff member who clocks in/out and may see their own assigned work and attendance.

**Business outcome:** A manager can create an appointment, confirm service completion, record attendance, review a payroll cutoff, and issue a transparent payslip from the same system. Reduce duplicated encoding, missed appointments, and manual payroll reconciliation.

## Non-negotiable MVP

1. Admin-side calendar booking.
2. Time-in/time-out and corrections.
3. Configurable payroll with commission and approved attendance.
4. Supporting setup for staff, services, customers, hours, and permissions.

See [product requirements](product-requirements.md) for acceptance criteria and explicit exclusions.

## Localization

- Country: Philippines; currency: **PHP (₱)**; monetary precision: 2 decimals.
- Salon business time zone: **Asia/Manila**; persist timestamps as UTC `timestamptz` and render in business timezone.
- User-friendly date/time: local date and 12-hour AM/PM time, with explicit timezone in exports.
- Philippine phone formatting should accept common `09...` and `+63...` inputs while storing normalized data when possible.
- UI copy is plain English suitable for Taglish-speaking teams; do not hardcode stylistic colors or gender stereotypes by salon category.
- Services, service categories, durations, commission rules, opening days, and pay frequency are **business-configurable**, never hair-only or nail-only assumptions.

## Users and tenant boundaries

- Salon-owned data lives in an **organization**. Each salon company is one tenant in MVP; start with one location per business. Multi-branch support is a later phase.
- Salon **owner/admin**, **manager/receptionist**, and **staff** are tenant-scoped memberships/permissions.
- A global/platform super-admin, if retained for operations, must be explicitly separate and must never be assigned to a salon owner by default.
- Staff can exist as employee records without login. A logged-in staff member may access only their own attendance and assigned appointments; they cannot view payroll for others.

## Working assumptions to validate with pilot salons

- Booking is entered by admin; no public customer portal at launch.
- One primary staff assignee per appointment. Multiple services may be booked sequentially with that staff member.
- Commission is earned when a service is marked **completed**, not automatically upon booking.
- Payroll supports hourly, daily, or monthly base-pay plus configurable per-service percentage/fixed commission; employer confirms correct payroll rules.
- Pay periods and deduction categories vary by salon; administrators review payroll before approval.

## Data sensitivity, operational rules and ownership

Customer phones, staff personal data, attendance, and salaries are private. Require tenant-isolated RLS, least-privilege access, audited changes, careful export restrictions, minimal retention, protected backups, and redacted audit payloads for sensitive payroll details. Document retention and lawful processing requirements with each deployment; avoid recording unnecessary personal data.

Development owner: project maintainers. Business approval owner: each pilot salon manager/owner. Integrations: none required for initial local demo. Costs/hosting/notifications: decide with pilot client before production.

**Out of scope:** POS, online payments, government remittance/filing automation, public booking, inventory, customer messaging integrations, biometric attendance, SMS gateway, location tracking.

**Open decisions:** Pilot salon compensation policies; holiday/overtime treatment; commissions on discounts, refunds and tips; approval of manual attendance edits; multi-staff appointments; offline needs; statutory payroll calculations and regulatory review; hosted multi-tenant rollout versus single-client deployment.
