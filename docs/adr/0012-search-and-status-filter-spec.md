# 12. 前台關鍵字搜尋與個人化狀態過濾器規範

- **狀態**：已通過 (Accepted)
- **日期**：2026-07-23

## 背景 (Context)

隨著系統中的 Work Item 數量增加，僅靠「時間排序」無法滿足使用者迅速定位特定待辦事項或僅檢視「待確認/已確認」項目的需求。需要增加關鍵字搜尋與狀態過濾功能。

## 決策 (Decision)

1. **後端 API 增強 (`GET /api/v1/work-items`)**：
   - 支援 Query Parameters：
     - `search`: 關鍵字搜尋（對 `Title` 與 `Description` 進行不區分大小寫的子字串比對）。
     - `statusFilter`: 狀態篩選枚舉 (`All` 全部, `Pending` 僅待確認, `Confirmed` 僅已確認)。
2. **前端 UI/UX 設計**：
   - **搜尋輸入框**：提供微光玻璃風格搜尋框，具備 300ms Debounce 延遲防抖，避免頻繁發送 API。
   - **狀態選單 (Tab Pills)**：提供三態 Capsule 切換按鈕（全部、待確認、已確認）。
   - **TanStack Query 整合**：搜尋字串與過濾狀態統一併入 Query Key `['work-items', { search, statusFilter, sortBy, sortOrder }]`，確保快取自動刷新。

## 後果與權衡 (Consequences)

### 優點
- **大數據量處理**：大幅提升前端操作效率與使用者體驗。
- **高架構彈性**：LINQ 查詢可直接在資料庫層級進行 `WHERE` 篩選與分頁預備。
