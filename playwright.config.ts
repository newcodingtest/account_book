import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:4183",
    viewport: { width: 375, height: 812 },
    launchOptions: process.env.PLAYWRIGHT_CHROME_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROME_PATH }
      : {},
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run preview -- --port 4183",
    url: "http://127.0.0.1:4183",
    reuseExistingServer: true,
  },
});
