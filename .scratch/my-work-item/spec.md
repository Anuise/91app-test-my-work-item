# Spec: My Work Item

Status: ready-for-agent
Feature slug: my-work-item
建立日期: 2026-07-27
來源: `/to-spec`（承接 `/grill-with-docs` 定案；規格原文見 `docs/processed_md/AI 考題 — B2E 題型：My Work Item.md`；決策依據 ADR 0001–0015 與 `CONTEXT.md` 詞彙表）

> **給實作 agent 的當前狀態摘要**
> - **後端 WorkItem 核心已完工並綠燈**：`WorkItemsController` / `AdminWorkItemsController` / service / repository / EF migrations / `WorkItemsApiTests.cs` 皆存在，涵蓋 list / detail / bulk-confirm / revoke / admin CRUD / soft-delete / RBAC。
> - **grilling（ADR 0015）對「已完成後端」下了 3 項行為變更**，尚未反映到程式碼，且與現有測試衝突（見 Implementation Decisions 的「Delta」標記）。
> - **前端幾乎未開工**：只有登入頁（`page.tsx` + `page.test.tsx`）與一支 BFF proxy stub `api/work-items/route.ts`。list / detail / admin 三頁尚不存在。
> - 本 PRD 描述整個功能的目標行為（不是只寫 delta）。每條 Implementation Decision 以 `[已完成]` / `[Delta]` / `[待建]` 標明落地狀態，讓 agent 一眼分辨要動什麼。

---

## Problem Statement

前台使用者需要一個網頁，能看到管理者維護的一批待辦 Work Item，並針對每個項目做**屬於自己的**勾選與確認；關掉瀏覽器再登入，仍要看到自己先前的狀態，且完全不受其他使用者操作影響。管理者則需要一個後台介面，對這批 Work Item 做新增／修改／刪除。

目前系統只有登入流程與後端 API，前台使用者打開瀏覽器沒有任何可操作的列表頁；而 grilling 定案的分頁、排序白名單、全選範圍等契約也還沒落到程式碼，導致前後端對「列表查詢長什麼樣」沒有一致約定。

## Solution

交付一條可從瀏覽器走完的關鍵流程：

1. 使用者登入後進入 `/work-items`，看到共用的 Work Item 列表（欄位：編號、標題、狀態），預設依建立時間新→舊排序，可切換升／降序，支援關鍵字搜尋、狀態過濾與 server-side 分頁。
2. 使用者可勾選一至多列並按「確認」批量標記為「已確認」（僅記錄自己的狀態）；對「已確認」的列可經二次確認對話框「撤銷確認」回「待確認」。
3. 點任一列進入 `/work-items/{id}` 詳情頁，看到完整欄位；「返回列表」保留原本的排序與分頁狀態。
4. 管理者透過 `/admin/work-items` 系列頁面新增、編輯、刪除 Work Item，變更即時反映到前台列表。

同時把 ADR 0015 的列表查詢契約（分頁、排序白名單含 `title`、越界值靜默 fallback、全選限當前頁）落實到後端與前端，讓兩端契約一致。

## User Stories

### 前台使用者 — 列表與呈現
1. 作為前台使用者，我想登入後在 `/work-items` 看到 Work Item 列表（編號／標題／狀態三欄），以便了解有哪些待辦項目。
2. 作為前台使用者，當資料庫沒有任何項目時，我想看到「目前無待辦項目」的空狀態提示，而不是空白畫面。
3. 作為前台使用者，我想要列表預設依「建立時間」由新到舊排序，以便先看到最新項目。
4. 作為前台使用者，我想能切換建立時間的升／降序，以便換角度檢視。
5. 作為前台使用者，我想能改用「標題」排序（升／降），以便依名稱找項目。
6. 作為前台使用者，我想在列表用關鍵字搜尋標題／描述（帶 300ms debounce），以便快速縮小範圍。
7. 作為前台使用者，我想用 All／Pending／Confirmed 過濾狀態，以便只看我關心的項目。
8. 作為前台使用者，當項目很多時，我想要分頁（每頁預設 20 筆）並能翻頁，以便列表不會過長。
9. 作為前台使用者，我想在翻頁、搜尋、過濾、排序時看到穩定一致的結果，以便信任畫面。

