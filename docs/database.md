# 資料庫設計

本專案使用 PostgreSQL 16 與 EF Core 10 Code First migration。預設 database 為 `my_work_item`，本機由 `docker-compose.yml` 的 `db` service 啟動，資料存於 `my-work-item-pgdata` named volume。

## 關聯模型

```mermaid
erDiagram
    Users ||--o{ UserWorkItemStatuses : owns
    WorkItems ||--o{ UserWorkItemStatuses : tracks

    Users {
        uuid Id PK
        varchar_100 Username UK
        varchar_100 Name
        varchar_20 Role
        varchar_512 PasswordHash
        timestamptz CreatedAt
    }

    WorkItems {
        uuid Id PK
        varchar_200 Title
        varchar_2000 Description nullable
        timestamptz CreatedAt
        timestamptz UpdatedAt
        boolean IsDeleted
    }

    UserWorkItemStatuses {
        uuid UserId PK,FK
        uuid WorkItemId PK,FK
        integer Status
        timestamptz ConfirmedAt nullable
        timestamptz UpdatedAt
    }
```

## 資料語意

- `Users.Username` 有 unique index；role 目前為 `User` 或 `Admin`。
- `WorkItems.IsDeleted` 實作軟刪除。EF Core global query filter 讓一般查詢與 UI 不顯示已刪除資料。
- `UserWorkItemStatuses` 使用 `(UserId, WorkItemId)` composite primary key，確保每位使用者對每筆 Work Item 最多一筆個人狀態。
- 沒有 status row 時，API 隱式回傳 `Pending`；確認後建立或更新為 `Confirmed`，撤銷後回到 `Pending`。
- 刪除 Work Item 不移除既有 status history；軟刪除項目不再出現在 User 或 Admin active 列表。

## Migration

Migration 位於 `backend/91app-backend/Migrations`，依序建立 Users、WorkItems、Description、soft-delete 欄位與第二名 demo User。

```powershell
dotnet tool restore
dotnet ef migrations list --project backend/91app-backend/91app-backend.csproj
dotnet ef database update --configuration Release --project backend/91app-backend/91app-backend.csproj
```

後端啟動時也會執行 `Database.MigrateAsync()`，再以 `DatabaseInitializer` 補齊缺少的 demo 帳號與初始 Work Items。初始化器只補缺少的固定資料，不會清除使用者狀態或 Admin 建立的資料。

## Demo 資料

| Username | Name | Role | 密碼 |
| --- | --- | --- | --- |
| `user` | User | User | `User123!` |
| `user2` | User 2 | User | `User123!` |
| `admin` | Admin | Admin | `Admin123!` |

密碼不以明文儲存。前端先計算 `SHA256(RawPassword + SystemSalt)`，後端再以 ASP.NET Core `PasswordHasher` 驗證 database 中的 hash。

## 驗證與重建

```powershell
powershell -File scripts/smoke-db.ps1
```

script 會等待 PostgreSQL healthy、套用 migration，並檢查最新 migration 與三個 demo 帳號。初始 Work Items 由後端啟動初始化器補齊，並在 UI smoke path 驗證。

若要清除所有本機資料並從 migration 重建：

```powershell
docker compose down -v
docker compose up db -d --wait
dotnet ef database update --configuration Release --project backend/91app-backend/91app-backend.csproj
```

`docker compose down -v` 會永久刪除本專案的本機 database volume，不應對需要保留的環境執行。
