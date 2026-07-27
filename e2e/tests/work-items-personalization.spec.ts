import { expect, test } from "@playwright/test";
import { confirmItem, ensurePending, findRowByTitle, login, revokeConfirmation } from "../support/app";

// Seed 項目（DatabaseInitializer）；本 spec 只動這一筆，結束時還原為待確認。
const TITLE = "設定本機開發環境";

test("前台主線：確認 → 重整仍為已確認 → 撤銷 → 詳情 → 返回列表保留排序與分頁", async ({ page }) => {
  await login(page, "user");

  const row = await findRowByTitle(page, TITLE);
  await ensurePending(page, TITLE);
  await expect(row).toContainText("待確認");

  await confirmItem(page, TITLE);
  await expect(row).toContainText("已確認");

  // 持久化：狀態存在後端，重整後仍為已確認，且 checkbox 不殘留勾選。
  await page.reload();
  await expect(row).toContainText("已確認");
  await expect(page.getByLabel(`選取 ${TITLE}`)).not.toBeChecked();

  await revokeConfirmation(page, TITLE);
  await expect(row).toContainText("待確認");

  // 先改排序，再進詳情，才能驗證返回列表時脈絡有被保留。
  await page.getByRole("button", { name: "排序依據：建立時間" }).click();
  await page.getByRole("button", { name: "降冪" }).click();

  await page.getByRole("link", { name: TITLE, exact: true }).click();
  await expect(page.getByRole("heading", { name: TITLE })).toBeVisible();
  await expect(page.getByText("我的狀態")).toBeVisible();

  await page.getByRole("link", { name: "返回列表" }).click();
  await expect(page).toHaveURL(/sortBy=title.*sortOrder=asc.*page=1/);
  await expect(page.getByRole("button", { name: "排序依據：標題" })).toBeVisible();
  await expect(page.getByRole("button", { name: "升冪" })).toBeVisible();
  await expect(page.getByLabel("搜尋標題或描述")).toHaveValue(TITLE);
});
