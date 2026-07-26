# My Work Item

Next.js 16 與 .NET 10 組成的工作項目應用。目前已完成可登入的最小全棧骨架：前端先以 SHA-256 產生 `ClientHash`，後端以 ASP.NET Core `PasswordHasher` 驗證 PostgreSQL 種子帳號，並核發 24 小時 JWT。

## 開發環境

- .NET SDK 10
- Node.js 20 以上
- Docker Desktop（提供本機 PostgreSQL 16 容器）

## 本機資料庫 (Docker Compose)

以 Docker Compose 啟動可持久化的 PostgreSQL 16 容器。首次使用可複製環境設定範本（可略過，容器會採用相同的預設值）：

```powershell
Copy-Item .env.example .env
```

| 目的 | 指令 |
| --- | --- |
| 啟動並等待就緒 | `docker compose up db -d --wait` |
| 查看狀態 | `docker compose ps db` |
| 查看日誌 | `docker compose logs -f db` |
| 停止（保留資料） | `docker compose stop db` |
| 重置本機資料（清空 volume） | `docker compose down -v` |

- 資料以 named volume `my-work-item-pgdata` 持久化，`docker compose stop` 或重建容器後資料仍保留；只有明確執行 `docker compose down -v` 才會清空。
- 資料庫名稱與開發帳密由 `.env` 提供（預設 `my_work_item` / `postgres` / `postgres`）；repository 不含正式環境秘密。若變更帳密或 `POSTGRES_PORT`，請同步更新 `backend/91app-backend/appsettings.Development.json` 的連線字串。

啟動資料庫後即可啟動後端；啟動時會自動套用 EF Core migration 並建立種子帳號：

```powershell
dotnet run --project backend/91app-backend/91app-backend.csproj --launch-profile http
```

另開終端啟動前端：

```powershell
cd frontend/91app-frontend
npm install
npm run dev
```

開啟 `http://localhost:3000`，使用下列 Demo 帳號：

| 角色 | 帳號 | 密碼 |
| --- | --- | --- |
| User | `user` | `User123!` |
| Admin | `admin` | `Admin123!` |

## 設定

正式環境必須透過環境變數提供：

- `ConnectionStrings__DefaultConnection`
- `Jwt__Key`（至少 32 字元）
- `Cors__AllowedOrigins__0`
- Next.js server `API_BASE_URL`

前後端既定 `SystemSalt` 為 `MyWorkItem-System-Salt-v1`。若覆寫前端 `NEXT_PUBLIC_PASSWORD_SALT`，必須同步重建 migration 中的種子密碼雜湊，否則預設帳號將無法登入。

## API 契約

- `POST /api/v1/auth/login`：接收 `username` 與 64 字元 `clientHash`。
- `POST /api/auth/login`：Next.js BFF 轉送 `ClientHash` 並將 JWT 寫入 HttpOnly cookie。
- `GET /api/v1/auth/session`：Next.js Server Component 使用 Bearer token 驗證並還原登入狀態。
- 成功與失敗皆使用 JSON envelope；失敗回應與 `X-Trace-ID` response header 會帶回同一組 `traceId`。

## 驗證

本機資料庫 smoke check（驗證容器 healthy、EF Core migration 已套用、`user`/`admin` 種子帳號可用）：

```powershell
pwsh scripts/smoke-db.ps1
```

前後端測試：

```powershell
dotnet test backend/91app-backend.sln
cd frontend/91app-frontend
npm test
npm run typecheck
npm run lint
npm run build
```
