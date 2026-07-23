# 13. 軟刪除 (Soft Delete) 與批量確認冪等性防護規範

- **狀態**：已通過 (Accepted)
- **日期**：2026-07-23

## 背景 (Context)

在高併發或多使用者操作環境下，若管理者刪除某一 Work Item，而使用者同時或隨後嘗試勾選並執行「批量確認」，傳統硬刪除 (Hard Delete) 可能導致外鍵孤立、查詢崩潰或 HTTP 500 未預期例外。

## 決策 (Decision)

1. **資料庫軟刪除 (Soft Delete)**：
   - `WorkItem` 實體新增 `IsDeleted` (boolean, 預設 `false`) 欄位。
   - 後台管理員執行刪除 (`DELETE /api/v1/admin/work-items/{id}`) 時，更新 `IsDeleted = true` 與 `UpdatedAt`，保留歷史審計紀錄。
   - EF Core 配置 Global Query Filter `builder.HasQueryFilter(w => !w.IsDeleted)`，自動隱藏已刪除項目。
2. **批量確認 API 冪等性與優雅降級 (Idempotent Bulk Response)**：
   - `POST /api/v1/work-items/bulk-confirm` 為冪等 (Idempotent) 操作，重複提交相同 ID 列表不會造成非預期行為。
   - 若提交的 ID 列表中包含已刪除或不存在的項目，業務邏輯層自動過濾，並於 API Envelope 的 `message` 回傳明確提示（如：「成功確認 2 個項目，1 個項目已被移除」），維持 HTTP 200 成功回應與優雅 UI 反饋。

## 後果與權衡 (Consequences)

### 優點
- **強大容錯能力**：徹底避免因資料時差造成的例外崩潰。
- **維護審計軌跡**：軟刪除機制保護資料不被永久抹除，利於合規稽核。
