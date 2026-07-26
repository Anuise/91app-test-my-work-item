# My Work Item

Next.js 16 與 .NET 10 組成的工作項目應用。目前已完成可登入的最小全棧骨架：前端先以 SHA-256 產生 `ClientHash`，後端以 ASP.NET Core `PasswordHasher` 驗證 PostgreSQL 種子帳號，並核發 24 小時 JWT。

## 開發環境

- .NET SDK 10
- Node.js 20 以上
- PostgreSQL 16

先建立本機資料庫 `my_work_item`。預設開發連線為 `postgres / postgres`；若環境不同，請修改 `backend/91app-backend/appsettings.Development.json`。

啟動後端；啟動時會自動套用 EF Core migration 並建立種子帳號：

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

```powershell
dotnet test backend/91app-backend.sln
cd frontend/91app-frontend
npm test
npm run typecheck
npm run lint
npm run build
```
