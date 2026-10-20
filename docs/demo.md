# Database-free demo

Run `pnpm dev` (or `pnpm demo`) and open http://localhost:3000. Demo mode is now the default: no environment file, Supabase project, database, containers, keys or email configuration is required. The demo opens as the hair salon owner. `pnpm build` followed by `pnpm start` also runs the demo.

To deliberately enable the Supabase implementation later, set `SALONSYS_DEMO_MODE=false` and configure the three public variables in `.env.example`. That explicit mode still validates its credentials and never falls back to demo access. The presence or absence of Supabase credentials does not decide the mode.

Use the top demo bar to switch between the hair salon owner, manager, staff member, nail studio owner and nail technician. Navigation and data change with the selected role and salon. Use **Reset demo** to restore sample salons and start a fresh walkthrough.

On a local Node.js server, changes are saved to `.salonsys-demo/data.json`, which is ignored by Git. Refreshing the browser or restarting the server preserves your work. All viewers using that local server share the sample records.

On **Vercel**, deploy the repository as a Next.js app with the standard build command. No custom environment variables are required. The automatically supplied `VERCEL=1` selects compressed, HttpOnly browser-cookie snapshots instead of disk storage. Each browser has its own demo; role switching within that browser shares its records, and changes survive refreshes and fresh server instances. Cookies expire after seven days, clearing cookies resets the data, and deployments do not provide a central shared dataset. If an existing project explicitly sets `SALONSYS_DEMO_MODE=false`, remove that override to use the default demo.

Hosted snapshots have a bounded cookie/header budget. When full, a mutation is rejected with **Use Reset demo to continue**, preserving the previous snapshot. Business changes retain their audit entries; payslip page-view audits are ephemeral in the hosted demo because Server Components cannot set response cookies. This storage is for synthetic demo records, not real authentication, confidential salary records or production business data.

## Walkthrough

1. Browse Overview, Services and Staff as the hair salon owner. Edit a service or configure a new employee's compensation.
2. Create a booking at a free time inside operating hours. Check in, start the service, then mark it completed to earn commission.
3. Switch to **Sam · Hair salon staff** and open My attendance. Clock in and clock out.
4. Switch back to the hair salon owner. Review and approve that shift in Attendance. Yesterday's sample shifts can also be reviewed.
5. Generate Payroll for a cutoff including the completed appointment and approved shift. Review the base pay, commission sources and any documented manual additions/deductions.
6. Mark reviewed, approve and record a sample payment reference. Finalized calculations are locked.
7. Switch back to Sam and open My payslips to view/print the statement. A sample previous-month statement is also provided.
8. Switch to the nail studio owner to try the same workflow with gel manicure, pedicure and monthly compensation.

Salon setup, service/staff/customer editing, booking changes, punches/corrections, approvals, payroll and payslips use the selected demo store. Email registration/delivery, password changes and cloud attachments are unavailable in this mode. Profile display-name editing works. If signed out, sample emails from the account picker use password `Starter123!`.

## Verification

Use `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm test:demo` for local verification. Browser checks cover desktop/mobile controls and the full booking-to-payslip workflow, customer reload persistence, and absence of Supabase requests.

After building, `pnpm test:demo:hosted` starts the production server on port 3105 with blank Supabase/site variables, no demo opt-in, and Vercel storage selection. It runs the same browser checks against cookie persistence. Unit tests verify cookie round-trips, browser isolation, failed-transaction rollback, corrupted snapshots, size limits and operation without writable disk.

`pnpm test:demo` exercises the database-free browser workflow. Existing Supabase E2E cases remain separate under `pnpm test:e2e` and require demo mode to be off and Supabase configured. Demo engine tests run with `pnpm test` alongside the original tests.

The local adapter preserves validation, role scoping, booking conflicts, shift overlap/duplicate protection, exact integer-centavo payroll arithmetic, source allocation and immutable finalized runs. The Supabase implementation and its RLS/migrations are unchanged. This is a demonstration of management workflows, not verified statutory payroll automation.
