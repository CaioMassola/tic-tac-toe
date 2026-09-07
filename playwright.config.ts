import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  webServer: {
    command: process.env.CI ? "npm run start" : "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    channel: process.env.PLAYWRIGHT_CHANNEL || "msedge",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
  ],
});
