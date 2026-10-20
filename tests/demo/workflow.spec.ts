import { expect, test, type Page } from "@playwright/test";

async function choose(page: Page, label: string, option: string) {
  await page.getByRole("combobox", { name: label, exact: true }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

async function confirm(page: Page, label: string) {
  await page.getByRole("button", { name: label, exact: true }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: label, exact: true })
    .click();
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
}
test("database-free salon demo: pages, booking, punches, payroll and own payslip", async ({
  page,
}) => {
  const externalRequests: string[] = [];
  page.on("request", (req) => {
    if (/supabase|59321|59322/.test(req.url()))
      externalRequests.push(req.url());
  });
  await page.goto("/dashboard");
  await expect(page.getByText("Demo mode", { exact: true })).toBeVisible();
  await confirm(page, "Reset demo");
  for (const route of [
    "/appointments",
    "/attendance",
    "/payroll",
    "/staff",
    "/services",
    "/customers",
    "/settings/salon",
    "/settings/profile",
  ]) {
    await page.goto(route);
    await expect(
      page.getByRole("heading", { name: "Something went wrong" }),
    ).toHaveCount(0);
    await expect(page.locator("h1")).toBeVisible();
  }
  await page.goto("/services");
  await page.getByRole("button", { name: "Add service", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save changes", exact: true })
    .click();
  await expect(
    page.getByText("Enter a service name.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Enter a category.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/Too small:|expected string/)).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.goto("/customers");
  await page.getByRole("button", { name: "Add customer", exact: true }).click();
  const customerName = `Demo client ${Date.now()}`;
  await page
    .getByRole("dialog")
    .getByLabel("Name", { exact: true })
    .fill(customerName);
  await page
    .getByRole("dialog")
    .getByLabel("Phone", { exact: true })
    .fill("09170000001");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Create customer", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload();
  await expect(page.getByText(customerName, { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: `Delete ${customerName}`, exact: true })
    .click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Delete customer", exact: true })
    .click();
  await expect(page.getByText(customerName, { exact: true })).toHaveCount(0);
  await page.goto("/appointments");
  await page.getByRole("button", { name: "New booking", exact: true }).click();
  let dialog = page.getByRole("dialog");
  const name = `Demo visit ${Date.now()}`;
  await dialog.getByLabel("Walk-in name (optional)").fill(name);
  await choose(page, "Assigned employee", "Sam Santos");
  const start = dialog.getByLabel("Start · Asia/Manila date", { exact: true });
  const today = (await start.inputValue()).slice(0, 10);
  await dialog
    .getByRole("button", {
      name: "Open Start · Asia/Manila date calendar",
      exact: true,
    })
    .click();
  await expect(page.getByRole("grid")).toBeVisible();
  const selectedDay = page.locator(`[data-calendar-day="${today}"]`);
  await expect(selectedDay).toBeFocused();
  await page.keyboard.press("ArrowRight");
  const tomorrow = new Date(Date.parse(`${today}T00:00:00Z`) + 86400000)
    .toISOString()
    .slice(0, 10);
  await expect(page.locator(`[data-calendar-day="${tomorrow}"]`)).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(selectedDay).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("grid")).toHaveCount(0);
  await expect(start).toHaveValue(today);
  await choose(page, "Start · Asia/Manila time hour", "04");
  await choose(page, "Start · Asia/Manila time period", "PM");
  await dialog.getByText("Haircut & finish", { exact: true }).click();
  await dialog.getByText("Color consultation", { exact: true }).click();
  await expect(dialog.getByText("2 selected", { exact: true })).toBeVisible();
  await expect(dialog.getByText(/120 minutes including buffer/)).toBeVisible();
  await dialog.getByText("Color consultation", { exact: true }).click();
  await expect(
    dialog.getByRole("checkbox", { name: "Haircut & finish", exact: true }),
  ).toBeChecked();
  await expect(dialog.getByText(/45 minutes including buffer/)).toBeVisible();
  await dialog.getByRole("button", { name: "Save appointment" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const notifications = page.getByRole("region", { name: "Notifications" });
  await expect(
    notifications.getByText("Appointment saved.", { exact: true }),
  ).toBeVisible();
  await expect(
    notifications.getByText("Appointment saved.", { exact: true }),
  ).toHaveCount(0, { timeout: 8000 });
  await page.getByRole("button").filter({ hasText: name }).first().click();
  for (const label of ["Check in", "Start service", "Mark completed"]) {
    await confirm(page, label);
    await expect(
      page
        .getByRole("dialog")
        .getByText("Appointment updated.", { exact: true }),
    ).toHaveCount(0);
  }
  await page.keyboard.press("Escape");
  await choose(page, "View demo as", "Sam · Hair salon staff");
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/my-attendance");
  const clock = page.getByRole("region", { name: "Attendance clock" });
  await clock.getByRole("button", { name: "Clock in", exact: true }).click();
  await expect(
    clock.getByRole("button", { name: "Clock out", exact: true }),
  ).toBeVisible();
  await clock.getByRole("button", { name: "Clock out", exact: true }).click();
  await expect(
    clock.getByRole("button", { name: "Clock in", exact: true }),
  ).toBeVisible();
  await choose(page, "View demo as", "Alex · Hair salon owner");
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/attendance");
  await page
    .getByRole("textbox", { name: "Search records" })
    .fill("Sam Santos");
  await confirm(page, "Approve shift");
  await page.goto("/payroll");
  await page
    .getByRole("button", { name: "Generate payroll", exact: true })
    .click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Cutoff start", { exact: true }).fill(today);
  await dialog
    .getByLabel("Cutoff end (inclusive)", { exact: true })
    .fill(today);
  await dialog.getByRole("button", { name: "Calculate preview" }).click();
  await expect(page).toHaveURL(/\/payroll\/[a-f0-9-]+$/);
  await expect(page.getByText(/Haircut & finish/).first()).toBeVisible();
  await expect(
    page.getByText(/10% of .*350\.00 service price/).first(),
  ).toBeVisible();
  await expect(page.getByText(/"type"\s*:/)).toHaveCount(0);
  await confirm(page, "Mark reviewed");
  await confirm(page, "Approve payroll");
  await page.getByRole("button", { name: "Mark paid", exact: true }).click();
  dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Payment method and reference")
    .fill("Demo bank TEST-001");
  await dialog.getByRole("button", { name: "Confirm mark paid" }).click();
  await expect(
    page.getByRole("button", { name: "Mark paid", exact: true }),
  ).toHaveCount(0);
  await choose(page, "View demo as", "Sam · Hair salon staff");
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/my-payslips");
  await page
    .getByText(`${today} → ${today}`, { exact: true })
    .locator("..")
    .getByRole("link", { name: "View payslip" })
    .click();
  await expect(
    page.getByRole("button", { name: "Print payslip" }),
  ).toBeVisible();
  await expect(
    page.getByText(/10% of .*350\.00 service price/).first(),
  ).toBeVisible();
  await expect(page.getByText(/"type"\s*:/)).toHaveCount(0);
  await expect(
    page.getByText("Sam Santos", { exact: true }).first(),
  ).toBeVisible();
  await choose(page, "View demo as", "Nico · Nail studio owner");
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/services");
  await expect(page.getByText("Gel manicure", { exact: true })).toBeVisible();
  expect(externalRequests).toEqual([]);
  await confirm(page, "Reset demo");
});
