import { expect, test } from "@playwright/test";

test("/admin while signed out goes to the login page", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText("Officers sign in with Google")).toBeVisible();
  await expect(page.getByRole("button", { name: /Sign in with Google/ })).toBeVisible();
});

test("/login shows a fixed message, never text from the link", async ({ page }) => {
  await page.goto("/login?error=Your account is locked");
  await expect(page.getByText("Your account is locked")).toHaveCount(0);
  await expect(page.locator("main p")).toHaveText("Sign-in didn't finish. Try again.");
});

test.describe("officer on a phone", () => {
  test.use({ storageState: "tests/e2e/.auth/officer.json", viewport: { width: 390, height: 844 } });
  test("the Admin link and Sign out are in the footer, not the header", async ({ page }) => {
    await page.goto("/notices");
    await expect(page.getByRole("contentinfo").getByRole("link", { name: "Admin" })).toBeVisible();
    await expect(page.getByRole("contentinfo").getByRole("button", { name: "Sign out" })).toBeVisible();
    await expect(page.getByRole("banner").getByRole("link", { name: "Admin" })).toBeHidden();
  });
});

test.describe("officer on a small phone", () => {
  test.use({ storageState: "tests/e2e/.auth/officer.json", viewport: { width: 360, height: 640 } });
  test("the footer with officer links never scrolls the page sideways", async ({ page }) => {
    await page.goto("/notices");
    await expect(page.getByRole("contentinfo").getByRole("link", { name: "Admin" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });
});
