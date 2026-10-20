import { expect, test, type Page } from "@playwright/test";

async function choose(page: Page, label: string, option: string) {
  await page.getByRole("combobox", { name: label, exact: true }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

for (const width of [1440, 375]) {
  test(`shared salon controls at ${width}px: calendar, hours and multiple services`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/settings/salon");
    await choose(page, "Default cutoff frequency", "Weekly");
    await expect(
      page.getByRole("combobox", {
        name: "Default cutoff frequency",
        exact: true,
      }),
    ).toHaveText("Weekly");

    await choose(page, "Monday opening hour", "12");
    await choose(page, "Monday opening period", "AM");
    await expect(
      page.getByRole("combobox", { name: "Monday opening hour", exact: true }),
    ).toHaveText("12");
    await expect(
      page.getByRole("combobox", {
        name: "Monday opening period",
        exact: true,
      }),
    ).toHaveText("AM");

    await page
      .getByRole("button", { name: "Open Closed dates calendar", exact: true })
      .click();
    await choose(page, "Calendar year", "2024");
    await choose(page, "Calendar month", "February");
    const calendar = page.getByRole("grid");
    await expect(calendar).toBeVisible();
    const bounds = await calendar.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    await calendar
      .getByRole("button", {
        name: new Intl.DateTimeFormat("en-PH", {
          dateStyle: "full",
          timeZone: "UTC",
        }).format(new Date("2024-02-29T00:00:00Z")),
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("button", { name: "Remove 2024-02-29", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Remove 2024-02-29", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Remove 2024-02-29", exact: true }),
    ).toHaveCount(0);

    const closedDate = page.getByRole("textbox", {
      name: "Closed dates",
      exact: true,
    });
    await closedDate.fill("2024-02-30");
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await expect(closedDate).toHaveAttribute("aria-invalid", "true");
    await expect(
      page.getByText("Check closed dates and try again.", { exact: true }),
    ).toBeVisible();
    await closedDate.fill("");

    // Invalid configuration is rejected; leave the other local edits unsaved.
    await page.goto("/staff");
    await page
      .getByRole("button", { name: "Add employee", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    const eligibility = dialog.getByRole("combobox", {
      name: "Service eligibility",
      exact: true,
    });
    await eligibility.click();
    await page
      .getByRole("option", { name: "Haircut & finish", exact: true })
      .click();
    await page
      .getByRole("option", { name: "Hair treatment", exact: true })
      .click();
    await page.keyboard.press("Escape");
    await expect(eligibility).toContainText("Haircut & finish");
    await expect(eligibility).toContainText("Hair treatment");
    expect(
      await dialog.evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      ),
    ).toBe(true);
    await expect(
      page.locator(
        'select:visible, input[type="date"]:visible, input[type="time"]:visible, input[type="datetime-local"]:visible',
      ),
    ).toHaveCount(0);
  });
}