### 前台使用者 — 勾選與確認
10. 作為前台使用者，我想在每列左側有 checkbox，以便勾選要操作的項目。
11. 作為前台使用者，勾選某列後我想看到該列有「已選中」的視覺回饋，以便確認我選了什麼。
12. 作為前台使用者，我想用表頭「全選」一次選取／取消**當前頁顯示中的**所有項目，以便省去逐列點選。
13. 作為前台使用者，當我沒有勾選任何項目時，我想要「確認」按鈕為 disabled，以便避免誤送空請求。
14. 作為前台使用者，按「確認」後我想把所勾選項目（僅我個人）標記為「已確認」，成功後清除勾選並看到對應列狀態更新。
15. 作為前台使用者，確認成功後我想看到提示（例如「已成功確認 X 項目」），以便確認操作生效。
16. 作為前台使用者，若確認失敗，我想看到錯誤訊息且列狀態保持原樣，以便重試。
17. 作為前台使用者，我想只對「已確認」的列看到「撤銷確認」按鈕，以便撤回誤確認。
18. 作為前台使用者，點「撤銷確認」時我想跳出二次確認對話框（確定／取消），取消則不做任何變更。
19. 作為前台使用者，確認撤銷後我想把該列（僅我個人）改回「待確認」、隱藏「撤銷確認」按鈕，並看到提示訊息。
20. 作為前台使用者，我想我的勾選／確認狀態與其他使用者完全隔離，以便各自獨立作業。

### 前台使用者 — 持久化與詳情
21. 作為前台使用者，我想我的確認狀態存在後端，關閉或重整瀏覽器後再進 `/work-items` 仍看到「已確認」（且 checkbox 為未勾選）。
22. 作為前台使用者，我想點任一列（或「查看詳情」）進到 `/work-items/{id}`，看到編號／標題／描述／建立時間／狀態／最後更新時間。
23. 作為前台使用者，我想詳情頁狀態欄反映的是我個人的狀態，而非別人的。
24. 作為前台使用者，我想詳情頁提供「返回列表」，回去時保留先前的排序與分頁狀態。
25. 作為前台使用者，當我開啟一個不存在或已被刪除項目的詳情時，我想看到明確的找不到提示，而不是崩潰。

### 後台管理員
26. 作為管理員，我想在 `/admin/work-items/new` 用表單新增 Work Item（標題必填、描述選填），以便加入新待辦。
27. 作為管理員，當標題為空白時我想看到欄位錯誤提示且無法提交，以便避免建立無效資料。
28. 作為管理員，新增成功後我想導回列表並看到「新增成功」提示，新項目依排序規則出現在最上方。
29. 作為管理員，我想在 `/admin/work-items/{id}/edit` 看到預填當前標題與描述的編輯表單，以便修正內容。
30. 作為管理員，編輯時標題不得為空白，否則顯示錯誤且禁止儲存。
31. 作為管理員，儲存成功後我想回列表看到「更新成功」提示，且該列顯示最新內容，變更同步反映到前台使用者列表。
32. 作為管理員，我想對每列有「刪除」按鈕，點擊時跳出「確定要刪除此項目嗎？」對話框。
33. 作為管理員，確認刪除後我想該列從列表移除並看到「刪除成功」提示；刪除採軟刪除，保留歷史狀態紀錄。
34. 作為管理員，我想只有 Admin 角色能進入 `/admin/*` 與呼叫 admin API，一般 User 會被擋下。
35. 作為管理員，我同時也是前台作業者，勾選確認時一樣產生屬於我自己的個人化狀態。

