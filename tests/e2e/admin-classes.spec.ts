import { expect, test } from "@playwright/test";

// Needs a fresh `npx supabase db reset`; the class made here has a unique room and is deleted at the end.
const OFFICER = "tests/e2e/.auth/officer.json";
const VIEWER = "tests/e2e/.auth/viewer.json";

test.describe("officer", () => {
  test.use({ storageState: OFFICER });

  test("add a G2 class, cancel it for one week, restore it, delete it", async ({ page }) => {
    test.setTimeout(60_000); // one long walk through every one-day change
    const room = `E2E Room ${Date.now()}`;
    await page.goto("/admin/classes");
    const form = page.getByRole("form", { name: "Add a weekly class" });
    await form.getByLabel("Course").selectOption({ label: "CNS · Computer Networks and Security" });
    await form.getByLabel("Day").selectOption({ label: "Thursday" });
    await form.getByLabel("Group").selectOption({ label: "G2 only" });
    await form.getByLabel("Starts").fill("5:00 PM");
    await form.getByLabel("Ends").fill("4:00 PM");
    await form.getByRole("button", { name: "Add class" }).click();
    await expect(form.getByText("End time must be after the start time")).toBeVisible();
    await form.getByLabel("Ends").fill("6:00 PM");
    await form.getByLabel("Room").fill(room);
    await form.getByRole("button", { name: "Add class" }).click();
    await expect(page.getByRole("status")).toHaveText("Class added");
    const row = page.getByRole("region", { name: "Weekly classes" }).locator("div", { has: page.getByText(room) }).filter({ has: page.getByRole("button", { name: "Delete" }) }).last();
    await expect(row).toContainText(`Computer Networks and Security · G2 · ${room}`);

    const card = (week: string) => page.goto(`/?week=${week}`).then(() => page.getByRole("region", { name: "Calendar" }).getByRole("button").filter({ hasText: room }));
    const thisWeek = await card("2026-11-15");
    await expect(thisWeek).toContainText("G2");
    await expect(thisWeek).not.toContainText("No class");
    await thisWeek.click();
    const dlg = page.getByRole("dialog");
    await expect(dlg.getByText("Officers only")).toBeVisible();
    // Switch the G2 class to G1 for this week only; next week it is G2 again.
    await dlg.getByRole("group", { name: "Group on Thu 19 Nov" }).getByRole("button", { name: "G1" }).click();
    await expect(page.getByRole("status")).toHaveText("G1 on Thu 19 Nov");
    await expect(thisWeek).toContainText("G1");
    await expect(await card("2026-11-22")).toContainText("G2");
    await (await card("2026-11-15")).click();
    await expect(dlg).toContainText("G1 (this week only; usually G2)");
    await dlg.getByRole("group", { name: "Group on Thu 19 Nov" }).getByRole("button", { name: "G2" }).click();
    await expect(page.getByRole("status")).toHaveText("G2 on Thu 19 Nov");
    await expect(thisWeek).toContainText("G2");
    // Move this week's class later; the next week keeps 5–6 PM.
    await thisWeek.click();
    const hours = dlg.getByRole("form", { name: "Hours on Thu 19 Nov" });
    await hours.getByLabel("Starts").fill("6:00 PM");
    await hours.getByLabel("Ends").fill("5:30 PM");
    await hours.getByRole("button", { name: "Change hours on Thu 19 Nov" }).click();
    await expect(page.getByRole("status")).toHaveText("End time must be after the start time");
    await hours.getByLabel("Ends").fill("7:30 PM");
    await hours.getByRole("button", { name: "Change hours on Thu 19 Nov" }).click();
    await expect(page.getByRole("status")).toHaveText("Hours changed for Thu 19 Nov");
    await expect(thisWeek).toContainText("6:00–7:30");
    await expect(await card("2026-11-22")).toContainText("5:00–6:00");
    await (await card("2026-11-15")).click();
    await expect(dlg).toContainText("6:00–7:30 PM (this week only; usually 5:00–6:00 PM)");
    await dlg.getByRole("button", { name: "Back to usual hours" }).click();
    await expect(page.getByRole("status")).toHaveText("Usual hours on Thu 19 Nov");
    await expect(thisWeek).toContainText("5:00–6:00");
    // Move this week's class online; the next week is in person in its room again.
    await thisWeek.click();
    await dlg.getByRole("group", { name: "Class on Thu 19 Nov" }).getByRole("button", { name: "Online" }).click();
    await expect(page.getByRole("status")).toHaveText("Online on Thu 19 Nov");
    // An online card shows "Online" where the room was.
    const online = page.getByRole("region", { name: "Calendar" }).getByRole("button").filter({ hasText: "G2 · Online" });
    await expect(online).toHaveCount(1);
    await expect(thisWeek).toHaveCount(0);
    await expect(await card("2026-11-22")).toContainText(`G2 · ${room}`);
    await page.goto("/?week=2026-11-15");
    await online.click();
    await expect(dlg).toContainText(`Online (this week only; usually in person, ${room})`);
    await dlg.getByRole("group", { name: "Class on Thu 19 Nov" }).getByRole("button", { name: "In person" }).click();
    await expect(page.getByRole("status")).toHaveText("In person on Thu 19 Nov");
    await expect(thisWeek).toContainText(`G2 · ${room}`);
    // Another room and an agenda for this week only: the agenda takes the course name's place on the card.
    await thisWeek.click();
    const ra = dlg.getByRole("form", { name: "Room and agenda on Thu 19 Nov" });
    await ra.getByLabel("Room").fill("Lab 9");
    await ra.getByLabel("Agenda").fill("Orientation");
    await ra.getByRole("button", { name: "Save for Thu 19 Nov" }).click();
    await expect(page.getByRole("status")).toHaveText("Room and agenda saved for Thu 19 Nov");
    const agendaCard = page.getByRole("region", { name: "Calendar" }).getByRole("button").filter({ hasText: "Orientation" });
    await expect(agendaCard).toContainText("G2 · Lab 9");
    await expect(agendaCard).not.toContainText("Computer Networks");
    await expect(await card("2026-11-22")).toContainText("Computer Networks and Security");
    await page.goto("/?week=2026-11-15");
    await agendaCard.click();
    await expect(dlg).toContainText(`Lab 9 (this week only; usually in person, ${room})`);
    await expect(dlg).toContainText("Orientation");
    await ra.getByLabel("Room").fill("");
    await ra.getByLabel("Agenda").fill("");
    await ra.getByRole("button", { name: "Save for Thu 19 Nov" }).click();
    await expect(page.getByRole("status")).toHaveText("Room and agenda saved for Thu 19 Nov");
    await expect(thisWeek).toContainText("Computer Networks and Security");
    await expect(agendaCard).toHaveCount(0);
    await thisWeek.click();
    await dlg.getByRole("button", { name: "Cancel this class on Thu 19 Nov only" }).click();
    await expect(page.getByRole("status")).toHaveText("Class cancelled for Thu 19 Nov");
    await expect(dlg).toBeHidden();
    // The cancelled class leaves the time grid; its "No class" item is in the row below.
    await expect(thisWeek).toHaveCount(0);
    const off = page.getByRole("region", { name: "Calendar" }).getByRole("button").filter({ hasText: "No class · G2" });
    await expect(off.last()).toBeVisible();
    // Admin → Calendar leaves it out; only the seed's hand-made No class (PM's faculty meeting) is listed.
    await page.goto("/admin/calendar");
    await expect(page.getByRole("region", { name: "Calendar" }).locator("b", { hasText: "No class" })).toHaveCount(1);
    await expect(await card("2026-11-22")).not.toContainText("No class");

    await page.goto("/?week=2026-11-15");
    await off.last().click();
    await page.getByRole("dialog").getByRole("button", { name: "Restore this class" }).click();
    await expect(page.getByRole("status")).toHaveText("Class restored");
    await expect(off).toHaveCount(0);
    await expect(await card("2026-11-15")).not.toContainText("No class");

    // Online every week: the row and every week's card say Online, and the card becomes a window; then back in person.
    await page.goto("/admin/classes");
    const edit = page.getByRole("form", { name: "Edit weekly class" });
    await row.getByRole("link", { name: "Edit" }).click();
    await edit.getByLabel("Online every week").check();
    await edit.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByRole("status")).toHaveText("Saved");
    const onlineRow = page.getByRole("region", { name: "Weekly classes" }).locator("div", { has: page.getByText("Computer Networks and Security · G2 · Online") })
      .filter({ has: page.getByRole("link", { name: "Edit" }) }).last();
    await expect(onlineRow).toBeVisible();
    await page.goto("/?week=2026-11-22");
    await expect(online).toHaveCount(1);
    await expect(online).toHaveClass(/__on/);
    await page.goto("/admin/classes");
    await onlineRow.getByRole("link", { name: "Edit" }).click();
    await edit.getByLabel("Online every week").uncheck();
    await edit.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByRole("status")).toHaveText("Saved");
    await expect(row).toContainText(`Computer Networks and Security · G2 · ${room}`);

    page.once("dialog", (d) => d.accept());
    await row.getByRole("button", { name: "Delete" }).click();
    await expect(row).toHaveCount(0);
  });
});

test.describe("visitor", () => {
  test.use({ storageState: VIEWER });

  test("the class dialog has no officer footer", async ({ page }) => {
    await page.goto("/?week=2026-11-15");
    await page.getByRole("region", { name: "Calendar" }).getByRole("button").filter({ hasText: "Microprocessors" }).first().click();
    await expect(page.getByRole("dialog").getByRole("heading", { name: /.+/ }).first()).toBeVisible();
    await expect(page.getByText("Officers only")).toHaveCount(0);
  });
});
