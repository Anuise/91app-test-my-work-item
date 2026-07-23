# 5. 個人化狀態資料關聯與 Schema 設計

- **狀態**：已通過 (Accepted)
- **日期**：2026-07-23

## 背景 (Context)

系統需支援多使用者個人化狀態隔離（如：User A 對 Work Item #1 已確認，User B 對 Work Item #1 仍為待確認）。需要選擇效能佳、擴充性高且符合關聯式資料庫正規化的 Schema 設計。

## 決策 (Decision)

1. **實體設計**：建立 `UserWorkItemStatus` 關聯實體：
   - 複合主鍵：`(UserId, WorkItemId)`
   - 欄位：`UserId`, `WorkItemId`, `Status` (Enum: Pending = 0, Confirmed = 1), `ConfirmedAt`, `UpdatedAt`
2. **狀態計算策略**：
   - 前端查詢列表時，對 `WorkItem` 與該使用者的 `UserWorkItemStatus` 進行 `LEFT JOIN`。
   - 若該使用者無明確狀態紀錄，業務邏輯層隱式視為 `Pending` (待確認)。
   - 當使用者點擊「確認」時，更新或插入 (`UPSERT`) 該筆紀錄為 `Confirmed`。
   - 當使用者點擊「撤銷確認」時，更新狀態為 `Pending`。

## 後果與權衡 (Consequences)

### 優點
- **儲存效率高**：無需在新增 Work Item 時預先為所有使用者批量生成預設紀錄。
- **維護與查詢方便**：LINQ 查詢簡潔且能善用複合索引效能。

### 缺點 / 考量
- 查詢時需使用 `LEFT JOIN` 並處理 null 值轉化為 `Pending` 狀態。
