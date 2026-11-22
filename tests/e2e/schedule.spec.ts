import { expect, test } from "@playwright/test";

// Data comes from supabase/seed.sql (run `npx supabase db reset` first).
const cal = (page: import("@playwright/test").Page) => page.getByRole("region", { name: "Calendar" });

/** A week that is never this week: the Sunday two weeks from now (the app takes any day of a week). */
const otherWeek = () => new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10);

test("a term week shows its number and US date range", async ({ page }) => {
  await page.goto("/?week=2026-11-15");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Schedule of Week 1");
  await expect(page.getByText("November 15, 2026 to November 21, 2026")).toBeVisible();
});

test("a break week shows the break and no classes", async ({ page }) => {
  await page.goto("/?week=2026-12-20");
  await expect(page.locator(".dt").getByText(/Christmas break, no classes/)).toBeVisible(); // the phone copy is hidden here
  await expect(cal(page).getByRole("button", { name: "Verilog exercises" })).toBeVisible();
  await expect(cal(page).getByRole("button", { name: /Class/ })).toHaveCount(0);
});

test("G1 hides G2 labs and is remembered", async ({ page }) => {
  await page.goto("/?week=2026-11-15");
  await expect(cal(page).getByRole("button", { name: /G2/ }).first()).toBeVisible();
  await page.getByRole("group", { name: "Lab group" }).getByRole("button", { name: "G1" }).click();
  await expect(cal(page).getByRole("button", { name: /G2/ })).toHaveCount(0);
  await expect(cal(page).getByRole("button", { name: /G1/ }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByRole("group", { name: "Lab group" }).getByRole("button", { name: "G1" })).toHaveAttribute("aria-pressed", "true");
  await expect(cal(page).getByRole("button", { name: /G2/ })).toHaveCount(0);
});

test("a course link filters, is saved, and comes back on the plain site", async ({ page }) => {
  await page.goto("/?week=2026-11-15&course=cns");
  const filter = page.getByRole("navigation", { name: "Your courses" });
  await expect(filter.getByRole("button", { name: /^CNS/ })).toHaveAttribute("aria-pressed", "true");
  await expect(cal(page).getByRole("button", { name: /Quiz 1: OSI model/ }).first()).toBeVisible();
  for (const code of ["MICROP", "MOR", "PM", "LAWS", "HDL"]) {
    await expect(cal(page).getByText(code, { exact: true })).toHaveCount(0);
  }
  await page.goto("/");
  await expect(page).toHaveURL(/[?&]course=CNS(&|$)/);
});

test("the timetable sizes classes by length and marks a timed quiz in the grid and the row below", async ({ page }) => {
  await page.goto("/?week=2026-11-15");
  const block = (name: RegExp) => cal(page).getByRole("button", { name }).first();
  const lecture = await block(/MICROP 7:30–9:00/).boundingBox(); // 1½ hours
  const lab = await block(/MICROP 1:00–4:00/).boundingBox(); // 3 hours
  expect(lab!.height / lecture!.height).toBeGreaterThan(1.9);
  expect(lab!.y).toBeGreaterThan(lecture!.y);
  await expect(cal(page).getByRole("button", { name: /Quiz 1: OSI model/ })).toHaveCount(2);
  await expect(cal(page).getByText("Also this day")).toBeVisible();
  await expect(cal(page).getByRole("group", { name: "Day" })).toBeHidden(); // day tabs and the Day/Week switch are for phones only
  await expect(cal(page).getByRole("group", { name: "Calendar view" })).toBeHidden();
});

test("on a phone, the Week view (from ▦) opens scrolled to today with the hours pinned", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/?week=2026-11-15");
  await page.getByRole("banner").getByRole("button", { name: "Week timetable" }).click();
  // Monday's and Tuesday's cards are both there at once, and only the timetable scrolls sideways.
  await expect(cal(page).getByRole("button", { name: /Microprocessors/ }).first()).toBeAttached();
  await expect(cal(page).getByRole("button", { name: /Quiz 1: OSI model/ }).first()).toBeAttached();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const scroller = cal(page).locator('[tabindex="0"]');
  // Opened on today's column when today is in this week, else on Monday.
  const todayIdx = (Date.parse(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" })) - Date.parse("2026-11-15")) / 864e5;
  const startIdx = todayIdx >= 0 && todayIdx < 7 ? todayIdx : 1;
  await expect.poll(() => scroller.evaluate((el, i) => el.scrollWidth > el.clientWidth
    && el.scrollLeft === Math.min(el.scrollWidth - el.clientWidth, el.querySelector<HTMLElement>(`[data-day="${i}"]`)!.offsetLeft - el.querySelector<HTMLElement>("[data-hours]")!.offsetWidth), startIdx)).toBe(true);
});

test("a phone's Week view shows three whole days, with hours trimmed to the week", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?week=2026-11-15");
  await page.getByRole("banner").getByRole("button", { name: "Week timetable" }).click();
  await expect(cal(page).getByRole("button", { name: /Microprocessors/ }).first()).toBeAttached();
  const scroller = cal(page).locator('[tabindex="0"]');
  // Every day header in view sits wholly inside the scroller (past the pinned hours), and exactly three are in view.
  // Polled: the scroll to today lands just after the first paint.
  await expect.poll(() => scroller.evaluate((el) => {
    const box = el.getBoundingClientRect();
    const left = el.querySelector<HTMLElement>("[data-hours]")!.getBoundingClientRect().right;
    return [...el.querySelectorAll<HTMLElement>("[data-day]")].map((d) => d.getBoundingClientRect())
      .filter((r) => r.right > left + 6 && r.left < box.right - 6) // a column's border or a few px peeking at an edge is not a day in view
      .map((r) => r.left >= left - 1 && r.right <= box.right + 1);
  })).toEqual([true, true, true]);
  // The seed's classes run 7:30 to 4:00, so the grid stops at 4 PM instead of 8 PM.
  const hours = cal(page).locator("[data-hours] span");
  await expect(hours.filter({ hasText: "3 PM" })).toBeVisible();
  await expect(hours.filter({ hasText: "4 PM" })).toBeHidden();
  await expect(hours.filter({ hasText: "7 PM" })).toBeHidden();
});

test("a card opens its details and Escape closes them", async ({ page }) => {
  await page.goto("/?week=2026-11-15");
  await cal(page).getByRole("button", { name: /Quiz 1: OSI model/ }).first().click();
  const dlg = page.getByRole("dialog");
  await expect(dlg).toBeVisible();
  await expect(dlg.getByText("When", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dlg).toBeHidden();
});

test("the download button saves a PNG", async ({ page }) => {
  await page.goto("/?week=2026-11-15");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download image" }).click();
  expect((await download).suggestedFilename()).toMatch(/\.png$/);
});

test("phone width has no sideways page scroll", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/?week=2026-11-15");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("posted this week leaves out done notices", async ({ page }) => {
  await page.goto("/?week=2026-11-15");
  const cards = page.getByRole("region", { name: "Posted this week" }).getByRole("article");
  await expect(cards).toHaveCount(2);
  await expect(cards.filter({ hasText: "Group list submitted" })).toHaveCount(0);
  await expect(cards.first()).toContainText("Read the code of ethics");
  await expect(cards.first()).not.toHaveClass(/past/);
});

test("on a phone, Schedule's header has Week and Filter buttons; other pages do not", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?week=2026-11-15");
  const banner = page.getByRole("banner");
  await expect(banner.getByRole("button", { name: /Week timetable|Day summary/ })).toBeVisible();
  await expect(banner.getByRole("button", { name: "Filter" })).toBeVisible();
  await page.goto("/notices");
  await expect(banner.getByRole("button", { name: "Filter" })).toHaveCount(0);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/?week=2026-11-15");
  await expect(banner.getByRole("button", { name: "Filter" })).toBeHidden();
});

