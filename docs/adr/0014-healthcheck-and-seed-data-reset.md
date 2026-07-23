# 14. 系統健康檢查 (`/healthz`) 與 Demo 資料一鍵重置機制

- **狀態**：已通過 (Accepted)
- **日期**：2026-07-23

## 背景 (Context)

在 Pair Programming 與 live 簡報展示時，系統需具備維運可觀察性，並防範因現場測試刪除過多資料導致展示卡關的風險。

## 決策 (Decision)

1. **系統健康檢查 (`/healthz`)**：
   - 後端掛載 ASP.NET Core Health Checks 展現 12-Factor/Cloud-Native 規範。
   - 檢查項包含：API Runtime 運作狀態、PostgreSQL 資料庫連線狀態。
2. **Demo 資料一鍵重置 (`POST /api/v1/admin/reset-seed-data`)**：
   - 後端提供 Reset Seed Data 端點 (限制 Admin 角色存取)。
   - 執行時安全清空測試資料，並重新植入預設之標準 Work Items 與預設測試帳號 (`User A`, `User B`, `Admin`)。
   - 前端後台頂部欄位提供「重置 Demo 資料」按鈕與二次 Modal 確認，確保 Pair Programming 現場可隨時重置乾淨的驗證環境。

## 後果與權衡 (Consequences)

### 優點
- **極高的面試示範流暢度**：資料清空或測試完畢後可瞬間恢復初始狀態。
- **維運友善**：`/healthz` 方便 Docker compose 或 K8s 容器探針 (Liveness/Readiness Probe) 檢測。