### 跨切面（權限、錯誤、容錯）
36. 作為任一使用者，未帶有效 token 存取受保護資源時，我想得到一致的 401 錯誤 envelope（含可追蹤 traceId）。
37. 作為一般 User 存取 admin API 時，我想得到 403，而非誤以為成功。
38. 作為使用者，任何 API 錯誤我想看到統一格式的訊息與 traceId，以便回報問題時可追蹤。
39. 作為使用者，若我提交的批量確認清單含已被刪除或不存在的項目，我想系統自動忽略它們、回 HTTP 200 並用訊息告知（例如「成功確認 2 個項目，1 個項目已被移除」），而不是整批失敗。
40. 作為使用者，重複送出同一批確認或同一筆撤銷時，我想結果保持一致（冪等），不會產生重複紀錄或非預期行為。

## Implementation Decisions

> 標記：`[已完成]` = 現有程式碼已符合；`[Delta]` = 現有已完成但 grilling 要求變更、需改動（含改測試）；`[待建]` = 尚未存在需新建。

### 領域模型與 Schema
- **`[已完成]`** `WorkItem`（`Id` Guid、`Title`、`Description?`、`CreatedAt`、`UpdatedAt`、`IsDeleted`）。`WorkItem.Id` 與 `User.UserId` **皆為 Guid**（ADR 0005 補註 A；`CONTEXT.md` 詞條 1 收斂為 Guid）。
- **`[已完成]`** `UserWorkItemStatus`：複合主鍵 `(UserId, WorkItemId)`、`Status`（enum `Pending=0` / `Confirmed=1`）、`ConfirmedAt`、`UpdatedAt`。無明確紀錄時業務層隱式視為 `Pending`（LEFT JOIN + null 轉 Pending）。
- **`[已完成]`** Admin 亦有個人化狀態（ADR 0005 補註 B）：`UserWorkItemStatus` 不辨識角色；Admin 額外擁有的僅是 `/admin/*` CRUD 權限。
- **`[已完成]`** 軟刪除：`IsDeleted` + EF Core Global Query Filter `HasQueryFilter(w => !w.IsDeleted)`（ADR 0013）。刪除保留 `UserWorkItemStatus` 歷史。

### 後端 API 契約（前台 `/api/v1/work-items`，後台 `/api/v1/admin/work-items`；ADR 0006）
- **`[已完成]`** `GET /api/v1/work-items/{id}`：回個人化狀態詳情；不存在／已軟刪除 → 404 envelope。
- **`[已完成]`** `POST /api/v1/work-items/bulk-confirm`：冪等；空清單 → 400；含遺失／軟刪除 ID → 自動過濾、回 200，`data.confirmedCount` / `data.ignoredCount` 與 `message`（含「已被移除」）。不影響其他使用者。
- **`[已完成]`** `POST /api/v1/work-items/{id}/revoke`：冪等 + 優雅 200（ADR 0013 補註）。`data.revoked` 布林；非 `Confirmed`（含無狀態列、已軟刪除、不存在）→ no-op 回 200 `revoked=false`，不丟 404/500。
- **`[已完成]`** Admin CRUD：`POST` 新增（標題空白 → 400，`errors` 含 `title 不可為空白`，成功回 201）、`PUT` 編輯（同驗證；不存在 → 404）、`DELETE` 軟刪除（回 200 `刪除工作項目成功`；不存在 → 404）。RBAC：無 token → 401、User 打 admin → 403（ADR 0011）。
- **`[Delta]`** `GET /api/v1/work-items` 列表查詢契約改為 ADR 0015：
  - **Server-side 分頁**：新增 query `page`（1-based）、`pageSize`（預設 `20`）；分頁在 `search`/`statusFilter` 過濾與排序**之後**於資料庫層（LINQ `Skip`/`Take`）套用；回應除清單外附 `totalCount`（過濾後總數）。**目前回應僅回陣列、無分頁 → 需擴充回應結構**（見下方 API 契約決策）。
  - **排序白名單含 `title`**：`sortBy ∈ {createdAt, title}`、`sortOrder ∈ {asc, desc}`，預設 `createdAt` / `desc`。**目前僅支援 `createdAt`，`title` 會被拒 → 需新增 `title` 排序分支**。
  - **越界值靜默 fallback**：`sortBy`／`sortOrder` 傳白名單外的值時**回退預設、不回 400**。**與現有測試衝突**：`WorkItemsApiTests.Unsupported_sortBy_value_returns_400_envelope` 與 `Unsupported_sortOrder_value_returns_400_envelope` 現在斷言 400，需改寫為斷言「靜默 fallback + 200 + 預設排序結果」。
