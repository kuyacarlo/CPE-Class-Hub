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
    { name: "public", testIgnore: /admin.*\.spec\.ts/, dependencies: ["setup"] },
    // Admin tests change shared rows, so they run after the public ones that count them.
    { name: "admin", testMatch: /admin.*\.spec\.ts/, dependencies: ["setup", "public"] },
  ],
  webServer: {
    command: "npm run dev",
    port: 3000,
    reuseExistingServer: true,
  },
});