test("on a phone, Filter opens a sheet whose chips filter the week and are remembered", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?week=2026-11-15");
  await page.getByRole("banner").getByRole("button", { name: "Filter" }).click();
  const sheet = page.getByRole("dialog", { name: "Filter" });
  await expect(sheet).toBeVisible();
  await sheet.getByRole("group", { name: "Courses" }).getByRole("button", { name: /^CNS/ }).click();
  await expect(page).toHaveURL(/[?&]course=CNS(&|$)/);
  await expect(page).toHaveURL(/[?&]week=2026-11-15/);
  await expect(page.getByRole("banner").getByRole("button", { name: "Filter" })).toContainText("1");
  await sheet.getByRole("button", { name: "Done" }).click();
  await expect(sheet).toBeHidden();
  await page.goto("/");
  await expect(page).toHaveURL(/[?&]course=CNS(&|$)/);
});

test.describe("the phone day summary", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  const summary = (page: import("@playwright/test").Page) => page.getByRole("region", { name: "Day summary" });
  const strip = (page: import("@playwright/test").Page) => summary(page).getByRole("tablist", { name: "Day" });

  test("a phone opens Schedule on the day summary", async ({ page }) => {
    await page.goto("/?week=2026-11-15");
    await expect(summary(page)).toBeVisible();
    await expect(cal(page)).toBeHidden();
  });

  test("the strip picks a day and the sheet and classes follow", async ({ page }) => {
    await page.goto("/?week=2026-11-15");
    await strip(page).getByRole("tab", { name: "Mon 16" }).click();
    await expect(strip(page).getByRole("tab", { name: "Mon 16" })).toHaveAttribute("aria-selected", "true");
    await expect(summary(page).getByRole("group", { name: "Monday 16 November" })).toBeVisible();
    await expect(summary(page).getByRole("tab", { name: "Classes 3" })).toBeVisible();
    await expect(summary(page).getByRole("tabpanel").getByRole("button").first()).toContainText("Microprocessors");
  });

  test("▦ switches to Week and is remembered", async ({ page }) => {
    await page.goto("/?week=2026-11-15");
    await page.getByRole("banner").getByRole("button", { name: "Week timetable" }).click();
    await expect(cal(page)).toBeVisible();
    await expect(summary(page)).toBeHidden();
    await page.reload();
    await expect(cal(page)).toBeVisible();
    await expect(page.getByRole("banner").getByRole("button", { name: "Day summary" })).toContainText("Day");
  });

  test("a row opens the same details dialog", async ({ page }) => {
    await page.goto("/?week=2026-11-15");
    await strip(page).getByRole("tab", { name: "Mon 16" }).click();
    await summary(page).getByRole("tabpanel").getByRole("button").first().click();
    await expect(page.getByRole("dialog")).toContainText("Microprocessors");
  });

  test("in a break week the summary shows the break and no classes", async ({ page }) => {
    await page.goto("/?week=2026-12-20");
    await expect(summary(page)).toContainText("Christmas break");
    await expect(summary(page).getByRole("tab", { name: "Classes 0" })).toBeVisible();
  });

  test("on another week, no day is marked today and the same weekday is shown", async ({ page }) => {
    await page.goto(`/?week=${otherWeek()}`);
    await expect(strip(page).locator("[data-today]")).toHaveCount(0);
    const wd = new Date().toLocaleDateString("en-US", { weekday: "short", timeZone: "Asia/Manila" });
    await expect(strip(page).getByRole("tab", { selected: true })).toHaveAccessibleName(new RegExp(`^${wd} `));
  });

  test("a filter shows a Showing line, and a picked course with no classes that day says so", async ({ page }) => {
    await page.goto("/?week=2026-11-15&course=PM");
    await expect(page.getByText(/Showing PM/)).toBeVisible(); // the week row sits above the summary
    await strip(page).getByRole("tab", { name: "Thu 19" }).click();
    await expect(summary(page).getByRole("tabpanel")).toContainText("No classes");
    await page.getByRole("banner").getByRole("button", { name: "Filter" }).click();
    await expect(page.getByRole("dialog", { name: "Filter" }).getByRole("button", { name: /^PM/ })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("dialog", { name: "Filter" }).getByRole("button", { name: "Done" }).click();
    await page.getByRole("link", { name: "Clear" }).click();
    await expect(page).not.toHaveURL(/course=/);
  });
});

