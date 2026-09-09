import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";
import { existsSync } from "node:fs";

// Keep the test runner and Next.js on the same backend, including .env.local.
for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}

const backendUrl = (
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"
).replace(/\/$/, "");
const backendDir = resolve(process.env.BACKEND_DIR || "../tic-tac-toe-backend");

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  webServer: [
    {
      command: process.env.CI ? "npm run start" : "npm run dev",
      env: { PORT: "3000" },
      url: "http://127.0.0.1:3000",
      reuseExistingServer: !process.env.CI,
    },
    ...(process.env.E2E_EXTERNAL_BACKEND === "1"
      ? []
      : [
          {
            command: `java -jar "${backendDir}/target/backend-0.0.1-SNAPSHOT.jar"`,
            url: `${backendUrl}/api/health`,
            reuseExistingServer: !process.env.CI,
            timeout: 60000,
          },
        ]),
  ],
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
