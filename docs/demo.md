# Database-free demo

Run `pnpm demo` and open http://localhost:3000. No Supabase project, database, containers, keys or email configuration is required. The demo opens as the hair salon owner.

Demo mode is also enabled in this workspace's ignored `.env.local`, so the existing `pnpm dev` server works immediately. Set `SALONSYS_DEMO_MODE=false` to use the production Supabase implementation again. Demo access is **never** enabled automatically when Supabase configuration is missing.

Use the top demo bar to switch between the hair salon owner, manager, staff member, nail studio owner and nail technician. Navigation and data change with the selected role and salon. Use **Reset demo** to restore sample salons and start a fresh walkthrough.

Changes are saved to `.salonsys-demo/data.json`, which is ignored by Git. Refreshing the browser or restarting the server preserves your work. All viewers using the same local server share these sample records; account selection is a demo convenience, not real authentication. Use synthetic information only. This mode targets a single local Node.js server with a writable filesystem, not serverless/production hosting.

## Walkthrough

1. Browse Overview, Services and Staff as the hair salon owner. Edit a service or configure a new employee's compensation.
2. Create a booking at a free time inside operating hours. Check in, start the service, then mark it completed to earn commission.
3. Switch to **Sam · Hair salon staff** and open My attendance. Clock in and clock out.
4. Switch back to the hair salon owner. Review and approve that shift in Attendance. Yesterday's sample shifts can also be reviewed.
5. Generate Payroll for a cutoff including the completed appointment and approved shift. Review the base pay, commission sources and any documented manual additions/deductions.
6. Mark reviewed, approve and record a sample payment reference. Finalized calculations are locked.
7. Switch back to Sam and open My payslips to view/print the statement. A sample previous-month statement is also provided.
8. Switch to the nail studio owner to try the same workflow with gel manicure, pedicure and monthly compensation.

Salon setup, service/staff/customer editing, booking changes, punches/corrections, approvals, payroll and payslips use the local store. Email registration/delivery, password changes and cloud attachments are unavailable in this mode. Profile display-name editing works. If signed out, sample emails from the account picker use password `Starter123!`.

## Verification

Verified with `pnpm lint`, `pnpm typecheck`, `pnpm test` (44 unit tests and six script/database tests), `pnpm build`, and `pnpm test:demo` (one full browser workflow). The browser test also creates a customer, reloads to verify local persistence, and checks that no Supabase requests are made.

`pnpm test:demo` exercises the database-free browser workflow. Existing Supabase E2E cases remain separate under `pnpm test:e2e` and require demo mode to be off and Supabase configured. Demo engine tests run with `pnpm test` alongside the original tests.

The local adapter preserves validation, role scoping, booking conflicts, shift overlap/duplicate protection, exact integer-centavo payroll arithmetic, source allocation and immutable finalized runs. The Supabase implementation and its RLS/migrations are unchanged. This is a demonstration of management workflows, not verified statutory payroll automation.
