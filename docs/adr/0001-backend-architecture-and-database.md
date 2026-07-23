# 1. .NET 10 後端三層架構與 PostgreSQL 16 Code First 資料庫選型

- **狀態**：已通過 (Accepted)
- **日期**：2026-07-23

## 背景 (Context)

本專案為 「My Work Item」 B2E Web 應用程式，後端需處理管理者 Work Item 管理 (CRUD) 以及前台使用者個人化狀態（勾選、確認、撤銷）紀錄與持久化。為利於 Pair Programming 面試展示與可維護性，需確定後端分層架構與資料庫存取方案。

## 決策 (Decision)

1. **後端執行平台**：採用 **.NET 10**。
2. **後端分層架構**：採用經典三層架構 (Classic 3-Tier Architecture)：
   - **API / Presentation Layer** (Controllers, DTOs, Handlers)
   - **Service / Business Logic Layer** (WorkItemService, UserStatusService)
   - **Data Access / Infrastructure Layer** (DbContext, Repositories)
3. **資料庫引擎**：採用 **PostgreSQL 16**。
4. **ORM & 遷移策略**：採用 **Entity Framework Core (EF Core) Code First** 機制進行 Domain Model 定義、Migration 遷移與資料庫存取；套件精確版本於導入時由專案 manifest 鎖定。

## 後果與權衡 (Consequences)

### 優點
- **責任分離**：Controller、Service 與 Repository 各司其職，方便進行單元測試與 Mock。
- **開發效率與 Schema 管理**：Code First Migration 能精準追蹤 Schema 變更並快速建立 DB 結構。
- **PostgreSQL 強大功能**：具備高可靠度與完善的關聯式資料庫特性，適合處理多使用者與 Work Item 的關聯。

### 缺點 / 考量
- 需要確保 Local 開發環境具備 PostgreSQL 實例（例如透過 Docker Compose 或 local service）。
