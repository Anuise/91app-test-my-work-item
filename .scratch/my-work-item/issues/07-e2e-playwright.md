# 07 — E2E Playwright 關鍵流程

**What to build:** 跨前後端的端到端測試，實際用瀏覽器走完 demo 主線，證明整條流程可用。涵蓋前台個人化確認/撤銷/持久化/詳情返回，與後台 CRUD 反映前台，以及跨使用者狀態隔離。

**Blocked by:** 04（確認/撤銷）、05（詳情）、06（admin CRUD）

**Status:** done

- [x] 新增 Playwright 設定與可跑的 E2E 專案（沿用 seed 帳號 `user` / `user2` / `admin`）
- [x] 前台主線：登入 → `/work-items` → 勾選並確認 → 重整後仍為已確認 → 撤銷回待確認 → 進詳情頁 → 返回列表保留排序/分頁
- [x] 後台主線：admin 新增 → 前台可見 → 編輯 → 前台反映 → 刪除 → 前台消失
- [x] 跨使用者隔離：`user` 確認某項目後，`user2` 登入該項目仍為待確認
- [x] E2E 只覆蓋關鍵流程，不與 Seam 1/2 重複細節斷言

## Comments

### 實作結果（2026-07-28）

- 新增 `e2e/` 獨立套件：`playwright.config.ts`、`support/accounts.ts`（seed 帳號）、`support/app.ts`（登入／搜尋定位／確認／撤銷 helper）、三支 spec。
- **不在 config 內代管 server**：E2E 打已啟動的 `docker compose` 整套服務（`E2E_BASE_URL` 可覆寫），避免 `dotnet run` / `npm run dev` 變成第二套啟動真實來源（ADR 0007）。執行方式寫入 README「自動化驗證」。
- `workers: 1` + `fullyParallel: false`：三支 spec 共用同一個資料庫與 seed 帳號，個人化狀態會互相干擾。
- 可重複執行：個人化 spec 以 `ensurePending` 先撤銷殘留狀態、結束還原為待確認；後台 spec 以固定標題並在開頭清掉同名殘留項目。前台／隔離 spec 刻意使用不同 seed 項目。
- 分頁保留改為斷言「返回列表後 URL query（含 `page`）與排序控制狀態原樣還原」：seed 僅 3 筆、`pageSize` 20，湊不出第 2 頁，不為此硬造 21 筆資料。

### E2E 抓到的產品缺陷（已修）

`src/app/admin/work-items/admin-work-items-list.tsx` 把 `items` props 複製進 `useState`，React Query 重新取得的結果被忽略。實際影響：admin 新增或編輯後 `router.push` 導回列表，看到的是舊快取——剛新增的項目不出現、已刪除的項目仍在列。修法為以 props 為單一資料來源、刪除只記下已移除的 id（3 行，不動元件介面，票 06 既有測試全綠）。

### 驗證

- `e2e`：3 passed，連續執行兩次皆綠。
- `frontend`：74 passed（15 檔）、`npm run typecheck` 綠。
- `backend`：63 passed。
