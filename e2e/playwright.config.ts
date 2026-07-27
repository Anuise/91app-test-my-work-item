import { defineConfig, devices } from "@playwright/test";

// E2E 打的是「已經跑起來的整套服務」（`docker compose up -d --wait`），
// 不由 Playwright 代管 dotnet run / npm run dev，避免多出第二套啟動真實來源（ADR 0007）。
export default defineConfig({
  testDir: "./tests",
  // 三支 spec 共用同一個資料庫與 seed 帳號，個人化狀態會互相干擾，故序列執行。
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    locale: "zh-TW",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
