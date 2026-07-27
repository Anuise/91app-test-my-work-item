import { expect, test } from "@playwright/test";
import { confirmItem, ensurePending, findRowByTitle, login, revokeConfirmation } from "../support/app";

// Seed 項目（DatabaseInitializer）；刻意與前台主線 spec 使用不同項目，避免兩支測試互相干擾。
const TITLE = "撰寫個人化狀態單元測試";

test("跨使用者隔離：user 確認後 user2 看到的仍是待確認", async ({ browser }) => {
  const userContext = await browser.newContext();
  const user2Context = await browser.newContext();

  try {
    const userPage = await userContext.newPage();
    await login(userPage, "user");
    const userRow = await findRowByTitle(userPage, TITLE);
    await ensurePending(userPage, TITLE);

    await confirmItem(userPage, TITLE);
    await expect(userRow).toContainText("已確認");

    const user2Page = await user2Context.newPage();
    await login(user2Page, "user2");
    const user2Row = await findRowByTitle(user2Page, TITLE);
    await expect(user2Row).toContainText("待確認");
    // 沒有個人化 Confirmed 狀態就不該出現撤銷入口。
    await expect(user2Page.getByRole("button", { name: `撤銷確認 ${TITLE}` })).toBeHidden();

    // 還原 user 的個人化狀態，讓這支測試可重複執行。
    await revokeConfirmation(userPage, TITLE);
    await expect(userRow).toContainText("待確認");
  } finally {
    await userContext.close();
    await user2Context.close();
  }
});
