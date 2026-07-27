import { expect, type Locator, type Page } from "@playwright/test";
import { ACCOUNTS, type AccountKey } from "./accounts";

/** 由登入頁走完真實登入流程；成功後停在前台列表頁。 */
export async function login(page: Page, account: AccountKey): Promise<void> {
  const { username, password } = ACCOUNTS[account];
  await page.goto("/");
  await page.getByLabel("帳號").fill(username);
  await page.getByLabel("密碼").fill(password);
  await page.getByRole("button", { name: "登入" }).click();
  await expect(page.getByRole("heading", { name: "我的工作項目" })).toBeVisible();
}

/**
 * 以標題搜尋並回傳該列 Locator。
 * 共用資料庫的項目數量不固定，靠搜尋收斂到單頁單列，避免斷言撞到分頁或其他測試留下的資料。
 */
export async function findRowByTitle(page: Page, title: string): Promise<Locator> {
  await page.getByLabel("搜尋標題或描述").fill(title);
  // 搜尋有 300ms debounce 才寫進 URL 並重新查詢；等它落地，否則後續斷言打到的是未過濾的列表。
  await page.waitForURL((url) => url.searchParams.get("search") === title);
  const row = page
    .getByRole("row")
    .filter({ has: page.getByRole("link", { name: title, exact: true }) });
  await expect(row).toBeVisible();
  return row;
}

/**
 * 確保該項目對目前登入者是「待確認」。
 * 個人化狀態存在共用資料庫，前一次失敗的執行可能殘留「已確認」，先撤銷才能讓測試可重複跑。
 */
export async function ensurePending(page: Page, title: string): Promise<void> {
  const revokeButton = page.getByRole("button", { name: `撤銷確認 ${title}` });
  if (await revokeButton.isVisible()) {
    await revokeButton.click();
    await page.getByRole("button", { name: "確認撤銷" }).click();
    await expect(revokeButton).toBeHidden();
  }
}

/** 勾選單一項目並按下「確認所選項目」。 */
export async function confirmItem(page: Page, title: string): Promise<void> {
  await page.getByLabel(`選取 ${title}`).check();
  await page.getByRole("button", { name: /^確認所選項目/ }).click();
}

/** 走完「撤銷確認 → 二次確認對話框 → 確認撤銷」。 */
export async function revokeConfirmation(page: Page, title: string): Promise<void> {
  await page.getByRole("button", { name: `撤銷確認 ${title}` }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "確認撤銷" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
}
