# 05 — 前台詳情頁 `/work-items/{id}`

**What to build:** 前台使用者從列表點任一列（或「查看詳情」）進到 `/work-items/{id}`，看到該項目的編號／標題／描述／建立時間／狀態／最後更新時間，其中狀態反映呼叫者個人化狀態。頁面提供「返回列表」，返回後保留先前的排序與分頁狀態。開啟不存在或已軟刪除項目時顯示明確的找不到提示，不崩潰。

**Blocked by:** 03（列表頁；需列表導航與可還原的查詢狀態）

**Status:** done

- [x] 列表每列可點進 `/work-items/{id}`（標題連結帶入當前查詢字串）
- [x] 詳情頁顯示編號／標題／描述／建立時間／狀態／最後更新時間
- [x] 狀態欄反映呼叫者個人化狀態（非他人狀態）
- [x] 「返回列表」回到先前列表，保留排序與分頁狀態（由 03 的 URL query 還原）
- [x] 項目不存在／已軟刪除（API 404）時顯示找不到提示
- [x] 前端測試：欄位呈現、個人化狀態、返回保留排序/分頁、404 提示

**實作位置：** `src/app/work-items/[id]/page.tsx`（AuthGuard + 原樣轉發 query 組出 `backHref`）、`src/app/work-items/[id]/WorkItemDetailView.tsx`（TanStack Query `retry: false`，錯誤即顯示找不到提示）、`src/lib/work-items.ts` 的 `fetchWorkItem`。

**後端支撐：** `GET /api/v1/work-items/{id}` 以 LEFT JOIN 取個人化狀態（無紀錄隱式 Pending）；`AppDbContext` 的 `HasQueryFilter(item => !item.IsDeleted)` 讓軟刪除項目自然落入 404。
