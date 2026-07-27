# 01 — 後端列表契約收斂到 ADR 0015

**What to build:** `GET /api/v1/work-items` 的列表查詢契約落實 ADR 0015，並在同一原子變更內修好因此而破的既有後端測試。完成後，任何前端都能依穩定契約消費列表：可指定頁碼與每頁筆數、可依 `createdAt` 或 `title` 升降序排序、傳非法排序值時安靜回退預設而非報錯，且回應帶得到分頁總數。

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] `GET /api/v1/work-items` 接受 query `page`（1-based）與 `pageSize`（預設 20），於 `search`/`statusFilter` 過濾與排序**之後**於資料庫層套用分頁
- [ ] 回應 `data` 由純陣列改為物件 `{ items, page, pageSize, totalCount }`，`totalCount` 為過濾後總數；外層 envelope（`success`/`message`/`errors`/`traceId`）不變
- [ ] `sortBy` 白名單擴為 `{ createdAt, title }`，`sortOrder` 為 `{ asc, desc }`，預設 `createdAt` / `desc`；`title` 排序分支可用
- [ ] `sortBy`／`sortOrder` 傳白名單外的值時靜默 fallback 回預設，回 200（不再回 400）
- [ ] 重寫 `Unsupported_sortBy_value_returns_400_envelope`、`Unsupported_sortOrder_value_returns_400_envelope`：改為斷言靜默 fallback + 200 + 預設排序結果
- [ ] 修正所有把 `data` 當陣列讀的既有斷言（`GetArrayLength`/`EnumerateArray`）改讀 `data.items`
- [ ] 新增測試：`title` 升／降序、分頁（越界頁碼、`pageSize` 預設 20）、過濾後 `totalCount` 正確
- [ ] 既有 BFF proxy `api/work-items/route.ts` 同步對齊新契約（不再硬編 `createdAt`、可帶分頁）
- [ ] 後端測試全綠
