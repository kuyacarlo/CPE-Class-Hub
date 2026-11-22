import { expect, test } from "@playwright/test";

test("home renders the header and hides notifications", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.status()).toBe(200);
  for (const name of ["Schedule", "Notices", "Files", "Courses"]) {
    await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
  }
  const foot = page.getByRole("contentinfo");
  await expect(foot.getByRole("link", { name: "Officer sign in" })).toHaveAttribute("href", "/login");
  await expect(foot).toContainText("CPE 3C");
  await expect(foot).toContainText(/Updated [A-Z][a-z]{2} \d+ [A-Z][a-z]{2}, \d+:\d\d [AP]M/);
  await expect(foot).toContainText(/v\d+\.\d+\.\d+/);
  // Notifications are opt-in: the panel stays closed until the footer link is used.
  await expect(foot.getByRole("button", { name: "Notifications" })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Notifications" })).toBeHidden();
});

test.describe("the install strip on a touch phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("shows, explains how, and stays dismissed", async ({ page }) => {
    await page.goto("/notices");
    const strip = page.getByRole("region", { name: "Add to Home Screen" });
    await expect(strip).toBeVisible();
    await strip.getByRole("button", { name: "How" }).click();
    await expect(page.getByRole("dialog", { name: "Add to Home Screen" })).toContainText("Add to Home Screen");
    await page.keyboard.press("Escape");
    await strip.getByRole("button", { name: "Dismiss" }).click();
    await expect(strip).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("region", { name: "Add to Home Screen" })).toHaveCount(0);
  });

  for (const [w, h] of [[360, 640], [375, 812]] as const) {
    test(`Goal 1 still holds at ${w}×${h} with the strip showing`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.goto("/?week=2026-11-15");
      await expect(page.getByRole("region", { name: "Add to Home Screen" })).toBeAttached();
      const sum = page.getByRole("region", { name: "Day summary" });
      await sum.getByRole("tablist", { name: "Day" }).getByRole("tab", { name: "Mon 16" }).click();
      const row = await sum.getByRole("tabpanel").getByRole("button").first().boundingBox();
      const bar = await page.getByRole("navigation", { name: "Main" }).boundingBox();
      expect(row!.y + row!.height).toBeLessThanOrEqual(bar!.y);
    });
  }
});

test("the install strip never shows on a desktop", async ({ page }) => {
  await page.goto("/notices");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("region", { name: "Add to Home Screen" })).toHaveCount(0);
});

test("dark mode follows the device, and the footer switch overrides it and is remembered", async ({ page }) => {
  const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/notices");
  expect(await bg()).toBe("rgb(26, 26, 26)");
  const theme = page.getByRole("contentinfo").getByRole("group", { name: "Theme" });
  await expect(theme.getByRole("button", { name: "Auto" })).toHaveAttribute("aria-pressed", "true");
  await theme.getByRole("button", { name: "Light" }).click();
  expect(await bg()).toBe("rgb(239, 239, 239)");
  await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute("content", "#ffffff");
  await page.reload(); // set before paint, from this browser's choice
  expect(await bg()).toBe("rgb(239, 239, 239)");
  await theme.getByRole("button", { name: "Auto" }).click();
  expect(await bg()).toBe("rgb(26, 26, 26)");
});
