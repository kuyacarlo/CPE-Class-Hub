import { expect, test } from "@playwright/test";

// A classmate reports a mistake from a class's details; the officer sees it in Admin, Reports, marks it done, deletes it.
const OFFICER = "tests/e2e/.auth/officer.json";

test("a classmate's report reaches the officers' inbox", async ({ browser }) => {
  test.setTimeout(60_000); // two browsers, and the admin page compiles cold on a fresh dev server
  const msg = `E2E The room is ER 999 now ${Date.now()}`;
  const visitor = await (await browser.newContext()).newPage();
  await visitor.goto("/?week=2026-11-15");
  await visitor.getByRole("region", { name: "Calendar" }).getByRole("button").filter({ hasText: "Microprocessors" }).first().click();
  const dlg = visitor.getByRole("dialog");
  await expect(dlg.getByText("Officers only")).toHaveCount(0);
  await dlg.getByText("Something wrong?").click();
  const form = dlg.getByRole("form", { name: "Report a mistake" });
  await form.getByLabel("What should it say?").fill("x");
  await form.getByRole("button", { name: "Send to the officers" }).click();
  await expect(visitor.getByRole("status")).toHaveText("Say what's wrong");
  await form.getByLabel("What should it say?").fill(msg);
  await form.getByRole("button", { name: "Send to the officers" }).click();
  await expect(visitor.getByRole("status")).toHaveText("Sent to the officers. Thanks!");

  const page = await (await browser.newContext({ storageState: OFFICER })).newPage();
  await page.goto("/admin/reports");
  const row = page.getByRole("region", { name: "Reports" }).locator("div", { has: page.getByText(msg) })
    .filter({ has: page.getByRole("button", { name: "Delete" }) }).last();
  await expect(row).toContainText(/MICROP class, \w{3} \d{1,2} Nov/);
  await row.getByRole("button", { name: "Mark done" }).click();
  await expect(page.getByRole("status")).toHaveText("Marked as done");
  await expect(row).toContainText("Done");
  page.once("dialog", (d) => d.accept());
  await row.getByRole("button", { name: "Delete" }).click();
  await expect(row).toHaveCount(0);
});
