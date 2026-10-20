# Feature: Philippine salon payroll MVP

**Purpose:** Help owners generate auditable employee payout calculations from verified time records and completed services, not silently assert legal payroll compliance.

## Inputs and configuration

- One selected salon and defined local payroll period `start_date .. end_date` inclusive.
- Compensation type per employee: `hourly`, `daily`, or `monthly`, with effective-dated rate or period policy (historical basis snapshotted).
- Commission per completed service: fixed PHP amount or percentage of eligible service price; business policy must state basis for discounts, refunds, staff changes, and tips. MVP default: earned at service completion, price snapshot before later price edits.
- Approved attendance, eligible unpaid/unallocated commission earnings, manual additions/allowances and documented deductions.
- Pay frequencies: weekly, semi-monthly, or arbitrary custom cutoff; no hard-coded 15th/30th assumption.

## Transparent MVP calculation

```text
base_pay = approved_hours * hourly_rate
        OR approved_payable_days * daily_rate
        OR configured_monthly_amount allocated to selected cutoff per salon policy

commission = sum(eligible, unique completed-service commission snapshots)
gross_pay = base_pay + commission + approved_allowances + approved_extra_pay
total_deductions = sum(explicitly entered/verified deduction line items)
net_pay = gross_pay - total_deductions
```

Show formula and source records for every employee. Use decimal/integer-centavo money arithmetic; round only at defined line boundaries. Do not auto-deduct SSS, PhilHealth, Pag-IBIG, withholding tax, holiday rates, overtime or mandated benefits until their applicability, rates and implementation have been reviewed against up-to-date official requirements by a competent payroll professional. Allow explicitly reviewed **manual** line items in MVP, clearly labeled—not disguised as legally calculated figures.

## Lifecycle

`draft -> calculated -> reviewed -> approved -> paid`. A payroll run is immutable after approval except a separately audited void/reversal/adjustment path; avoid deleting paid payroll. Require deliberate confirmation for approval and payment, store who acted and when plus optional payment reference. Never mark `paid` based solely on calculation. Prevent duplicate pay periods or double allocation of earnings.

## Roles

Salon admin/payroll owner: configure rules, calculate, view team amounts, approve and mark paid. Manager: optionally prepare calculations only when delegated; default no salary access. Staff: read only own finalized payslip. Must not permit global starter admin bypass across salons.

## Screens

`/payroll`: pay period chooser + status + staff totals, exceptions. `/payroll/[periodId]`: detail line items and per-staff audit/source links, action bar and print. `/my-payslips`: role-limited employee view. Never show other employees' financial figures in general dashboard or attendance screens.

## Acceptance / tests

- A salon configures basic daily/hourly/monthly pay, and the rule is explicit in calculations.
- Approved punches feed only their correct Manila-local period; missing/unapproved punches are flagged, not counted silently.
- A completed service creates one commission credit and only one payroll allocation; repeat action is idempotent.
- Service price or rate change does not retrospectively rewrite approved payroll.
- Calculated gross/net reconciles to visible line items; zero and negative edge cases reviewed.
- Manager without permission cannot read or approve salary; staff sees only own payslip; Salon A has zero access to Salon B.
- After approval totals are frozen; paid run cannot be paid twice; correction is a traceable follow-on adjustment.
- Payslip displays salon, employee, date range, line items, net PHP amount, status, and approval/payment dates if present.

## Launch caveat

This is a management and calculation aid. Before production payroll use, validate compensation contracts, minimum wage/holiday/OT rules, statutory deductions and tax withholding, recordkeeping, employee classification, and labor-law applicability for the specific business and current Philippine requirements. Get accountant/payroll/legal review and production signoff.