for (const [w, h] of [[360, 640], [375, 812]] as const) {
  test(`Goal 1: at ${w}×${h} the day's first class row is above the tab bar`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto("/?week=2026-11-15");
    const sum = page.getByRole("region", { name: "Day summary" });
    await sum.getByRole("tablist", { name: "Day" }).getByRole("tab", { name: "Mon 16" }).click();
    const row = await sum.getByRole("tabpanel").getByRole("button").first().boundingBox();
    const bar = await page.getByRole("navigation", { name: "Main" }).boundingBox();
    expect(row!.y + row!.height).toBeLessThanOrEqual(bar!.y);
  });
}

test("no sideways page scroll at 360px on Schedule, in both views", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto("/?week=2026-11-15");
  await expect(page.getByRole("region", { name: "Day summary" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.getByRole("banner").getByRole("button", { name: "Week timetable" }).click();
  await expect(cal(page)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  // A break week's long week row must shrink too.
  await page.getByRole("banner").getByRole("button", { name: "Day summary" }).click();
  await page.goto("/?week=2026-12-20");
  await expect(page.getByRole("region", { name: "Day summary" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test.describe("the date sheet flip", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  const swipe = async (page: import("@playwright/test").Page, dx: number) => {
    const sheet = page.getByRole("region", { name: "Day summary" }).getByRole("group", { name: /November/ });
    const b = (await sheet.boundingBox())!;
    const y = b.y + b.height / 2, x = b.x + b.width / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + dx / 2, y, { steps: 3 });
    await page.mouse.move(x + dx, y, { steps: 3 });
    await page.mouse.up();
  };

  test("swiping the date sheet moves a day; the new day's rows show while the old sheet tears away", async ({ page }) => {
    await page.goto("/?week=2026-11-15");
    const sum = page.getByRole("region", { name: "Day summary" });
    await sum.getByRole("tablist", { name: "Day" }).getByRole("tab", { name: "Mon 16" }).click();
    await expect(sum.locator("[data-leaving]")).toHaveCount(0); // let that turn finish before swiping
    await swipe(page, -120);
    // The whole date card turns over like a calendar page: Monday's card (16, its times, MONDAY) lifts off over Tuesday's.
    await expect(sum.locator("[data-leaving]")).toContainText("16");
    await expect(sum.locator("[data-leaving]")).toContainText(/monday/i);
    await expect(sum.getByRole("group", { name: "Tuesday 17 November" })).toBeVisible();
    await expect(sum.getByRole("tabpanel").getByRole("button").first()).toContainText(/Quiz 1|Computer Networks/);
    await expect(sum.locator("[data-leaving]")).toHaveCount(0);
    await swipe(page, 120);
    await expect(sum.getByRole("group", { name: "Monday 16 November" })).toBeVisible();
  });

  test("with reduced motion the day just changes", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/?week=2026-11-15");
    const sum = page.getByRole("region", { name: "Day summary" });
    await sum.getByRole("tablist", { name: "Day" }).getByRole("tab", { name: "Mon 16" }).click();
    await expect(sum.locator("[data-leaving]")).toHaveCount(0); // let that turn finish before swiping
    await swipe(page, -120);
    await expect(sum.getByRole("group", { name: "Tuesday 17 November" })).toBeVisible();
    await expect(sum.locator("[data-leaving]")).toHaveCount(0);
  });

  test("swiping the panel moves between Classes, Due and Notices", async ({ page }) => {
    await page.goto("/?week=2026-11-15");
    const sum = page.getByRole("region", { name: "Day summary" });
    const panel = sum.getByRole("tabpanel");
    const b = (await panel.boundingBox())!;
    await page.mouse.move(b.x + b.width / 2, b.y + 20);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width / 2 - 120, b.y + 22, { steps: 4 });
    await page.mouse.up();
    await expect(sum.getByRole("tab", { name: /^Due/ })).toHaveAttribute("aria-selected", "true");
  });
});

test.describe("review fixes", () => {
  test("on a phone, the Week view keeps the week heading and ‹ Today ›", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/?week=2026-11-15");
    await page.getByRole("banner").getByRole("button", { name: "Week timetable" }).click();
    await expect(cal(page)).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Week 1");
    await expect(page.getByRole("navigation", { name: "Week" }).getByRole("link", { name: "Next week" })).toBeVisible();
  });

  test("on a phone, Today from another week selects today's date", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/?week=${otherWeek()}`);
    const sum = page.getByRole("region", { name: "Day summary" });
    const today = new Date().toLocaleDateString("en-US", { weekday: "short", timeZone: "Asia/Manila" });
    const other = today === "Wed" ? "Thu" : "Wed";
    await sum.getByRole("tab", { name: new RegExp(`^${other} `) }).click();
    await page.getByRole("link", { name: "Today" }).click();
    await expect(page).not.toHaveURL(new RegExp(`week=${otherWeek()}`));
    await expect(sum.getByRole("tablist", { name: "Day" }).getByRole("tab", { selected: true })).toHaveAccessibleName(new RegExp(`^${today} `));
  });

  test("a narrow desktop window still opens the timetable scrolled to today", async ({ page }) => {
    await page.setViewportSize({ width: 950, height: 800 });
    await page.goto("/?week=2026-11-15");
    const scroller = cal(page).locator('[tabindex="0"]');
    const todayIdx = (Date.parse(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" })) - Date.parse("2026-11-15")) / 864e5;
    const startIdx = todayIdx >= 0 && todayIdx < 7 ? todayIdx : 1;
    await expect.poll(() => scroller.evaluate((el, i) => el.scrollWidth > el.clientWidth
      && el.scrollLeft === Math.min(el.scrollWidth - el.clientWidth, el.querySelector<HTMLElement>(`[data-day="${i}"]`)!.offsetLeft - el.querySelector<HTMLElement>("[data-hours]")!.offsetWidth), startIdx)).toBe(true);
  });
});

test.describe("the phone header", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("keeps the logo on the left on every page, with Schedule's buttons on the right", async ({ page }) => {
    for (const path of ["/?week=2026-11-15", "/notices"]) {
      await page.goto(path);
      const logo = await page.getByRole("banner").getByRole("link", { name: "Class Hub, home" }).boundingBox();
      expect(logo!.x, path).toBeLessThan(24);
    }
    await page.goto("/?week=2026-11-15");
    const banner = page.getByRole("banner");
    const logo = await banner.getByRole("link", { name: "Class Hub, home" }).boundingBox();
    const view = await banner.getByRole("button", { name: "Week timetable" }).boundingBox();
    expect(view!.x).toBeGreaterThan(logo!.x + logo!.width);
    await expect(banner.getByRole("button", { name: "Week timetable" })).toContainText("Week");
  });

  test("a bell opens the notification settings on every page", async ({ page }) => {
    for (const path of ["/?week=2026-11-15", "/files"]) {
      await page.goto(path);
      await page.getByRole("banner").getByRole("button", { name: "Notifications" }).click();
      await expect(page.getByRole("dialog", { name: "Notifications" })).toBeVisible();
      await page.keyboard.press("Escape");
    }
  });
});

test.describe("the phone week row and day strip", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the week arrows sit either side of the week name; Today stands apart", async ({ page }) => {
    await page.goto("/?week=2026-11-15");
    const nav = page.getByRole("navigation", { name: "Week" });
    const last = (await nav.getByRole("link", { name: "Last week" }).boundingBox())!;
    const next = (await nav.getByRole("link", { name: "Next week" }).boundingBox())!;
    const title = (await page.getByRole("heading", { level: 1 }).boundingBox())!;
    const today = (await page.getByRole("link", { name: "Today" }).boundingBox())!;
    expect(last.x + last.width).toBeLessThanOrEqual(title.x + 1);
    expect(next.x).toBeGreaterThanOrEqual(title.x + title.width - 1);
    expect(today.x).toBeGreaterThan(next.x + next.width);
  });

  test("today's day says Today instead of an underline", async ({ page }) => {
    await page.goto("/");
    const tab = page.getByRole("region", { name: "Day summary" }).locator("[data-today]");
    await expect(tab).toContainText("Today");
    expect(await tab.locator("b").evaluate((b) => getComputedStyle(b).textDecorationLine)).toBe("none");
  });
});

test("on a phone, the filter lists every course even in a break week", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?week=2026-12-20");
  await page.getByRole("banner").getByRole("button", { name: "Filter" }).click();
  const chips = page.getByRole("dialog", { name: "Filter" }).getByRole("group", { name: "Courses" });
  for (const code of ["MICROP", "PM", "LAWS", "BOHS", "HDL", "CNS", "ELEC", "MOR", "CEDD"]) {
    await expect(chips.getByRole("button", { name: new RegExp(`^${code}`) })).toBeVisible();
  }
});

test.describe("press and loading feedback on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  const slow = (page: import("@playwright/test").Page, url: RegExp) =>
    page.route(url, async (r) => { await new Promise((ok) => setTimeout(ok, 1500)); await r.continue().catch(() => {}); });

  test("Next week shows it is working until the next week arrives", async ({ page }) => {
    await page.goto("/?week=2026-11-15");
    await slow(page, /week=2026-11-22/);
    const next = page.getByRole("navigation", { name: "Week" }).getByRole("link", { name: "Next week" });
    await next.click();
    await expect(next.locator(".pending")).toBeAttached();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Week 2", { timeout: 10_000 });
    await expect(page.locator(".pending")).toHaveCount(0);
  });

  test("a course chip in the filter shows it is working", async ({ page }) => {
    await page.goto("/?week=2026-11-15");
    await slow(page, /course=CNS/);
    await page.getByRole("banner").getByRole("button", { name: "Filter" }).click();
    const chip = page.getByRole("dialog", { name: "Filter" }).getByRole("button", { name: /^CNS/ });
    await chip.click();
    await expect(chip.locator(".pending")).toBeAttached();
    await expect(page).toHaveURL(/course=CNS/, { timeout: 10_000 });
    await expect(page.locator(".pending")).toHaveCount(0);
  });

  test("the tab bar shows which page is loading", async ({ page }) => {
    await page.goto("/?week=2026-11-15");
    await slow(page, /\/files/);
    const tab = page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Files" });
    await tab.click();
    await expect(tab.locator(".pending")).toBeAttached();
    await expect(page.getByRole("heading", { level: 1, name: "Files" })).toBeVisible({ timeout: 10_000 });
  });

  test("a day in the strip reacts the moment it is pressed", async ({ page }) => {
    await page.goto("/?week=2026-11-15");
    const tab = page.getByRole("region", { name: "Day summary" }).getByRole("tab", { name: "Mon 16" });
    const b = (await tab.boundingBox())!;
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.down();
    await expect.poll(() => tab.evaluate((el) => getComputedStyle(el).transform)).not.toBe("none");
    await page.mouse.up();
  });
});

test.describe("keyboard and screen reader on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("arrow keys, Home and End move through the day strip and the Classes/Due/Notices tabs", async ({ page }) => {
    await page.goto("/?week=2026-11-15");
    const strip = page.getByRole("tablist", { name: "Day" });
    await strip.getByRole("tab", { name: "Mon 16" }).click();
    await expect(strip.getByRole("tab", { name: "Mon 16" })).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(strip.getByRole("tab", { name: "Tue 17" })).toHaveAttribute("aria-selected", "true");
    await expect(strip.getByRole("tab", { name: "Tue 17" })).toBeFocused();
    await page.keyboard.press("End");
    await expect(strip.getByRole("tab", { name: "Sat 21" })).toHaveAttribute("aria-selected", "true");
    // Only the picked day is a tab stop; the rest are reached with the arrows.
    await expect(strip.getByRole("tab", { name: "Mon 16" })).toHaveAttribute("tabindex", "-1");

    const show = page.getByRole("tablist", { name: "Show" });
    await show.getByRole("tab", { selected: true }).focus();
    await page.keyboard.press("Home");
    await expect(show.getByRole("tab").first()).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("ArrowLeft"); // wraps to the last
    await expect(show.getByRole("tab").last()).toHaveAttribute("aria-selected", "true");
  });

  test("the Filter button says how many courses are picked", async ({ page }) => {
    await page.goto("/?week=2026-11-15&course=CNS,PM");
    await expect(page.getByRole("banner").getByRole("button", { name: "Filter, 2 courses picked" })).toBeVisible();
    await page.goto("/?week=2026-11-15&course=CNS");
    await expect(page.getByRole("banner").getByRole("button", { name: "Filter, 1 course picked" })).toBeVisible();
    // A link naming a course that no longer exists: only the real one counts, and the URL drops the other.
    await page.goto("/?week=2026-11-15&course=CNS,ZZZ");
    await expect(page).toHaveURL(/[?&]course=CNS(&|$)/);
    await expect(page.getByRole("banner").getByRole("button", { name: "Filter, 1 course picked" })).toBeVisible();
  });
});

test.describe("Next up under the phone's Week view", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("lists the next quizzes and due dates as tickets that open their details", async ({ page }) => {
    await page.goto("/?week=2026-11-15");
    await page.evaluate(() => localStorage.setItem("classhub.calendarView", "week"));
    await page.reload();
    const list = page.getByRole("region", { name: "Next up" }).filter({ visible: true });
    await expect(list).toHaveCount(1);
    const rows = list.getByRole("button");
    expect(await rows.count()).toBeGreaterThan(0);
    expect(await rows.count()).toBeLessThanOrEqual(3);
    await expect(rows.first().locator("time")).toHaveText(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\d{1,2}(today|tmrw|\d+ days|.*)$/);
    const title = (await rows.first().locator("b").last().textContent())!;
    await rows.first().click();
    await expect(page.getByRole("dialog")).toContainText(title);
    // The day summary keeps its own Due tab instead.
    await page.keyboard.press("Escape");
    await page.evaluate(() => localStorage.setItem("classhub.calendarView", "day"));
    await page.reload();
    await expect(page.getByRole("region", { name: "Next up" }).filter({ visible: true })).toHaveCount(0);
  });
});
