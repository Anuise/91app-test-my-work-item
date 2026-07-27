import { expect, test, type Page } from "@playwright/test";
import { findRowByTitle, login } from "../support/app";

const TITLE = "E2E 後台建立的項目";
const EDITED_TITLE = "E2E 後台編輯後的項目";

/** 刪掉後台列表上所有指定標題的項目；標題無唯一約束，前次失敗可能殘留多筆。 */
async function removeAdminItems(page: Page, title: string): Promise<void> {
  // 列表還在載入時 count() 會是 0，得等載入結束才數得準。
  await expect(page.getByText("載入中…")).toBeHidden();
  const deleteButton = page.getByRole("button", { name: `刪除 ${title}` });
  while ((await deleteButton.count()) > 0) {
    await deleteButton.first().click();
    await page.getByRole("button", { name: "確認刪除" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
  }
}

test("後台主線：新增 → 前台可見 → 編輯 → 前台反映 → 刪除 → 前台消失", async ({ browser }) => {
  const adminContext = await browser.newContext();
  const userContext = await browser.newContext();

  try {
    const adminPage = await adminContext.newPage();
    await login(adminPage, "admin");
    await adminPage.getByRole("link", { name: "後台管理" }).click();
    await expect(adminPage.getByRole("heading", { name: "工作項目管理" })).toBeVisible();

    // 前次失敗可能留下同名項目，先清乾淨才能讓本測試可重複執行。
    await removeAdminItems(adminPage, TITLE);
    await removeAdminItems(adminPage, EDITED_TITLE);

    await adminPage.getByRole("link", { name: "新增工作項目" }).click();
    await adminPage.getByLabel("標題").fill(TITLE);
    await adminPage.getByLabel("描述（選填）").fill("由 E2E 測試建立，測試結束會刪除。");
    await adminPage.getByRole("button", { name: "建立工作項目" }).click();
    await expect(adminPage.getByText("工作項目新增成功。")).toBeVisible();

    const userPage = await userContext.newPage();
    await login(userPage, "user");
    await findRowByTitle(userPage, TITLE);

    // 後台列表順序不保證新項目在最前，先鎖到該項目所在的列再點編輯。
    const adminItem = adminPage.getByRole("listitem").filter({ hasText: TITLE });
    await adminItem.getByRole("link", { name: "編輯" }).click();
    const titleField = adminPage.getByLabel("標題");
    await expect(titleField).toHaveValue(TITLE);
    await titleField.fill(EDITED_TITLE);
    await adminPage.getByRole("button", { name: "儲存變更" }).click();
    await expect(adminPage.getByText("工作項目更新成功。")).toBeVisible();

    await userPage.reload();
    await findRowByTitle(userPage, EDITED_TITLE);

    await removeAdminItems(adminPage, EDITED_TITLE);
    await expect(adminPage.getByText("刪除成功")).toBeVisible();

    await userPage.reload();
    await userPage.getByLabel("搜尋標題或描述").fill(EDITED_TITLE);
    await expect(userPage.getByText("目前無待辦項目")).toBeVisible();
  } finally {
    await adminContext.close();
    await userContext.close();
  }
});
