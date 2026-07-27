# 15. 前台列表查詢：Server-side 分頁、全選範圍與排序白名單

- **狀態**：已通過 (Accepted)
- **日期**：2026-07-27

## 背景 (Context)

規格詳情頁要求「返回列表時保持排序與**分頁**狀態」，但既有 ADR（0006 路由、0012 搜尋過濾）皆未定義分頁機制、全選在分頁下的作用範圍，以及 `sortBy` 允許的欄位。需補齊 `GET /api/v1/work-items` 的列表查詢契約。

## 決策 (Decision)

1. **Server-side 分頁**：
   - `GET /api/v1/work-items` 新增 Query Parameters：`page`（1-based）、`pageSize`（預設 `20`）。
   - 分頁在 `search` / `statusFilter` 過濾與排序**之後**於資料庫層套用。
   - 回應除項目清單外，附帶 `totalCount`（過濾後總數）供前端渲染分頁控制。
2. **全選範圍（僅當前頁）**：
   - 表頭「全選」只選取／取消**當前頁顯示中的項目**，符合規格「所有顯示中的項目」字面。
   - `POST /work-items/bulk-confirm` 由前端送出當前頁被勾選的明確 ID 清單；不實作「選取全部 N 頁」的跨頁二段式全選。
3. **排序白名單**：
   - `sortBy ∈ { createdAt, title }`；`sortOrder ∈ { asc, desc }`。
   - 預設 `sortBy = createdAt`、`sortOrder = desc`（新→舊）。
   - 傳入白名單外的值時**靜默 fallback** 回預設，不回 400。

## 後果與權衡 (Consequences)

### 優點
- **語意單純**：全選限當前頁，bulk-confirm 無跨頁隱含選取的陷阱。
- **可擴充**：server-side 分頁與 LINQ `WHERE`/`ORDER BY`/`Skip`/`Take` 契合，資料量成長不影響前端。
- **防注入**：`sortBy` 白名單避免任意欄位排序。

### 缺點 / 考量
- 前端需維護 `page` 狀態並併入 TanStack Query Key（沿用 ADR 0012 的 `['work-items', { search, statusFilter, sortBy, sortOrder, page }]`）。
- 全選限當前頁對「一次確認大量項目」的使用者需逐頁操作。
