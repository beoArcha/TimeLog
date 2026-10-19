import { defineConfig, devices } from "@playwright/test";
import { resolveDevServerConfig } from "../../../config/devServer.ts";

const devConfig = resolveDevServerConfig();

export default defineConfig({
  testDir: "../specs",
  timeout: 60 * 1000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: devConfig.url,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
        launchOptions: {
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-crash-reporter",
            "--no-crashpad",
            "--disable-breakpad",
            "--disable-dev-shm-usage",
            "--disable-gpu",
          ],
        },
      },
    },
  ],
  webServer: {
    command: "bun run dev",
    url: devConfig.url,
    reuseExistingServer: !process.env.CI,
    timeout: 30 * 1000,
  },
});