- **API 回應結構決策（`[Delta]`）**：列表分頁需要 `totalCount`，但既有 envelope 的 `data` 對列表是純陣列。決策：**`data` 改為物件** `{ items: WorkItem[], page, pageSize, totalCount }`，維持外層 `success`/`message`/`errors`/`traceId` envelope 不變。凡讀 `data` 為陣列的既有測試與 BFF 需同步調整（下方 Testing 一併列出）。

### 認證與授權（ADR 0010 / 0011）
- **`[已完成]`** 前端密碼預雜湊 `ClientHash = SHA256(RawPassword + SystemSalt)`；後端 `BCrypt(ClientHash)` 儲存為 `DBStoredHash`。預雜湊定位（ADR 0010 補註 A）：**非傳輸安全**（TLS 已負責），唯一效益是原始明文密碼永不離開瀏覽器。
- **`[待建（前端）]`** JWT 儲存於 **localStorage**、以 `Authorization: Bearer <token>` 攜帶（ADR 0010 補註 B）。已知 XSS 取捨，httpOnly cookie 為正式環境升級路徑、不在本 demo 範圍。
  - 註：現有 BFF `api/work-items/route.ts` 走的是 **cookie**（`AUTH_COOKIE_NAME`）讀 token。前端 token 儲存策略需與 ADR 0010 補註 B 對齊——**此為需在實作時解決的既有不一致**（localStorage vs cookie 二選一，全站一致）。
- **`[已完成]`** 無自助註冊：帳號僅由 seed 提供（`user` / `user2` / `admin`）。JWT claims：`sub`(UserId)、`name`、`role`、`exp`(24h)。

### 前端（ADR 0002 / 0009；Next.js App Router / React 19 / TS / Tailwind v4 / TanStack Query）
- **`[待建]`** 三個頁面：`/work-items`（列表）、`/work-items/{id}`（詳情）、`/admin/work-items` 系列（列表 + `new` + `{id}/edit`）。
- **`[待建]`** 全選僅當前頁（ADR 0015 決策 2）：表頭「全選」只選取／取消**當前頁**項目；`bulk-confirm` 送出當前頁被勾選的明確 ID 清單；**不**實作跨頁「選取全部 N 頁」。
- **`[待建]`** TanStack Query Key 併入分頁：`['work-items', { search, statusFilter, sortBy, sortOrder, page }]`（ADR 0012 + 0015）。
- **`[待建]`** 「返回列表」保留排序與分頁狀態：列表查詢參數（含 `page`）需反映在 URL query 或可還原的狀態，讓詳情頁返回後一致。
- **`[已完成/沿用]`** 搜尋 300ms debounce、狀態過濾 All/Pending/Confirmed（ADR 0012）。
- **`[待建]`** 設計語彙：Soft Glassmorphism、lucide-react icons（ADR 0009）。撤銷採二次確認對話框；操作成功／失敗均有訊息回饋。

### 部署（ADR 0007）
- **`[已完成/沿用]`** Docker Compose 雙軌（demo 模式 vs dev 模式 `dotnet watch` / `npm run dev`）+ 一鍵容器 demo。`/healthz` 健康檢查與 `POST /api/v1/admin/reset-seed-data` 種子重置（ADR 0014）沿用。

## Testing Decisions

**什麼是好測試**：只驗證外部可觀察行為（HTTP 契約、使用者可見的畫面與互動、狀態隔離與持久化結果），不綁實作細節（不斷言私有方法、內部欄位或特定 SQL）。斷言鎖在 API envelope 形狀、狀態轉換結果、跨使用者隔離、冪等結果、UI 上使用者看得到的文字與可點性。

