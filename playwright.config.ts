import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  workers: 1, // admin specs rename shared rows, so nothing runs beside them
  // A cold dev server can take a click before the page is interactive; one retry keeps that from skipping the admin
  // specs, and the report still lists the test as flaky.
  retries: 1,
  use: { baseURL: "http://localhost:3000" },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    // setup also removes rows a failed admin run left behind, so it goes first.
    { name: "public", testIgnore: /(admin.*|semester)\.spec\.ts/, dependencies: ["setup"] },
    // Admin tests change shared rows, so they run after the public ones that count them.
    { name: "admin", testMatch: /admin.*\.spec\.ts/, dependencies: ["setup", "public"] },
    // Starting a new semester wipes the seed, so it runs after everything else, once (a retry would find it wiped).
    { name: "semester", testMatch: /semester\.spec\.ts/, dependencies: ["admin"], retries: 0 },
  ],
  webServer: {
    command: "npm run dev",
    port: 3000,
    reuseExistingServer: true,
  },
});
