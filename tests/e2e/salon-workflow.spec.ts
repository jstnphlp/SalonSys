import { expect, test, type Page } from "@playwright/test";
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Starter123!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}
async function confirm(page: Page, label: string) {
  await page.getByRole("button", { name: label, exact: true }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: label, exact: true })
    .click();
}

// Requires a freshly reset local Supabase instance. No mocked authentication or data.
for (const pilot of [
  {
    name: "hair salon",
    owner: "admin@example.test",
    employee: "Sam Staff",
    staffEmail: "staff@example.test",
    service: "Haircut",
    duration: 45,
    price: "350.00",
  },
  {
    name: "nail studio",
    owner: "nail-owner@example.test",
    employee: "Remy Technician",
    staffEmail: "nail-staff@example.test",
    service: "Gel manicure",
    duration: 75,
    price: "650.00",
  },
])
  test(`${pilot.name}: booking, attendance, payroll approval and own payslip`, async ({
    page,
    browser,
  }) => {
    test.setTimeout(120000);
    await login(page, pilot.owner);
    await page.goto("/settings/salon");
    await expect(page.getByLabel("Salon display name")).toHaveValue(
      pilot.name === "hair salon"
        ? "Common Ground Hair Studio"
        : "Still Nail Studio",
    );
    await page.goto("/services");
    await expect(
      page.getByText(pilot.service, { exact: true }).first(),
    ).toBeVisible();
    await page.goto("/staff");
    const employeeName = `Pilot employee ${Date.now()}`;
    await page
      .getByRole("button", { name: "Add employee", exact: true })
      .click();
    let dialog = page.getByRole("dialog");
    await dialog.getByLabel("Employee name").fill(employeeName);
    await dialog.getByRole("button", { name: "Save changes" }).click();
    await page
      .getByRole("textbox", { name: "Search records" })
      .fill(employeeName);
    await page
      .getByRole("button", { name: "Compensation", exact: true })
      .click();
    dialog = page.getByRole("dialog");
    await dialog.getByLabel("Base rate (PHP)").fill("500.00");
    await dialog.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.goto(`/appointments?date=${today()}`);
    await page
      .getByRole("button", { name: "New booking", exact: true })
      .click();
    dialog = page.getByRole("dialog");
    const walkIn = `Pilot visit ${Date.now()}`;
    await dialog.getByLabel("Walk-in name (optional)").fill(walkIn);
    await dialog
      .getByLabel("Assigned employee")
      .selectOption({ label: pilot.employee });
    await dialog.getByLabel("Start · Asia/Manila").fill(`${today()}T15:00`);
    const option = dialog
      .getByLabel("Services (sequential)")
      .locator("option")
      .filter({ hasText: pilot.service })
      .first();
    await dialog
      .getByLabel("Services (sequential)")
      .selectOption((await option.getAttribute("value")) ?? "");
    await expect(dialog.getByText(/Estimated end:/)).toBeVisible();
    await dialog.getByRole("button", { name: "Save appointment" }).click();
    await page.getByRole("button").filter({ hasText: walkIn }).first().click();
    await confirm(page, "Check in");
    await confirm(page, "Start service");
    await confirm(page, "Mark completed");
    await page.keyboard.press("Escape");
    const employeeContext = await browser.newContext();
    const employeePage = await employeeContext.newPage();
    try {
      await login(employeePage, pilot.staffEmail);
      await employeePage.goto("/my-attendance");
      await employeePage
        .getByRole("button", { name: "Clock in", exact: true })
        .click();
      await expect(
        employeePage.getByRole("button", { name: "Clock out", exact: true }),
      ).toBeVisible();
      await employeePage
        .getByRole("button", { name: "Clock out", exact: true })
        .click();
      await expect(
        employeePage.getByRole("button", { name: "Clock in", exact: true }),
      ).toBeVisible();
      await page.goto("/attendance");
      await page
        .getByRole("textbox", { name: "Search records" })
        .fill(pilot.employee);
      await confirm(page, "Approve shift");
      await page.goto("/payroll");
      await page
        .getByRole("button", { name: "Generate payroll", exact: true })
        .click();
      dialog = page.getByRole("dialog");
      await dialog.getByLabel("Cutoff start").fill(today());
      await dialog.getByLabel("Cutoff end (inclusive)").fill(today());
      await dialog.getByRole("button", { name: "Calculate preview" }).click();
      await expect(page).toHaveURL(/\/payroll\/[a-f0-9-]+$/);
      await expect(
        page.getByText(pilot.service, { exact: false }).first(),
      ).toBeVisible();
      await confirm(page, "Mark reviewed");
      await confirm(page, "Approve payroll");
      await employeePage.goto("/my-payslips");
      await employeePage
        .getByRole("link", { name: "View payslip" })
        .first()
        .click();
      await expect(
        employeePage.getByText(pilot.employee, { exact: true }).first(),
      ).toBeVisible();
      await expect(
        employeePage.getByRole("button", { name: "Print payslip" }),
      ).toBeVisible();
      await expect(
        employeePage.getByText(employeeName, { exact: true }),
      ).toHaveCount(0);
      await page
        .getByRole("button", { name: "Mark paid", exact: true })
        .click();
      dialog = page.getByRole("dialog");
      await dialog
        .getByLabel("Payment method and reference")
        .fill("Bank · TEST-PILOT");
      await dialog.getByRole("button", { name: "Confirm mark paid" }).click();
      await expect(
        page.getByRole("button", { name: "Mark paid", exact: true }),
      ).toHaveCount(0);
    } finally {
      await employeeContext.close();
    }
  });

test("owners cannot open another salon's records and staff cannot open payroll administration", async ({
  page,
}) => {
  await login(page, "nail-owner@example.test");
  await page.goto("/customers");
  await expect(page.getByText("Demo Client Alex", { exact: true })).toHaveCount(
    0,
  );
  await expect(
    page.getByText("Demo Client Jamie", { exact: true }),
  ).toBeVisible();
  await page.context().clearCookies();
  await login(page, "staff@example.test");
  await page.goto("/payroll");
  await expect(
    page.getByRole("heading", { name: "Something went wrong" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Generate payroll", exact: true }),
  ).toHaveCount(0);
});
