import { expect, test } from "@playwright/test";

// Data comes from supabase/seed.sql (run `npx supabase db reset` first).
const cards = (page: import("@playwright/test").Page) => page.getByRole("article");

test("notices are grouped in course order, leaving out done ones", async ({ page }) => {
  await page.goto("/notices");
  const all = cards(page);
  await expect(all).toHaveCount(2); // PM's "Group list submitted" is done, so only its course page shows it
  // Course order is PM, LAWS, ... CNS. Quiz 1 greys after 17 Nov, so its greying isn't checked.
  await expect(all.nth(0)).toContainText("Read the code of ethics");
  await expect(all.nth(0)).not.toHaveClass(/past/);
  await expect(all.nth(1)).toContainText("Quiz 1 on Tuesday");
  await expect(all.filter({ hasText: "Quiz 1 on Tuesday" })).toContainText("On the calendar: Quiz/exam, Tue 17 Nov");
});

test("List view is a table with a Status column and is remembered", async ({ page }) => {
  await page.goto("/notices");
  await page.getByRole("group", { name: "View" }).getByRole("button", { name: "List" }).click();
  await expect(page.getByRole("columnheader", { name: "Status" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Date" })).toBeVisible();
  await expect(page.getByRole("row", { name: /Read the code of ethics.*Active/ })).toBeVisible();
  const open = page.getByRole("button", { name: "Read the code of ethics" });
  await expect(page.locator(".dt").getByText("Read sections 1 to 3 before Thursday.")).toHaveCount(0);
  await open.click();
  await expect(open).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".dt").getByText("Read sections 1 to 3 before Thursday.")).toBeVisible();
  await open.click();
  await expect(page.locator(".dt").getByText("Read sections 1 to 3 before Thursday.")).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("columnheader", { name: "Status" })).toBeVisible();
});

test("General files show without course files", async ({ page }) => {
  await page.goto("/files?course=general");
  await expect(page.getByRole("navigation", { name: "Files by course" }).getByRole("link").last()).toContainText("General");
  await expect(page.getByRole("cell", { name: "Class master list" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Packet Tracer download" })).toHaveCount(0);
  const link = page.getByRole("link", { name: "Open link" });
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", "noopener");
  await page.goto("/files?course=CNS");
  await expect(page.getByRole("cell", { name: "Packet Tracer download" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Class master list" })).toHaveCount(0);
});

test("picking MOR on Notices is carried to the Schedule", async ({ page }) => {
  await page.goto("/notices");
  await page.getByRole("group", { name: "Show notices from these courses" }).getByRole("button", { name: /^MOR/ }).click();
  await expect(page).toHaveURL(/course=MOR/);
  await page.goto("/");
  await expect(page).toHaveURL(/[?&]course=MOR(&|$)/);
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("Notices are rows under a chip row; a row expands", async ({ page }) => {
    await page.goto("/notices");
    await expect(page.getByRole("button", { name: "List" })).toHaveCount(0);
    await expect(page.getByRole("group", { name: "Show notices from these courses" }).getByRole("button", { name: /^All/ })).toHaveAttribute("aria-pressed", "true");
    const first = page.getByRole("article").first();
    const title = first.getByRole("button", { expanded: false });
    await expect(title).toBeVisible();
    await title.click();
    await expect(first.getByRole("button", { expanded: true })).toBeVisible();
  });

  test("Files opens on All, grouped by course; empty courses are left out", async ({ page }) => {
    await page.goto("/files");
    const chips = page.getByRole("navigation", { name: "Files by course" });
    await expect(chips.getByRole("link", { name: /^All/ })).toHaveAttribute("aria-current", "page");
    await expect(chips.getByRole("link", { name: /^MOR/ })).toHaveCount(0);
    const list = page.locator(".ph").getByRole("list", { name: "Files" });
    await expect(list.getByRole("heading", { name: /CNS/ })).toBeVisible();
    await expect(list.getByRole("heading", { name: /General/ })).toBeVisible();
    await expect(list.getByRole("link", { name: /Packet Tracer download/ })).toBeVisible();
    await chips.getByRole("link", { name: /^CNS/ }).click();
    await expect(page).toHaveURL(/course=CNS/);
    await expect(list.getByRole("link", { name: /Lab manual/ })).toHaveCount(0);
  });
});
