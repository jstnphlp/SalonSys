import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/demo",
  workers: 1,
  timeout: 90000,
  use: { baseURL: "http://127.0.0.1:3000", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "node scripts/demo.mjs",
    url: "http://127.0.0.1:3000/dashboard",
    reuseExistingServer: true,
    env: { SALONSYS_DEMO_MODE: "true" },
  },
});
