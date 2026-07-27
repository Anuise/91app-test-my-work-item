# My Work Item

My Work Item 是由 Next.js 16、.NET 10 Web API 與 PostgreSQL 16 組成的全棧應用。一般使用者可瀏覽、批量確認及撤銷自己的 Work Item 狀態；Admin 可在受 RBAC 保護的後台建立、編輯與刪除 Work Item。

## 必要環境

- .NET SDK 10
- Node.js 20 以上版本
- Docker Desktop（含 Docker Compose）
- Windows PowerShell 5.1 以上版本（執行資料庫 smoke script 時使用）

## 一鍵展示環境

從 repository root 複製展示用設定後，以單一 Compose 指令建置並啟動 PostgreSQL、.NET API 與 Next.js：

```powershell
Copy-Item .env.example .env
docker compose up --build -d
```

服務就緒後開啟 `http://localhost:3000`，可使用下方 Demo 帳號登入。常用維運指令：

```powershell
# 查看服務與 health 狀態
docker compose ps

# 追蹤所有服務日誌
docker compose logs -f

# 停止服務並保留資料庫 volume
docker compose down

# 重新建置並啟動
docker compose up --build -d
```

可重現的 smoke check 會建置並啟動三個服務、等待 healthcheck，並驗證 Demo 登入與重新整理後的 session：

```powershell
powershell -NoProfile -File scripts/smoke-compose.ps1
```

若 `3000` 已被本機開發服務占用，可指定替代 port：

```powershell
powershell -NoProfile -File scripts/smoke-compose.ps1 -FrontendPort 3100
```

`.env.example` 僅提供本機展示預設值；部署至正式環境前，必須覆寫 `POSTGRES_PASSWORD`、`JWT_KEY`、`CORS_ORIGIN` 與其他對外設定，且不得提交 `.env`。

## 乾淨環境啟動

以下命令皆從 repository root 執行。

1. 建立本機資料庫設定並啟動 PostgreSQL：

   ```powershell
   Copy-Item .env.example .env
   docker compose up db -d --wait
   ```

2. 還原後端工具與套件，套用 EF Core migration：

   ```powershell
   dotnet tool restore
   dotnet restore backend/91app-backend.sln
   dotnet ef database update --configuration Release --project backend/91app-backend/91app-backend.csproj
   ```

3. 啟動後端。應用啟動時也會套用尚未執行的 migration，並補齊 demo 資料：

   ```powershell
   dotnet run --project backend/91app-backend/91app-backend.csproj --launch-profile http
   ```

   後端預設位址為 `http://localhost:8000`。

4. 另開終端機，安裝並啟動前端：

   ```powershell
   Set-Location frontend/91app-frontend
   Copy-Item .env.example .env.local
   npm ci
   npm run dev
   ```

5. 開啟 `http://localhost:3000`。

### Demo 帳號

| 角色 | 帳號 | 密碼 |
| --- | --- | --- |
| User 1 | `user` | `User123!` |
| User 2 | `user2` | `User123!` |
| Admin | `admin` | `Admin123!` |

三個帳號由 migration 與啟動初始化器補齊。若既有資料庫缺少任一 demo 帳號，重新啟動後端即可補上。

## 設定

| 設定 | 用途 | 本機預設 |
| --- | --- | --- |
| `POSTGRES_DB` | PostgreSQL database | `my_work_item` |
| `POSTGRES_USER` | PostgreSQL user | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `postgres` |
| `POSTGRES_PORT` | PostgreSQL host port | `5432` |
| `ConnectionStrings__DefaultConnection` | 後端資料庫連線字串 | 見 `appsettings.Development.json` |
| `Jwt__Key` | JWT 簽章金鑰，至少 32 字元 | 開發設定內含本機值 |
| `Cors__AllowedOrigins__0` | 允許的前端 origin | `http://localhost:3000` |
| `API_BASE_URL` | Next.js server 呼叫的後端位址 | `http://localhost:8000` |

前後端固定使用 `MyWorkItem-System-Salt-v1` 進行 client-side password pre-hashing。若覆寫 `NEXT_PUBLIC_PASSWORD_SALT`，現有 demo 密碼雜湊將不再相符。

## Migration 與資料庫驗證

```powershell
dotnet ef migrations list --project backend/91app-backend/91app-backend.csproj
dotnet ef database update --configuration Release --project backend/91app-backend/91app-backend.csproj
powershell -File scripts/smoke-db.ps1
```

要重建完全乾淨的本機資料庫，可先停止前後端，再執行：

```powershell
docker compose down -v
docker compose up db -d --wait
```

`down -v` 會刪除本專案的 `my-work-item-pgdata` volume，僅適合可丟棄的本機資料。

## 自動化驗證

後端整合測試涵蓋登入、JWT session、401/403、列表排序、跨使用者狀態隔離、批量確認、撤銷、詳情與 Admin CRUD：

```powershell
dotnet test backend/91app-backend.sln
```

前端測試、型別、lint 與 production build：

```powershell
Set-Location frontend/91app-frontend
npm ci
npm test
npm run typecheck
npm run lint
npm run build
```

## 面試 Smoke Path

為避免 HttpOnly session cookie 互相覆蓋，使用三個獨立瀏覽器 profile，或在每次切換帳號前清除 `localhost` cookie。

1. 以 `user` 登入，開啟 `/work-items`，選取同一個 Work Item 並批量確認；確認成功訊息、數量與該列 `Confirmed` 狀態。
2. 以 `user2` 登入，開啟同一個 Work Item；確認仍為 `Pending`，證明個人狀態隔離。
3. 回到 `user` session 並重新整理；確認狀態仍為 `Confirmed`，再執行撤銷並確認成功訊息與 `Pending` 狀態。
4. 以 `admin` 登入並進入 `/admin/work-items`；建立一筆 Work Item，確認列表成功訊息與新列。
5. 編輯該筆標題與描述，確認返回列表後顯示更新成功訊息與新內容。
6. 刪除該筆資料，在確認對話框選擇確認；確認成功訊息且原列消失，再回一般使用者列表確認該筆不可見。
7. 以一般 User 直接開啟 `/admin/work-items`；確認被導回列表且看到權限不足回饋。

## Trace ID 與日誌

每個 API response 都包含 `X-Trace-ID` header；錯誤 envelope 的 `traceId` 與該 header 相同。後端以 Serilog 輸出 JSON 結構化日誌，request log 與登入等關鍵操作都帶有相同的 `TraceId`。

診斷錯誤時，在瀏覽器 Network 面板複製 `X-Trace-ID` 或錯誤畫面的 trace id，再於後端終端機搜尋同一值，即可對應請求與例外日誌。呼叫端也可傳入 `X-Trace-ID`，方便跨服務沿用既有追蹤識別碼。

## 文件

- [系統架構](docs/architecture.md)
- [API 契約](docs/api.md)
- [資料庫設計](docs/database.md)
- [產品規格](docs/specs/my-work-item.md)
- [架構決策紀錄](docs/adr)

## 範圍

本交付包含登入、RBAC、個人化 Work Item 狀態、排序、批量確認、撤銷、詳情與 Admin CRUD。不包含搜尋、通知、即時更新、離線模式或進階篩選。
