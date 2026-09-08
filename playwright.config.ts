import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3217",
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  webServer: {
    command: "npm run start -- -H 127.0.0.1 -p 3217",
    url: "http://127.0.0.1:3217",
    reuseExistingServer: false,
    timeout: 120_000
  },
  projects: [
    {
      name: "phone",
      use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } }
    },
    {
      name: "foldable-landscape",
      use: { ...devices["Desktop Chrome"], viewport: { width: 914, height: 412 } }
    },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 960 } }
    }
  ]
});
