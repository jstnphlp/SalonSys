# Universal salon UI / UX specification

## Principles

1. **Operational, not decorative:** Show today's work clearly. The product is internal business software, not a booking-marketplace landing page.
2. **Salon-type agnostic:** No pink-by-default, beauty-only language, nail-only categories, or forced service workflows. Customizable salon name, service taxonomy, and optional brand accent.
3. **Fast at a counter:** Large practical targets, one primary action per page, persistent context, minimal form fields, keyboard shortcuts only as enhancements.
4. **Desktop-first for admin; truly usable on tablet/mobile:** Calendar never becomes a tiny unreadable grid on phones.
5. **Explicit financial trust:** Payroll calculations always reveal source records, pay basis, period, approval state and adjustments.

## Design direction

The implemented layout follows the local DentalSys reference in `Documents/projects/DentalSys`: a 230px sidebar, inset rounded workspace, locally hosted Inter, compact type and navigation, flat metric surfaces, table-led overview, and hour-grid calendar. SalonSys has its own shared palette for hair and nail salons: warm ivory surfaces, soft mauve navigation, deep plum primary actions and text accents, and warm stone secondary surfaces. Semantic CSS tokens apply these colors consistently across both salon types; service and status colors remain distinct and labeled. Salon terminology, permissions and persisted workflows remain in SalonSys; DentalSys is a layout reference rather than an application dependency. Demo controls sit quietly in the top bar. Mobile uses the matching bottom navigation plus a drawer.

Clean modern SaaS operations dashboard. Ivory canvas, strong warm ink text, subtle mauve separators and service/status accents; high contrast focus states. Flat controls with restrained rounded corners, no fake 3D/clay buttons, heavy gradients, random stock avatars, emoji navigation or aggressive shadows. Use existing Tailwind CSS, CSS semantic tokens and locally owned shadcn-style primitives instead of a new UI framework. Dark mode is optional after MVP; its tokens use the same plum and mauve family.

Dropdowns use shared Base UI select menus with plum selection indicators, keyboard navigation and typeahead. Date fields use a shared calendar popover with month/year navigation, a keyboard-operable day grid, Today and Clear actions, and direct YYYY-MM-DD entry. Time fields use matching 12-hour hour/minute/AM-PM controls while retaining local 24-hour values for server validation. All business date/time inputs remain in Asia/Manila. Closed dates use the calendar and removable date chips. These controls replace browser-owned select and date/time panels throughout forms, filters and table pagination.

## Shell and navigation

- Desktop (>=1024px): fixed slim left sidebar with brand/workspace, Overview, Appointments, Attendance, Payroll, Staff, Services, Customers; settings/account at bottom; content width optimized for dense information.
- Tablet: collapsible sidebar and spacious touch controls.
- Mobile: drawer navigation; actions in reachable top section; important lists become cards or horizontally scrollable accessible tables.
- Top bar: salon name/current workspace, today's local date, profile, primary page action.
- Persistent feedback: skeletons, friendly empty states, inline validation, toast/action result, confirm destructive changes.
- No unimplemented nav links or decorative fake data.

## Page-level wireframes (content order)

### Overview `/dashboard`
Top: `Today's appointments`, `Staff clocked in`, `Needs attention`, `Payroll to review`. Below: compact daily timeline, next appointments list, pending attendance corrections and actionable alerts. KPI labels must disclose period, e.g., "Appointments today" not "Revenue" when POS is absent.

### Appointments `/appointments`
Header + `New booking`; segmented **Day / Week / List**; date arrows/today; staff and status filters. Main calendar groups events by staff and time, with collision indicators. Selecting an event opens detail drawer with status history and Edit / Check in / Start / Complete / Cancel. Create/edit side panel: customer or walk-in, service(s), employee, local start, auto end time, notes, price snapshot preview; inline availability validation. On mobile default to agenda/list rather than compressed week columns.

### Attendance `/attendance`
Admin tabs `Live attendance` and `Timesheets`; today's team, shift status, clock in/out time, duration, exceptions; date and employee filters; correction dialog requires reason. Staff `/my-attendance`: prominent Clock in/Clock out action and own recent punches; current time uses Manila timezone. Do not make location, camera or biometrics a dependency.

### Payroll `/payroll`
Period selector + status badge. Payroll list rows: employee, approved days/hours, base pay, commission, adjustments, gross, deductions, net, status. Open staff detail drawer with itemized wage and completed-service references, attendance discrepancies, manually entered deduction descriptions, transparent formula text. Actions: Preview → Review → Approve → Mark Paid; confirmation and reason/audit for corrections. `/payroll/[runId]` can host detailed review; printable payslip view is role-limited.

### Staff `/staff`
Simple staff cards/table with service eligibility, employment/pay type, active state, assigned bookings, optional account invitation. Sensitive compensation settings are restricted to payroll admins. Separate non-login employee records from authenticated users.

### Services `/services`
Category list and editable service rows: price in ₱, minutes, buffer, availability, optional assigned staff/skill. A nail salon should be able to create nail services with no source-code or schema changes.

### Customers `/customers`
Reuse the starter CRUD while adapting to salon terms: phone-first, optional email, visit/appointment history, notes, walk-in behavior.

### Settings `/settings/salon`
Salon identity, operating hours, booking configuration, payroll cutoffs, roles. Hide regulatory calculation switches until verified.

## Components to add/reuse

Reuse `PageHeader`, `AppDataTable`, `EmptyState`, `ConfirmationDialog`, form input patterns, CSS tokens and existing auth components. Add `AppointmentCalendar`, `AppointmentDrawer`, `BookingForm`, `AttendanceClock`, `TimesheetTable`, `PayrollBreakdown`, `PayrollStatusBadge`, and `PayslipPrintView` inside their features. Choose a maintained calendar library only if it meaningfully reduces complexity and supports a11y/SSR; otherwise build accessible day/week views carefully.

## Copy and accessibility

Use short labels like "Clock in", "Mark completed", "Create appointment" and "Review payroll". Clear confirmation for irreversible operations. Always show `₱`, `AM/PM`, date range, and employee names; do not rely on color alone for appointment statuses. Labels/errors, tab order, focus after dialogs, accessible list alternative for calendar, high contrast, and reduced motion are required.

## Usability checkpoints

- Create an appointment in <= 5 deliberate steps after service/staff setup.
- Show double-booking errors without losing form values.
- Show payroll deduction and commission formulas, not just net amount.
- Support a 375px viewport with no cut-off save actions and a useful calendar agenda.
- Operable with keyboard and screen reader at least for core create/edit/review flows.