**Seam 1 — 後端 HTTP（沿用現有 prior-art）**
- `WebApplicationFactory<Program>` + in-memory EF（`WorkItemsApiFactory` / `AuthApiFactory`），打真 HTTP 全管線（auth、RBAC、envelope、EF）。這是最高可用 seam，優先沿用。
- 既有 `WorkItemsApiTests.cs` / `AuthApiTests.cs` 為 prior-art，維持 xUnit + FluentAssertions + `ReplaceWorkItemsAsync` 種資料風格。
- **需新增**（ADR 0015 delta）：`title` 升／降序排序、分頁（`page`/`pageSize`/`totalCount`、越界頁碼、`pageSize` 預設 20）、過濾後 `totalCount` 正確。
- **需改寫**：`Unsupported_sortBy_value_returns_400_envelope`、`Unsupported_sortOrder_value_returns_400_envelope` → 從「斷言 400」改為「斷言靜默 fallback 回預設排序 + 200」。
- **需同步**：所有把 `data` 當陣列讀的斷言（如 `data.GetArrayLength()`、`data.EnumerateArray()`）改為讀 `data.items`（回應結構決策）。

**Seam 2 — 前端頁面（沿用現有 prior-art）**
- Vitest + Testing Library，render 頁面元件、mock `fetch`，斷言使用者可見行為（沿用 `page.test.tsx` 風格：`getByRole`/`getByLabelText`、`waitFor`、mock 回 envelope）。
- 涵蓋：空狀態文字、勾選視覺回饋、全選限當前頁、確認按鈕 disabled 條件、確認/撤銷成功與失敗訊息、撤銷二次確認對話框、排序切換、分頁翻頁、搜尋 debounce、admin 表單標題必填驗證、返回列表保留排序/分頁。

**Seam 3 — E2E（新增，Playwright）**
- 跨前後端整合，走完一條關鍵流程：登入 → 進 `/work-items` → 勾選並確認 → 重整後仍為已確認 → 撤銷 → 進詳情頁 → 返回列表保留排序/分頁；另跑 admin：新增 → 前台可見 → 編輯 → 刪除消失。
- 至少覆蓋「個人化狀態跨使用者隔離」與「持久化（重整後保留）」兩條 demo 主線。E2E 為新 seam，數量精簡在關鍵流程，不與 Seam 1/2 重複細節斷言。

## Out of Scope

- 自助註冊 / 忘記密碼 / 修改密碼（無自助註冊，帳號僅由 seed 提供）。
- 登入失敗鎖定、rate limit、refresh token（grilling 明確標為 demo out-of-scope）。
- 跨頁「選取全部 N 頁」二段式全選（明確不做，全選限當前頁）。
- 將 JWT 改為 httpOnly cookie 驗證模型（連帶 CORS credentials / CSRF）——正式環境升級路徑，非本 demo 範圍（但 token 儲存策略需在前端全站一致，見 Implementation Decisions）。
- Work Item 的分類 / 標籤 / 指派 / 到期日等 spec 未要求的欄位或功能。

## Further Notes

- ADR 0015（分頁 / 全選範圍 / 排序白名單）是本 spec 最大的行為 delta，且**與已綠燈的後端測試直接衝突**（`sortBy=title` 現回 400、越界值現回 400、`data` 現為陣列）。實作 agent 應把「改後端 + 改對應測試 + 擴充回應結構」視為同一個原子變更，避免半套。
- 前端 token 儲存存在既有不一致：ADR 0010 補註 B 定 localStorage + Bearer，但現有 BFF `api/work-items/route.ts` 讀 cookie。實作時需擇一並全站對齊；此為決策已定（localStorage）、程式碼待收斂。
- 種子帳號（測試已依賴）：`user` / `user2`（皆 role `User`，`user2` 用於狀態隔離煙霧測試）、`admin`（role `Admin`）。
- 所有錯誤走統一 envelope（`success`/`data`/`message`/`errors`/`traceId`）+ 全域例外中介 + Serilog + `X-Trace-ID`（ADR 0003 / 0008）。
