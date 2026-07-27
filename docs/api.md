# API 契約

後端本機 base URL 為 `http://localhost:8000`。除登入外，API 使用 `Authorization: Bearer <token>`；Next.js UI 會把 JWT 存在 HttpOnly cookie，並透過 BFF route 轉送。

## 回應 Envelope

成功回應：

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

錯誤回應：

```json
{
  "success": false,
  "data": null,
  "message": "錯誤說明",
  "errors": ["可操作的錯誤細節"],
  "traceId": "4f4f25c407a24864aa1657881d67ed34"
}
```

所有 response 都有 `X-Trace-ID` header；錯誤 envelope 的 `traceId` 與 header 相同。呼叫端可傳入 `X-Trace-ID` 沿用追蹤識別碼。

## Authentication

| Method | Route | 權限 | 說明 |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/login` | Public | 以 `username` 與 64 字元 SHA-256 `clientHash` 登入，回傳 24 小時 JWT |
| `GET` | `/api/v1/auth/session` | User / Admin | 驗證 JWT 並回傳使用者 id、name、role |

登入 request：

```json
{
  "username": "user",
  "clientHash": "e73b3e692eacfa6219213cac29e48e053064d9ee138ee1d4a28b2a935e289d3a"
}
```

## User Work Items

| Method | Route | 說明 |
| --- | --- | --- |
| `GET` | `/api/v1/work-items?search=&statusFilter=All&sortBy=createdAt&sortOrder=desc&page=1&pageSize=20` | 取得 active Work Items 與呼叫者的個人狀態；`search` 對標題／描述做不分大小寫子字串比對，`statusFilter` 支援 `All`／`Pending`／`Confirmed`，`sortBy` 支援 `createdAt`／`title`，`sortOrder` 支援 `asc`／`desc`（白名單外的值靜默回退預設）；回應 `data` 為 `{ items, page, pageSize, totalCount }` |
| `GET` | `/api/v1/work-items/{id}` | 取得詳情與呼叫者的個人狀態 |
| `POST` | `/api/v1/work-items/bulk-confirm` | 將呼叫者選取的 Work Items 冪等更新為 `Confirmed` |
| `POST` | `/api/v1/work-items/{id}/revoke` | 將呼叫者的單筆狀態恢復為 `Pending` |

批量確認 request：

```json
{
  "workItemIds": [
    "1a1f0a3c-3b6d-4b8a-9c0a-1e2d3c4b5a61"
  ]
}
```

找不到或已刪除的 id 在批量確認時會被忽略，response 的 `confirmedCount` 與 `ignoredCount` 會反映結果。撤銷非 `Confirmed` 項目是安全 no-op，回傳 `revoked: false`。

## Admin Work Items

所有路由都要求 JWT role 為 `Admin`。未登入回 401；一般 User 回 403。

| Method | Route | 說明 |
| --- | --- | --- |
| `GET` | `/api/v1/admin/work-items` | 取得 active 管理列表 |
| `GET` | `/api/v1/admin/work-items/{id}` | 取得編輯資料 |
| `POST` | `/api/v1/admin/work-items` | 建立 Work Item；成功回 201 |
| `PUT` | `/api/v1/admin/work-items/{id}` | 更新 Work Item |
| `DELETE` | `/api/v1/admin/work-items/{id}` | 軟刪除 Work Item |

建立與更新 request：

```json
{
  "title": "面試 Demo 項目",
  "description": "可省略或傳 null"
}
```

API 會去除 `title` 前後空白並拒絕空白標題。資料庫欄位限制為 `title` 200 字元、`description` 2000 字元。

## HTTP 狀態碼

| Status | 使用情境 |
| --- | --- |
| `200` | 查詢、更新、刪除、批量確認與撤銷成功 |
| `201` | Admin 建立成功 |
| `400` | JSON、排序參數或欄位驗證失敗 |
| `401` | 缺少、無效或逾期 JWT |
| `403` | 非 Admin 呼叫 Admin API |
| `404` | active Work Item 不存在 |
| `500` | 未處理例外，response 會帶 trace id |

## Next.js BFF Routes

瀏覽器 UI 呼叫 `/api/auth/login`、`/api/work-items`、`/api/work-items/bulk-confirm`、`/api/work-items/{id}/revoke` 與 `/api/admin/work-items` 相關 routes。BFF 從 HttpOnly cookie 取得 JWT 後轉送後端，瀏覽器 JavaScript 不會讀取 JWT。
